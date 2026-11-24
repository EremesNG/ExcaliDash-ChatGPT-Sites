# Change: refresh-upstreams-2026-11

**Classification**: substantial
**Scope**: coordinated
**Uncertainty**: low
**Risk**: medium

## Exploration

The clean public-source checkout starts at eb5ee51. ExcaliDash is pinned to v0.6.7 / 0f9be2d8649be7650e6bee2844739c584fa76c35. Independent fresh upstream research confirms that both its latest release and main remain at that revision on 2026-11-07; there is no ExcaliDash source delta to import.

The editor is independently pinned to @excalidraw/excalidraw@0.18.0-4ce8305 / 4ce8305ca78e4ea05ad78c306292932bfe6b256f. The current excalidraw.com production build is 2026-11-04T19:55:10Z-3c916c5, matching release SHA 3c916c58bd219157a3486960f865174468f86eff and published npm next version 0.18.0-3c916c5. Registry publication time is 2026-11-04T20:26:46.460Z. Independently verified tarball integrity is sha512-RYMD7G2vbTMzIE8RmKGRrghdD+h6p1jd7R0pQZzw1NPOzFosg73SMW8JDFVPMC/weWByBqGNOtmp+v+YEDilMA==.

The source comparison has 8 commits ahead and 1 behind because the release-only hide-hints patch was recreated. Changes cover Mermaid conversion/loading, keyboard node navigation, and frame/arrow insertion, movement and exports. Research found no serialization schema, restore logic, public type or export signature changes in this delta; scene editing and frame export behavior still warrant full regression checks.

Accepted local discovery identifies docs/UPDATES.md, upstream.json, frontend/package.json, frontend/package-lock.json and tests/adapter.integration.mjs as the update boundary. server/api.ts derives provenance from upstream.json; the adapter tests contain explicit version/date comparison fixtures. Existing canonical editor-integration requirements cover an exact published pin, consistency validation and authenticated drift reporting. No active change record or constitution exists. Node 24.22.2 and pnpm 11.25.0 are installed; frontend commands must explicitly use npm 10.9.2.

Sources: https://github.com/ZimengXiong/ExcaliDash/releases/tag/v0.6.7 ; https://api.github.com/repos/ZimengXiong/ExcaliDash/commits?per_page=1 ; https://excalidraw.com/ ; https://api.github.com/repos/excalidraw/excalidraw/branches/release ; https://registry.npmjs.org/@excalidraw/excalidraw/0.18.0-3c916c5 ; https://api.github.com/repos/excalidraw/excalidraw/compare/4ce8305...3c916c5 .

## Intent

Bring both upstream references current: confirm ExcaliDash is already current and update the independently pinned Excalidraw editor to the current production build, preserving the Sites adapter and verifying integration.

## Non-goals

Publishing, pushing, committing, hosted migrations, database changes, replacement Sites, unrelated dependency upgrades, or importing unsupported upstream backend features. Do not alter generated outputs manually or rewrite historical records. Do not increment ExcaliDash or application versions without a corresponding upstream release.

## Acceptance

- AC-1: Fresh authoritative evidence confirms the latest ExcaliDash release and source revision; unchanged upstream v0.6.7 remains correctly recorded when no update exists.
- AC-2: The frontend resolves exact published editor 0.18.0-3c916c5; its lockfile, integrity, full SHA, production build date and documentation agree, and offline consistency validation passes.
- AC-3: Editor drift/status comparisons remain meaningful for equal/newer/older/different/unavailable builds after fixture updates; build, both TypeScript projects, frontend and adapter tests, public-source checks and frontend lint pass. Root lint is run and any failure must be demonstrated to predate this upgrade in unchanged source/configuration and recorded explicitly; no introduced lint failure is accepted. A local runtime smoke confirms the editor, scene save/reopen, real full-scene/frame export rendering and packaged fonts/assets loading. SVG generation with accented text and a selected frame MUST produce inspectable real SVG bytes with embedded fonts and no subsetting-worker error. Inspecting the generated Blob/SVG at the public browser save boundary is sufficient if native saving is unavailable. Actual downloaded-file capture is attempted and reported separately; canceled or timed-out downloads are not successful file exports.
- AC-4: The final diff preserves the Sites authentication/storage contracts, existing React/package-manager boundaries and upstream attribution; no hosted data or deployment is changed. Independent final review passes.

