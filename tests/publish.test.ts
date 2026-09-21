/**
 * Tests for the publish path, with GitHub and Supabase auth both mocked.
 *
 * Run with: bun run test
 *
 * There is no real GitHub token anywhere in these tests: the `ContentRepo` is a fake
 * that records what would have been committed, which is how "commits nothing" is
 * asserted for the rejection cases.
 */
import { describe, expect, it } from "bun:test";
import {
  PublishError,
  base64ToUtf8,
  base64ByteLength,
  createGithubContentRepo,
  readPublishConfig,
  utf8ToBase64,
  type CommitFile,
  type ContentRepo,
} from "@/lib/github.server";
import { MAX_IMAGE_BYTES, assertStaff, runPublish } from "@/lib/publish.server";
import { CONTENT_PATH, cloneContent, serializeContent } from "@/lib/contentFile";
import liveContent from "../content/pages.json";

type Tree = Record<string, Record<string, Record<string, unknown>>>;

const tree = () => cloneContent(liveContent) as Tree;

const BASE_SHA = "base000000000000000000000000000000000000";
const MOVED_SHA = "moved00000000000000000000000000000000000";

type Recorded = { message: string; files: CommitFile[]; parentCommitSha: string };

/** A fake ContentRepo that serves fixed file contents per ref and records commits. */
function fakeRepo(opts: { head: string; byRef: Record<string, unknown> }) {
  const commits: Recorded[] = [];
  const repo: ContentRepo = {
    async getBranchHead() {
      return opts.head;
    },
    async readTextFile(path, ref) {
      if (path !== CONTENT_PATH) throw new PublishError("github_error", `unexpected path ${path}`);
      const value = opts.byRef[ref];
      if (value === undefined) {
        throw new PublishError("github_error", `no content at ref ${ref}`);
      }
      return { text: serializeContent(value), sha: `blob-${ref}` };
    },
    async commit(input) {
      commits.push(input);
      return {
        commitSha: "newcommitsha",
        commitUrl: "https://github.com/acts2man/treetestprep/commit/newcommitsha",
      };
    },
  };
  return { repo, commits };
}

/** Decode the pages.json that a recorded commit would have written. */
function committedContent(commit: Recorded): Tree {
  const file = commit.files.find((entry) => entry.path === CONTENT_PATH);
  if (!file) throw new Error("commit did not include the content file");
  return JSON.parse(base64ToUtf8(file.content)) as Tree;
}

const pngBase64 = utf8ToBase64("pretend-png-bytes");

// ---------------------------------------------------------------------------

describe("readPublishConfig — missing environment variables", () => {
  const full = {
    GITHUB_CONTENT_TOKEN: "ghp_notreal",
    GITHUB_REPO: "acts2man/treetestprep",
    CONTENT_BRANCH: "armature/git-content",
  };

  it("returns the config when all three are set", () => {
    expect(readPublishConfig(full)).toEqual({
      token: "ghp_notreal",
      repo: "acts2man/treetestprep",
      branch: "armature/git-content",
    });
  });

  it("names a missing GITHUB_CONTENT_TOKEN", () => {
    expect(() => readPublishConfig({ ...full, GITHUB_CONTENT_TOKEN: undefined })).toThrow(
      "Publishing is not configured: missing GITHUB_CONTENT_TOKEN",
    );
  });

  it("names a missing GITHUB_REPO", () => {
    expect(() => readPublishConfig({ ...full, GITHUB_REPO: undefined })).toThrow(
      "Publishing is not configured: missing GITHUB_REPO",
    );
  });

  it("names a missing CONTENT_BRANCH", () => {
    expect(() => readPublishConfig({ ...full, CONTENT_BRANCH: undefined })).toThrow(
      "Publishing is not configured: missing CONTENT_BRANCH",
    );
  });

  it("treats blank values as missing, and carries the not_configured code", () => {
    try {
      readPublishConfig({ ...full, GITHUB_CONTENT_TOKEN: "   " });
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(PublishError);
      expect((error as PublishError).code).toBe("not_configured");
      expect((error as PublishError).message).toContain("missing GITHUB_CONTENT_TOKEN");
    }
  });

  it("rejects a malformed GITHUB_REPO", () => {
    expect(() => readPublishConfig({ ...full, GITHUB_REPO: "treetestprep" })).toThrow(
      'GITHUB_REPO must look like "owner/repo"',
    );
  });
});

