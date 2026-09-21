/**
 * The git-first publish logic: take the fields an editor changed, merge them into the
 * committed content, and write one commit.
 *
 * SERVER ONLY — it is reached through a dynamic import inside a server function, and
 * it imports github.server.ts, which holds the publish token.
 *
 * Everything here takes its dependencies as arguments (a `ContentRepo`, a clock, a
 * staff-check client), so the whole flow is unit-testable without GitHub or Supabase.
 * All validation runs BEFORE the first network call that could write, so an invalid
 * publish never creates a commit.
 */
import {
  CONTENT_PATH,
  UPLOAD_DIR,
  UPLOAD_URL_PREFIX,
  cloneContent,
  isPlainObject,
  serializeContent,
  type ContentTree,
  type ContentValue,
} from "@/lib/contentFile";
import {
  changedFieldsForPage,
  fieldLabel,
  validateContentTree,
  validateFieldUpdate,
} from "@/lib/contentValidation";
import { getPageDefinition } from "@/lib/pageSchema";
import {
  PublishError,
  base64ByteLength,
  isValidBase64,
  utf8ToBase64,
  type CommitFile,
  type ContentRepo,
} from "@/lib/github.server";

/** Per-image ceiling, as specified for the editor. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Ceiling for one publish's images combined. Base64 inflates a payload by about a
 * third, and Netlify caps a function request at roughly 6 MB, so a publish carrying
 * much more than this is rejected here with a clear message instead of being dropped
 * at the platform edge with an opaque one.
 */
export const MAX_TOTAL_IMAGE_BYTES = Math.floor(4.5 * 1024 * 1024);

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

export type FieldUpdate = { section: string; field: string; value: ContentValue };

export type ImageUpload = {
  section: string;
  field: string;
  filename: string;
  contentType: string;
  /** Base64 of the file bytes, without a data: prefix. */
  dataBase64: string;
};

export type PublishInput = {
  slug: string;
  /** Commit sha the editor loaded its content from. */
  baseCommitSha: string;
  fields: FieldUpdate[];
  images: ImageUpload[];
};

export type PublishOutcome = {
  commitSha: string;
  commitUrl: string;
  /** "section.field" keys written. */
  fields: string[];
  /** Public URLs of images added by this publish. */
  images: string[];
};

/** Turn an uploaded filename into a short, safe slug for the committed path. */
function safeBaseName(filename: string): string {
  const withoutExtension = filename.replace(/\.[^./\\]*$/, "");
  const cleaned = withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (cleaned || "image").slice(0, 60);
}

type PreparedImage = {
  key: string;
  url: string;
  file: CommitFile;
};

/** Validate the uploads and decide where each one is committed. */
function prepareImages(
  slug: string,
  images: ImageUpload[],
  timestamp: number,
): { prepared: PreparedImage[]; errors: string[] } {
  const prepared: PreparedImage[] = [];
  const errors: string[] = [];
  let total = 0;

  images.forEach((image, index) => {
    const where = `image ${index + 1} (${image.filename || "unnamed"})`;

    const extension = IMAGE_EXTENSIONS[image.contentType?.toLowerCase() ?? ""];
    if (!extension) {
      errors.push(
        `${where}: only PNG, JPEG and WebP images can be uploaded — got "${image.contentType}"`,
      );
      return;
    }

    if (typeof image.dataBase64 !== "string" || !isValidBase64(image.dataBase64)) {
      errors.push(`${where}: the uploaded file data is not valid base64`);
      return;
    }

    const bytes = base64ByteLength(image.dataBase64);
    if (bytes === 0) {
      errors.push(`${where}: the uploaded file is empty`);
      return;
    }
    if (bytes > MAX_IMAGE_BYTES) {
      errors.push(
        `${where}: too large (${(bytes / 1024 / 1024).toFixed(1)} MB, limit ${MAX_IMAGE_BYTES / 1024 / 1024} MB)`,
      );
      return;
    }
    total += bytes;

    const name = `${slug}-${timestamp}-${safeBaseName(image.filename)}.${extension}`;
    prepared.push({
      key: `${image.section}.${image.field}`,
      url: `${UPLOAD_URL_PREFIX}/${name}`,
      file: {
        path: `${UPLOAD_DIR}/${name}`,
        content: image.dataBase64.replace(/\s+/g, ""),
        encoding: "base64",
      },
    });
  });

  if (total > MAX_TOTAL_IMAGE_BYTES) {
    errors.push(
      `The images in this publish total ${(total / 1024 / 1024).toFixed(1)} MB, more than the ${(
        MAX_TOTAL_IMAGE_BYTES /
        1024 /
        1024
      ).toFixed(1)} MB a single publish can carry. Publish fewer images at a time.`,
    );
  }

  return { prepared, errors };
}

