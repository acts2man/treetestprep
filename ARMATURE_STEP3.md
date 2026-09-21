# Armature Step 3 — The Publish Button

Third stage of the **Armature** pilot on `treetestprep`. Step 1 (`ARMATURE_RECON.md`, on
`armature/recon`) surveyed the repo. Step 2 (`ARMATURE_STEP2.md`, on this branch) moved the
site's content into a committed file, `content/pages.json`, and proved the site renders from
it. This step connects the existing admin editor to that file: **"Publish changes" now
commits to GitHub, and the commit triggers the rebuild.**

- **Repo:** `acts2man/treetestprep`
- **Branch:** `armature/git-content`
- **Date:** 2026-09-21
- **Not done here:** no pull request, no merge to `main`, no force-push, no history rewrite.

---

## Summary

**In plain English.** Before this step, the editing dashboard saved your changes into a
database that nothing read — you could edit the homepage headline, see "Saved", and the
website would not change. Now the Publish button does the real thing: it writes your changes
into the website's own files on GitHub, which starts a rebuild, and about two minutes later
the new words are live and visible to Google.

**How it behaves now.** You open a page in the dashboard, change as many fields as you like,
and nothing happens yet — the changes sit in your browser and each changed field is marked
"Changed". A counter at the top tells you how many unpublished changes you have. You can
revert one field or discard them all. When you press **Publish changes**, everything goes in
**one commit**, you get a link to that commit, and the message tells you it will be live in
about two minutes. If you try to leave the page with unpublished changes, it stops you and
asks.

**What makes it safe.**

| Guard                                                                              | What it prevents                                                         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Staff-only, checked server-side against `is_staff` under the caller's own token    | A signed-in student, or anyone not staff, publishing anything            |
| Every changed field validated against `pageSchema.ts` before anything is written   | Unknown fields, wrong types, oversized text                              |
| Link and URL fields restricted to `https://`, `http://`, `mailto:`, `tel:` or `/…` | `javascript:` and `data:` links being injected into the live site        |
| Image fields restricted to paths under `/assets/`                                  | Content pointing at someone else's server                                |
| Uploads limited to PNG / JPEG / WebP, 5 MB each                                    | An SVG (which can carry script) or a huge file being committed           |
| The same checks `bun run check:content` runs, re-run on the merged result          | A publish leaving the content file in a state that breaks the build      |
| Field-by-field conflict detection against the branch's current state               | Two editors silently overwriting each other                              |
| The branch ref is updated **without** force                                        | Any non-fast-forward write, even if our own conflict check missed a race |
| The token is read only inside a server-only module, reached by dynamic import      | The publish token, or any GitHub code, reaching the browser              |

**Proof the token cannot leak.** After a production build, every one of these strings is
**absent** from all 84 files in `dist/client`: `GITHUB_CONTENT_TOKEN`, `GITHUB_REPO`,
`CONTENT_BRANCH`, `SUPABASE_SERVICE_ROLE_KEY`, `api.github.com`, `git/blobs`,
`git/refs/heads`, `createGithubContentRepo`, `readPublishConfig`, `runPublish`,
`assertStaff`, `X-GitHub-Api-Version`. The same strings **are** present in `dist/server`, in
their own chunks (`github.server-*.js`, `publish.server-*.js`), which is what a correct
split looks like.

**Nothing about the public site changed.** All 7 public pages still render byte-identical
visible text and identical `<title>`/`<meta>`/`<link>` tags to the Step 2 output. The only
difference in the raw HTML is one vendor chunk's filename (`Match-….js` became `qss-….js`,
because `useBlocker` pulled a different router module into the shared chunk) — 4 bytes per
page, no content.

**What it still needs from the owner.** Five environment variables and a GitHub token,
which cannot be created from here. **Until those are set, the Publish button is disabled and
the dashboard says exactly which variable is missing.** The setup steps are below.

---

## What changed

### New files

