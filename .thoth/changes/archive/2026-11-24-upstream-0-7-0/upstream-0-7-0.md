# Change: upstream-0-7-0

**Classification**: substantial
**Scope**: cross-cutting
**Uncertainty**: medium
**Risk**: high

## Exploration

Branch `feat/upstream-0.7.0` starts clean at feb3424 (prior published editor 3c916c5 refresh committed as 786d3cd; root pnpm minimum release age lowered to three days per user request in feb3424). ExcaliDash is pinned to v0.6.7 / 0f9be2d8649be7650e6bee2844739c584fa76c35; the editor to @excalidraw/excalidraw@0.18.0-3c916c5.

Accepted upstream research (2026-11-24): latest stable ExcaliDash is v0.7.0 / b692be20aea76519c19e9874d95163887066f036 (published 2026-11-22T16:31:18Z), 71 commits / 188 files ahead of v0.6.7, no divergence; intermediate releases v0.6.8 (b5e4a0a), v0.6.9 (2da26e6), v0.6.10 (bdd4f9b). Frontend changes: dashboard rendering/preview caching/thumbnails/drawing prefetch (`frontend/src/pages/dashboard/useDashboardData.ts`, `components/drawing-card/`, `utils/drawingPrefetch.ts`), editor viewport fitting and save handling, system theme (`context/ThemeContext.tsx`), inline rename, drop-to-append with account preference (`pages/editor/droppedScenes.ts`, `context/PreferencesContext.tsx`), stale-tab library rebase (`pages/editor/librarySync.ts`), auth refresh/share-session recovery (`context/AuthContext.tsx`). `frontend/package.json` unchanged (Excalidraw ^0.18.1 upstream, React 18.3.1, Vite 7.3.7, Tailwind 3.4.1); lockfile bumps follow-redirects 1.16.1 → 1.16.3. Backend contracts used by the SPA: `GET /drawings/:id?omitPreview=1` with `hasPreview` and ETag/304; `PUT /drawings/:id` with `Prefer: return=minimal` and gzip JSON bodies (SPA has fallback); history list `retentionDays`; preview/file conditional caching; account preference `appendDroppedDrawings`; Prisma index `Drawing(collectionId, updatedAt)`. Not applicable to Sites: SQLite backup/WAL fixes, first-admin setup, Socket.IO API-key handshake, share-link sessions, nginx, Docker, snapshot coalescing env (default 0). Docs: refreshed README/VitePress, new self-hosting/OIDC/Excalidraw Plus guides, `.github/release-notes/`. Source: https://github.com/ZimengXiong/ExcaliDash/compare/v0.6.7...v0.7.0 and release pages.

Editor: excalidraw.com production `2026-11-21T18:23:03Z-9c2e462`; npm `next` = `0.18.0-9c2e462`, published 2026-11-24T18:30:46.368Z, release SHA 9c2e462ec23e54c4cf0493328840d6a27191c674, integrity `sha512-xumH4TBrpAAbLPlb75Qyv9SaQYF48X2OT6lFppsL99cC3f9np4fd7X96M3BpzM0b9PIeMGl3gBLj/Iv4zhMzTw==`. Compare 3c916c5...9c2e462 is 18 ahead / 1 behind (release-only patch recreated); adds minimap and zoom menu, caret-anchored keyboard zoom, text auto-resize/focus fixes, frame-drag performance, color-picker focus fix.

Accepted local discovery: sync is manual (`docs/UPDATES.md:8–23`); no upstream remote; local import 6b034af is a direct child of upstream 0f9be2d. `upstream-docs/` equals upstream `docs/` and `upstream-backend/` equals upstream `backend/` minus four `.env*.example` files at v0.6.7 (reference-only). `frontend/src` diverges from upstream by 60 modified and 10 added files (Sites transport `api/sitesSocket.ts`, auth/sharing restrictions, scene API, SVG previews, reconciliation, Advanced, localization `locales/*`). Metadata mirrors: `upstream.json:2–7`, `README.md:9–12`, `docs/ADAPTATION.md:3–7`, release notes precedent `docs/upstream-release-0.6.7.md`, `docs/upstream-inventory.json`.

Worker adapter (`server/api.ts`): drawing GET returns full D1 metadata + R2 scene, no omitPreview/hasPreview/ETag (lines 80–83,140,156); PUT returns full drawing, ignores `Prefer` and `Content-Encoding` (88–91,157); `body(req)` buffers text with 16 MiB limit then parses JSON (5,54); origin checks 64–72; optimistic version CAS with atomic D1 batch and R2 cleanup on lost race. History list returns `{snapshots,totalCount}` with no retention pruning (148–150). `/auth/preferences` shallow-merges arbitrary keys into `users.preferences` JSON (93–97). Drawings table has only PK and `drawings_owner(userId, updatedAt)` (`db/schema.ts:4`, `drizzle/0000_thick_baron_zemo.sql:21`); list filters by collection in JS (138). Preview responds `no-store`; files `private, max-age=300`, no ETag (117–118,147). Adapter harness `tests/adapter.integration.mjs` runs Miniflare D1/R2 and applies only migration 0000 (60–76). `upstream.json` feeds `/api/system/update` and Settings.

## Intent

Synchronize the fork with upstream ExcaliDash v0.7.0, adapting applicable frontend behavior and API contracts to the ChatGPT Sites Worker/D1/R2 adapter while preserving Sites identity, ownership, origin checks, immutable R2 scenes, optimistic concurrency, localization and attribution; then, as a separate commit, update the pinned editor to the current excalidraw.com build 0.18.0-9c2e462.

## Non-goals

Publishing, pushing, hosted migrations or production data changes; reintroducing local passwords, first-admin setup, API keys, Socket.IO server, public share links, scheduled backups, SMTP or nginx/Docker behavior; snapshot coalescing; history retention pruning; upgrading React/Vite/Tailwind or unrelated dependencies; rewriting applied migrations; hand-editing generated outputs.

## Acceptance

- AC-1: `frontend/` contains every applicable upstream v0.6.7→v0.7.0 frontend change merged onto the Sites adaptation without losing adapter behavior (Sites transport, managed auth, restricted sharing, scene API, SVG previews, reconciliation, Advanced, Spanish UI); all new user-visible text has `en` and `es` dictionary entries; frontend lockfile changes are limited to upstream's transitive bumps; frontend TypeScript, lint and Vitest suites pass with focused tests for adapted new behavior.
- AC-2: The Worker implements the SPA-facing v0.7.0 contracts with upstream semantics: `omitPreview=1`/`hasPreview` and strong ETag/`If-None-Match` 304 on drawing GET; `Prefer: return=minimal` reduced PUT response; gzip-encoded JSON request bodies decoded with the decompressed size still bounded at 16 MiB and malformed gzip rejected with a stable error code; history list `retentionDays` reflecting the adapter's actual (non-pruning) behavior; `appendDroppedDrawings` preference persisted and defaulted; conditional caching on preview/file reads that never leaks across users; a new append-only D1 migration adding `drawings(collectionId, updatedAt)` index. Ownership, origin, identity and version-conflict behavior unchanged. Adapter integration tests cover each contract including cross-user and conflict cases.
- AC-3: `upstream-backend/` and `upstream-docs/` match upstream v0.7.0 `backend/` and `docs/` (same `.env*.example` exclusions); `upstream.json`, README, `docs/ADAPTATION.md`, `docs/UPDATES.md`, `docs/upstream-inventory.json` and a new `docs/upstream-release-0.7.0.md` record v0.7.0 / b692be2… provenance and what was ported or excluded; upstream attribution and license notices preserved.
- AC-4: In a separate commit, the editor is pinned exactly to `0.18.0-9c2e462` with full SHA, production version, release date and integrity in `upstream.json`; offline consistency check passes; drift fixtures and docs updated; editor regression tests pass.
- AC-5: Consolidated CI-equivalent checks (frozen installs, public-source, offline editor consistency, build, both TypeScript projects, frontend and adapter tests, frontend lint, root lint with no introduced failures) pass, and a local integrated preview smoke confirms dashboard, editor open/save/reopen, a v0.7.0 feature (drop-to-append or inline rename), Spanish UI and real SVG export with embedded fonts.
- AC-6: Fresh independent Oracle final verification passes on the frozen diff.

