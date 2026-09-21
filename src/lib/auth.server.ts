/**
 * Caller authentication for the content server functions.
 *
 * SERVER ONLY. Reached by dynamic import from `content.functions.ts`.
 *
 * Why this exists instead of `requireSupabaseAuth`:
 * that generated middleware runs *outside* a server function's handler and signals
 * every problem by throwing. A throw from middleware never reaches the handler's
 * try/catch, so it leaves the RPC as a rejected promise with no structured body — and
 * the editor had no way to tell the difference between that and "still loading". It is
 * what made the dashboard go silent when SUPABASE_URL was absent from the Netlify
 * function environment. See ARMATURE_STEP3.md, "If the Publish button is gray".
 *
 * So the same work happens here, inside the handler, and reports problems as
 * `PublishError` values the editor can render. The client half of the pair —
 * `attachSupabaseAuth` in src/start.ts, which puts the bearer token on the request —
 * is untouched and still required.
 */
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { PublishError } from "@/lib/github.server";

export type SupabaseServerConfig = { url: string; key: string };

/** What is known about the Supabase server environment, with no secret values. */
export type SupabaseEnvReport = {
  urlPresent: boolean;
  keyPresent: boolean;
  keyLength: number;
  missing: string[];
};

export function describeSupabaseEnv(
  env: Record<string, string | undefined> = process.env,
): SupabaseEnvReport {
  const url = env["SUPABASE_URL"]?.trim() ?? "";
  const key = env["SUPABASE_PUBLISHABLE_KEY"]?.trim() ?? env["SUPABASE_ANON_KEY"]?.trim() ?? "";
  const missing: string[] = [];
  if (!url) missing.push("SUPABASE_URL");
  if (!key) missing.push("SUPABASE_PUBLISHABLE_KEY");
  return { urlPresent: url.length > 0, keyPresent: key.length > 0, keyLength: key.length, missing };
}

/**
 * The Supabase URL and publishable key from the *server* environment. These are
 * separate from the `VITE_`-prefixed pair: those are compiled into the browser bundle
 * at build time, while these must exist in the deployed function's environment.
 */
export function readSupabaseServerConfig(
  env: Record<string, string | undefined> = process.env,
): SupabaseServerConfig {
  const report = describeSupabaseEnv(env);
  if (report.missing.length > 0) {
    throw new PublishError(
      "not_configured",
      `Publishing is not configured: missing ${report.missing.join(" and ")} in this deploy's environment. These are separate from the VITE_-prefixed pair — add them in Netlify under Site configuration → Environment variables, for all deploy contexts, then redeploy.`,
    );
  }
  const url = env["SUPABASE_URL"]!.trim();
  const key = (env["SUPABASE_PUBLISHABLE_KEY"] ?? env["SUPABASE_ANON_KEY"])!.trim();
  return { url, key };
}

const isNewSupabaseApiKey = (value: string) =>
  value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");

/**
 * Mirrors the fetch wrapper the generated Supabase clients use: always send the
 * `apikey` header, and drop an `Authorization` header that merely repeats a new-style
 * opaque key (those are not bearer JWTs).
 */
function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export type Caller = {
  userId: string;
  email: string;
  /** Scoped to the caller's token, so every query runs as them under RLS. */
  supabase: ReturnType<typeof createClient<Database>>;
};

/** Pull the bearer token off the incoming request, or explain what is missing. */
export function readBearerToken(): string {
  // getRequest() throws a bare Error when there is no request in scope. Guarding it
  // keeps every failure in this module a PublishError the editor can render.
  let request: ReturnType<typeof getRequest> | undefined;
  try {
    request = getRequest();
  } catch {
    throw new PublishError(
      "forbidden",
      "This request arrived without a web request attached, so your sign-in could not be read. Reload the page and try again.",
    );
  }

  const header = request?.headers?.get("authorization");

  if (!header) {
    throw new PublishError(
      "forbidden",
      "Your browser did not send a sign-in token with this request. Reload the page, and sign in again if that does not help.",
    );
  }
  if (!header.startsWith("Bearer ")) {
    throw new PublishError("forbidden", "Your sign-in token was not sent in the expected format.");
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token || token.split(".").length !== 3) {
    throw new PublishError(
      "forbidden",
      "Your sign-in token is not readable. Sign out and sign in again.",
    );
  }
  return token;
}

/**
 * Verify the caller and return a Supabase client scoped to them. Throws `PublishError`
 * — never a bare Error — so the caller's try/catch can turn it into a rendered message.
 */
export async function resolveCaller(): Promise<Caller> {
  const { url, key } = readSupabaseServerConfig();
  const token = readBearerToken();

  const supabase = createClient<Database>(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  let claims: Record<string, unknown> | undefined;
  try {
    const { data, error } = await supabase.auth.getClaims(token);
    if (error) throw error;
    claims = data?.claims as Record<string, unknown> | undefined;
  } catch (error) {
    throw new PublishError(
      "forbidden",
      `Your sign-in could not be verified (${error instanceof Error ? error.message : "unknown error"}). Sign out and sign in again.`,
    );
  }

  const userId = typeof claims?.["sub"] === "string" ? (claims["sub"] as string) : "";
  if (!userId) {
    throw new PublishError(
      "forbidden",
      "Your sign-in token does not identify a user. Sign out and sign in again.",
    );
  }

  const email = typeof claims?.["email"] === "string" ? (claims["email"] as string) : "an admin";

  return { userId, email, supabase };
}