describe("assertStaff", () => {
  const staffClient = {
    rpc: async () => ({ data: true, error: null }),
    from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }),
  };

  it("allows a staff account", async () => {
    await expect(assertStaff(staffClient, "user-1")).resolves.toBeUndefined();
  });

  it("rejects a non-staff account", async () => {
    const client = {
      rpc: async () => ({ data: false, error: null }),
      from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }),
    };
    await expect(assertStaff(client, "user-1")).rejects.toThrow(
      "does not have permission to publish",
    );
  });

  it("falls back to the caller's own user_roles when the rpc errors", async () => {
    const client = {
      rpc: async () => ({ data: null, error: { message: "function unavailable" } }),
      from: () => ({
        select: () => ({ eq: async () => ({ data: [{ role: "admin" }], error: null }) }),
      }),
    };
    await expect(assertStaff(client, "user-1")).resolves.toBeUndefined();
  });

  it("rejects when the fallback shows only a student role", async () => {
    const client = {
      rpc: async () => ({ data: null, error: { message: "nope" } }),
      from: () => ({
        select: () => ({ eq: async () => ({ data: [{ role: "student" }], error: null }) }),
      }),
    };
    await expect(assertStaff(client, "user-1")).rejects.toThrow(
      "does not have permission to publish",
    );
  });

  it("rejects when both paths fail, rather than defaulting to allow", async () => {
    const client = {
      rpc: async () => {
        throw new Error("network down");
      },
      from: () => ({
        select: () => ({
          eq: async () => {
            throw new Error("network down");
          },
        }),
      }),
    };
    await expect(assertStaff(client, "user-1")).rejects.toThrow("Could not confirm");
  });
});