| File                              | What it does                                                                                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/contentFile.ts`          | The content file's shape and its canonical on-disk format. Pure, no secrets. The serializer lives here so the export script and the Publish button write byte-identical files.                                             |
| `src/lib/contentValidation.ts`    | Two layers of validation: the whole-file shape check (what `check:content` runs) and the stricter per-field check for values arriving from the editor. Pure.                                                               |
| `src/lib/github.server.ts`        | **Server only.** Reads the three GitHub environment variables; talks to GitHub's Contents and Git Data APIs; makes one commit (blobs → tree → commit → non-forced ref update). Redacts the token from every error message. |
| `src/lib/publish.server.ts`       | **Server only.** The publish logic — validate, read, detect conflicts, merge, re-validate, commit — plus the `assertStaff` check. Takes its dependencies as arguments, so it is fully unit-tested.                         |
| `src/lib/content.functions.ts`    | The two server functions, `getPublishedContent` and `publishContent`. Thin: authenticate, load config, delegate.                                                                                                           |
| `src/lib/auth.server.ts`          | **Server only.** Verifies the caller inside the handler and returns a Supabase client scoped to them. Added by the silent-dashboard fix; see the appendix.                                                                 |
| `src/lib/diagnostics.server.ts`   | **Server only.** Builds the "Check connection" checklist. Reports rather than throws, so one failure never hides the rest.                                                                                                 |
| `tests/contentValidation.test.ts` | 26 tests over the validation rules.                                                                                                                                                                                        |
| `tests/publish.test.ts`           | 32 tests over the publish flow, with GitHub and Supabase auth mocked.                                                                                                                                                      |
| `tests/diagnostics.test.ts`       | 27 tests over the connection checklist and the Supabase environment reader.                                                                                                                                                |

### Changed files

| File                               | Change                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/admin.pages.$slug.tsx` | Rewired: loads from `getPublishedContent`, holds edits as a local draft, one Publish button, per-field Revert, image uploads held until publish. **No longer touches `page_content_overrides` or the `site-media` bucket.** Same visual language, same section tabs, same field cards. |
| `scripts/check-content.ts`         | Now a thin CLI over `validateContentTree()`, so the checker and the publish path cannot drift. Output and exit codes unchanged.                                                                                                                                                        |
| `scripts/export-defaults.ts`       | Uses the shared `serializeContent()`. Output byte-identical (verified).                                                                                                                                                                                                                |
| `package.json`                     | Added `"test": "bun test"`. `build` unchanged.                                                                                                                                                                                                                                         |
| `AGENTS.md`                        | Added a "Content editing" section, outside the `LOVABLE:` markers so a Lovable sync will not clobber it.                                                                                                                                                                               |

### How a publish works

1. The editor loads `content/pages.json` **from the content branch on GitHub**, not from the
   copy baked into the build, and remembers the commit sha it came from.
2. You edit. Changes live in your browser only.
3. Publish sends the **changed fields only**, plus any new images as base64, plus that base
   commit sha.
4. The server checks you are staff, validates every field, then reads the branch's current
   head.
5. If the branch has moved since your base sha, it reads the version you started from,
   works out which fields the other person changed, and:
   - **no overlap** → merges field by field and continues;
   - **overlap** → publishes nothing and tells you which fields to look at.
6. It re-runs the whole-file check on the merged result and refuses to commit if it fails.
7. One commit: `content/pages.json` plus any new images under `public/assets/uploads/`,
   message `Content: <page label> updated by <your email>`.
8. The branch ref is fast-forwarded (never forced). Netlify sees the commit and rebuilds.

### Test coverage

`bun run test` — **85 tests, 0 failures**, no network and no real token. Every case the brief
asked for, plus the edges:

| Requirement                                                 | Covered by                                                                                                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| non-staff rejected                                          | `assertStaff` rejects `is_staff: false`, rejects a student-only fallback, and rejects when _both_ checks fail rather than defaulting to allow                                                           |
| unknown field rejected                                      | `runPublish` rejects `hero.not_a_real_field`; commits 0                                                                                                                                                 |
| bad URL rejected                                            | `javascript:` in a link `href`, in a `url` field, and inside a list item's `href`; commits 0                                                                                                            |
| oversized / wrong-type image rejected                       | 5.25 MB PNG rejected; `image/svg+xml` rejected; commits 0                                                                                                                                               |
| happy path = exactly one commit with pages.json + the image | asserts `commits.length === 1`, both file paths, the image committed as base64 unchanged, the field repointed at `/assets/uploads/…`, the commit message, and that **nothing else in the tree changed** |
| branch moved, no overlap → merges                           | their body-copy edit survives, mine applies, parent is the moved head                                                                                                                                   |
| branch moved, overlap → conflict, nothing committed         | code is `conflict`, names `Hero → Headline`, commits 0                                                                                                                                                  |
| missing env var → "not configured"                          | each of the three named individually; blank values treated as missing                                                                                                                                   |

Plus: the Git Data API sequence (2 blobs, tree layered on `base_tree`, one commit, `force:
false` on the ref), a 401 mapped to a `forbidden` error **with the token redacted**, 404
mapped to a config hint, 422 mapped to a conflict, base64 round-trips over the real content
file including non-ASCII, and a guard that every field of the live content still passes the
new per-field rules — so the limits cannot reject the site's own copy.

### Verification

| Check                                                                    | Result                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| `bun run test`                                                           | **85 pass, 0 fail**                               |
| `bun run check:content`                                                  | **PASS** — 126/126 fields                         |
| `bunx tsc --noEmit`                                                      | **PASS** — clean                                  |
| `NETLIFY=true bun run build`                                             | **PASS** — `✓ built in 912ms`                     |
| `dist/client` secret/server-code grep                                    | **18 of 18 strings absent**                       |
| 7 public routes' raw HTML vs Step 2                                      | visible text and head tags **identical**          |
| `/admin/`, `/admin/pages/`, `/admin/pages/home/`, `/admin/pages/shared/` | all **200**, expected SSR shell, no server errors |
| `bun run lint`                                                           | **fails, as it does on `main`** — see below       |

`bun run lint` is red on this repo before any of this work: `main` reports 524 problems,
Step 2 left 503, this step leaves **499**. Linting only the files this step adds or changes
reports **0 problems**. No pre-existing violation was fixed, because `prettier --write .`
across the repo would bury this diff in hundreds of unrelated reformats.

---

## Setup — what the owner needs to do

Four short jobs. Nothing here needs a developer, but do them in order, and **do not paste
the token into a chat, an email, or a file** — it goes straight into Netlify.

### (a) Create the GitHub token

This is a key that lets the website write to its own repository. Make it as narrow as
possible.

1. Sign in to GitHub as the account that owns `acts2man/treetestprep`.
2. Click your profile picture (top right) → **Settings**.
3. In the left sidebar, scroll to the bottom → **Developer settings**.
4. In the left sidebar → **Personal access tokens** → **Fine-grained tokens**.
5. Click **Generate new token**.
6. Fill it in:
   - **Token name:** `treetestprep content publishing`
   - **Resource owner:** `acts2man`
   - **Expiration:** 90 days is a sensible start. Whatever you pick, **put a reminder in
     your calendar a week before** — when it expires, publishing stops working and the
     dashboard will say the token was rejected.
   - **Repository access:** choose **Only select repositories**, then pick
     **`acts2man/treetestprep`**. Do not choose "All repositories".
7. Open **Permissions** → **Repository permissions**. Find **Contents** and set it to
   **Read and write**. Leave every other permission at "No access".
   - You will see **Metadata: Read-only** switch on by itself. That is normal and required.
   - **Contents is the only permission you need.** If you find yourself granting anything
     else, something has gone wrong.