## Clarifications

- User (2026-11-24): commit the pending published 3c916c5 refresh first (done, 786d3cd); target ExcaliDash v0.7.0; scope = frontend plus porting applicable API contracts to the Worker; bump editor now without waiting for release age.
- User (2026-11-24): lower root pnpm minimum release age from seven to three days (done, feb3424). Frontend npm is unaffected.
- Retention: the adapter does not prune history; `retentionDays` reports that faithfully (null/unlimited per the upstream type) rather than introducing pruning.
- Implementation clarification (root, 2026-11-24, from AC-1 findings): upstream SPA `DELETE /drawings/:id?requireTrashed=1` is ported to the Worker in AC-2 as an atomic guard (permanent delete only when currently trashed, else 409 with a stable code; no flag keeps prior semantics). Backup recovery export with `X-Excalidash-Missing-Images` is excluded (existing Sites backup behavior kept). AC-1 write scope extends to `frontend/index.html` and `frontend/public/theme-init.js` for upstream early theme init.
- Final-review convergence (root, 2026-11-24): first fresh final Oracle returned FAIL (reviewed prefix 83f447e406aa01c8d9b4eb0b9e679abd1cbf42f8944a615563614b246d4a3004). Root accepts four blockers: (1) metadata-only PUT compares but does not advance `version`, weakening the pre-existing CAS contract (a second same-version rename passes) — restore version advancement for metadata writes and add a competing-renames regression; (2) `useEditorElementTracking` ignores the normalized image status argument, so unchanged images can trigger redundant broadcasts/saves — compare normalized status and test repeated identical frames; (3) offline editor consistency check accepts contradictory `commit`/`productionVersion` vs pin suffix — validate full SHA prefix, pin suffix and production identifier agreement with a negative check; (4) `docs/upstream-release-0.7.0.md` wrongly claims follow mode works over Sites transport — document it as excluded. Prior PASS evidence for other ACs remains valid for unchanged inputs; consolidated checks rerun only on affected suites plus build.
- Second final-review convergence (root, 2026-11-24): fresh round-2 Oracle returned FAIL at eeb8dff (reviewed prefix 7a4fadc5df7ff94572ba19e3e4a9793193cf788195bfa58be56060320547741c); the four earlier findings were confirmed repaired. Root accepts one new blocker: drawing PUT (scene and preview paths, `server/api.ts` ~140–143, 241–244) reads the row with a post-commit SELECT, so under an interleaved concurrent save a response can acknowledge another writer's revision (observed: expected 2, received 3), letting the SPA adopt a version past its local scene. Remedy: return the row written by the guarded UPDATE (RETURNING) inside the same D1 batch for every PUT path and add an interleaved-save regression.
- Third final-review convergence (root, 2026-11-24): fresh round-3 Oracle returned FAIL at 04d9d2e (reviewed prefix a0bfdc8aba25f7f4e67d33681f09ec5121e433d64f6b6a189ec11132e94e7f5a); the PUT acknowledgement repair was confirmed. Root accepts three blockers: (1) `frontend/src/pages/editor/reconcileSave.ts` (~61–88) conflict reconciliation replaces unsaved local persisted app-state fields (e.g. background colour) with a peer's unchanged values, and the retry marks the local revision saved — pre-port retry kept local app state; merge persisted app-state fields three-way against the last accepted base on retry and catch-up, with a disjoint-edits test; (2) `frontend/src/utils/importHelpers.ts` imports `exportScene` at module scope, so Settings statically pulls the 1.61 MB editor chunk, whereas upstream v0.7.0 loads Excalidraw lazily inside preview generation — port the dynamic import; (3) offline editor checker ignores the lockfile root requirement `packages[''].dependencies[editor.package]` — compare it with the pin and add a negative case.
- Fourth final-review convergence (root, 2026-11-24; user chose repair and re-verify): fresh round-4 Oracle returned FAIL at 2ed7d6e (reviewed prefix f3b6eda9e2200194d7fac4af83eabb287fd7bf5e6337ea3e9190cabf1e4924a1) and judged the recovered concurrent 409s non-blocking. Root accepts two blockers introduced by the round-3 merge: (1) the three-way merge base records a missing legacy `gridSize` as null while the pinned editor restores it to 20, so the restored default is misclassified as a local edit and a retry can overwrite a peer's grid size — compare canonical restored values (base captured after editor restore/normalization) and regress null-to-20 load + peer grid change + local background edit; (2) remote patches now apply a peer's `gridStep`, which in Sites is an account preference (selector unchanged) — exclude account-controlled `gridStep` from remote patches as before the port and test selector/canvas agreement.
- Fifth final-review convergence (root, 2026-11-24): fresh round-5 Oracle returned FAIL at d723912 (reviewed prefix 3eaf431022a7cd710a82f092205819048df649011461d782453d14ad5f8cb9d9): a full-scene poll observing the client's own unacknowledged commit reapplies the older setting over a newer local edit, which the next autosave persists and marks saved. User decision (2026-11-24): remove live scene-settings adoption from the full-scene poll and saved-scene broadcasts, restoring pre-port Sites behavior (poll forwards elements/files only; peer scene settings arrive on reload/load or through the 409 retry's three-way merge against the acknowledged canonical base). Live settings convergence is therefore a declared non-goal; persisted convergence without lost edits remains required.
- Sixth final-review convergence (root, 2026-11-24): fresh round-6 Oracle returned FAIL at ad8dc57 (reviewed prefix c554c0cbdac174ea67600d81338209fc95e2a8af0319828a1a1b49683a0c00dc), confirming the round-5 boundary. Root accepts one blocker: `mergePersistedAppState` treats keys omitted from a valid remote appState as "no remote value", so a peer's persisted reset to defaults (e.g. history restore committing empty appState) is undone by a stale editor's 409 retry. Remedy: for a valid remote appState object, canonicalize all reconciled keys through the pinned restore (omitted = restored default) before the three-way comparison; regression with a sparse/empty remote snapshot plus a disjoint local edit; no live settings adoption reintroduced.
- Collaboration follow mode (`visible-bounds`) is ported in the SPA only as far as the existing Sites transport supports it; no Socket.IO server is added.

## Decisions

- Merge mechanics: add a local `upstream` remote (never pushed), fetch tags v0.6.7 and v0.7.0, and apply `git diff v0.6.7 v0.7.0 -- frontend/` with three-way merge onto `frontend/`; resolve conflicts in favor of Sites adaptation plus upstream intent. Reference trees are replaced wholesale from the v0.7.0 tag.
- The upstream v0.7.0 backend source is the contract reference for AC-2; the Worker mirrors its observable request/response semantics, not its implementation.
- Keep Excalidraw pinned in frontend at the exact `next` build; upstream's `^0.18.1` range is not adopted.
- Commits: one per accepted unit (reference trees+metadata, frontend sync, Worker port, editor bump); root commits reviewed work. No push or publish in this change.
- Version files: root `VERSION` (asserted equal to `upstream.json.version` by `tests/adapter.integration.mjs:180` and used by `frontend/vite.config.ts:6–11` as SPA version) changes together with `upstream.json` in the AC-3 unit.
- Sites cache contract (frozen before parallel dispatch; binding for both the Worker and SPA units):
  - Every conditional read (drawing GET, preview GET, file GET) resolves identity and ownership first; ETag comparison and 304 happen only after authorization succeeds. Unauthorized or foreign requests get the existing 401/404 regardless of `If-None-Match`.
  - ETags are strong and derived from the exact selected representation: drawing GET and preview GET use a SHA-256 of the serialized response body (so `omitPreview`, rename, `creatorName` profile changes, collection deletion or any non-versioned metadata change alters the tag); file GET uses the stored R2 object etag/version.
  - Responses use `Cache-Control: private, no-cache` (mandatory revalidation; no fresh reuse), replacing the current 300 s file `max-age`; no shared caching.
  - SPA in-memory or persistent caches (preview cache, drawing prefetch, stored ETags) are keyed by authenticated user id and cleared when the identity changes; a response that resolves after the identity changed (late response from the previous account) is discarded, never rendered or cached under the new account.
  - SPA test (AC-1): with warm caches for account A (prefetched drawing, preview, stored ETag), switching to account B shows none of A's data without a fresh request, and a pending A request resolving after the switch is ignored.
  - Tests: representation changes without version bump change the drawing ETag; another user replaying the owner's ETag gets 404 (not 304); 304 has no body; file and preview follow the same rules.