describe("runPublish — rejections commit nothing", () => {
  it("rejects an unknown field", async () => {
    const { repo, commits } = fakeRepo({ head: BASE_SHA, byRef: { [BASE_SHA]: tree() } });
    await expect(
      runPublish({
        repo,
        userEmail: "owner@example.com",
        input: {
          slug: "home",
          baseCommitSha: BASE_SHA,
          fields: [{ section: "hero", field: "not_a_real_field", value: "x" }],
          images: [],
        },
      }),
    ).rejects.toThrow("not a field declared in pageSchema.ts");
    expect(commits).toHaveLength(0);
  });

  it("rejects an unsafe link destination", async () => {
    const { repo, commits } = fakeRepo({ head: BASE_SHA, byRef: { [BASE_SHA]: tree() } });
    await expect(
      runPublish({
        repo,
        userEmail: "owner@example.com",
        input: {
          slug: "home",
          baseCommitSha: BASE_SHA,
          fields: [
            { section: "hero", field: "cta", value: { label: "Go", href: "javascript:alert(1)" } },
          ],
          images: [],
        },
      }),
    ).rejects.toThrow("must start with https://");
    expect(commits).toHaveLength(0);
  });

  it("rejects an image with the wrong content type", async () => {
    const { repo, commits } = fakeRepo({ head: BASE_SHA, byRef: { [BASE_SHA]: tree() } });
    await expect(
      runPublish({
        repo,
        userEmail: "owner@example.com",
        input: {
          slug: "home",
          baseCommitSha: BASE_SHA,
          fields: [],
          images: [
            {
              section: "hero",
              field: "badge",
              filename: "evil.svg",
              contentType: "image/svg+xml",
              dataBase64: pngBase64,
            },
          ],
        },
      }),
    ).rejects.toThrow("only PNG, JPEG and WebP");
    expect(commits).toHaveLength(0);
  });

  it("rejects an oversized image", async () => {
    const oversized = "A".repeat(7_000_000); // ~5.25 MB decoded, over the 5 MB limit
    expect(base64ByteLength(oversized)).toBeGreaterThan(MAX_IMAGE_BYTES);
    const { repo, commits } = fakeRepo({ head: BASE_SHA, byRef: { [BASE_SHA]: tree() } });
    await expect(
      runPublish({
        repo,
        userEmail: "owner@example.com",
        input: {
          slug: "home",
          baseCommitSha: BASE_SHA,
          fields: [],
          images: [
            {
              section: "hero",
              field: "badge",
              filename: "huge.png",
              contentType: "image/png",
              dataBase64: oversized,
            },
          ],
        },
      }),
    ).rejects.toThrow("too large");
    expect(commits).toHaveLength(0);
  });

  it("rejects an empty publish", async () => {
    const { repo, commits } = fakeRepo({ head: BASE_SHA, byRef: { [BASE_SHA]: tree() } });
    await expect(
      runPublish({
        repo,
        userEmail: "owner@example.com",
        input: { slug: "home", baseCommitSha: BASE_SHA, fields: [], images: [] },
      }),
    ).rejects.toThrow("no changes to publish");
    expect(commits).toHaveLength(0);
  });

  it("rejects an unknown page", async () => {
    const { repo, commits } = fakeRepo({ head: BASE_SHA, byRef: { [BASE_SHA]: tree() } });
    await expect(
      runPublish({
        repo,
        userEmail: "owner@example.com",
        input: {
          slug: "not-a-page",
          baseCommitSha: BASE_SHA,
          fields: [{ section: "hero", field: "title", value: "x" }],
          images: [],
        },
      }),
    ).rejects.toThrow("is not a page this site can edit");
    expect(commits).toHaveLength(0);
  });

  it("rejects a publish with no base commit sha", async () => {
    const { repo, commits } = fakeRepo({ head: BASE_SHA, byRef: { [BASE_SHA]: tree() } });
    await expect(
      runPublish({
        repo,
        userEmail: "owner@example.com",
        input: {
          slug: "home",
          baseCommitSha: "",
          fields: [{ section: "hero", field: "title", value: "x" }],
          images: [],
        },
      }),
    ).rejects.toThrow("Reload the page");
    expect(commits).toHaveLength(0);
  });
});