8. Click **Generate token**.
9. GitHub shows the token **once**, starting with `github_pat_`. Copy it now and keep it on
   your clipboard for the next step. If you lose it, delete the token and make a new one —
   you cannot see it again.

> If `acts2man` is an organisation rather than a personal account, the organisation may have
> to approve the token before it works. GitHub will say "pending approval" if so, and an
> organisation owner approves it under Settings → Personal access tokens.

### (b) Add the five environment variables in Netlify

> **Corrected.** An earlier version of these instructions listed only the three GitHub
> variables. That was wrong, and it is what made the Publish button stay gray with no
> message: the dashboard also needs the two **non-prefixed** Supabase variables in order
> to verify your sign-in on the server. Add all five.

1. Sign in to Netlify and open the **treetestprep** site.
2. **Site configuration** → **Environment variables**.
3. Click **Add a variable** → **Add a single variable**, once per row:

   | Key                        | Value                                             | What it is for              |
   | -------------------------- | ------------------------------------------------- | --------------------------- |
   | `GITHUB_CONTENT_TOKEN`     | the `github_pat_…` token you just copied          | writing your changes to git |
   | `GITHUB_REPO`              | `acts2man/treetestprep`                           | which repository to write   |
   | `CONTENT_BRANCH`           | `armature/git-content`                            | which branch to write       |
   | `SUPABASE_URL`             | the same value as `VITE_SUPABASE_URL`             | checking you are signed in  |
   | `SUPABASE_PUBLISHABLE_KEY` | the same value as `VITE_SUPABASE_PUBLISHABLE_KEY` | checking you are signed in  |

   The last two almost certainly already exist in your Netlify variables with a `VITE_`
   prefix. Open each `VITE_…` one, copy its value, and save it again under the name above
   **without** the prefix. You need both spellings: the prefixed pair is for the browser,
   the unprefixed pair is for the server.

4. For each one, leave **Scopes** as **All scopes** — this matters, the server functions
   need the **Functions** scope — and set **Deploy contexts** to **All deploy contexts**.
   (The branch deploy in step (c) needs them, so "Production only" will not work.)
5. For `GITHUB_CONTENT_TOKEN`, if Netlify offers a **Contains secret values** / secret
   checkbox, tick it. That stops the value being shown back to you or printed in build logs.
6. Double-check there are no stray spaces and no quote marks around any value.
7. **Redeploy the branch afterwards.** A variable only reaches a deploy that was built
   after it was saved. Deploys → **Trigger deploy** → **Deploy site**.

> **Important:** these names have **no** `VITE_` prefix, and they must not get one. A
> `VITE_`-prefixed variable is compiled into the JavaScript the browser downloads, which
> would publish the token to the world.

### (c) Turn on a branch deploy for `armature/git-content`

This gives the pilot its own test website, so nothing you do here can affect the live site.

1. In the same Netlify site: **Site configuration** → **Build & deploy** → scroll to
   **Branches and deploy contexts** → **Configure**.
2. Under **Branch deploys**, choose **Let me add individual branches**.
3. Type `armature/git-content` and add it.
4. **Save.**
5. Go to the **Deploys** tab and wait for a deploy of `armature/git-content` to finish. If
   one does not start by itself, use **Trigger deploy** → **Deploy site**, or push any
   commit to the branch.
6. Note the branch's own URL. Netlify shows it on the deploy; it looks like
   **`https://armature-git-content--<your-site-name>.netlify.app`**. Everything in step (d)
   happens on that URL, **not** on treetestprep.com.

### (d) Test it, step by step

Do this on the branch deploy URL from step (c).

1. Open **`<branch-url>/auth/`** and sign in with your admin account.
2. Go to **`<branch-url>/admin/pages/home/`**.
   - At the top you should see "No unpublished changes" and, in grey, `editing
armature/git-content @ <7 characters>`. **If instead you see an amber "Publishing is
     unavailable" box, stop** — it names the environment variable that is missing or the
     reason GitHub refused the token. Fix that in step (b) and redeploy.