/**
 * Merge the editor's changes into the committed content and write one commit.
 *
 * Throws `PublishError` with a code the editor can act on:
 * - `invalid`   — bad input or content that would fail check:content. Nothing committed.
 * - `conflict`  — someone else changed the same fields. Nothing committed.
 * - `forbidden` / `not_configured` / `github_error` — see github.server.ts.
 */
export async function runPublish(opts: {
  repo: ContentRepo;
  input: PublishInput;
  userEmail: string;
  now?: () => number;
}): Promise<PublishOutcome> {
  const { repo, input, userEmail } = opts;
  const now = opts.now ?? (() => Date.now());

  const page = getPageDefinition(input.slug);
  if (!page) {
    throw new PublishError("invalid", `"${input.slug}" is not a page this site can edit.`);
  }

  const fields = input.fields ?? [];
  const images = input.images ?? [];
  if (fields.length === 0 && images.length === 0) {
    throw new PublishError("invalid", "There are no changes to publish.");
  }

  if (typeof input.baseCommitSha !== "string" || input.baseCommitSha.length === 0) {
    throw new PublishError(
      "invalid",
      "This editor session did not record which version it loaded. Reload the page and try again.",
    );
  }

  // --- validate everything before touching GitHub --------------------------
  const errors: string[] = [];
  const updates = new Map<string, ContentValue>();

  for (const update of fields) {
    const key = `${update.section}.${update.field}`;
    if (updates.has(key)) {
      errors.push(`${key}: sent twice in one publish`);
      continue;
    }
    updates.set(key, update.value);
  }

  const { prepared, errors: imageErrors } = prepareImages(input.slug, images, now());
  errors.push(...imageErrors);
  // An uploaded image decides its field's value, whatever the client sent for it.
  for (const image of prepared) updates.set(image.key, image.url);

  for (const [key, value] of updates) {
    const [sectionKey, ...rest] = key.split(".");
    const fieldKey = rest.join(".");
    const result = validateFieldUpdate(input.slug, sectionKey ?? "", fieldKey, value);
    errors.push(...result.errors);
  }

  if (errors.length > 0) {
    throw new PublishError("invalid", errors.join("\n"));
  }

  // --- read the current state ---------------------------------------------
  const head = await repo.getBranchHead();
  const currentFile = await repo.readTextFile(CONTENT_PATH, head);

  let current: unknown;
  try {
    current = JSON.parse(currentFile.text);
  } catch {
    throw new PublishError(
      "github_error",
      `${CONTENT_PATH} on the content branch is not valid JSON, so it cannot be edited safely.`,
    );
  }
  if (!isPlainObject(current)) {
    throw new PublishError("github_error", `${CONTENT_PATH} is not a JSON object.`);
  }

  // --- conflict check ------------------------------------------------------
  if (head !== input.baseCommitSha) {
    let base: unknown;
    try {
      const baseFile = await repo.readTextFile(CONTENT_PATH, input.baseCommitSha);
      base = JSON.parse(baseFile.text);
    } catch {
      throw new PublishError(
        "conflict",
        "The content has changed since you opened this page, and the version you started from is no longer available. Reload to get the latest content.",
      );
    }

    const theirChanges = changedFieldsForPage(input.slug, base, current);
    const overlap = [...updates.keys()].filter((key) => theirChanges.has(key));
    if (overlap.length > 0) {
      const labels = overlap.map((key) => {
        const [sectionKey, ...rest] = key.split(".");
        return fieldLabel(input.slug, sectionKey ?? "", rest.join("."));
      });
      throw new PublishError(
        "conflict",
        `Someone else changed ${labels.length === 1 ? "this field" : "these fields"} while you were editing: ${labels.join(", ")}. Nothing was published. Reload to get their version, then reapply your change.`,
        labels,
      );
    }
    // No overlap: their changes are already in `current`, and ours merge on top.
  }

  // --- merge ---------------------------------------------------------------
  const merged = cloneContent(current) as ContentTree;
  for (const [key, value] of updates) {
    const [sectionKey, ...rest] = key.split(".");
    const fieldKey = rest.join(".");
    const section = (merged[input.slug] ??= {});
    const sectionContent = (section[sectionKey ?? ""] ??= {});
    sectionContent[fieldKey] = value;
  }

  // --- the same checks scripts/check-content.ts runs -----------------------
  const report = validateContentTree(merged);
  if (report.errors.length > 0) {
    throw new PublishError(
      "invalid",
      `Publishing would have made the content file invalid, so nothing was published:\n${report.errors.join("\n")}`,
    );
  }

  const nextText = serializeContent(merged);
  if (nextText === currentFile.text && prepared.length === 0) {
    throw new PublishError("invalid", "There are no changes to publish.");
  }

  // --- one commit ----------------------------------------------------------
  const files: CommitFile[] = [
    { path: CONTENT_PATH, content: utf8ToBase64(nextText), encoding: "base64" },
    ...prepared.map((image) => image.file),
  ];

  const result = await repo.commit({
    message: `Content: ${page.label} updated by ${userEmail}`,
    files,
    parentCommitSha: head,
  });

  return {
    commitSha: result.commitSha,
    commitUrl: result.commitUrl,
    fields: [...updates.keys()],
    images: prepared.map((image) => image.url),
  };
}

