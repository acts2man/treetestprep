/**
 * Self-diagnosis for the publish path — what the "Check connection" button runs.
 *
 * SERVER ONLY. Reached by dynamic import from `content.functions.ts`.
 *
 * Every check reports rather than throws, so one failure never hides the rest: the
 * dashboard shows the whole checklist with a green tick or a red cross and a
 * plain-English fix on each line.
 *
 * Secrets: the token's *presence and character length* are reported, never its value.
 * GITHUB_REPO and CONTENT_BRANCH are not secret and are shown, but only to a staff
 * caller. The Supabase environment lines are shown to any signed-in-or-not caller on
 * purpose — a broken sign-in is exactly the case that needs diagnosing, and presence
 * flags disclose nothing the browser bundle does not already contain.
 */
import type { GithubProbe, PublishConfig } from "@/lib/github.server";
import { CONTENT_PATH } from "@/lib/contentFile";
import { describeSupabaseEnv } from "@/lib/auth.server";

export type CheckStatus = "ok" | "fail" | "skipped";

export type ConnectionCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  /** Safe to display. Never a secret value. */
  detail: string;
  /** Plain-English next step, present when the check did not pass. */
  fix?: string;
};

export type ConnectionReport = {
  /** True only when every check passed. Distinct from the RPC envelope's `ok`. */
  allPassed: boolean;
  checks: ConnectionCheck[];
};

export type SignInResult =
  { ok: true; email: string; userId: string } | { ok: false; message: string };
export type StaffResult = { ok: boolean; message: string };

const NETLIFY_VAR_FIX =
  "In Netlify, open Site configuration → Environment variables, click the variable, and make sure it has a value for Branch deploys as well as Production, with Scopes including Functions. Then redeploy the branch — environment variables only reach a deploy that was built after they were saved.";

/**
 * Run the checklist. `makeProbe` is injected so tests can supply a fake GitHub.
 */