3. The **Hero** section is already selected. Find **Headline**. It currently reads
   _Become An ISA Certified Arborist_.
4. Change it to something you will spot instantly, for example **`ARMATURE PUBLISH TEST`**.
5. Check the feedback: the field is outlined in gold and tagged **Changed**, the **Hero** tab
   shows a **1**, and the bar at the top reads **1 unpublished change**.
6. Click **Publish changes**. The button shows "Publishing…" for a few seconds.
7. You should get a green box: **"Published. Your changes will be live in about 2 minutes."**
   with a **View the commit** link.
8. Click that link. GitHub opens the commit. Confirm:
   - the message reads `Content: Home updated by <your email>`;
   - the only file changed is `content/pages.json`;
   - the diff shows your new headline replacing the old one.
9. Go to Netlify's **Deploys** tab. A new `armature/git-content` deploy should be building.
   Wait for **Published** (usually 1–2 minutes).
10. Open **`<branch-url>/`** in a new tab and reload. The big headline should now read
    **ARMATURE PUBLISH TEST**.
11. Prove it is really in the page the server sends, not just drawn by JavaScript: press
    **Ctrl+U** (**Cmd+Option+U** on a Mac) to view the page source, then **Ctrl+F** for
    `ARMATURE PUBLISH TEST`. It should be there, inside an `<h1>` tag. _This is the whole
    point of the exercise — it means Google sees your edits._
12. Now change it back. Return to **`<branch-url>/admin/pages/home/`**, set **Headline** back
    to **`Become An ISA Certified Arborist`** (copy it exactly, capital letters included),
    and click **Publish changes**.
13. Wait for the deploy, reload the homepage, and confirm the original headline is back.

While you are there, two more things worth trying:

- **The leave-page warning.** Type something into a field and then click **All pages** at the
  top. It should stop you and offer "Stay on this page" / "Leave and discard".
- **An image.** On the Hero section, use **Choose file** on **Badge** to pick a PNG, JPEG or
  WebP. You should see your picture immediately as a preview, with "New image ready to
  publish". Publish, then check the commit — it should contain **two** files: the image
  under `public/assets/uploads/` and `content/pages.json` pointing at it. Then revert it the
  same way.

Once all of that works, the pilot is proven end to end and the remaining decision is whether
to point `CONTENT_BRANCH` at `main` (which is what makes it live on treetestprep.com) — see
the first open issue.

---

## If the Publish button is gray

Written for a non-developer. Work down the list; stop when the button wakes up.

**First, look at the top of the editor.** There is always a line there telling you what is
going on. It says exactly one of three things:

| What you see                                                 | What it means                              |
| ------------------------------------------------------------ | ------------------------------------------ |
| **Connecting to GitHub...** (with a spinner)                 | Still loading. Give it a few seconds.      |
| **editing armature/git-content @ a1b2c3d** (grey)            | Connected. Publish works.                  |
| **Not connected to GitHub** (amber), with an amber box below | Something is wrong, and the box says what. |

If Publish is gray while you have unpublished changes, there is also a short amber line
directly under the button telling you why.

**Then press "Check connection".** It is next to the Publish button and it is the fastest
way to find the problem. It runs ten checks and shows a green tick or a red cross on each,
with the fix written out. The first red cross is the one to act on. It never shows any
secret value — only whether a setting arrived, and how many characters long it was.

Common results and what to do:

1. **"Supabase keys reached this deploy" is red.** This is the usual one, and it was the
   cause of the first failure. The site needs `SUPABASE_URL` and
   `SUPABASE_PUBLISHABLE_KEY` **without** the `VITE_` prefix. Add them per step (b) above,
   then redeploy.
2. **"GITHUB_CONTENT_TOKEN reached this deploy" is red.** Netlify is not passing the token
   to this deploy. Open the variable in Netlify and check it has a value for **Branch
   deploys** (not just Production) and that **Scopes** includes **Functions**. Then
   redeploy the branch.
