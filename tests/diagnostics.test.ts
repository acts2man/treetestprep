/**
 * Tests for the self-diagnosis behind the "Check connection" button, and for the
 * Supabase server-environment reader whose absence caused the silent dashboard.
 *
 * Run with: bun run test
 *
 * GitHub is a fake probe; no token and no network are involved.
 */
import { describe, expect, it } from "bun:test";
import { buildConnectionReport, type ConnectionCheck } from "@/lib/diagnostics.server";
import { describeSupabaseEnv, readBearerToken, readSupabaseServerConfig } from "@/lib/auth.server";
import { PublishError, createGithubProbe, type GithubProbe } from "@/lib/github.server";

const FULL_ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abcdefghijklmnop",
  GITHUB_CONTENT_TOKEN: "github_pat_notarealtoken_0123456789",
  GITHUB_REPO: "acts2man/treetestprep",
  CONTENT_BRANCH: "armature/git-content",
};

const STAFF = { ok: true as const, message: "is_staff returned true" };
const SIGNED_IN = { ok: true as const, email: "owner@example.com", userId: "user-1" };

/** A probe where everything succeeds, unless overridden. */
function happyProbe(overrides: Partial<GithubProbe> = {}): GithubProbe {
  return {
    repository: async () => ({ status: 200, ok: true, message: "OK", canPush: true }),
    branch: async () => ({ status: 200, ok: true, message: "OK", sha: "abc1234" }),
    contentFile: async () => ({ status: 200, ok: true, message: "OK" }),
    ...overrides,
  };
}

const find = (checks: ConnectionCheck[], id: string): ConnectionCheck => {
  const check = checks.find((entry) => entry.id === id);
  if (!check) throw new Error(`no check with id ${id}`);
  return check;
};

const report = (opts: {
  env?: Record<string, string | undefined>;
  signIn?: Parameters<typeof buildConnectionReport>[0]["signIn"];
  staff?: Parameters<typeof buildConnectionReport>[0]["staff"];
  probe?: GithubProbe;
}) =>
  buildConnectionReport({
    env: opts.env ?? FULL_ENV,
    signIn: opts.signIn ?? SIGNED_IN,
    staff: opts.staff ?? STAFF,
    makeProbe: () => opts.probe ?? happyProbe(),
  });

// ---------------------------------------------------------------------------

describe("describeSupabaseEnv / readSupabaseServerConfig", () => {
  it("reports both present without revealing the key", () => {
    const env = describeSupabaseEnv(FULL_ENV);
    expect(env.missing).toEqual([]);
    expect(env.urlPresent).toBe(true);
    expect(env.keyPresent).toBe(true);
    expect(env.keyLength).toBe(FULL_ENV.SUPABASE_PUBLISHABLE_KEY.length);
  });

  it("names SUPABASE_URL when it is missing — the actual cause of the silent editor", () => {
    const env = describeSupabaseEnv({ ...FULL_ENV, SUPABASE_URL: undefined });
    expect(env.missing).toEqual(["SUPABASE_URL"]);
  });

  it("does not accept the VITE_-prefixed pair as a substitute", () => {
    const env = describeSupabaseEnv({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
    });
    expect(env.missing).toEqual(["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"]);
  });

  it("falls back to SUPABASE_ANON_KEY", () => {
    const env = describeSupabaseEnv({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon-key-value",
    });
    expect(env.missing).toEqual([]);
  });

  it("throws a not_configured PublishError, not a bare Error", () => {
    try {
      readSupabaseServerConfig({ ...FULL_ENV, SUPABASE_URL: undefined });
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(PublishError);
      expect((error as PublishError).code).toBe("not_configured");
      expect((error as PublishError).message).toContain("SUPABASE_URL");
      expect((error as PublishError).message).toContain("VITE_");
    }
  });

  it("never puts a key value in the error message", () => {
    try {
      readSupabaseServerConfig({ SUPABASE_URL: "https://x.supabase.co" });
    } catch (error) {
      expect((error as PublishError).message).not.toContain("sb_publishable");
    }
  });
});

describe("readBearerToken", () => {
  it("throws a forbidden PublishError when there is no request context", () => {
    // Outside a request, getRequest() yields nothing — the same shape as a missing header.
    try {
      readBearerToken();
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(PublishError);
      expect((error as PublishError).code).toBe("forbidden");
    }
  });
});