## Clarifications

- No material human-owned uncertainty remains. The request authorizes updating the repository. Publication is outside this request; docs/UPDATES.md places backup-before-publish at the publication step.
- Excalidraw follows the production build served by excalidraw.com, rather than npm latest (still 0.18.1), according to the existing update procedure.
- The seven-day root pnpm release-age policy remains intact. The independently managed frontend uses its documented npm 10.9.2 procedure; do not change or bypass root policy.
- Verification reassessment: root lint reports 38 existing no-explicit-any errors in server/api.ts and one anonymous-default-export warning in worker/index.ts. Those source files and eslint.config.mjs match HEAD, so unrelated cleanup is excluded and these baseline failures are reported transparently. AC-3 was clarified before final review to require no introduced lint failures while retaining the full root-lint result. All other checks and the browser smoke remain required.
- Runtime verification reassessment: both real scene/frame export previews rendered, but native SVG file saving aborted and scene-download capture timed out, including one browser-capability fallback attempt. No file was captured. Root qualifies the local smoke acceptance to preview/rendering evidence and explicit reporting of download limits; no successful file export is claimed. Fresh final Oracle must independently judge whether that coverage is adequate for this dependency-only change. Source runtime/export code remains unchanged; no export bug fix is included.
- Final-review convergence: the first fresh Oracle returned FAIL because raster previews do not exercise SVG font subsetting required by docs/UPDATES.md step 6 and guarded in frontend/vite.config.ts. Root accepts this blocker and restores explicit SVG/font coverage in AC-3. Smallest remedy: a fresh verification worker inspects actual generated SVG/Blob bytes at the public save boundary, using accented text and a frame, checks embedded font output and console/worker failures, and cleans local QA state. No source changes or broad test reruns are authorized. Stop if bytes cannot be inspected or runtime subsetting fails; then reassess a concrete source defect. Native file delivery remains a separate disclosed limitation.

## Decisions

- Retain ExcaliDash v0.6.7 and revision 0f9be2d8649be7650e6bee2844739c584fa76c35 because both latest release and main match the baseline.
- Pin editor 0.18.0-3c916c5 with full SHA 3c916c58bd219157a3486960f865174468f86eff, production build timestamp 2026-11-04T19:55:10Z and registry integrity recorded above. Stop if live production/release/registry evidence contradicts this target before installation.
- Prefer provenance, fixture and documentation updates. Adapter code changes require a demonstrated compatibility failure and reassessment before expansion.
- Reuse existing behavioral test seams; do not add tests that only repeat version constants. If new adapter behavior becomes necessary, confirm its public seam and follow the installed tdd skill before implementing it.

## Durable deltas

- `MODIFIED editor-integration` **Pinned editor build** — The frontend MUST depend on the exact published editor version `0.18.0-3c916c5`, with full commit, integrity and production provenance recorded in `upstream.json`; offline consistency validation MUST reject disagreement among the manifest, lockfile and provenance.
  - GIVEN the current production editor is `0.18.0-3c916c5`; WHEN the update is installed and built; THEN the exact version and matching full commit/integrity are recorded and the offline consistency check passes.
- `MODIFIED editor-integration` **Editor upstream drift status** — Authenticated users MUST be able to see the built editor version and production drift status through Settings Advanced and the server-side comparison, preserving equal/newer/different/unavailable behavior for the updated pin without browser requests to third-party hosts.
  - GIVEN the pinned editor is `0.18.0-3c916c5`; WHEN excalidraw.com reports a later build with another hash; THEN `/api/system/editor` returns `newer` and Advanced shows an update.

## Plan

1. Accept the completed read-only local and upstream investigations: clean baseline, no ExcaliDash drift, exact independently verified editor target and compatibility delta.
2. A worker owns the cohesive editor upgrade: exact npm 10.9.2 install, upstream.json provenance, version/date fixtures in adapter tests and relevant frontend status fixtures, and current pin documentation in AGENTS.md, docs/UPDATES.md and docs/ADAPTATION.md. Preserve existing dependencies and source behavior. Run existing focused editor/status/consistency checks and review the diff using simplify.
3. After accepting that output, a fresh worker owns consolidated verification against the unchanged source: frozen installs, documented CI checks, both linters, and local preview functional smoke. Generated assets are produced by shipped commands only. Any real compatibility failure returns for reassessment before code changes.
4. Freeze implementation and update this record with accepted evidence; validate through verify, request fresh read-only Oracle final verification, record its validated result, pass closeout, and archive/synchronize the declared canonical deltas.

