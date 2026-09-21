/**
 * Server functions for the git-first content editor.
 *
 * All three are staff-only. Authentication happens INSIDE each handler, via
 * `resolveCaller()` in auth.server.ts, rather than through the generated
 * `requireSupabaseAuth` middleware.
 *
 * That is deliberate and it is the fix for the "silent dashboard" bug: middleware runs
 * outside the handler, and `requireSupabaseAuth` signals every problem by throwing, so
 * a missing SUPABASE_URL or an unattached bearer token left the RPC as a rejected
 * promise with no structured body. The editor could not tell that apart from "still
 * loading", so it showed neither the connected line nor an error. Now every failure —
 * configuration, sign-in, permissions, GitHub — comes back as
 * `{ ok: false, code, message }` that the editor renders verbatim.
 *
 * Everything server-only is pulled in with a dynamic `await import()` inside the
 * handler. This file is a `*.functions.ts` module, which ships to the client bundle, so
 * a top-level import of github.server.ts would put the publish token's code path in the
 * browser. ARMATURE_STEP3.md records the grep that proves it does not.
 *
 * Both reads use POST. A GET server function's response can be cached by a browser or
 * CDN, and a cached commit sha would make the editor publish against a stale base and
 * report a phantom conflict.
 */
import { createServerFn } from "@tanstack/react-start";
import type { ContentTree, ContentValue } from "@/lib/contentFile";
import type { PublishErrorCode } from "@/lib/github.server";
import type {
  ConnectionCheck,
  ConnectionReport,
  SignInResult,
  StaffResult,
} from "@/lib/diagnostics.server";

/** Re-exported so route files can type the checklist without naming a .server module. */
export type { ConnectionCheck, ConnectionReport };

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

export type ConnectionResult = ({ ok: true } & ConnectionReport) | ContentFailure;

/** Narrow an unknown thrown value into the shape the editor expects. */
async function toFailure(error: unknown): Promise<ContentFailure> {
  const { PublishError } = await import("@/lib/github.server");
  if (error instanceof PublishError) {
    return { ok: false, code: error.code, message: error.message, fields: error.fields };
  }
  const message = error instanceof Error ? error.message : "Something went wrong.";
  // Belt and braces: if anything still throws a bare Unauthorized, say something useful.
  if (message.startsWith("Unauthorized")) {
    return {
      ok: false,
      code: "forbidden",
      message: "Your sign-in was not accepted. Reload the page, or sign in again.",
      fields: [],
    };
  }
  console.error("[publish] unexpected failure:", message);
  return {
    ok: false,
    code: "github_error",
    message: `Unexpected error: ${message}. Use "Check connection" for details.`,
    fields: [],
  };
}

/**
 * The content as actually committed on CONTENT_BRANCH, plus the commit it came from.
 * The editor loads this rather than the bundled copy, so it always shows what is
 * really published and can detect a concurrent change at publish time.
 */
export const getPublishedContent = createServerFn({ method: "POST" }).handler(
  async (): Promise<PublishedContent | ContentFailure> => {
    try {
      const { resolveCaller } = await import("@/lib/auth.server");
      const { assertStaff } = await import("@/lib/publish.server");
      const { readPublishConfig, createGithubContentRepo, CONTENT_PATH, PublishError } =
        await import("@/lib/github.server");

      const caller = await resolveCaller();
      await assertStaff(
        caller.supabase as unknown as Parameters<typeof assertStaff>[0],
        caller.userId,
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

      if (!head) {
        throw new PublishError(
          "github_error",
          `GitHub did not report a current commit for ${config.branch}.`,
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
  },
);

/**
 * The self-diagnosis behind the "Check connection" button. Never throws: it returns a
 * checklist so one broken step does not hide the others. Secrets are reported by
 * presence and length only.
 */
export const checkPublishConnection = createServerFn({ method: "POST" }).handler(
  async (): Promise<ConnectionResult> => {
    try {
      const { resolveCaller } = await import("@/lib/auth.server");
      const { assertStaff } = await import("@/lib/publish.server");
      const { createGithubProbe } = await import("@/lib/github.server");
      const { buildConnectionReport } = await import("@/lib/diagnostics.server");

      let signIn: SignInResult = { ok: false, message: "Not checked." };
      let staff: StaffResult = { ok: false, message: "Not checked." };

      try {
        const caller = await resolveCaller();
        signIn = { ok: true, email: caller.email, userId: caller.userId };
        try {
          await assertStaff(
            caller.supabase as unknown as Parameters<typeof assertStaff>[0],
            caller.userId,
          );
          staff = { ok: true, message: "is_staff returned true" };
        } catch (error) {
          staff = {
            ok: false,
            message: error instanceof Error ? error.message : "Could not confirm your role.",
          };
        }
      } catch (error) {
        signIn = {
          ok: false,
          message: error instanceof Error ? error.message : "Could not verify your sign-in.",
        };
      }

      const report = await buildConnectionReport({
        env: process.env,
        signIn,
        staff,
        makeProbe: (config) => createGithubProbe(config),
      });

      return { ok: true, ...report };
    } catch (error) {
      return toFailure(error);
    }
  },
);

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
  .validator(validatePublishRequest)
  .handler(async ({ data }): Promise<PublishSuccess | ContentFailure> => {
    try {
      const { resolveCaller } = await import("@/lib/auth.server");
      const { assertStaff, runPublish } = await import("@/lib/publish.server");
      const { readPublishConfig, createGithubContentRepo } = await import("@/lib/github.server");

      const caller = await resolveCaller();
      await assertStaff(
        caller.supabase as unknown as Parameters<typeof assertStaff>[0],
        caller.userId,
      );

      const config = readPublishConfig();
      const repo = createGithubContentRepo(config);

      const outcome = await runPublish({
        repo,
        input: data,
        userEmail: caller.email,
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
