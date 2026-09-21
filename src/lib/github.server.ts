/**
 * GitHub Contents/Git Data API helper for the git-first publish path.
 *
 * SERVER ONLY. This module reads GITHUB_CONTENT_TOKEN and must never reach the
 * browser bundle. Import it with a dynamic `await import()` inside a server
 * function handler, never at the top level of a route file or a `*.functions.ts`
 * module — those ship to the client.
 *
 * A publish is ONE commit: blobs for every changed file, a tree layered over the
 * branch's current tree, a commit, then a non-forced update of the branch ref. The
 * ref update is deliberately not forced, so GitHub itself refuses anything that is
 * not a fast-forward even if our own conflict check somehow missed a race.
 */
import { CONTENT_PATH } from "@/lib/contentFile";

const API = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

export type PublishErrorCode =
  "not_configured" | "forbidden" | "invalid" | "conflict" | "github_error";

/** An error safe to show an editor: no token, no stack detail. */
export class PublishError extends Error {
  readonly code: PublishErrorCode;
  /** For conflicts: the human labels of the fields someone else changed. */
  readonly fields: string[];

  constructor(code: PublishErrorCode, message: string, fields: string[] = []) {
    super(message);
    this.name = "PublishError";
    this.code = code;
    this.fields = fields;
  }
}

export type PublishConfig = {
  token: string;
  /** "owner/repo" */
  repo: string;
  /** Branch that publishes commit to. */
  branch: string;
};

const REPO_PATTERN = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

/**
 * Read the three server-only environment variables. Throws a `not_configured`
 * PublishError naming the missing one rather than failing silently.
 */
export function readPublishConfig(
  env: Record<string, string | undefined> = process.env,
): PublishConfig {
  const token = env["GITHUB_CONTENT_TOKEN"]?.trim();
  if (!token) {
    throw new PublishError(
      "not_configured",
      "Publishing is not configured: missing GITHUB_CONTENT_TOKEN",
    );
  }

  const repo = env["GITHUB_REPO"]?.trim();
  if (!repo) {
    throw new PublishError("not_configured", "Publishing is not configured: missing GITHUB_REPO");
  }
  if (!REPO_PATTERN.test(repo)) {
    throw new PublishError(
      "not_configured",
      `Publishing is not configured: GITHUB_REPO must look like "owner/repo"`,
    );
  }

  const branch = env["CONTENT_BRANCH"]?.trim();
  if (!branch) {
    throw new PublishError(
      "not_configured",
      "Publishing is not configured: missing CONTENT_BRANCH",
    );
  }

  return { token, repo, branch };
}

// --- base64 helpers, portable across node / bun / workers ---------------------

const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

function stripWhitespace(value: string): string {
  return value.replace(/\s+/g, "");
}

export function isValidBase64(value: string): boolean {
  const clean = stripWhitespace(value);
  return clean.length % 4 === 0 && BASE64_PATTERN.test(clean);
}

/** Decoded byte length of a base64 string, without decoding it. */
export function base64ByteLength(value: string): number {
  const clean = stripWhitespace(value);
  if (clean.length === 0) return 0;
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return (clean.length / 4) * 3 - padding;
}