Risks: frame exports and bindings intentionally change upstream; a source rollback cannot convert saved elements or restore data. The npm package has no gitHead, so provenance is corroborated by the production build, release SHA, version and publishing workflow. Root policy remains unchanged. Existing main/release may advance; accepted targets are bounded to the observed production snapshot. No publication occurs here.

## Tasks

- [x] AC-1: Establish current upstream targets and the integration boundary.
  - Outcome: accepted current revision and compatibility evidence for both upstreams.
  - Known entrypoints and skill paths: upstream.json; docs/UPDATES.md; docs/ADAPTATION.md; .thoth/specs/editor-integration/spec.md; thoth-sdd/SKILL.md.
  - Inputs: user update request and independently observed local/official upstream evidence.
  - Dependencies: none.
  - Output: local clean baseline and authoritative exact target/version/integrity findings recorded above.
  - Owner: explorer and librarian; root accepts their terminal results.
  - Writes: none.
  - Interface boundaries: upstream provenance and existing Sites adapter ownership.
  - Focused check and PASS evidence: offline editor consistency passed at the baseline; remote production/release/registry targets agree; latest ExcaliDash release and main equal the retained revision.
  - Return milestone: both terminal reports accepted before implementation planning.
  - Stop / reassessment: contradictory target evidence, dirty ownership or undocumented compatibility changes.
- [x] AC-2: Install and document the exact new editor with coherent drift fixtures.
  - Outcome: reviewable minimal editor upgrade with focused checks passing.
  - Known entrypoints and skill paths: frontend/package.json; frontend/package-lock.json; upstream.json; tests/adapter.integration.mjs; frontend/tests/settings-advanced.test.tsx; AGENTS.md; docs/UPDATES.md; docs/ADAPTATION.md; C:/Users/EremesNG/.agents/skills/tdd/SKILL.md; C:/Users/EremesNG/.agents/skills/simplify/SKILL.md.
  - Inputs: accepted target 0.18.0-3c916c5, full SHA, production date, integrity and local discovery above.
  - Dependencies: completed AC-1 evidence.
  - Output: exact package/lock/provenance/doc updates and date-comparison fixtures compatible with the new build.
  - Owner: worker.
  - Writes: frontend/package.json; frontend/package-lock.json; upstream.json; tests/adapter.integration.mjs; relevant current frontend editor/status fixtures; AGENTS.md; docs/UPDATES.md; docs/ADAPTATION.md. No historical records/specs.
  - Interface boundaries: editor package/public API, runtime provenance derived from upstream.json, existing React 18 and Sites API contracts.
  - Focused check and PASS evidence: offline consistency, focused editor/status unit tests and adapter harness all pass after the exact install; diff contains no unrelated dependency changes.
  - Return milestone: installed editor, focused checks and simplify review ready for acceptance.
  - Stop / reassessment: new runtime compatibility changes, policy conflict, unexpected lockfile churn or failed existing contracts.
- [x] AC-3: Verify the integrated editor through repository checks and a local functional preview.
  - Outcome: consolidated check evidence and successful save/reopen/export-preview runtime smoke, with baseline lint and file-download limitations explicitly reported.
  - Known entrypoints and skill paths: .github/workflows/sites-ci.yml; package.json; frontend/package.json; scripts/prepare-frontend.mjs; docs/DEPLOYMENT.md; C:/Users/EremesNG/.agents/skills/agent-browser/SKILL.md.
  - Inputs: accepted AC-2 terminal result and frozen updated source.
  - Dependencies: AC-2 accepted and source no longer being edited.
  - Output: actual command outcomes and local editor/asset smoke evidence, or bounded failure details.
  - Owner: fresh worker.
  - Writes: generated/ignored build and local preview state only through shipped commands; no tracked source edits or hosted resources.
  - Interface boundaries: integrated SPA/Worker preview, QA development identity, editor persistence/export, DB/BUCKET emulation.
  - Focused check and PASS evidence: documented frozen installs; public-source/editor consistency; build; root/frontend TypeScript; full frontend/adapter tests; frontend lint; root lint with pre-existing unchanged-source failures explicitly demonstrated; local editor save/reopen/full-scene-and-frame export previews with font/asset requests succeeding; attempted file-download result explicitly recorded.
  - Return milestone: all commands reconciled and preview observations reported.
  - Stop / reassessment: any failing check requiring source changes, inability to exercise runtime smoke or unexpected hosted-resource access.