describe("runPublish — happy path", () => {
  it("makes exactly one commit containing pages.json and the image", async () => {
    const { repo, commits } = fakeRepo({ head: BASE_SHA, byRef: { [BASE_SHA]: tree() } });

    const outcome = await runPublish({
      repo,
      userEmail: "owner@example.com",
      now: () => 1700000000000,
      input: {
        slug: "home",
        baseCommitSha: BASE_SHA,
        fields: [{ section: "hero", field: "title", value: "A Brand New Headline" }],
        images: [
          {
            section: "hero",
            field: "badge",
            filename: "My New Badge!.PNG",
            contentType: "image/png",
            dataBase64: pngBase64,
          },
        ],
      },
    });

    // Exactly one commit.
    expect(commits).toHaveLength(1);
    const commit = commits[0]!;

    // Both files, in one commit, parented on the branch head.
    expect(commit.parentCommitSha).toBe(BASE_SHA);
    expect(commit.files.map((file) => file.path).sort()).toEqual([
      "content/pages.json",
      "public/assets/uploads/home-1700000000000-my-new-badge.png",
    ]);

    // The image blob is committed as base64, unchanged.
    const imageFile = commit.files.find((file) => file.path.startsWith("public/assets/uploads/"))!;
    expect(imageFile.encoding).toBe("base64");
    expect(imageFile.content).toBe(pngBase64);

    // The text change and the new image path both landed in the content.
    const written = committedContent(commit);
    expect(written["home"]!["hero"]!["title"]).toBe("A Brand New Headline");
    expect(written["home"]!["hero"]!["badge"]).toBe(
      "/assets/uploads/home-1700000000000-my-new-badge.png",
    );

    // Nothing else changed.
    const expected = tree();
    expected["home"]!["hero"]!["title"] = "A Brand New Headline";
    expected["home"]!["hero"]!["badge"] = "/assets/uploads/home-1700000000000-my-new-badge.png";
    expect(written).toEqual(expected);

    // Commit message and returned metadata.
    expect(commit.message).toBe("Content: Home updated by owner@example.com");
    expect(outcome.commitSha).toBe("newcommitsha");
    expect(outcome.commitUrl).toContain("/commit/newcommitsha");
    expect(outcome.images).toEqual(["/assets/uploads/home-1700000000000-my-new-badge.png"]);

    // The written file is in the canonical format check:content expects.
    const file = commit.files.find((entry) => entry.path === CONTENT_PATH)!;
    expect(base64ToUtf8(file.content)).toBe(serializeContent(written));
  });

  it("writes a list field and a link field together", async () => {
    const { repo, commits } = fakeRepo({ head: BASE_SHA, byRef: { [BASE_SHA]: tree() } });
    await runPublish({
      repo,
      userEmail: "owner@example.com",
      input: {
        slug: "shared",
        baseCommitSha: BASE_SHA,
        fields: [
          {
            section: "header",
            field: "nav",
            value: [
              { label: "Home", href: "/" },
              { label: "Register", href: "/class-registration-page/" },
            ],
          },
          {
            section: "footer",
            field: "cta",
            value: { label: "Sign up", href: "/class-registration-page/" },
          },
        ],
        images: [],
      },
    });
    const written = committedContent(commits[0]!);
    expect(written["shared"]!["header"]!["nav"]).toHaveLength(2);
    expect(written["shared"]!["footer"]!["cta"]).toEqual({
      label: "Sign up",
      href: "/class-registration-page/",
    });
  });

  it("refuses a publish whose only change is a no-op", async () => {
    const current = tree();
    const { repo, commits } = fakeRepo({ head: BASE_SHA, byRef: { [BASE_SHA]: current } });
    await expect(
      runPublish({
        repo,
        userEmail: "owner@example.com",
        input: {
          slug: "home",
          baseCommitSha: BASE_SHA,
          fields: [
            {
              section: "hero",
              field: "title",
              value: current["home"]!["hero"]!["title"] as string,
            },
          ],
          images: [],
        },
      }),
    ).rejects.toThrow("no changes to publish");
    expect(commits).toHaveLength(0);
  });
});