3. **"GitHub accepted the token" is red with HTTP 401.** The token has expired, or it was
   created without access to this repository. Make a new fine-grained token (step (a)),
   update the Netlify variable, redeploy.
4. **"The token can write to the repository" is red.** The token is read-only. Edit it on
   GitHub and set **Contents** to **Read and write**.
5. **"The content branch exists" is red.** `CONTENT_BRANCH` has a typo. Branch names are
   case-sensitive and include the slash: `armature/git-content`.
6. **Everything is green but Publish is still gray.** Then you have no unpublished changes
   — the button is meant to be gray. Change a field and it will light up.

**If pressing "Check connection" itself fails**, the deploy is not running its server code
at all. Check in Netlify that the last deploy of this branch finished successfully (green
"Published"), and redeploy if not.

**The one thing to remember:** environment variables in Netlify only reach a deploy that
was built _after_ you saved them. Whenever you change a variable, trigger a redeploy.

---

## Appendix: why the dashboard went silent, and every path that was checked

The reported symptom was that the editor loaded and registered edits, but Publish stayed
gray with **neither** the connected line **nor** an error box. That combination was
supposed to be impossible, and tracing it found one structural cause plus a set of related
gaps.

### The root cause

`getPublishedContent` and `publishContent` authenticated through
`.middleware([requireSupabaseAuth])`. That generated middleware runs **outside** the
handler and reports every problem by **throwing**, so its errors never reached the
handler's `try/catch` that turns failures into `{ ok: false, message }`. The call came back
to the browser as a rejected promise with no body.

On the client, the status line was derived from `published.data` alone. A rejected request
leaves `data` as `undefined` and `isLoading` as `false`, so the "connected" branch and the
"error" branch were both skipped while the unrelated change counter kept working — exactly
the reported state.

What it was throwing about: `requireSupabaseAuth` needs `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY` in the **server** environment. The setup instructions in this
document listed only the three GitHub variables, and the committed `.env` only feeds the
build, not Netlify's function runtime — so the very first thing the middleware did was
throw _"Missing Supabase environment variable(s)"_. Adding the GitHub variables could never
have helped, because execution never got as far as reading them. This also explains why the
amber box never appeared: that box only renders a structured failure, and a structured
failure was never produced.

### Every failure path found

**A — bypassed the handler's error handling entirely (the silent class).** All of these
threw from middleware:

| #   | Path                                                                                                             | Now                                          |
| --- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| A1  | `SUPABASE_URL` missing from the server environment                                                               | Named in the amber box and in the checklist  |
| A2  | `SUPABASE_PUBLISHABLE_KEY` missing                                                                               | Same                                         |
| A3  | No `Authorization` header (session not yet restored, or signed out in another tab)                               | "Your browser did not send a sign-in token…" |
| A4  | Header not in `Bearer …` form                                                                                    | Plain-English message                        |
| A5  | Token not a three-part JWT                                                                                       | "Sign out and sign in again"                 |
| A6  | Token expired or rejected by `getClaims`                                                                         | Reports what Supabase said                   |
| A7  | `getRequest()` itself throwing outside a request scope — a bare `Error`, found by a test written during this fix | Now a `PublishError` with a readable message |

**B — transport-level, still outside any handler.** These cannot be converted to a
structured result, so the client now renders the thrown message instead of nothing:

| #   | Path                                                                                                                   | Now                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| B1  | CSRF request middleware answering `403 Forbidden` (it filters on `handlerType === "serverFn"`, so it sees these calls) | Amber box with the error, plus Retry              |
| B2  | The server function endpoint 404/500 at the platform level (failed deploy, function crash)                             | Amber box; "Check connection" names it explicitly |
| B3  | Network offline or request aborted                                                                                     | Amber box with Retry                              |

**C — never settled, or settled with unusable data.**