export async function buildConnectionReport(input: {
  env: Record<string, string | undefined>;
  signIn: SignInResult;
  staff: StaffResult;
  makeProbe: (config: PublishConfig) => GithubProbe;
}): Promise<ConnectionReport> {
  const { env, signIn, staff, makeProbe } = input;
  const checks: ConnectionCheck[] = [];

  // --- 1. Supabase server environment (the sign-in prerequisite) -----------
  const supabase = describeSupabaseEnv(env);
  checks.push(
    supabase.missing.length === 0
      ? {
          id: "supabase-env",
          label: "Supabase keys reached this deploy",
          status: "ok",
          detail: `SUPABASE_URL set; SUPABASE_PUBLISHABLE_KEY set (${supabase.keyLength} characters)`,
        }
      : {
          id: "supabase-env",
          label: "Supabase keys reached this deploy",
          status: "fail",
          detail: `Missing: ${supabase.missing.join(", ")}`,
          fix: `The dashboard cannot verify your sign-in without these, and they are NOT the same as the VITE_-prefixed pair. Add ${supabase.missing.join(" and ")} in Netlify. ${NETLIFY_VAR_FIX}`,
        },
  );

  // --- 2. Signed in --------------------------------------------------------
  checks.push(
    signIn.ok
      ? {
          id: "signed-in",
          label: "You are signed in",
          status: "ok",
          detail: `Signed in as ${signIn.email}`,
        }
      : {
          id: "signed-in",
          label: "You are signed in",
          status: "fail",
          detail: signIn.message,
          fix: "Sign out and sign in again at /auth/. If this keeps failing, check the Supabase line above first — that is the usual cause.",
        },
  );

  // --- 3. Staff ------------------------------------------------------------
  if (!signIn.ok) {
    checks.push({
      id: "is-staff",
      label: "Your account can publish",
      status: "skipped",
      detail: "Not checked, because the sign-in check did not pass.",
    });
  } else {
    checks.push(
      staff.ok
        ? {
            id: "is-staff",
            label: "Your account can publish",
            status: "ok",
            detail: "is_staff returned true",
          }
        : {
            id: "is-staff",
            label: "Your account can publish",
            status: "fail",
            detail: staff.message,
            fix: "This account needs the admin or super_admin role. Another admin can grant it under /admin/settings/.",
          },
    );
  }

  const skipRest = (reason: string) => {
    for (const [id, label] of [
      ["github-token", "GITHUB_CONTENT_TOKEN reached this deploy"],
      ["github-repo", "GITHUB_REPO is set"],
      ["content-branch", "CONTENT_BRANCH is set"],
      ["github-auth", "GitHub accepted the token"],
      ["github-write", "The token can write to the repository"],
      ["github-branch", "The content branch exists"],
      ["content-file", `${CONTENT_PATH} is readable`],
    ] as const) {
      checks.push({ id, label, status: "skipped", detail: reason });
    }
  };

  if (!signIn.ok || !staff.ok) {
    skipRest("Not checked. Sign in with a staff account to run the GitHub checks.");
    return { allPassed: false, checks };
  }

  // --- 4. The three publish variables -------------------------------------
  const token = env["GITHUB_CONTENT_TOKEN"]?.trim() ?? "";
  const repo = env["GITHUB_REPO"]?.trim() ?? "";
  const branch = env["CONTENT_BRANCH"]?.trim() ?? "";

  checks.push(
    token
      ? {
          id: "github-token",
          label: "GITHUB_CONTENT_TOKEN reached this deploy",
          status: "ok",
          detail: `Present, ${token.length} characters`,
        }
      : {
          id: "github-token",
          label: "GITHUB_CONTENT_TOKEN reached this deploy",
          status: "fail",
          detail: "Not present in this deploy's environment",
          fix: `Netlify is not passing GITHUB_CONTENT_TOKEN to this deploy. ${NETLIFY_VAR_FIX}`,
        },
  );

  checks.push(
    repo
      ? {
          id: "github-repo",
          label: "GITHUB_REPO is set",
          status: "ok",
          detail: repo,
        }
      : {
          id: "github-repo",
          label: "GITHUB_REPO is set",
          status: "fail",
          detail: "Not present in this deploy's environment",
          fix: `Set GITHUB_REPO to acts2man/treetestprep. ${NETLIFY_VAR_FIX}`,
        },
  );

  checks.push(
    branch
      ? {
          id: "content-branch",
          label: "CONTENT_BRANCH is set",
          status: "ok",
          detail: branch,
        }
      : {
          id: "content-branch",
          label: "CONTENT_BRANCH is set",
          status: "fail",
          detail: "Not present in this deploy's environment",
          fix: `Set CONTENT_BRANCH to the branch publishes should commit to. ${NETLIFY_VAR_FIX}`,
        },
  );

  if (!token || !repo || !branch) {
    for (const [id, label] of [
      ["github-auth", "GitHub accepted the token"],
      ["github-write", "The token can write to the repository"],
      ["github-branch", "The content branch exists"],
      ["content-file", `${CONTENT_PATH} is readable`],
    ] as const) {
      checks.push({
        id,
        label,
        status: "skipped",
        detail: "Not checked, because a setting above is missing.",
      });
    }
    return { allPassed: false, checks };
  }

  // --- 5. Ask GitHub ------------------------------------------------------
  const probe = makeProbe({ token, repo, branch });

  const repository = await probe.repository();
  checks.push(
    repository.ok
      ? {
          id: "github-auth",
          label: "GitHub accepted the token",
          status: "ok",
          detail: `HTTP ${repository.status} from GET /repos/${repo}`,
        }
      : {
          id: "github-auth",
          label: "GitHub accepted the token",
          status: "fail",
          detail: `HTTP ${repository.status || "no response"} from GET /repos/${repo} — ${repository.message}`,
          fix:
            repository.status === 401 || repository.status === 403
              ? "GitHub rejected the token. It has probably expired, or it was created without access to this repository. Make a new fine-grained token with Contents: Read and write on acts2man/treetestprep only, then update GITHUB_CONTENT_TOKEN in Netlify and redeploy."
              : repository.status === 404
                ? "GitHub cannot see this repository with this token. Check GITHUB_REPO is spelled owner/repo exactly, and that the token's Repository access includes it."
                : "GitHub could not be reached. Try again in a minute; if it persists, check https://www.githubstatus.com.",
        },
  );

  checks.push(
    !repository.ok
      ? {
          id: "github-write",
          label: "The token can write to the repository",
          status: "skipped",
          detail: "Not checked, because GitHub did not accept the token.",
        }
      : repository.canPush === true
        ? {
            id: "github-write",
            label: "The token can write to the repository",
            status: "ok",
            detail: "permissions.push is true",
          }
        : {
            id: "github-write",
            label: "The token can write to the repository",
            status: "fail",
            detail: "permissions.push is false — this token can read but not write",
            fix: "The token is read-only. Edit it on GitHub (Settings → Developer settings → Personal access tokens → Fine-grained tokens) and set Repository permissions → Contents to Read and write, or make a new one. Then update GITHUB_CONTENT_TOKEN in Netlify and redeploy.",
          },
  );

  const branchProbe = repository.ok
    ? await probe.branch()
    : { ok: false, status: 0, message: "skipped" };
  checks.push(
    !repository.ok
      ? {
          id: "github-branch",
          label: "The content branch exists",
          status: "skipped",
          detail: "Not checked, because GitHub did not accept the token.",
        }
      : branchProbe.ok
        ? {
            id: "github-branch",
            label: "The content branch exists",
            status: "ok",
            detail: `HTTP ${branchProbe.status} — ${branch} is at ${branchProbe.sha ?? "unknown"}`,
          }
        : {
            id: "github-branch",
            label: "The content branch exists",
            status: "fail",
            detail: `HTTP ${branchProbe.status || "no response"} for branch ${branch} — ${branchProbe.message}`,
            fix: `GitHub has no branch called "${branch}". Check CONTENT_BRANCH for a typo — branch names are case-sensitive and include any slashes.`,
          },
  );

  const fileProbe = branchProbe.ok
    ? await probe.contentFile(branch)
    : { ok: false, status: 0, message: "skipped" };
  checks.push(
    !branchProbe.ok
      ? {
          id: "content-file",
          label: `${CONTENT_PATH} is readable`,
          status: "skipped",
          detail: "Not checked, because the branch was not found.",
        }
      : fileProbe.ok
        ? {
            id: "content-file",
            label: `${CONTENT_PATH} is readable`,
            status: "ok",
            detail: `HTTP ${fileProbe.status} — found on ${branch}`,
          }
        : {
            id: "content-file",
            label: `${CONTENT_PATH} is readable`,
            status: "fail",
            detail: `HTTP ${fileProbe.status || "no response"} — ${fileProbe.message}`,
            fix: `${CONTENT_PATH} is missing from the "${branch}" branch. Publishing needs that file to exist. If CONTENT_BRANCH points at a branch created before the content file was added, point it at a branch that has it.`,
          },
  );

  return { allPassed: checks.every((check) => check.status === "ok"), checks };
}