describe("runPublish — the branch moved while editing", () => {
  it("merges field by field when the other change touched different fields", async () => {
    const base = tree();
    const moved = tree();
    moved["home"]!["hero"]!["body"] = "Someone else rewrote the body copy.";

    const { repo, commits } = fakeRepo({
      head: MOVED_SHA,
      byRef: { [BASE_SHA]: base, [MOVED_SHA]: moved },
    });

    await runPublish({
      repo,
      userEmail: "owner@example.com",
      input: {
        slug: "home",
        baseCommitSha: BASE_SHA,
        fields: [{ section: "hero", field: "title", value: "My New Headline" }],
        images: [],
      },
    });

    expect(commits).toHaveLength(1);
    const written = committedContent(commits[0]!);
    // Mine applied...
    expect(written["home"]!["hero"]!["title"]).toBe("My New Headline");
    // ...and theirs preserved.
    expect(written["home"]!["hero"]!["body"]).toBe("Someone else rewrote the body copy.");
    // Parented on the moved head, so the ref update is a fast-forward.
    expect(commits[0]!.parentCommitSha).toBe(MOVED_SHA);
  });

  it("merges when the other change was on a different page entirely", async () => {
    const base = tree();
    const moved = tree();
    moved["contact"]!["hero"]!["title"] = "Reach Us";

    const { repo, commits } = fakeRepo({
      head: MOVED_SHA,
      byRef: { [BASE_SHA]: base, [MOVED_SHA]: moved },
    });

    await runPublish({
      repo,
      userEmail: "owner@example.com",
      input: {
        slug: "home",
        baseCommitSha: BASE_SHA,
        fields: [{ section: "hero", field: "title", value: "My New Headline" }],
        images: [],
      },
    });

    const written = committedContent(commits[0]!);
    expect(written["home"]!["hero"]!["title"]).toBe("My New Headline");
    expect(written["contact"]!["hero"]!["title"]).toBe("Reach Us");
  });

  it("returns a conflict naming the field, and commits nothing, on overlap", async () => {
    const base = tree();
    const moved = tree();
    moved["home"]!["hero"]!["title"] = "Their Headline";

    const { repo, commits } = fakeRepo({
      head: MOVED_SHA,
      byRef: { [BASE_SHA]: base, [MOVED_SHA]: moved },
    });

    let caught: unknown;
    try {
      await runPublish({
        repo,
        userEmail: "owner@example.com",
        input: {
          slug: "home",
          baseCommitSha: BASE_SHA,
          fields: [{ section: "hero", field: "title", value: "My Headline" }],
          images: [],
        },
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(PublishError);
    expect((caught as PublishError).code).toBe("conflict");
    expect((caught as PublishError).message).toContain("Someone else changed");
    expect((caught as PublishError).fields).toEqual(["Hero → Headline"]);
    expect(commits).toHaveLength(0);
  });

  it("reports a conflict when the version it started from is gone", async () => {
    const moved = tree();
    const { repo, commits } = fakeRepo({ head: MOVED_SHA, byRef: { [MOVED_SHA]: moved } });
    await expect(
      runPublish({
        repo,
        userEmail: "owner@example.com",
        input: {
          slug: "home",
          baseCommitSha: BASE_SHA,
          fields: [{ section: "hero", field: "title", value: "x" }],
          images: [],
        },
      }),
    ).rejects.toThrow("no longer available");
    expect(commits).toHaveLength(0);
  });
});

describe("createGithubContentRepo — one commit through the Git Data API", () => {
  const config = {
    token: "ghp_notrealtoken",
    repo: "acts2man/treetestprep",
    branch: "armature/git-content",
  };

  it("creates blobs, a tree, a commit and a NON-forced ref update", async () => {
    const calls: { method: string; url: string; body: unknown }[] = [];

    const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const href = String(url);
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, url: href, body });

      // The token must travel as a bearer header and nowhere else.
      const auth = new Headers(init?.headers).get("Authorization");
      expect(auth).toBe(`Bearer ${config.token}`);

      const json = (value: unknown) =>
        new Response(JSON.stringify(value), {
          status: 200,
          headers: { "content-type": "application/json" },
        });

      if (href.endsWith("/git/ref/heads/armature/git-content")) {
        return json({ object: { sha: "headsha" } });
      }
      if (href.includes("/git/commits/headsha")) return json({ tree: { sha: "treesha" } });
      if (href.endsWith("/git/blobs")) return json({ sha: `blob-${calls.length}` });
      if (href.endsWith("/git/trees")) return json({ sha: "newtreesha" });
      if (href.endsWith("/git/commits")) {
        return json({ sha: "committed", html_url: "https://github.com/x/y/commit/committed" });
      }
      if (href.endsWith("/git/refs/heads/armature/git-content")) {
        return json({ object: { sha: "committed" } });
      }
      throw new Error(`unexpected call ${method} ${href}`);
    }) as unknown as typeof fetch;

    const repo = createGithubContentRepo(config, fakeFetch);
    expect(await repo.getBranchHead()).toBe("headsha");

    const result = await repo.commit({
      message: "Content: Home updated by owner@example.com",
      parentCommitSha: "headsha",
      files: [
        { path: CONTENT_PATH, content: utf8ToBase64("{}\n"), encoding: "base64" },
        { path: "public/assets/uploads/a.png", content: pngBase64, encoding: "base64" },
      ],
    });

    expect(result).toEqual({
      commitSha: "committed",
      commitUrl: "https://github.com/x/y/commit/committed",
    });

    // Two blobs for two files.
    expect(calls.filter((call) => call.url.endsWith("/git/blobs"))).toHaveLength(2);

    // The tree is layered over the parent's tree, not built from scratch.
    const treeCall = calls.find((call) => call.url.endsWith("/git/trees"))!;
    expect((treeCall.body as { base_tree: string }).base_tree).toBe("treesha");
    expect((treeCall.body as { tree: unknown[] }).tree).toHaveLength(2);

    // Exactly one commit, with the expected parent.
    const commitCalls = calls.filter(
      (call) => call.method === "POST" && call.url.endsWith("/git/commits"),
    );
    expect(commitCalls).toHaveLength(1);
    expect((commitCalls[0]!.body as { parents: string[] }).parents).toEqual(["headsha"]);

    // The ref update must not be forced.
    const refCall = calls.find((call) => call.method === "PATCH")!;
    expect(refCall.url).toContain("/git/refs/heads/armature/git-content");
    expect((refCall.body as { force: boolean }).force).toBe(false);
  });

  it("maps 401/403 to a forbidden error that does not leak the token", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ message: `Bad credentials for ${config.token}` }), {
        status: 401,
      })) as unknown as typeof fetch;

    const repo = createGithubContentRepo(config, fakeFetch);
    let caught: unknown;
    try {
      await repo.getBranchHead();
    } catch (error) {
      caught = error;
    }
    expect((caught as PublishError).code).toBe("forbidden");
    expect((caught as PublishError).message).not.toContain(config.token);
    expect((caught as PublishError).message).toContain("[redacted]");
  });

  it("maps a 422 ref update to a conflict", async () => {
    const fakeFetch = (async (url: string | URL | Request) => {
      const href = String(url);
      const json = (value: unknown, status = 200) =>
        new Response(JSON.stringify(value), { status });
      if (href.includes("/git/commits/headsha")) return json({ tree: { sha: "treesha" } });
      if (href.endsWith("/git/blobs")) return json({ sha: "blob" });
      if (href.endsWith("/git/trees")) return json({ sha: "newtree" });
      if (href.endsWith("/git/commits")) return json({ sha: "c", html_url: "u" });
      return json({ message: "Update is not a fast forward" }, 422);
    }) as unknown as typeof fetch;

    const repo = createGithubContentRepo(config, fakeFetch);
    await expect(
      repo.commit({
        message: "m",
        parentCommitSha: "headsha",
        files: [{ path: CONTENT_PATH, content: utf8ToBase64("{}"), encoding: "base64" }],
      }),
    ).rejects.toThrow("the branch moved while publishing");
  });

  it("maps a 404 to a configuration hint", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
      })) as unknown as typeof fetch;
    const repo = createGithubContentRepo(config, fakeFetch);
    await expect(repo.getBranchHead()).rejects.toThrow("Check GITHUB_REPO and CONTENT_BRANCH");
  });
});

describe("base64 helpers", () => {
  it("round-trips text including non-ASCII content", () => {
    const text = 'Tuesdays · 6:00 – 8:30 PM — "©" 🌳\n';
    expect(base64ToUtf8(utf8ToBase64(text))).toBe(text);
  });

  it("round-trips the whole content file", () => {
    const text = serializeContent(liveContent);
    expect(base64ToUtf8(utf8ToBase64(text))).toBe(text);
  });

  it("measures decoded byte length without decoding", () => {
    for (const sample of ["", "a", "ab", "abc", "hello world", "Tuesdays · 6:00 – 8:30 PM"]) {
      const encoded = utf8ToBase64(sample);
      expect(base64ByteLength(encoded)).toBe(new TextEncoder().encode(sample).length);
    }
  });
});