describe("buildConnectionReport — the happy path", () => {
  it("passes every check and says so", async () => {
    const result = await report({});
    expect(result.allPassed).toBe(true);
    expect(result.checks.every((check) => check.status === "ok")).toBe(true);
    expect(result.checks.map((check) => check.id)).toEqual([
      "supabase-env",
      "signed-in",
      "is-staff",
      "github-token",
      "github-repo",
      "content-branch",
      "github-auth",
      "github-write",
      "github-branch",
      "content-file",
    ]);
  });

  it("reports the token by length only, never its value", async () => {
    const result = await report({});
    const token = find(result.checks, "github-token");
    expect(token.detail).toBe(`Present, ${FULL_ENV.GITHUB_CONTENT_TOKEN.length} characters`);
    const serialised = JSON.stringify(result);
    expect(serialised).not.toContain(FULL_ENV.GITHUB_CONTENT_TOKEN);
    expect(serialised).not.toContain(FULL_ENV.SUPABASE_PUBLISHABLE_KEY);
  });

  it("shows the non-secret repo and branch values, and the branch's short sha", async () => {
    const result = await report({});
    expect(find(result.checks, "github-repo").detail).toBe("acts2man/treetestprep");
    expect(find(result.checks, "content-branch").detail).toBe("armature/git-content");
    expect(find(result.checks, "github-branch").detail).toContain("abc1234");
  });
});

describe("buildConnectionReport — each failure gets a fix", () => {
  it("flags a missing Supabase environment", async () => {
    const result = await report({ env: { ...FULL_ENV, SUPABASE_URL: undefined } });
    const check = find(result.checks, "supabase-env");
    expect(check.status).toBe("fail");
    expect(check.detail).toContain("SUPABASE_URL");
    expect(check.fix).toContain("VITE_");
    expect(check.fix).toContain("Netlify");
    expect(result.allPassed).toBe(false);
  });

  it("flags a missing token and names Netlify's Functions scope", async () => {
    const result = await report({ env: { ...FULL_ENV, GITHUB_CONTENT_TOKEN: undefined } });
    const check = find(result.checks, "github-token");
    expect(check.status).toBe("fail");
    expect(check.fix).toContain("Netlify is not passing GITHUB_CONTENT_TOKEN");
    expect(check.fix).toContain("Branch deploys");
    expect(check.fix).toContain("Functions");
    // GitHub is not asked when a setting is missing.
    expect(find(result.checks, "github-auth").status).toBe("skipped");
  });

  it("flags a missing GITHUB_REPO and CONTENT_BRANCH", async () => {
    const result = await report({
      env: { ...FULL_ENV, GITHUB_REPO: undefined, CONTENT_BRANCH: undefined },
    });
    expect(find(result.checks, "github-repo").status).toBe("fail");
    expect(find(result.checks, "content-branch").status).toBe("fail");
  });

  it("does not run or reveal the GitHub checks for a non-staff caller", async () => {
    const result = await report({ staff: { ok: false, message: "not staff" } });
    expect(find(result.checks, "is-staff").status).toBe("fail");
    for (const id of ["github-token", "github-repo", "content-branch", "github-auth"]) {
      expect(find(result.checks, id).status).toBe("skipped");
    }
    expect(JSON.stringify(result)).not.toContain("acts2man/treetestprep");
    expect(JSON.stringify(result)).not.toContain(FULL_ENV.GITHUB_CONTENT_TOKEN);
  });

  it("skips the staff check when sign-in failed, and still explains the sign-in", async () => {
    const result = await report({
      signIn: { ok: false, message: "Your browser did not send a sign-in token" },
    });
    expect(find(result.checks, "signed-in").status).toBe("fail");
    expect(find(result.checks, "signed-in").fix).toContain("Supabase line above");
    expect(find(result.checks, "is-staff").status).toBe("skipped");
  });

  it("explains a 401 from GitHub as an expired or wrongly scoped token", async () => {
    const result = await report({
      probe: happyProbe({
        repository: async () => ({ status: 401, ok: false, message: "Bad credentials" }),
      }),
    });
    const check = find(result.checks, "github-auth");
    expect(check.status).toBe("fail");
    expect(check.detail).toContain("HTTP 401");
    expect(check.fix).toContain("expired");
    // Downstream checks are skipped rather than reported as separate failures.
    expect(find(result.checks, "github-write").status).toBe("skipped");
    expect(find(result.checks, "github-branch").status).toBe("skipped");
    expect(find(result.checks, "content-file").status).toBe("skipped");
  });

  it("explains a 404 on the repository as a name or access problem", async () => {
    const result = await report({
      probe: happyProbe({
        repository: async () => ({ status: 404, ok: false, message: "Not Found" }),
      }),
    });
    expect(find(result.checks, "github-auth").fix).toContain("owner/repo");
  });

  it("flags a read-only token from permissions.push", async () => {
    const result = await report({
      probe: happyProbe({
        repository: async () => ({ status: 200, ok: true, message: "OK", canPush: false }),
      }),
    });
    const check = find(result.checks, "github-write");
    expect(check.status).toBe("fail");
    expect(check.detail).toContain("permissions.push is false");
    expect(check.fix).toContain("Read and write");
    expect(result.allPassed).toBe(false);
  });

  it("flags a missing branch and names the setting to check", async () => {
    const result = await report({
      probe: happyProbe({
        branch: async () => ({ status: 404, ok: false, message: "Not Found" }),
      }),
    });
    const check = find(result.checks, "github-branch");
    expect(check.status).toBe("fail");
    expect(check.fix).toContain("CONTENT_BRANCH");
    expect(find(result.checks, "content-file").status).toBe("skipped");
  });

  it("flags a missing content file on that branch", async () => {
    const result = await report({
      probe: happyProbe({
        contentFile: async () => ({ status: 404, ok: false, message: "Not Found" }),
      }),
    });
    const check = find(result.checks, "content-file");
    expect(check.status).toBe("fail");
    expect(check.fix).toContain("content/pages.json");
  });

  it("handles GitHub being unreachable (status 0)", async () => {
    const result = await report({
      probe: happyProbe({
        repository: async () => ({ status: 0, ok: false, message: "fetch failed" }),
      }),
    });
    const check = find(result.checks, "github-auth");
    expect(check.detail).toContain("no response");
    expect(check.fix).toContain("githubstatus.com");
  });

  it("gives every failing check a fix, and no passing check one", async () => {
    const result = await report({
      env: { ...FULL_ENV, GITHUB_CONTENT_TOKEN: undefined },
      staff: { ok: false, message: "not staff" },
      signIn: { ok: false, message: "no token" },
    });
    for (const check of result.checks) {
      if (check.status === "fail") expect(check.fix).toBeTruthy();
      if (check.status === "ok") expect(check.fix).toBeUndefined();
      expect(check.detail.length).toBeGreaterThan(0);
      expect(check.label.length).toBeGreaterThan(0);
    }
  });
});