- Migration upgrade path: the adapter harness gains an upgrade case that seeds users/drawings/collections/snapshots under migration 0000 only, then applies the new 0001 migration alone and verifies the index exists (sqlite_master), and seeded drawings remain readable and savable with intact data; fresh setup applies all migrations in order.
- Root lint baseline: 38 pre-existing `no-explicit-any` errors and one warning in unchanged source are reported, not fixed; Worker changes must not add new lint errors.

## Durable deltas

- `MODIFIED editor-integration` **Pinned editor build** — The frontend MUST depend on the exact published editor version `0.18.0-9c2e462`, with full commit, integrity and production provenance recorded in `upstream.json`; offline consistency validation MUST reject disagreement among the manifest, lockfile and provenance.
  - GIVEN the current production editor is `0.18.0-9c2e462`; WHEN the update is installed and built; THEN the exact version and matching full commit/integrity are recorded and the offline consistency check passes.
- `MODIFIED editor-integration` **Editor upstream drift status** — Authenticated users MUST be able to see the built editor version and production drift status through Settings Advanced and the server-side comparison, preserving equal/newer/different/unavailable behavior for the updated pin without browser requests to third-party hosts.
  - GIVEN the pinned editor is `0.18.0-9c2e462`; WHEN excalidraw.com reports a later build with another hash; THEN `/api/system/editor` returns `newer` and Advanced shows an update.
- `ADDED drawing-api` **Conditional drawing reads** — Drawing GET MUST support `omitPreview=1` with a `hasPreview` flag and return a strong ETag derived from the selected representation with `Cache-Control: private, no-cache`, evaluating `If-None-Match` only after identity and ownership checks so that 304 is returned only to the owning user.
  - GIVEN an owner who fetched a drawing and its ETag; WHEN they re-request it with `If-None-Match` unchanged; THEN the Worker returns 304 without a body, while another user replaying that ETag receives 404 and a rename changes the ETag.
- `ADDED drawing-api` **Compact and compressed drawing saves** — Drawing PUT MUST accept gzip-encoded JSON bodies bounded by the 16 MiB decompressed limit and honor `Prefer: return=minimal` with a reduced response, keeping version-conflict semantics.
  - GIVEN a gzip-encoded PUT with `Prefer: return=minimal` and the current version; WHEN it is saved; THEN the response is the reduced shape with the incremented version, and a stale version still yields 409.
- `ADDED drawing-api` **Drop-to-append preference** — Account preferences MUST persist `appendDroppedDrawings` and report its default when unset.
  - GIVEN a user without stored preferences; WHEN they set `appendDroppedDrawings` to true and reload preferences; THEN the value is true and other users are unaffected.

## Plan

1. Reference/metadata unit (worker A): add local `upstream` remote, fetch v0.6.7/v0.7.0, replace `upstream-backend/` and `upstream-docs/` from v0.7.0 with existing exclusions, update provenance/docs (`upstream.json` version/tag/commit, README, ADAPTATION, UPDATES, upstream-inventory, new `docs/upstream-release-0.7.0.md`). Fixture updates for the ExcaliDash version in adapter/frontend tests if they assert it. Check: public-source check, adapter + focused system/settings tests.
2. Frontend sync unit (worker B, after unit 1 fetch exists): three-way apply upstream frontend diff, resolve conflicts, localize new strings (en/es), adapt API calls to Sites contracts, follow-redirects lockfile bump only via npm 10.9.2. TDD focused tests for drop-to-append, inline rename/theme where touched, and api/drawings transport (omitPreview, minimal, gzip fallback). Check: frontend tsc, lint, full Vitest.
3. Worker port unit (worker C, parallel with unit 2; contract = upstream v0.7.0 backend routes): implement AC-2 in `server/api.ts`, `server/error-codes.ts`, `frontend/src/locales/errors.ts` (error strings only, coordinated: worker C owns only new error keys), `db/schema.ts`, generated `drizzle/0001_*.sql` + meta, adapter harness applying all migrations, new tests. TDD via adapter harness. Check: `pnpm test:adapter`, root tsc, root lint delta.
4. Editor unit (worker D, after units 2–3 accepted): exact npm 10.9.2 install of 0.18.0-9c2e462, provenance, fixtures, docs, per docs/UPDATES.md editor procedure. Check: offline consistency, editor regression tests.
5. Consolidated verification (fresh worker E): full CI-equivalent checks and local preview browser smoke incl. SVG export bytes; cleans QA state.
6. Root freezes, validates `verify`, fresh Oracle final verification, closeout, archive with spec sync.

Interfaces: unit 2 and 3 share the HTTP contract defined by upstream v0.7.0 backend; unit 3 must not edit `frontend/` except new keys in `frontend/src/locales/errors.ts`; unit 2 must not edit that file. Risks: large conflict surface in `frontend/src` (60 adapted files); gzip via `DecompressionStream` must enforce size limit while streaming (zip-bomb); conditional reads must follow the Sites cache contract in Decisions (authoritative; authorization before 304, representation-derived ETags, mandatory revalidation, account-scoped SPA caches); D1 migration must be applied once locally and later in hosted deploy (publication outside scope); editor build is under one day old and non-fast-forward; rollback of source does not roll back data.

## Tasks

- [x] AC-3: Refresh upstream reference trees and record v0.7.0 provenance and release notes.
  - Outcome: reference trees equal upstream v0.7.0; metadata/docs updated and consistent.
  - Known entrypoints and skill paths: upstream.json; README.md; docs/ADAPTATION.md; docs/UPDATES.md; docs/upstream-inventory.json; docs/upstream-release-0.6.7.md; upstream-backend/; upstream-docs/; scripts/ (public-source check).
  - Inputs: accepted upstream research and local discovery in Exploration.
  - Dependencies: none.
  - Output: local `upstream` remote with fetched tags; replaced reference trees; provenance/doc edits.
  - Owner: thoth-worker.
  - Writes: upstream-backend/; upstream-docs/; VERSION; upstream.json (ExcaliDash fields only); README.md; docs/ADAPTATION.md; docs/UPDATES.md; docs/upstream-inventory.json; docs/upstream-release-0.7.0.md; version fixtures in tests/adapter.integration.mjs and frontend/tests only if they assert 0.6.7.
  - Interface boundaries: /api/system/update reads upstream.json; VERSION must equal upstream.json.version (adapter assertion) and feeds the SPA build version; editor block untouched.
  - Focused check and PASS evidence: tree comparison against v0.7.0 shows only declared exclusions; `npm run check:public-source` and `pnpm test:adapter` pass.
  - Return milestone: diff ready for root review and commit.
  - Stop / reassessment: tag SHA mismatch with Exploration or unexpected non-reference changes.
- [x] AC-1: Merge upstream v0.7.0 frontend changes onto the Sites-adapted SPA with localization and tests.
  - Outcome: adapted frontend passing tsc, lint and Vitest.
  - Known entrypoints and skill paths: frontend/src/; frontend/tests/; frontend/package-lock.json; docs/ADAPTATION.md#localización; C:/Users/EremesNG/.agents/skills/tdd/SKILL.md; C:/Users/EremesNG/.pi/agent/skills/simplify/SKILL.md.
  - Inputs: fetched upstream tags from AC-3 unit; v0.7.0 backend routes as API contract.
  - Dependencies: AC-3 reference unit accepted (remote fetched).
  - Output: merged frontend source, new en/es locale keys, focused tests, list of upstream changes ported/adapted/excluded with reasons.
  - Owner: thoth-worker.
  - Writes: frontend/src/ (except frontend/src/locales/errors.ts); frontend/tests/; frontend/package-lock.json.
  - Interface boundaries: HTTP contracts implemented by Worker unit; Sites cache contract in Decisions (SPA caches keyed by user id, cleared on identity change, revalidation honored); Sites transport and managed auth; React 18 boundary.
  - Focused check and PASS evidence: `node frontend/node_modules/typescript/bin/tsc -b frontend/tsconfig.json`, `npm --prefix frontend run lint`, `npm run test:frontend` pass, including the warm-cache account-switch and late-response regression test required by the Sites cache contract.
  - Return milestone: conflicts resolved and checks green.
  - Stop / reassessment: an upstream feature requiring a backend capability excluded by Non-goals, or an adapter contract that cannot be preserved.