- [x] AC-3: Verify real SVG generation and embedded-font subsetting at the browser save boundary.
  - Outcome: inspectable real SVG output containing accented text and frame/arrow content with embedded font subset and no subsetting worker error.
  - Known entrypoints and skill paths: docs/UPDATES.md step 6; frontend/vite.config.ts; installed editor public SVG export UI; C:/Users/EremesNG/.agents/skills/agent-browser/SKILL.md.
  - Inputs: accepted raster/persistence smoke and first Oracle FAIL requiring SVG-specific runtime evidence.
  - Dependencies: AC-2 installed exact editor; accepted automated checks and prior local smoke; prior server/browser/QA cleanup complete.
  - Output: actual SVG/Blob byte inspection, embedded font output and console/worker observations, plus cleanup status.
  - Owner: fresh worker.
  - Writes: generated/ignored outputs and temporary local QA/browser state only; no tracked source or record edits.
  - Interface boundaries: normal editor SVG export and public browser file-save boundary; no private editor state or synthetic SVG generation.
  - Focused check and PASS evidence: real generated SVG includes expected content and embedded subsetted fonts; console/network show no worker/wasm/font-subsetting failure. Native file-download delivery remains explicitly separate.
  - Return milestone: actual bytes inspected or bounded blocker established; owned QA/server/browser cleaned before terminal result.
  - Stop / reassessment: inability to capture actual SVG through one bounded new public-I/O approach or an observed runtime font/export defect; no source fix without reassessment.
- [x] AC-4: Freeze the scoped upgrade and prepare its independent verification handoff.
  - Outcome: accepted source/check evidence and a record ready for fresh independent Oracle verification.
  - Known entrypoints and skill paths: this change record; current diff; .thoth/specs/editor-integration/spec.md; installed thoth-sdd and thoth-archive skills.
  - Inputs: accepted AC-2/AC-3 outputs, actual check evidence, reviewed canonical source digest.
  - Dependencies: all implementation and check tasks accepted.
  - Output: completed implementation tasks, frozen scoped diff and verification-ready record. Final Oracle judgment and archive follow this task as explicit workflow gates.
  - Owner: root.
  - Writes: this record only; final read-only Oracle and archive bookkeeping follow under Plan step 4.
  - Interface boundaries: no implementation edits during review; original Site and hosted data untouched.
  - Focused check and PASS evidence: scope review and verify gate pass before fresh Oracle dispatch.
  - Return milestone: independent review can start from frozen implementation and complete check evidence.
  - Stop / reassessment: blockers, stale source/digests, invalid review delivery or unexpected scope.

## Authorization

**Plan review**: OKAY
**Plan review selection**: EXPLICIT_REVIEW
**Implementation**: AUTHORIZED

User explicitly selected Review plan with Oracle, then Implement on 2026-11-07. Fresh read-only Oracle plan-review returned OKAY with no blockers. No native gate verdict was delivered (v2 mailbox); unchanged result passed the installed compact fallback: valid=true, kind=plan-review, verdict=OKAY, record=.thoth/changes/refresh-upstreams-2026-11/refresh-upstreams-2026-11.md, recordSha256=null, recordDigest=none. The review cautions that mocked unit tests must be supplemented with real editor/frame/arrow/font smoke checks.

## Verification

**Reviewer**: oracle
**Independent from implementer**: Yes
**Verdict**: PASS
**Reviewed record SHA-256**: acda2dc9868b3ba36c5fd154661bf213ccb2ec2d17817b9bd6dfb9592372d2f9

**Oracle envelope**:

```thoth-result
{
  "schemaVersion": 1,
  "role": "oracle",
  "status": "complete",
  "conclusion": "PASS. The scoped editor upgrade satisfies the reviewed acceptance criteria; actual SVG artifacts resolve the prior font-subsetting evidence gap.",
  "evidence": [
    {
      "id": "E1",
      "kind": "diff",
      "locator": "git diff HEAD",
      "claim": "Nine-file diff contains the exact editor pin, synchronized dependency changes, provenance, documentation and status fixtures. Runtime source, authentication, storage, build configuration and root dependency files remain unchanged.",
      "basis": "observed",
      "uncertainty": "None material within the reviewed diff."
    },
    {
      "id": "E2",
      "kind": "integrity",
      "locator": ".thoth/changes/refresh-upstreams-2026-11/refresh-upstreams-2026-11.md",
      "claim": "All recorded implementation, canonical-spec and SVG hashes match current bytes. The exact UTF-8 record prefix hashes to acda2dc9868b3ba36c5fd154661bf213ccb2ec2d17817b9bd6dfb9592372d2f9.",
      "basis": "observed",
      "uncertainty": ""
    },
    {
      "id": "E3",
      "kind": "artifact",
      "locator": "frontend/dist/qa-svg-full.svg; frontend/dist/qa-svg-frame.svg",
      "claim": "Both actual artifacts parse as XML and contain accented Spanish text, arrow paths, frame clipping and embedded Excalifont. Each embedded font decodes to 4036 bytes with a wOF2 signature and matching declared length. Full and selected-frame viewBoxes differ appropriately.",
      "basis": "observed",
      "uncertainty": "Independent fontTools decoding was unavailable; successful browser font loading is accepted execution evidence."
    },
    {
      "id": "E4",
      "kind": "accepted-execution-evidence",
      "locator": "Assigned record, Verification",
      "claim": "Frozen installs, build, both TypeScript checks, 279 frontend tests, 29 adapter checks, offline consistency, public-source checks and frontend lint passed. Browser evidence covers save/reopen, real SVG capture at the public save boundary, FontFace.load, SVG image decoding, successful asset requests and no observed subsetting-worker errors.",
      "basis": "inferred",
      "uncertainty": "Execution evidence was supplied and recorded by verification workers; suites and browser smoke were not repeated during this review."
    },
    {
      "id": "E5",
      "kind": "accepted-provenance",
      "locator": "Assigned record, Exploration; upstream.json",
      "claim": "Accepted authoritative research identifies editor 0.18.0-3c916c5 and confirms ExcaliDash v0.6.7 remains current. The manifest, lockfile and provenance agree with that bounded snapshot.",
      "basis": "inferred",
      "uncertainty": "Remote research was accepted from the assignment rather than repeated."
    }
  ],
  "verification": [
    {
      "check": "Scope, contracts and canonical baseline",
      "method": "Reviewed AGENTS.md, installed verify guidance, canonical editor-integration specification and actual nine-file diff; compared protected files with HEAD.",
      "outcome": "pass",
      "evidenceIds": ["E1", "E2", "E5"],
      "reason": "The implementation preserves the declared boundaries and existing contracts."
    },
    {
      "check": "Verification freshness",
      "method": "Recomputed recorded source and artifact SHA-256 values and reviewed accepted command outcomes.",
      "outcome": "pass",
      "evidenceIds": ["E2", "E4"],
      "reason": "Evidence remains applicable to unchanged implementation inputs."
    },
    {
      "check": "Real SVG generation and font-subsetting coverage",
      "method": "Inspected both unmodified SVG artifacts, parsed XML, decoded embedded WOFF2 headers and assessed recorded browser execution.",
      "outcome": "pass",
      "evidenceIds": ["E3", "E4"],
      "reason": "Actual vector output and embedded subset bytes cover the prior blocker; raster previews alone are no longer the evidence."
    },
    {
      "check": "Whitespace",
      "method": "git diff --check",
      "outcome": "pass",
      "evidenceIds": ["E1"],
      "reason": "No whitespace errors reported."
    }
  ],
  "risks": [
    {
      "description": "Native operating-system download delivery remains unverified. Public save-boundary Blob capture proves generated SVG content, but does not establish successful native file delivery.",
      "severity": "low",
      "blocking": false,
      "evidenceIds": ["E3", "E4"]
    },
    {
      "description": "Root lint retains 38 pre-existing errors and one warning in unchanged source/configuration; the repository is not globally lint-clean.",
      "severity": "low",
      "blocking": false,
      "evidenceIds": ["E1", "E4"]
    }
  ],
  "openQuestions": [],
  "nextAction": "Validate this unchanged result, record its matching digest, complete closeout and archive the declared canonical deltas.",
  "review": {
    "kind": "final-verification",
    "verdict": "PASS",
    "reviewedRecord": ".thoth/changes/refresh-upstreams-2026-11/refresh-upstreams-2026-11.md",
    "reviewedRecordSha256": "acda2dc9868b3ba36c5fd154661bf213ccb2ec2d17817b9bd6dfb9592372d2f9"
  }
}
```