| #   | Path                                                                                                                             | Now                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| C1  | Request hangs; `isPending` stays true forever                                                                                    | 15-second timeout flips to the amber box; self-heals if the reply arrives |
| C2  | `retry: false` made one transient failure permanent with no way back                                                             | Explicit **Retry** button                                                 |
| C3  | `getPublishedContent` was a **GET** server function, so a browser or CDN could cache the commit sha and cause a phantom conflict | Both reads are now **POST**                                               |
| C4  | A success carrying an empty `commitSha` would disable Publish silently                                                           | Treated as an error state with a message                                  |

**D — the client-side gaps that turned all of the above into silence.**

| #   | Path                                                                                | Now                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `published.isError` was never rendered anywhere                                     | Part of the three-state machine                                                                                                                           |
| D2  | Status derived only from `published.data`, so `undefined` rendered no branch        | `connection` is a `useMemo` returning exactly one of `connecting` / `connected` / `error`, with `connecting` as the fallback — there is no fourth outcome |
| D3  | Publish disabled with no explanation                                                | One amber line under the button whenever it is disabled while changes are waiting                                                                         |
| D4  | SSR renders before the query runs, so the first HTML always showed the loading text | Unchanged and harmless, but the state machine no longer strands there                                                                                     |

**E — paths that already worked, and that the symptom therefore ruled out.** Missing
GitHub variables, a non-staff caller, GitHub 401/403/404, and unparseable JSON all
happened _inside_ the handler and already came back as `{ ok: false }`. Because the owner
saw no amber box at all, the failure had to be in A or B — which is what pointed at the
middleware.

### The fixes

- **Authentication moved inside the handlers** (`src/lib/auth.server.ts`, `resolveCaller`).
  Same work as the generated middleware — read the bearer token, verify it, build a
  user-scoped client that respects RLS — but it raises `PublishError` values that the
  handler catches and returns as a rendered message. `requireSupabaseAuth` is no longer
  used. `attachSupabaseAuth` in `src/start.ts`, the client half that attaches the token, is
  untouched, and `csrfMiddleware` stays.
- **A three-state connection machine in the editor**, so silence is unrepresentable.
- **"Check connection"** (`checkPublishConnection` → `src/lib/diagnostics.server.ts`): ten
  checks, each with a tick or a cross and a plain-English fix, reporting secrets by presence
  and length only, and gating the GitHub lines behind the staff check so a non-staff caller
  learns nothing about the repository.
- **Both reads are POST**, removing the cached-sha risk.
- **The setup instructions above were corrected** from three variables to five.

### Verification