- [x] AC-2: Port the v0.7.0 drawing/preference/caching contracts and index migration to the Worker with adapter tests.
  - Outcome: Worker implements AC-2 with passing adapter harness.
  - Known entrypoints and skill paths: server/api.ts; server/error-codes.ts; frontend/src/locales/errors.ts; db/schema.ts; drizzle/; tests/adapter.integration.mjs; upstream v0.7.0 backend/src/routes/dashboard/{drawingReadRoutes,drawingCreateUpdateRoutes,drawingHistoryRoutes}.ts, backend/src/routes/files.ts, backend/src/auth/accountPreferencesRoutes.ts; C:/Users/EremesNG/.agents/skills/tdd/SKILL.md.
  - Inputs: Exploration adapter anchors; fetched upstream v0.7.0 backend.
  - Dependencies: AC-3 reference unit accepted.
  - Output: Worker changes, new migration `drizzle/0001_*.sql` with meta, harness applying all migrations, new integration tests.
  - Owner: thoth-worker.
  - Writes: server/; worker/ only if needed; db/schema.ts; drizzle/; tests/adapter.integration.mjs; frontend/src/locales/errors.ts (new keys only).
  - Interface boundaries: Sites cache contract in Decisions; SPA transport in frontend/src/api; identity/origin/ownership/CAS contracts; R2 immutability.
  - Focused check and PASS evidence: `pnpm test:adapter` passes with new cases (304 after authorization only, representation-change ETag without version bump, cross-user ETag replay → 404, `private, no-cache` on drawing/preview/file, omitPreview/hasPreview, minimal, gzip ok/malformed/oversize-after-decompression, conflict 409, preference default/persist/isolation, retentionDays, migration upgrade from seeded 0000 data); root tsc passes; root lint adds no new errors.
  - Return milestone: contracts implemented and harness green.
  - Stop / reassessment: contract ambiguity between upstream backend and SPA, or need to change identity/ownership semantics.
- [x] AC-4: Pin editor 0.18.0-9c2e462 with provenance, fixtures and docs in a separate commit.
  - Outcome: exact editor pin consistent across manifest, lockfile, upstream.json and docs.
  - Known entrypoints and skill paths: docs/UPDATES.md#actualizar-el-editor-excalidraw; frontend/package.json; frontend/package-lock.json; upstream.json; tests/adapter.integration.mjs; frontend/tests/settings-advanced.test.tsx; frontend/tests/i18n-settings.test.tsx; AGENTS.md; docs/ADAPTATION.md; README.md.
  - Inputs: editor target in Exploration.
  - Dependencies: AC-1 and AC-2 units accepted and committed.
  - Output: editor bump diff.
  - Owner: thoth-worker.
  - Writes: the listed files only.
  - Interface boundaries: editor public API used by frontend; /api/system/editor drift logic.
  - Focused check and PASS evidence: `node scripts/check-editor-upstream.mjs --offline`, editor regression Vitest files and `pnpm test:adapter` pass; lockfile churn limited to editor-related packages.
  - Return milestone: bump ready for root commit.
  - Stop / reassessment: registry/production evidence contradicts target, or editor API breakage requiring source changes.
- [x] AC-5: Run consolidated CI checks and a local preview smoke of the integrated build.
  - Outcome: command outcomes and browser smoke evidence.
  - Known entrypoints and skill paths: .github/workflows/sites-ci.yml; docs/UPDATES.md step 6 (lines 88–104); docs/DEPLOYMENT.md; scripts/prepare-frontend.mjs; C:/Users/EremesNG/.agents/skills/agent-browser/SKILL.md.
  - Inputs: frozen committed AC-1..AC-4 source.
  - Dependencies: AC-1, AC-2, AC-3, AC-4 accepted.
  - Output: reconciled check list, smoke observations, local migration applied to local state only, cleanup status.
  - Owner: thoth-worker (fresh).
  - Writes: generated/ignored outputs and local .wrangler state only.
  - Interface boundaries: local Worker preview with QA identity; no hosted resources.
  - Focused check and PASS evidence: all AC-5 commands pass (root lint baseline excepted, no new findings vs main); in the supported local QA preview with migrations applied in order, the full docs/UPDATES.md step-6 real-browser checklist passes: sticky note, Bucket Fill and lasso; save and reload persistence; dashboard thumbnails and history preview/restore; `.excalidraw`, PNG and SVG export (real SVG bytes with embedded font); image upload and reopen; same-origin fonts with no third-party browser requests; no `Failed to use workers for subsetting` or `document is not defined` in console; Settings → Advanced editor version, excalidraw.com status and managed auth without Disable; second session of the same account receiving a sticky-note edit. Additionally: a v0.7.0 feature (drop-to-append or inline rename), Spanish UI, and a 304 revalidation observed on drawing reopen. Native OS download delivery limits, if any, are reported explicitly.
  - Return milestone: all checks reconciled and QA state cleaned.
  - Stop / reassessment: any failure requiring source changes.
- [x] AC-2: Restore version advancement for metadata-only drawing PUTs with a competing-renames regression.
  - Outcome: metadata writes keep pre-existing CAS semantics.
  - Known entrypoints and skill paths: server/api.ts drawing PUT metadata branch (~232–242); tests/adapter.integration.mjs; C:/Users/EremesNG/.agents/skills/tdd/SKILL.md.
  - Inputs: final Oracle FAIL finding `cas`.
  - Dependencies: none.
  - Output: fix plus regression.
  - Owner: thoth-worker.
  - Writes: server/api.ts; tests/adapter.integration.mjs.
  - Interface boundaries: SPA rename/move callers; ETag; return=minimal shape.
  - Focused check and PASS evidence: new test RED before fix then GREEN; pnpm test:adapter all pass; root tsc; root lint no new findings.
  - Return milestone: fix ready for root commit.
  - Stop / reassessment: SPA relies on unchanged version after metadata writes.
- [x] AC-1: Compare normalized image status in editor element tracking with a repeated-identical-frames regression.
  - Outcome: unchanged images no longer schedule broadcasts/saves.
  - Known entrypoints and skill paths: frontend/src/pages/editor/useEditorElementTracking.ts; frontend/src/pages/editor/useEditorBroadcast.ts; frontend/tests/; C:/Users/EremesNG/.agents/skills/tdd/SKILL.md.
  - Inputs: final Oracle FAIL finding `image`.
  - Dependencies: none.
  - Output: fix plus regression.
  - Owner: thoth-worker.
  - Writes: frontend/src/pages/editor/ (tracking/broadcast only); frontend/tests/.
  - Interface boundaries: full-content reconciliation and save pipeline.
  - Focused check and PASS evidence: regression RED then GREEN; frontend tsc, lint, full Vitest pass.
  - Return milestone: fix ready for root commit.
  - Stop / reassessment: fix would require changing reconciliation semantics.
- [x] AC-4: Make the offline editor consistency check reject contradictory commit/production identifiers and correct follow-mode release notes.
  - Outcome: checker enforces pin/commit/production agreement; notes accurate.
  - Known entrypoints and skill paths: scripts/check-editor-upstream.mjs; docs/upstream-release-0.7.0.md; docs/UPDATES.md (if it documents the checker).
  - Inputs: final Oracle FAIL findings `pin` and `follow`.
  - Dependencies: none.
  - Output: checker change with negative check; doc correction.
  - Owner: thoth-worker.
  - Writes: scripts/check-editor-upstream.mjs; a focused test for the checker if a seam exists (else a documented negative run); docs/upstream-release-0.7.0.md.
  - Interface boundaries: CI `npm run check:editor-upstream -- --offline`; upstream.json editor block unchanged.
  - Focused check and PASS evidence: offline check passes on real files; negative in-memory/temp-copy run with mismatched commit and productionVersion fails non-zero.
  - Return milestone: ready for root commit.
  - Stop / reassessment: real upstream.json fails the stricter check.