// ---------------------------------------------------------------------------
// Staff check
// ---------------------------------------------------------------------------

type RpcResult = { data: unknown; error: unknown };

/**
 * The slice of a Supabase client the staff check uses. The caller passes the
 * user-scoped client from `resolveCaller()`, so every query runs as that user
 * under RLS — the service-role key is never involved.
 */
export type StaffCheckClient = {
  rpc: (name: "is_staff", args: { _user_id: string }) => PromiseLike<RpcResult>;
  from: (table: "user_roles") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => PromiseLike<RpcResult>;
    };
  };
};

const STAFF_ROLES = new Set(["admin", "super_admin"]);

/**
 * Throw unless the caller is staff. Primary path is the `is_staff` SECURITY DEFINER
 * function; if that call errors, fall back to reading the caller's own `user_roles`
 * rows, which RLS already limits to themselves. Both paths run as the user, and
 * anything inconclusive is a rejection.
 */
export async function assertStaff(client: StaffCheckClient, userId: string): Promise<void> {
  let rpc: RpcResult | null = null;
  try {
    rpc = await client.rpc("is_staff", { _user_id: userId });
  } catch {
    rpc = null;
  }

  if (rpc && !rpc.error && typeof rpc.data === "boolean") {
    if (rpc.data) return;
    throw new PublishError(
      "forbidden",
      "Your account does not have permission to publish content.",
    );
  }

  let roles: RpcResult | null = null;
  try {
    roles = await client.from("user_roles").select("role").eq("user_id", userId);
  } catch {
    roles = null;
  }

  if (!roles || roles.error || !Array.isArray(roles.data)) {
    throw new PublishError(
      "forbidden",
      "Could not confirm that your account has permission to publish content.",
    );
  }

  const isStaff = roles.data.some((row) => {
    if (!isPlainObject(row)) return false;
    return typeof row["role"] === "string" && STAFF_ROLES.has(row["role"]);
  });

  if (!isStaff) {
    throw new PublishError(
      "forbidden",
      "Your account does not have permission to publish content.",
    );
  }
}