export function base64ToUtf8(value: string): string {
  const binary = atob(stripWhitespace(value));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

export function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

// --- the repository interface the publish logic depends on -------------------

export type CommitFile = {
  /** Repo-relative path, e.g. "content/pages.json". */
  path: string;
  content: string;
  encoding: "utf-8" | "base64";
};

export type CommitResult = { commitSha: string; commitUrl: string };

/**
 * The narrow slice of GitHub the publish logic needs. Implemented against the real
 * API below, and faked in tests.
 */
export interface ContentRepo {
  /** Current head commit sha of the content branch. */
  getBranchHead(): Promise<string>;
  /** UTF-8 text of a file at a given commit-ish, with its blob sha. */
  readTextFile(path: string, ref: string): Promise<{ text: string; sha: string }>;
  /** One commit updating/adding every file, then a non-forced branch ref update. */
  commit(input: {
    message: string;
    files: CommitFile[];
    parentCommitSha: string;
  }): Promise<CommitResult>;
}

/** Remove the token from any text before it can reach a log or a user. */
function redact(text: string, token: string): string {
  if (!token) return text;
  return text.split(token).join("[redacted]");
}

export function createGithubContentRepo(
  config: PublishConfig,
  fetchImpl: typeof fetch = fetch,
): ContentRepo {
  const { token, repo, branch } = config;

  async function call<T>(
    path: string,
    init?: { method?: string; body?: unknown; accept?: string },
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetchImpl(`${API}${path}`, {
        method: init?.method ?? "GET",
        headers: {
          Accept: init?.accept ?? "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": GITHUB_API_VERSION,
          "User-Agent": "treetestprep-armature-publish",
          ...(init?.body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(init?.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new PublishError("github_error", `Could not reach GitHub: ${redact(detail, token)}`);
    }

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      let detail = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && "message" in parsed) {
          detail = String((parsed as { message: unknown }).message);
        }
      } catch {
        // keep the raw body
      }
      const message = redact(detail || response.statusText, token);

      if (response.status === 401 || response.status === 403) {
        throw new PublishError(
          "forbidden",
          `GitHub rejected the publish token (${response.status}). Check that GITHUB_CONTENT_TOKEN has Contents read and write on ${repo} and has not expired. GitHub said: ${message}`,
        );
      }
      if (response.status === 404) {
        throw new PublishError(
          "github_error",
          `GitHub could not find ${repo} or the branch "${branch}" (404). Check GITHUB_REPO and CONTENT_BRANCH. GitHub said: ${message}`,
        );
      }
      if (response.status === 409 || response.status === 422) {
        throw new PublishError(
          "conflict",
          `GitHub refused the update because the branch moved while publishing. Reload and try again. GitHub said: ${message}`,
        );
      }
      throw new PublishError("github_error", `GitHub returned ${response.status}: ${message}`);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    async getBranchHead() {
      const ref = await call<{ object?: { sha?: string } }>(
        `/repos/${repo}/git/ref/heads/${branch}`,
      );
      const sha = ref.object?.sha;
      if (!sha) {
        throw new PublishError("github_error", `GitHub did not return a head commit for ${branch}`);
      }
      return sha;
    },

    async readTextFile(path, ref) {
      const file = await call<{ content?: string; encoding?: string; sha?: string }>(
        `/repos/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
      );
      if (!file.sha) {
        throw new PublishError("github_error", `GitHub did not return a sha for ${path}`);
      }
      if (file.encoding !== "base64" || typeof file.content !== "string") {
        throw new PublishError(
          "github_error",
          `${path} is too large or not a text file, so it cannot be published through the editor`,
        );
      }
      return { text: base64ToUtf8(file.content), sha: file.sha };
    },

    async commit({ message, files, parentCommitSha }) {
      if (files.length === 0) {
        throw new PublishError("invalid", "Nothing to commit");
      }

      const parent = await call<{ tree?: { sha?: string } }>(
        `/repos/${repo}/git/commits/${parentCommitSha}`,
      );
      const baseTree = parent.tree?.sha;
      if (!baseTree) {
        throw new PublishError(
          "github_error",
          `GitHub did not return a tree for commit ${parentCommitSha}`,
        );
      }

      const entries = [];
      for (const file of files) {
        const blob = await call<{ sha?: string }>(`/repos/${repo}/git/blobs`, {
          method: "POST",
          body: { content: file.content, encoding: file.encoding },
        });
        if (!blob.sha) {
          throw new PublishError(
            "github_error",
            `GitHub did not return a blob sha for ${file.path}`,
          );
        }
        entries.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
      }

      const tree = await call<{ sha?: string }>(`/repos/${repo}/git/trees`, {
        method: "POST",
        body: { base_tree: baseTree, tree: entries },
      });
      if (!tree.sha) throw new PublishError("github_error", "GitHub did not return a tree sha");

      const commit = await call<{ sha?: string; html_url?: string }>(`/repos/${repo}/git/commits`, {
        method: "POST",
        body: { message, tree: tree.sha, parents: [parentCommitSha] },
      });
      if (!commit.sha) throw new PublishError("github_error", "GitHub did not return a commit sha");

      // force: false — GitHub rejects a non-fast-forward, which is the last line of
      // defence against a concurrent publish we did not detect.
      await call(`/repos/${repo}/git/refs/heads/${branch}`, {
        method: "PATCH",
        body: { sha: commit.sha, force: false },
      });

      return {
        commitSha: commit.sha,
        commitUrl: commit.html_url ?? `https://github.com/${repo}/commit/${commit.sha}`,
      };
    },
  };
}

export { CONTENT_PATH };