- [x] AC-2: Return the request's own committed row from guarded drawing PUT writes with an interleaved-save regression.
  - Outcome: every PUT response reports exactly the revision that request committed.
  - Known entrypoints and skill paths: server/api.ts scene/preview save batch (~140–143) and PUT route (~241–244); tests/adapter.integration.mjs; frontend/src/pages/editor/useEditorPersistence.ts:492–504 (read-only consumer); C:/Users/EremesNG/.agents/skills/tdd/SKILL.md.
  - Inputs: round-2 final Oracle FAIL finding `save-ack`.
  - Dependencies: none.
  - Output: fix plus regression.
  - Owner: thoth-worker.
  - Writes: server/api.ts; tests/adapter.integration.mjs.
  - Interface boundaries: full and return=minimal shapes, ETag, R2 cleanup on lost race, snapshot creation.
  - Focused check and PASS evidence: interleaving regression RED then GREEN; adapter all pass; root tsc; root lint no new findings.
  - Return milestone: fix ready for root commit.
  - Stop / reassessment: D1 batch cannot return the guarded row.
- [x] AC-1: Preserve unsaved local persisted app-state in conflict reconciliation and lazy-load the editor for import previews.
  - Outcome: disjoint local/peer edits both survive retry and catch-up; Settings no longer statically imports the editor chunk.
  - Known entrypoints and skill paths: frontend/src/pages/editor/reconcileSave.ts; frontend/src/pages/editor/useEditorPersistence.ts (~308–330); frontend/src/utils/importHelpers.ts; frontend/src/pages/Settings.tsx; upstream `git show v0.7.0:frontend/src/utils/importHelpers.ts`; frontend/tests/; C:/Users/EremesNG/.agents/skills/tdd/SKILL.md.
  - Inputs: round-3 final Oracle FAIL findings `reconcile` and `lazy`.
  - Dependencies: none.
  - Output: fixes plus regressions.
  - Owner: thoth-worker.
  - Writes: frontend/src/pages/editor/ (reconciliation/persistence only); frontend/src/utils/importHelpers.ts; frontend/tests/.
  - Interface boundaries: save/retry pipeline, version adoption, import/backup verification UI.
  - Focused check and PASS evidence: disjoint-edits regression RED then GREEN; build output shows Settings chunk no longer statically importing the editor chunk; frontend tsc, lint, full Vitest pass.
  - Return milestone: ready for root commit.
  - Stop / reassessment: fix requires changing server contracts.
- [x] AC-4: Make the offline checker compare the lockfile root dependency requirement with the pin.
  - Outcome: root lock requirement disagreement fails offline validation.
  - Known entrypoints and skill paths: scripts/check-editor-upstream.mjs; tests/editor-upstream-check.test.mjs.
  - Inputs: round-3 final Oracle FAIL finding `pin`.
  - Dependencies: none.
  - Output: checker change and negative case.
  - Owner: thoth-worker.
  - Writes: scripts/check-editor-upstream.mjs; tests/editor-upstream-check.test.mjs.
  - Interface boundaries: CI offline check.
  - Focused check and PASS evidence: new negative case RED then GREEN; real repo passes offline check.
  - Return milestone: ready for root commit.
  - Stop / reassessment: real lockfile fails the check.
- [x] AC-1: Canonicalize the reconciliation base after editor restore and keep account-controlled gridStep out of remote patches.
  - Outcome: legacy default values never count as local edits; peer saves never change the local grid step.
  - Known entrypoints and skill paths: frontend/src/pages/editor/shared.ts (~78–125); frontend/src/pages/editor/useEditorSceneLoader.ts (~193–205); frontend/src/pages/editor/useEditorPersistence.ts (~315–334); frontend/src/pages/editor/useEditorCollaboration.ts (~296–314); frontend/src/pages/editor/useEditorGridStep.ts; frontend/tests/; C:/Users/EremesNG/.agents/skills/tdd/SKILL.md.
  - Inputs: round-4 final Oracle FAIL findings `grid` and `step`.
  - Dependencies: none.
  - Output: fixes plus regressions using real editor restore normalization.
  - Owner: thoth-worker.
  - Writes: frontend/src/pages/editor/; frontend/tests/.
  - Interface boundaries: save/retry/catch-up pipeline; grid step preference.
  - Focused check and PASS evidence: regressions RED then GREEN; frontend tsc, lint, full Vitest.
  - Return milestone: ready for root commit.
  - Stop / reassessment: canonical base requires server changes.
- [x] AC-1: Remove live scene-settings adoption from polling/broadcast paths and cover the delayed-acknowledgement lost-edit case.
  - Outcome: polls and broadcasts never patch local scene settings; retry merge and load keep canonical base; no newer local setting is overwritten or falsely marked saved.
  - Known entrypoints and skill paths: frontend/src/pages/editor/useEditorCollaboration.ts (~283–315); frontend/src/pages/editor/useEditorPersistence.ts (~179–188, 285–306); frontend/src/pages/editor/appStateReconciliation.ts; reconcileSave.ts; pre-port reference `git show feb3424:frontend/src/pages/editor/useEditorCollaboration.ts`; frontend/tests/ (editor-save-safety live-convergence cases from d723912 must be rewritten to the new contract); C:/Users/EremesNG/.agents/skills/tdd/SKILL.md.
  - Inputs: round-5 Oracle FAIL `lost-edit`; user decision above.
  - Dependencies: none.
  - Output: code change plus regressions.
  - Owner: thoth-worker.
  - Writes: frontend/src/pages/editor/; frontend/tests/; docs/ADAPTATION.md and docs/upstream-release-0.7.0.md only to state the settings-sync boundary.
  - Interface boundaries: element/file polling, 409 retry merge, version adoption, base advancement on acknowledged saves only.
  - Focused check and PASS evidence: delayed-ACK regression (own commit seen by poll before ACK, newer local toggle) RED then GREEN; peer settings still converge after reload and through 409 retry without loss; frontend tsc, lint, full Vitest.
  - Return milestone: ready for root commit.
  - Stop / reassessment: version adoption from polls itself causes a lost edit requiring further redesign.
- [x] AC-1: Canonicalize omitted keys of a valid remote appState in the retry merge so peer resets to defaults survive.
  - Outcome: a committed reset represented by omitted keys is preserved by a 409 retry while disjoint local edits win.
  - Known entrypoints and skill paths: frontend/src/pages/editor/appStateReconciliation.ts (~32–45); frontend/src/pages/editor/reconcileSave.ts; frontend/tests/; C:/Users/EremesNG/.agents/skills/tdd/SKILL.md.
  - Inputs: round-6 Oracle FAIL findings `reset` and `retry`.
  - Dependencies: none.
  - Output: fix plus regressions.
  - Owner: thoth-worker.
  - Writes: frontend/src/pages/editor/appStateReconciliation.ts; frontend/tests/.
  - Interface boundaries: 409 retry merge only; polls unchanged.
  - Focused check and PASS evidence: sparse-remote regression RED then GREEN; invalid/non-object remote keeps base; frontend tsc, lint, full Vitest.
  - Return milestone: ready for root commit.
  - Stop / reassessment: fix needs server changes.
- [x] AC-6: Freeze the change and prepare independent final verification.
  - Outcome: verify-ready record with source digests.
  - Known entrypoints and skill paths: this record; git diff main..feat/upstream-0.7.0; .thoth/specs/.
  - Inputs: accepted AC-1..AC-5 results.
  - Dependencies: all prior tasks accepted.
  - Output: completed record ready for fresh Oracle.
  - Owner: root.
  - Writes: this record only.
  - Interface boundaries: no implementation edits during review.
  - Focused check and PASS evidence: `validate.mjs --through verify` passes.
  - Return milestone: Oracle can start.
  - Stop / reassessment: stale digests or unexpected scope.