| Check                                                   | Result                                                                                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bun run test`                                          | **85 pass, 0 fail** (26 validation + 32 publish + 27 diagnostics)                                                                                            |
| `bun run check:content`                                 | **PASS** — 126/126 fields                                                                                                                                    |
| `bunx tsc --noEmit`                                     | **PASS**                                                                                                                                                     |
| `NETLIFY=true bun run build`                            | **PASS**                                                                                                                                                     |
| `dist/client` audit                                     | **18 of 18** token/server-code strings **absent**; `auth.server`, `diagnostics.server`, `github.server`, `publish.server` exist only as `dist/server` chunks |
| 7 public routes                                         | visible text and head tags **byte-identical** to Step 3                                                                                                      |
| `/admin/`, `/admin/pages/home/`, `/admin/pages/shared/` | all **200**, no server errors                                                                                                                                |

---

## Open issues

Ordered by how much they matter.

1. **Going live means pointing `CONTENT_BRANCH` at `main`, and that collides with Lovable.**
   For the pilot, publishes go to `armature/git-content`, which Lovable does not sync, so
   there is no race. The moment `CONTENT_BRANCH` becomes `main`, every client publish is a
   commit on the branch Lovable syncs, and a publish can land while Lovable is mid-generation.
   Decide before switching: either keep publishing to a dedicated content branch that is
   merged (never rebased) into `main`, or tell Lovable via project knowledge never to touch
   `content/pages.json`. Test a deliberate concurrent edit first. This is still the biggest
   unresolved design question in the pilot.
2. **A 5 MB image will probably fail at Netlify's edge, not in our code.** The per-image limit
   is 5 MB as specified, but base64 inflates the request by a third and Netlify caps a
   function request at about 6 MB. A publish whose images total more than ~4.5 MB is rejected
   here with a clear message, but a single image between roughly 4.5 MB and 5 MB may be
   dropped by Netlify before it reaches the function, producing a less helpful error. If that
   shows up in practice, lower `MAX_IMAGE_BYTES` in `src/lib/publish.server.ts` to about 3 MB,
   or resize in the browser before upload. Site photos should be well under this anyway.
3. **Uploaded images are committed as-is — no resizing or re-encoding.** A 4 MB phone photo
   goes into the repo at 4 MB and ships to every visitor. The recon already flagged that the
   three existing hero images are 1.8 MB of the 3.1 MB asset budget. Browser-side
   downscaling before upload is the obvious next improvement.
4. **The token expires, and nothing warns you in advance.** When it does, publishing fails
   with "GitHub rejected the publish token" and the fix is to generate a new one and update
   the Netlify variable. A calendar reminder is the only safeguard right now.
5. **`page_content_overrides` is now completely unread, but still exists and is still
   world-readable.** The editor no longer touches it. `src/routes/admin.index.tsx` still
   counts its rows for a dashboard stat tile — harmless, out of scope here, and worth
   removing with the table. No migration was written, as instructed. Once the pilot is
   accepted, revoke the `anon` SELECT grant and drop the table.
6. **The `site-media` Supabase bucket is now only used by two other screens.** Page-editor
   uploads go to git. `admin.resources.tsx` and `AvatarUploader.tsx` still use the bucket,
   which is fine — but it means the site has two media systems, and a future step should
   decide whether resources and avatars also belong in git.
7. **Publishing is per-page.** The editor publishes one page slug at a time, and the shared
   header/footer is its own page in the dashboard. Editing the homepage and the footer is two
   publishes and two rebuilds. A "publish everything I changed" flow across pages would be a
   better fit for how a client actually works.
8. **No preview of unpublished changes.** The draft lives in the browser and the editor shows
   the field values, but there is no way to see the assembled page before publishing — so the
   feedback loop is still "publish, wait two minutes, look". The recon flagged this; it is
   unaddressed and is the main remaining UX gap.
9. **Conflict detection is per field, not per word.** Two people editing _different_ fields
   merge cleanly. Two people editing the _same_ field is reported as a conflict and nothing
   is published, which is safe but blunt: the second person has to reapply their change by
   hand. There is no three-way merge inside a single field.
10. **Tests are not covered by `tsc --noEmit`.** They live in `tests/`, which is outside
    `tsconfig.json`'s `include`, so that `bun:test` could be used without adding a types
    dependency to a repo whose lockfile portability was just fixed. They are linted and they
    run, but a signature change in a tested module surfaces as a test failure rather than a
    type error. Adding `@types/bun` and moving them under `src/` would close that gap.
11. **The `is_staff` fallback path is untested against the real database.** The primary check
    is the `is_staff` RPC; if that call errors, the code falls back to reading the caller's
    own `user_roles` rows. Both paths are unit-tested with mocks, and `is_staff` is not
    revoked from `authenticated` in any migration, so the RPC should work — but this sandbox
    cannot reach the Supabase project, so the first real sign-in is the first real test.
12. **Repo-wide lint is still red** (499 problems, all pre-existing). Worth its own
    `prettier --write .` commit, kept separate so it never obscures a logic diff.
13. **`.env` is still committed to the repository** (flagged in Step 2, unchanged here). It
    holds publishable/anon Supabase keys only — no service-role key, and none of the three
    new publish variables — but it should be untracked and the keys rotated.

