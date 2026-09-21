/**
 * Server functions for the git-first content editor.
 *
 * Both are staff-only. They authenticate with `requireSupabaseAuth`, which verifies
 * the caller's bearer token and hands back a Supabase client scoped to that user, so
 * every database read runs as them under RLS — the service-role key is never used.
 *
 * Everything server-only is pulled in with a dynamic `await import()` inside the
 * handler. This file is a `*.functions.ts` module, which ships to the client bundle,
 * so a top-level import of github.server.ts would put the publish token's code path
 * in the browser. ARMATURE_STEP3.md records the grep that proves it does not.
 *
 * Handlers return a discriminated result rather than throwing, so the error code and
 * the conflicting field names survive the RPC boundary intact.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ContentTree, ContentValue } from "@/lib/contentFile";
import type { PublishErrorCode } from "@/lib/github.server";

export type ContentFailure = {
  ok: false;
  code: PublishErrorCode;
  message: string;
  /** For conflicts: human labels of the fields someone else changed. */
  fields: string[];
};

export type PublishedContent = {
  ok: true;
  content: ContentTree;
  /** Head commit of the content branch that this content was read from. */
  commitSha: string;
  branch: string;
  repo: string;
};

export type PublishSuccess = {
  ok: true;
  commitSha: string;
  commitUrl: string;
  fields: string[];
  images: string[];
};

export type FieldUpdateInput = { section: string; field: string; value: ContentValue };

export type ImageUploadInput = {
  section: string;
  field: string;
  filename: string;
  contentType: string;
  dataBase64: string;
};

export type PublishRequest = {
  slug: string;
  baseCommitSha: string;
  fields: FieldUpdateInput[];
  images: ImageUploadInput[];
};

/** Narrow an unknown thrown value into the shape the editor expects. */
async function toFailure(error: unknown): Promise<ContentFailure> {
  const { PublishError } = await import("@/lib/github.server");
  if (error instanceof PublishError) {
    return { ok: false, code: error.code, message: error.message, fields: error.fields };
  }
  // Auth middleware failures surface as plain Errors ("Unauthorized: ...").
  const message = error instanceof Error ? error.message : "Something went wrong.";
  if (message.startsWith("Unauthorized")) {
    return { ok: false, code: "forbidden", message: "Please sign in again.", fields: [] };
  }
  console.error("[publish] unexpected failure", message);
  return { ok: false, code: "github_error", message, fields: [] };
}

const emailFromClaims = (claims: unknown): string => {
  if (claims && typeof claims === "object" && "email" in claims) {
    const email = (claims as { email?: unknown }).email;
    if (typeof email === "string" && email.length > 0) return email;
  }
  return "an admin";
};

/**
 * The content as actually committed on CONTENT_BRANCH, plus the commit it came from.
 * The editor loads this rather than the bundled copy, so it always shows what is
 * really published and can detect a concurrent change at publish time.
 */
export const getPublishedContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PublishedContent | ContentFailure> => {
    try {
      const { assertStaff } = await import("@/lib/publish.server");
      const { readPublishConfig, createGithubContentRepo, CONTENT_PATH, PublishError } =
        await import("@/lib/github.server");

      await assertStaff(
        context.supabase as unknown as Parameters<typeof assertStaff>[0],
        context.userId,
      );

      const config = readPublishConfig();
      const repo = createGithubContentRepo(config);
      const head = await repo.getBranchHead();
      const file = await repo.readTextFile(CONTENT_PATH, head);

      let parsed: unknown;
      try {
        parsed = JSON.parse(file.text);
      } catch {
        throw new PublishError(
          "github_error",
          `${CONTENT_PATH} on ${config.branch} is not valid JSON.`,
        );
      }

      return {
        ok: true,
        content: parsed as ContentTree,
        commitSha: head,
        branch: config.branch,
        repo: config.repo,
      };
    } catch (error) {
      return toFailure(error);
    }
  });

/** Defensive shaping of the RPC payload; the real rules live in contentValidation.ts. */
function validatePublishRequest(data: unknown): PublishRequest {
  if (!data || typeof data !== "object") throw new Error("Invalid publish request");
  const raw = data as Record<string, unknown>;

  const slug = typeof raw["slug"] === "string" ? raw["slug"] : "";
  const baseCommitSha = typeof raw["baseCommitSha"] === "string" ? raw["baseCommitSha"] : "";

  const fields = Array.isArray(raw["fields"])
    ? raw["fields"].flatMap((entry): FieldUpdateInput[] => {
        if (!entry || typeof entry !== "object") return [];
        const item = entry as Record<string, unknown>;
        if (typeof item["section"] !== "string" || typeof item["field"] !== "string") return [];
        return [
          {
            section: item["section"],
            field: item["field"],
            value: item["value"] as ContentValue,
          },
        ];
      })
    : [];

  const images = Array.isArray(raw["images"])
    ? raw["images"].flatMap((entry): ImageUploadInput[] => {
        if (!entry || typeof entry !== "object") return [];
        const item = entry as Record<string, unknown>;
        if (typeof item["section"] !== "string" || typeof item["field"] !== "string") return [];
        return [
          {
            section: item["section"],
            field: item["field"],
            filename: typeof item["filename"] === "string" ? item["filename"] : "",
            contentType: typeof item["contentType"] === "string" ? item["contentType"] : "",
            dataBase64: typeof item["dataBase64"] === "string" ? item["dataBase64"] : "",
          },
        ];
      })
    : [];

  return { slug, baseCommitSha, fields, images };
}

/**
 * Validate the editor's changes, merge them into the committed content, and write one
 * commit to CONTENT_BRANCH — which is what triggers the Netlify rebuild.
 */
export const publishContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(validatePublishRequest)
  .handler(async ({ context, data }): Promise<PublishSuccess | ContentFailure> => {
    try {
      const { assertStaff, runPublish } = await import("@/lib/publish.server");
      const { readPublishConfig, createGithubContentRepo } = await import("@/lib/github.server");

      await assertStaff(
        context.supabase as unknown as Parameters<typeof assertStaff>[0],
        context.userId,
      );

      const config = readPublishConfig();
      const repo = createGithubContentRepo(config);

      const outcome = await runPublish({
        repo,
        input: data,
        userEmail: emailFromClaims(context.claims),
      });

      return {
        ok: true,
        commitSha: outcome.commitSha,
        commitUrl: outcome.commitUrl,
        fields: outcome.fields,
        images: outcome.images,
      };
    } catch (error) {
      return toFailure(error);
    }
  });