## Authorization

**Plan review**: OKAY
**Plan review selection**: EXPLICIT_REVIEW
**Implementation**: AUTHORIZED

User selected Review plan with Oracle, then Implement, on 2026-11-24. Round 1 REJECT (VERSION ownership, cache contract, migration upgrade test) and round 2 REJECT (SPA account-switch test, full step-6 browser checklist) were repaired by root; fresh round-3 Oracle returned OKAY with delivered verdict valid=true, kind=plan-review, verdict=OKAY, record=null.

## Verification

**Reviewer**: oracle
**Independent from implementer**: Yes
**Verdict**: PASS
**Reviewed record SHA-256**: 31273b8884d77dcfbdf7b9b9fb9ed0b12aa452bfc24c4ffaa28e043b2ea8fd5b

**Oracle envelope**:

```thoth-result
{
  "schemaVersion": 1,
  "role": "oracle",
  "status": "complete",
  "conclusion": "PASS on frozen commit 5b2ed5b. The 409 retry preserves remote resets and disjoint local edits. Polls still adopt neither scene settings nor drawing versions. No blocking violations found across AC-1–AC-6, the durable deltas, or the binding decisions.",
  "evidence": [
    {"id":"freeze","kind":"digest","locator":".thoth/changes/upstream-0-7-0/upstream-0-7-0.md:318–346","claim":"Verify gate passed. All 28 recorded source digests and the declared absence matched the checkout; source content matched the frozen commit after line-ending normalization.","basis":"observed","uncertainty":""},
    {"id":"spa","kind":"code-and-tests","locator":"frontend/src/pages/editor/appStateReconciliation.ts:23–47; reconcileSave.ts:65–98; frontend/src/api/sitesSocket.ts:15","claim":"Retry distinguishes an empty valid snapshot from invalid input, restores omitted keys to defaults, retains locally changed fields, and excludes account-controlled grid step. Poll payloads carry elements and files only. All 384 frontend tests passed, including retry, delayed ACK, account-switch cache, and Advanced regressions.","basis":"observed","uncertainty":""},
    {"id":"worker","kind":"integration","locator":"server/api.ts:76–105,140–158,178–186,224–248; tests/adapter.integration.mjs","claim":"All 37 adapter checks passed, including owner-only conditional reads, gzip limits, per-write CAS acknowledgements, preferences, history, and seeded migration upgrade.","basis":"observed","uncertainty":""},
    {"id":"provenance","kind":"git-and-tests","locator":"v0.7.0; 0bca43b; 12ceafe; upstream.json","claim":"Reference blobs and modes match the tag except the four declared environment examples. SPA lockfile changed only follow-redirects before the separate exact editor pin. Offline checker, six negative tests, and public-source check passed.","basis":"observed","uncertainty":""},
    {"id":"ci","kind":"checks-and-record","locator":"Change record Verification: AC-5 and post-repair evidence","claim":"Both TypeScript projects and frontend lint passed independently. Root lint reproduced 36 baseline errors and one warning versus 38 errors and one warning on main, with no added diagnostics. The record documents frozen installs, build, and integrated browser smoke including Spanish UI and SVG with an embedded font.","basis":"observed","uncertainty":"Install, build, and browser smoke were reviewed from recorded evidence, not rerun by Oracle. Only the retry helper and its tests changed after the last browser smoke."}
  ],
  "verification": [
    {"check":"AC-1 and settings-sync decision","method":"Frozen diff inspection and full Vitest run","outcome":"pass","evidenceIds":["spa","provenance"],"reason":"Sparse remote resets and disjoint edits survive retry without live poll adoption."},
    {"check":"AC-2 and drawing-api deltas","method":"Worker inspection and adapter integration run","outcome":"pass","evidenceIds":["worker"],"reason":"Authorization, response shapes, CAS, and migration behavior verified."},
    {"check":"AC-3/4 and editor-integration deltas","method":"Tag/commit comparison, offline checks, and drift tests","outcome":"pass","evidenceIds":["provenance","worker","spa"],"reason":"Reference fidelity, exact pin, and drift reporting verified."},
    {"check":"AC-5/6","method":"Independent frozen-source checks and review of existing CI/browser evidence","outcome":"pass","evidenceIds":["freeze","spa","worker","ci"],"reason":"Latest retry change is covered by fresh tests; browser evidence applies to unchanged paths."}
  ],
  "risks": [
    {"description":"AC-5 browser evidence does not cover native OS download delivery; SVG bytes and embedded fonts were verified through interception.","severity":"low","blocking":false,"evidenceIds":["ci"]}
  ],
  "openQuestions": [],
  "nextAction": "root: closeout",
  "review": {
    "kind": "final-verification",
    "verdict": "PASS",
    "reviewedRecord": ".thoth/changes/upstream-0-7-0/upstream-0-7-0.md",
    "reviewedRecordSha256": "31273b8884d77dcfbdf7b9b9fb9ed0b12aa452bfc24c4ffaa28e043b2ea8fd5b"
  }
}
```