describe("createGithubProbe — reports instead of throwing", () => {
  const config = {
    token: "github_pat_notreal",
    repo: "acts2man/treetestprep",
    branch: "armature/git-content",
  };

  it("reads permissions.push from the repository response", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ permissions: { push: true } }), {
        status: 200,
      })) as unknown as typeof fetch;
    const result = await createGithubProbe(config, fakeFetch).repository();
    expect(result).toMatchObject({ status: 200, ok: true, canPush: true });
  });

  it("reports a 401 rather than throwing, with the token redacted", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ message: `Bad credentials ${config.token}` }), {
        status: 401,
      })) as unknown as typeof fetch;
    const result = await createGithubProbe(config, fakeFetch).repository();
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(result.message).not.toContain(config.token);
    expect(result.message).toContain("[redacted]");
  });

  it("reports a transport failure as status 0 rather than throwing", async () => {
    const fakeFetch = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const result = await createGithubProbe(config, fakeFetch).repository();
    expect(result).toMatchObject({ status: 0, ok: false });
    expect(result.message).toContain("network down");
  });

  it("returns the branch's short sha", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ object: { sha: "0123456789abcdef" } }), {
        status: 200,
      })) as unknown as typeof fetch;
    const result = await createGithubProbe(config, fakeFetch).branch();
    expect(result.sha).toBe("0123456");
  });

  it("asks for the content file on the given ref", async () => {
    let seen = "";
    const fakeFetch = (async (url: string | URL | Request) => {
      seen = String(url);
      return new Response(JSON.stringify({ sha: "x" }), { status: 200 });
    }) as unknown as typeof fetch;
    await createGithubProbe(config, fakeFetch).contentFile("armature/git-content");
    expect(seen).toContain("/contents/content/pages.json");
    expect(seen).toContain("ref=armature%2Fgit-content");
  });
});