- AC-1: PASS | official upstream observations and local discovery | latest ExcaliDash unchanged; editor target production/release/registry agree as recorded in Exploration.
- AC-2: PASS | exact npm 10.9.2 install; node scripts/check-editor-upstream.mjs --offline; four focused editor/status Vitest files; adapter harness; simplify/diff review | provenance, lock integrity and production build agree; 50 unit tests and 29 integration checks passed. Existing adapter assertion was observed RED against the old pin before the install. Files changed: AGENTS.md, docs/ADAPTATION.md, docs/UPDATES.md, frontend/package.json, frontend/package-lock.json, frontend/tests/settings-advanced.test.tsx, frontend/tests/i18n-settings.test.tsx, tests/adapter.integration.mjs, upstream.json. Only five synchronized editor package entries, mermaid-to-excalidraw and pele changed in the lockfile; runtime adapter/auth/storage code unchanged.
- AC-3: PASS | consolidated checks and qualified real-browser smoke | frozen installs, build, both TypeScript projects, 279 frontend tests/14 files, 29 adapter checks, 609-file public-source check, exact offline consistency and frontend lint passed. Root lint has 38 errors/one warning in source/config identical to HEAD; root package/lock are also unchanged. Integrated localhost:5173 Settings showed editor 0.18.0-3c916c5 and app 0.6.7. UI-created frame/arrow/accented text persisted and survived hard reopen with frame bindings intact; a 409 save conflict recovered through GET/retry PUT 200. Full-scene preview 518x253 and selected-frame preview 518x224 rendered nonblank content. Five local Assistant/Excalifont font responses were 200, document.fonts.status=loaded, no observed script/style/asset failure. Actual scene/SVG downloads were NOT captured: native picker AbortError/cancel, then one capability fallback timed out. Owned QA drawing deleted (DELETE 200, subsequent GET 404); browser/dev server closed and port 5173 no longer listening. No source edits by the verification worker.
- AC-4: PASS | fresh independent Oracle round 2 and matching record digest | actual nine-file diff, source/spec/SVG hashes and export artifacts independently reviewed. No blocking risks remain. Native OS download delivery and existing root-lint failures remain explicitly disclosed limitations.
- Final result validation: no native gate verdict was delivered (v2 mailbox); unchanged final Oracle result passed the installed compact fallback with valid=true, kind=final-verification, verdict=PASS, mode=record, assigned record path, recordDigest=match and recordSha256=acda2dc9868b3ba36c5fd154661bf213ccb2ec2d17817b9bd6dfb9592372d2f9. Root independently hashed the exact prefix before Authorization and matched that digest. No pre-Authorization edits followed this PASS.
- Check note: ambient npm 12 did not forward the offline flag reliably; the direct Node invocation above supplies the actual offline evidence. Consolidated verification must use npm 10.9.2 or direct Node for this check.
- Dependency audit note: the install reported eight findings; all named package entries are unchanged from baseline HEAD, and none names changed packages. No audit-fix or unrelated dependency update was performed.
- Consolidated checks so far: frozen root/frontend installs PASS (frontend 471 packages); public-source PASS (609 files); direct offline editor consistency PASS; pnpm build PASS; both TypeScript checks PASS; frontend 279 tests in 14 files PASS; adapter 29 checks PASS; frontend lint PASS. Root lint fails with 38 baseline errors plus one warning in unchanged server/api.ts/worker/index.ts with unchanged eslint.config.mjs. Browser smoke remains pending; passing checks are not repeated without changed inputs.
- Final handoff: implementation and verification workers are terminal, all tracked implementation inputs are frozen, nine-file scope and whitespace reviewed by root, source digests recorded below, local QA data/browser/server cleaned. Earlier pending-browser note is superseded by AC-3 evidence above. AC-4 scope/freeze preparation is complete; its independent acceptance judgment remains pending below.
- First final review: FAIL, reviewed prefix SHA-256 2edf691d22c29a98a747b4c92768ad5324974a688d6f54d7f33f2c0a12b5e7f9. Scope/provenance/automated checks accepted; blocking gap is real SVG generation/font-subsetting evidence. AC-3 and handoff task reopened for the focused remedy above; prior PASS evidence remains valid on unchanged implementation. No final PASS or archive is claimed.
- SVG convergence evidence: a fresh verification worker used normal Export image -> Export SVG UI and intercepted only public window.showSaveFilePicker with an in-memory writable to capture the actual editor-produced Blob. Full SVG 7,664 bytes (viewBox 0 0 710 280.5) and selected-frame SVG 7,200 bytes (viewBox 0 0 690 240; Solo seleccionados checked) parse without XML errors and contain accented Spanish text, frame/arrow paths and clipPath. Both embed Excalifont via @font-face with data:font/woff2; the 4,036-byte subset has a valid wOF2 signature versus 24,956-byte source font, and FontFace.load succeeded. Captured selected-frame SVG Image.decode succeeded at 690x240. Font/subset worker/shared/helper requests were 200; no page error, subsetting-worker failure, document-is-not-defined or WASM failure was observed, only successful worker-pool debug messages. This resolves the first Oracle's concrete blocker; fresh independent review is still required.
- Runtime artifact: frontend/dist/qa-svg-full.svg | sha256:7673770128c60f8e1fa60d758febcd44ee4e284ec4fcce2dcaf2a7cfe493f894 | unmodified actual editor-generated bytes, ignored output.
- Runtime artifact: frontend/dist/qa-svg-frame.svg | sha256:01ca7b01eac384c6ac883ba0f7f3eb57d9338ade33291b8cb093d1454d90853f | unmodified actual editor-generated bytes, ignored output.
- Convergence cleanup/freeze: owned QA drawing deleted (DELETE 200, following GET 404), browser and server closed, port 5173 no longer listening. All nine source hashes still match; no source edits or repeated full suites. SVG and handoff-preparation tasks are complete. Native OS file-delivery remains unverified and is not represented as a successful download.
- Source: .thoth/specs/editor-integration/spec.md | sha256:fb6a93718395bd80b86f7335ce2b266817c0f99076a4479c2b73f758a336c2ca
- Source: AGENTS.md | sha256:8696300eff3a6413938e6c79e5a240054c1d645734591d888fe5e52583631d63
- Source: docs/ADAPTATION.md | sha256:a38effabe8470726f6dc25d8bef5e0106397a1b58a26583003c58b6cacc42028
- Source: docs/UPDATES.md | sha256:05ef167cc38b9335fd380854c5e0b2a259089bcaf203ba51eab8d925b3beaece
- Source: frontend/package.json | sha256:ed2aacbd8f36a51f1851d5f6718ed20d6e6172556cdb0634b5edfd4f02fdfe84
- Source: frontend/package-lock.json | sha256:a307d86685eaaa554edbce369d695f54770fdb51ee90b4f6178dd48c3902e0e0
- Source: frontend/tests/settings-advanced.test.tsx | sha256:f2df5e0bef258be26e439f46fe9e458dd35c472577591056a0f05d7fad55b466
- Source: frontend/tests/i18n-settings.test.tsx | sha256:2fd80eae212817e98e0468a03008b8c347c88809b0cc36f490e58956125ec236
- Source: tests/adapter.integration.mjs | sha256:088e09064df6bc80383f12c525c9c9fe1908683b4e30dde3467ca7b177a92dff
- Source: upstream.json | sha256:0b984f6004e55ad53b79d4cdebc61b66916b1c03d2b20c54323c1cfd55f17ee7

## Closeout

**Archive**: READY

All requested repository updates and accepted checks are complete. No commit, push, hosted migration or publication occurred. Local QA state and owned runtime processes were cleaned; generated export artifacts remain ignored.