- AC-1: PASS | three-way merge of upstream frontend v0.6.7..v0.7.0 (commit 0bca43b); frontend tsc, lint, Vitest 367/367 in 26 files incl. warm-cache account-switch + late-response test; prepare-frontend | Ported dashboard pagination/lazy thumbnails/prefetch, inline rename, system theme (index.html + public/theme-init.js same-origin), editor viewport/save/upload/library improvements, drop-to-append preference, guarded permanent delete. Adapted: HTTP polling transport, reconciliation, exportScene previews, managed auth, restricted sharing, Advanced, Spanish UI, omitPreview/ETag reads, return=minimal + gzip with JSON fallback, null retention shown as unlimited. Excluded: Socket.IO follow mode, share-link recovery, first-admin, API keys, incomplete-backup recovery, nginx. package.json unchanged at that commit; lockfile only follow-redirects 1.16.1->1.16.3.
- AC-2: PASS | commit 5dd0a5d; pnpm test:adapter 35/35; root tsc exit 0; root lint 36 errors + 1 warning (main 38 + 1, no new rule/file) | omitPreview/hasPreview; SHA-256 body ETags on drawing/preview, R2 etag on files; authorize-then-304 bodyless; private, no-cache; rename/profile/collection deletion change ETag; cross-user replay 404; return=minimal shape; gzip via DecompressionStream with 16 MiB decoded cap (INVALID_GZIP 400, UNSUPPORTED_CONTENT_ENCODING 415, REQUEST_TOO_LARGE 413); 409 CAS preserved; retentionDays null; appendDroppedDrawings default false, boolean-only, per user; atomic requireTrashed delete (DRAWING_NOT_TRASHED 409); migration drizzle/0001_lean_hex.sql `CREATE INDEX drawings_collection_updated_at ON drawings (collectionId, updatedAt)` with seeded 0000->0001 upgrade test; 0000 untouched.
- AC-3: PASS | commit fb36571; tree comparison vs v0.7.0 (213 backend + 99 docs files match blobs/modes; only the four .env*.example exclusions); check:public-source; adapter tests | upstream tags verified v0.6.7=0f9be2d, v0.7.0=b692be2; VERSION and upstream.json 0.7.0; README, ADAPTATION, UPDATES, upstream-inventory and docs/upstream-release-0.7.0.md updated; license/attribution unchanged.
- AC-4: PASS | commit 12ceafe; live re-verification of production/npm next/release SHA/integrity before install; offline consistency; frontend tsc; Vitest 367/367; adapter 35/35; prepare-frontend | Exact pin 0.18.0-9c2e462; lockfile changed only five @excalidraw entries; README stale 4ce8305 row fixed.
- AC-5: PASS | fresh verification worker at frozen 12ceafe | frozen installs (frontend 471 packages); public-source 660 files; offline consistency; build; both tsc; frontend 367/367; adapter 35/35; frontend lint; root lint baseline gate (36+1 vs main 38+1). Local Chrome preview with migrations 0000 then 0001: sticky note, Bucket Fill, lasso; save/reload persistence with accented text; dashboard thumbnail; history preview 200 and restore v2 -> v6; .excalidraw JSON, PNG signature, real SVG 7,018 bytes with `Café, acción y piñata` and 2,652-byte wOF2 subset; no subsetting/document errors; image upload rendered after reopen (/api/files 200); same-origin fonts, no third-party browser requests; Spanish Settings Advanced shows app 0.7.0, editor 0.18.0-9c2e462, excalidraw.com match, managed auth without Disable; inline rename persisted; drawing reopen HTTP 304; second session received the edit without reload. Native OS download delivery not tested (save APIs intercepted in memory). QA drawing deleted (GET 404), browsers/preview closed, port 5173 free.
- AC-6: PASS | root freeze at 5b2ed5b and verify gate | branch range 786d3cd..5b2ed5b including all convergence repairs; implementation inputs frozen; source digests below.
- Convergence repairs (commit eeb8dff, after first final FAIL): (1) metadata-only PUT now advances version in the guarded `UPDATE ... WHERE version=? RETURNING *`; regression RED (second same-version rename returned 200) then GREEN; adapter 36/36. (2) `useEditorBroadcast` compares/records/sends the normalized element; confirmed merge regression vs upstream v0.7.0; regression RED (3 broadcasts over three equivalent frames) then GREEN; frontend 368/368. (3) offline editor checker requires hash-suffixed prerelease, matching 40-hex commit, production build id hash and timestamp equal to pin and releasedAt; tests/editor-upstream-check.test.mjs 5 negative cases RED before fix, exit 1 after; real repo and archived pins 3c916c5/4ce8305 pass. (4) release notes list viewport follow mode as excluded. Known pre-existing interaction: dashboard/editor-title rename and collection moves omit version, so a later editor autosave may 409 and reconcile/retry; pagehide keepalive has no retry (same as pre-port CAS behavior).
- Post-repair consolidated checks at eeb8dff (root-run, deterministic): public-source 661 files; offline editor consistency; checker negative tests; build; root tsc; frontend tsc; frontend Vitest 368/368 in 26 files; adapter 36/36 incl. seeded 0000->0001 upgrade; frontend lint; root lint 36 errors + 1 warning (baseline, no new findings). Browser smoke from AC-5 at 12ceafe not repeated; repaired code paths are covered by the new regressions.
- Second convergence repair (commit 04d9d2e, after round-2 final FAIL): every drawing PUT path builds its full and return=minimal response from the row returned by its own guarded `UPDATE ... RETURNING *` in the D1 batch; empty result keeps 409 VERSION_CONFLICT with staged R2 cleanup. Regression wraps the real Miniflare D1 binding so a peer PUT commits between the first batch and its response (no production hook): RED (scene PUT returned 3 instead of its own 2) then GREEN for scene, preview and metadata saves.
- Post-repair consolidated checks at 04d9d2e (root-run): public-source 661 files; offline editor consistency; checker negative tests 5/5; build; root tsc; frontend tsc; Vitest 368/368 in 26 files; adapter 37/37; frontend lint; root lint 36 errors + 1 warning (baseline, no new findings).
- Third convergence repairs: commit 54d22db — offline checker compares `packages[''].dependencies[editor.package]` with the pin; new negative case RED (old checker exited 0) then GREEN, 6/6; `resolved` URL deliberately unchecked (pin + integrity already bind the tarball). Commit 2ed7d6e — save retries, reconnect catch-up and saved-scene broadcasts three-way merge persisted app-state fields against the last accepted server state (local-changed wins, unchanged adopts peer); shared base ref wired in Editor.tsx; regressions RED (retry sent white instead of unsaved red; catch-up missed peer grid change) then GREEN; `makeSvgPreview` dynamically imports Sites exportScene; built Settings chunk static graph excludes the Editor route and the 1.61 MB Excalidraw chunk.
- Post-repair consolidated checks at 2ed7d6e (root-run): public-source 661 files; offline editor consistency; checker tests 6/6; root tsc; frontend tsc; Vitest 370/370 in 26 files; adapter 37/37; frontend lint; root lint 36 errors + 1 warning (baseline). Build exercised by the repair worker's production build and by the browser rerun preview.
- Focused browser rerun at 2ed7d6e (fresh worker, local Chrome, QA identity): (1) sticky note with accented text, Bucket Fill, lasso persisted after cache-bypassing reload; (2) background colour persisted; (3) two same-account sessions editing concurrently (A background, B ellipse): both edits present in both sessions after reload, no lost edit; first run PUTs A 409,200,409,200 and B 200,409,200 — every conflict recovered within bounded retries; clean-log repeat one PUT 200 per session with both changes present; (4) dashboard inline rename then editor edit persisted, no 409; (5) reopen GET 304; (6) history v6 preview/restore 200 with correct state; (7) intercepted SVG 11,160 bytes with accented text and embedded wOF2, no subsetting/document errors; (8) opening Settings did not request the 1.61 MB editor chunk; importing an .excalidraw file requested it (200), created drawing 201, preview 200; (9) Spanish Advanced shows app 0.7.0, editor 0.18.0-9c2e462, managed auth without Disable. QA drawings deleted (GET 404), browsers/preview closed, port free. Root judgment on item 3: the "at most one recovered 409" figure was a root-chosen smoke heuristic, not an acceptance criterion; repeated 409s under genuinely concurrent CAS writes that each recover without loss are the intended optimistic-concurrency behavior. Native OS download delivery not tested.
- Fourth convergence repair (commit 3323a04): initial load, successful saves, conflict retries and peer catch-up compare canonical scene settings produced by the pinned editor's `restoreAppState`; remote reconciliation accepts only `viewBackgroundColor`, `gridSize`, `gridModeEnabled`; `gridStep` and `theme` (Sites account preferences) and `language`/`langCode` (editor prop) are excluded; outgoing saves still carry local gridStep. Regressions with the real restore function: RED (legacy null gridSize restored to 20 overwrote peer 40 on retry; peer gridStep 8 applied while selector showed 5) then GREEN.
- Post-repair checks at 3323a04 (root-run): public-source 663 files; offline editor consistency; checker 6/6; root tsc; frontend tsc; Vitest 371/371; adapter 37/37; frontend lint; root lint 36 errors + 1 warning (baseline).
- Focused browser rerun at 3323a04 (fresh worker): 9 PASS (sticky note/Bucket Fill/lasso persistence; background persistence with canvas pixel readback; same-account grid step 11 kept in selector and canvas after peer save; inline rename then edit; reopen GET 304; history v8 preview/restore 200; intercepted SVG 11,460 bytes with accented text and wOF2, no subsetting/document errors; Settings loads the editor chunk only on import; Spanish Advanced app 0.7.0 / editor 0.18.0-9c2e462 / managed auth without Disable; local D1 index verified). Item 3: after B's 409->200, A briefly showed B's ellipse and A's background with grid mode still off; full reloads showed all three edits in both sessions, nothing lost. QA data cleaned, port free.
- Live-convergence diagnosis (fresh worker, commit d723912): element deltas arrive on the ~1 s Sites event poll without app state; committed scene settings arrive on the next ~6 s full-scene poll, or immediately through 409 recovery if the observer saves first. Pre-port (feb3424) the full-scene poll forwarded only elements/files, so live settings adoption is new behavior of this port. Four new regressions (observer saves before/after the peer's 409->200; autosave and explicit-save queue with guarded preview write) reproduce the intermediate state and verify live convergence of background, grid mode and grid size without changing grid step; all passed on unchanged production code (no defect). Root judgment: the browser item-3 observation is the documented intermediate window (eventual convergence within one full-scene poll), not a lost edit or divergence. Vitest 375/375 in 26 files; frontend tsc and lint pass.
- Fifth convergence repair (commit ad8dc57, user decision): collaboration polls, saved-scene broadcasts and reconnect catch-up merge only elements and files (matching pre-port feb3424); they no longer patch scene settings, advance the canonical settings base or adopt the drawing version; `sitesSocket.ts` poll dispatch no longer carries appState/version; obsolete Editor.tsx wiring removed. Settings converge on reload or via 409 retry three-way merge; docs/ADAPTATION.md and docs/upstream-release-0.7.0.md state the boundary. Delayed-ACK regression with real polling+persistence hooks: RED ([true,true]) then GREEN ([false,false], newer element preserved); rewritten autosave/explicit-save cases confirm a peer commit forces 409 and the retry preserves both sides' elements and disjoint settings. Vitest 376/376.
- Post-repair checks at ad8dc57 (root-run): public-source 663 files; offline editor consistency; checker 6/6; root tsc; frontend tsc; Vitest 376/376; adapter 37/37; frontend lint; root lint 36 errors + 1 warning (baseline).
- Focused browser rerun at ad8dc57 (fresh worker): 11/11 PASS — sticky note/Bucket Fill/lasso persistence; background persistence; two sessions: B's ellipse live in A while A's grid stayed off, A's next edit 409->200, after reloads both canvases had background, grid ON, ellipse and diamond (PUTs A 200; B 409->200; A 409->200); rapid grid ON->OFF before autosave confirmation remained OFF after 8 s and reload (deliberately delayed in-flight ACK covered by the Vitest regression, not browser); peer grid step 11 did not change A's canvas/selector 5; inline rename then edit; reopen GET 304; history v5 preview/restore 200; intercepted SVG 13,322 bytes with accented text and wOF2, no subsetting/document errors; Settings/Advanced load no editor bundle until import preview; Spanish Advanced app 0.7.0 / editor 0.18.0-9c2e462 / managed auth without Disable. QA data and preferences restored, port free.
- Sixth convergence repair (commit 5b2ed5b): for a valid plain-object remote appState, the retry merge canonicalizes it via the pinned restore (omitted keys = restored defaults), three-way compares every reconciled key and uses that canonical snapshot as the next accepted base; null/non-object/array remote leaves base and local unchanged; polls unchanged. Regressions (empty, partially sparse, explicit-value control, invalid remote): RED 3/24 focused failures before fix (stale red kept; non-plain object changed base), GREEN after.
- Post-repair checks at 5b2ed5b (root-run): public-source 663 files; offline editor consistency; checker 6/6; root tsc; frontend tsc; Vitest 384/384 in 26 files; adapter 37/37; frontend lint; root lint 36 errors + 1 warning (baseline). Browser rerun not repeated: the change is confined to the pure merge helper covered by the new regressions; the 11/11 browser evidence at ad8dc57 covers all other paths unchanged since.
- Source: VERSION | sha256:966d87547cf763b2acac8723db5c1615c6a41fcc63adfce50a13f106b6311188
- Source: upstream.json | sha256:07d7216f0e2cf0a060beeea2441a1e07167eef5db119b523fb1345a710f68497
- Source: server/api.ts | sha256:02ca122e463491c286492fe7c962241a2eb1a56653266e34e3724839bcb85d89
- Source: server/error-codes.ts | sha256:00d5c3b821e6a724e9dd3e2235e8c15c443256bf19d595ac7093243e30cb25f8
- Source: db/schema.ts | sha256:e37940a302b2bfae6b21e2bc5c2240bd97e5405abc6feb19df68bb1665e8fbb9
- Source: drizzle/0001_lean_hex.sql | sha256:026e039e819427c5315782bb5be3d25993f3b9525f4e542b18c67feabefce097
- Source: tests/adapter.integration.mjs | sha256:fb108c7a035c993d7e4da9bb653bd21b5ae7762c240e419a6ae3ac9673549a23
- Source: frontend/package.json | sha256:c2b28e994b7e5287b6a472fd8f052a60943bca5c17896b2874e889d838521499
- Source: frontend/package-lock.json | sha256:96d2ca66cb03c5d78da4671a1befca83bc6e9ba93787452e657c3d6ebc1b08db
- Source: frontend/src/locales/errors.ts | sha256:201c374ec5ca718e0fdfc7cc972f07bd03971e7b65f27ec735500ac39e370011
- Source: scripts/check-editor-upstream.mjs | sha256:0e615f6114d20fdf26512a501b9ac23a7d525db235d9f3ac1fd69e9bcbddf45d
- Source: tests/editor-upstream-check.test.mjs | sha256:a9077003305b287be792d004dd32d1c05826bcda953b7c7b5819470041a9c680
- Source: frontend/src/pages/editor/useEditorBroadcast.ts | sha256:baec7af95521618f46493b81a348bb6d9a37d818469c5d168bb87fb643e0d4eb
- Source: frontend/src/pages/editor/useEditorElementTracking.ts | sha256:0a1a348a470cedb2df41fb2b0bc7d2c92a5126b7107a67422d17f434a88b7a67
- Source: docs/upstream-release-0.7.0.md | sha256:b8c9417e9f8b991a9777008f67f1d132b417fcdecdc514d53bfcf92ac39c328b
- Source: frontend/src/pages/editor/reconcileSave.ts | sha256:a8bc8b9518bd7aaac70ee5c9e1c7e7d3b51cc89f4adb65fb3bda47760ca3cb7b
- Source: frontend/src/pages/editor/useEditorPersistence.ts | sha256:f4b53f8693d32387be2dd33a920761482f736e367c954f840363fb91887d3719
- Source: frontend/src/pages/editor/useEditorCollaboration.ts | sha256:a350ea9f851873edc4c63ff5f2d82fb83f2ee909a294efb0784ad99da950b20a
- Source: frontend/src/utils/importHelpers.ts | sha256:e1012aadf4fb3cab6eafa0b0bb44ac058523f30bd4f8c50f2ecfc3a767aa2650
- Source: frontend/src/pages/Editor.tsx | sha256:c1993be0266d5b5d55ad81195a6e6a45ca87b86ff0abebcfd777df57382fb558
- Source: frontend/src/pages/editor/appStateReconciliation.ts | sha256:848bf1d92f33b78f6a1b909ad32f61e35e608bb4731526c23806ea56adbb8d82
- Source: frontend/src/pages/editor/useEditorSceneLoader.ts | sha256:c70af5139e24c767c41b5a4be9b4faf243c42fe70897eb118ec2ae60d25fe477
- Source: frontend/src/pages/editor/shared.ts | sha256:fd8f198e0e4e0871ff381b79f110cfc73fa7635088762817b5b7badb69bfafa4
- Source: frontend/tests/editor-save-safety.test.tsx | sha256:722e6b7683aef75603824300e46b68e7637f2412fb6dffe6d66692a8d8e4dd34
- Source: frontend/src/api/sitesSocket.ts | sha256:1e8883d3b065fd5edd774557d67a63d99391aa2b9a799092b3c432d537390625
- Source: docs/ADAPTATION.md | sha256:3366362439f07cf9df0df82cb42c23193135b68ff801fce127a9b82b4576ec5c
- Source: frontend/tests/editor-collaboration-safety.test.tsx | sha256:9fb5379925b89b634fd992b0e8040b60717211b624eac28dd79eeb7215319306
- Source: .thoth/specs/editor-integration/spec.md | sha256:38bcbf448cc8dcffa6152bd0cdf38e4197357ac72c33fce7be1559b819a055f6
- Source: .thoth/specs/drawing-api/spec.md | absent

## Closeout

**Archive**: READY

Fresh round-7 Oracle final verification PASS at frozen 5b2ed5b with delivered verdict valid=true, kind=final-verification, verdict=PASS, mode=record, recordDigest=match, recordSha256=31273b8884d77dcfbdf7b9b9fb9ed0b12aa452bfc24c4ffaa28e043b2ea8fd5b; root independently hashed the exact prefix bytes and matched. Rounds 1-6 returned FAIL (reviewed prefixes 83f447e4, 7a4fadc5, a0bfdc8a, f3b6eda9, 3eaf4310, c554c0cb) and were repaired as recorded in Clarifications. Non-blocking residual risk: native OS download delivery not exercised. No push, hosted migration or publication occurred; drizzle/0001_lean_hex.sql must be applied to hosted D1 at publication.
