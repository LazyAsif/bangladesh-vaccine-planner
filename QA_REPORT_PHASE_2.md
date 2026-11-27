# Phase 2 local QA report

**The mobile UX update passed local regression.** The Node run passed 15 tests with zero failures or skips. The final end-to-end Chrome run passed eight scenario groups. All records, backup files and injected storage faults used for testing were synthetic.

## Environment and baseline

Windows, Node 24.21.0 and headless Chrome 158.0.8127.38. The browser harness used loopback HTTPS, an ephemeral certificate, an isolated browser profile and local download storage. Offline checks disconnected the local origin. The rollback test switched the code served at that same origin.

The retained `.qa-phase2-baseline/` contains the 48 site files from the released Phase 1 complete source plus the responsive r3 update. Compared with the prior Phase 2 preview, the clinical definitions and the function producing every vaccine-details paragraph are identical after line-ending normalization. The archived v1.10 engine independently reproduced the 93 frozen rows.

## Mobile UX checks · 27 November 2026

Both owner-supplied reference screenshots were inspected before editing. In the prior 390 × 667 layout the full profile action group occupied 163 px on the homepage. The fixed bottom navigation used z-index 1200, above the details overlay at 50. The entire dialog scrolled, including its close control.

| Check | Observed result |
|---|---|
| Long details | PASS in 12 combinations. Tested the four-vaccine details for the six-week row at 320 × 440, 390 × 667 and 667 × 375, each in Bangla and English and both themes. The short portrait and landscape cases used 150% root text size. Chrome emulated 14 px top and 24 px bottom safe areas. The complete rendered information matched the details generator. At the end of the independent scroll area the last paragraph was inside the viewport and received the hit test. |
| Dialog behavior | PASS. The native modal held initial focus on Close, prevented focus moving to the background selector, kept its heading and 44 px Close control visible, locked background scrolling, and restored focus and scrolling after button or keyboard Escape dismissal. |
| Navigation | PASS. The fresh homepage exposed first-child setup. The compact selector sat immediately before the chart. Desktop, tablet and mobile Menu/More links opened My Children and Backup & restore. Switching from the chart and managing children in the dedicated view both used the existing data controller. The unsaved switching, migration and backup assertions below passed through the updated routes. |
| Offline navigation | PASS. With the local server disconnected, the mobile Articles More link opened My Children, and Backup & restore opened from there. |
| Existing Phase 2 preview | PASS. Served the r1 public site from the previous complete ZIP on loopback, created a synthetic family, then activated the r2 worker on the same origin. The first offline reopen retained the exact serialized family and opened My Children. |

The focused test initially checked raw HTML serialization and its first hit-test point could fall outside the scrollport for a very tall paragraph. It now compares normalized DOM content and measures the end of the paragraph. Headless Chrome did not activate the requested standalone display mode via media emulation. Installed-device display and physical browser chrome remain owner checks.

## Executed checks

| Area | Result and evidence |
|---|---|
| Legacy migration | PASS. Both valid conflicting candidates were offered. Preview and Cancel produced zero storage writes. Damaging v4 left v3 available. Confirm preserved the selected original payload, including the name's whitespace, timestamp, hidden rows, false flags, completion without an actual date, products and distinct actual/clinician dates. The original sources were retained. Reload kept one migrated child. A simulated legacy write in an older tab surfaced a discrepancy. |
| Profile lifecycle and isolation | PASS. A second child received a new ID, independent empty maps and default products. Editing its completion, actual date, clinician date and rotavirus product left the first record deep-equal. Switching, renaming and DOB correction were exercised through the UI. A corrected DOB flagged earlier recorded dates. Targeted deletion retained the other record. Deleting the final child persisted an empty map and null selection. |
| Unsaved switching | PASS. Cancel kept the form text and caused zero writes. Discard switched while retaining the previous saved record. A simulated quota failure during Save kept the original active child and draft, showed a write error, and allowed verified Save and switch after retry. |
| Family and child files | PASS. Downloaded actual files from the app. Family replacement preview offered a current copy and listed the incoming children. Cancel wrote nothing. Confirm and reload reproduced all profile records, IDs and active selection, with a fresh revision. Importing an individual backup, a Phase 1 envelope and raw JSON created separate IDs even when identities matched. |
| Validation and recovery | PASS. Unit tests rejected unknown fields, duplicate JSON members, unsafe keys, invalid dates, invalid family metadata and oversized input. Browser file rejection retained storage. A damaged family offered recovery. Failure to verify a tab-session checkpoint prevented replacement. An injected read-back mismatch showed an error and left the intended family downloadable after reload. |
| Conflict and lock handling | PASS. A second Phase 2 tab changed the family during preview and blocked confirmation on the stale tab. Unit tests covered exact snapshot conflicts, unreadable storage, quota and verification failures. With Web Locks explicitly absent in Chrome, Add was disabled and family export stayed available. |
| Vaccination schedules | PASS. Six fixture cases covering 93 rows matched the frozen dates, baseline and earliest dates, dose visibility, source and warnings after family backup and selection. Historical single-record backup tests also matched the frozen rows. |
| Responsive layout | PASS. Measured 320, 360, 390, 393, 412, 600, 767, 768 and 1280 CSS px, each in Bangla and English, Light and Dark. All 36 combinations passed page overflow, profile control separation and minimum height checks. The expanded mobile timeline passed its overlap check. Visible identity-form actions retained a 14 px gap, 44 px minimum height and text within bounds. They filled the form width through 600 px. |
| PWA and calendar | PASS. Upgraded the released Phase 1 r3 worker to Phase 2 r2. Checked the three profile assets in the precache and an actual ICS download containing the selected child's schedule. After disconnecting the origin, a new tab reopened the correct active child's chart and loaded the Centres and Articles landing pages. |
| Rollback safety | PASS. Served the verified Phase 1 r3 fixture on the same origin and activated its worker. Phase 1 showed its legacy identity. Returning to Phase 2 restored the selected child's view. The entire serialized family and both legacy values matched their pre-rollback strings. |

## Commands and test history

- `node --test tests/backup-phase1.test.mjs tests/profiles-phase2.test.mjs` — 10 Phase 1 tests and 5 Phase 2 tests passed. `CVP_V110_SITE` pointed to a temporary directory containing only the archived public v1.10 `index.html`.
- `node tests/browser-phase1.mjs --phase2 --continuity-only` — the focused Web Locks, calendar, offline and rollback checks passed.
- `node tests/browser-phase1.mjs --phase2 --ux-only` — all 12 dialog combinations and the first-child, adjacent selector, menu and offline cross-page checks passed.
- `node tests/browser-phase1.mjs --phase2` — all eight scenario groups passed on the final integrated run, including all 36 responsive combinations and the Phase 1 rollback and re-upgrade.

For a browser rerun, set `CVP_PHASE1_SITE` to the absolute path of `.qa-phase2-baseline`. Set `CVP_TEST_PFX` to the base64 encoding of an ephemeral, empty-password PKCS#12 certificate for loopback HTTPS. The harness locates Chrome locally or accepts an executable path through `CVP_TEST_BROWSER`. It creates its own test profile. Keep certificates, downloads and browser profiles outside release files.

## Changed-file inventory

This UX revision edits nine files from the prior Phase 2 package: `site/index.html`, `site/assets/ui-v1.6.js`, `site/assets/profiles-ui.js`, `site/assets/profiles-v1.css`, `site/service-worker.js`, `tests/browser-phase2.mjs`, `CHANGELOG.md`, `QA_REPORT_PHASE_2.md` and `DEPLOY_PHASE_2.md`. The cumulative changed archive contains the following 14 files relative to the released Phase 1 r3 baseline. The complete project also includes the two supplied images in `design-references/`.

| Repository-relative path | Change |
|---|---|
| `site/index.html` | Integrated the profile manager and selected-child chart adapter, protected detached row controls and removed child-identifying details from calendar links. |
| `site/assets/backup-v1.js` | Exposed the existing strict parser, field checks and legacy snapshot check for reuse. |
| `site/assets/profiles-v1.js` | Added the family schema, strict backup formats, ID creation and verified commits. |
| `site/assets/profiles-ui.js` | Added bilingual profiles, migration, drafts, confirmation, backup and recovery controls. |
| `site/assets/profiles-v1.css` | Added responsive, theme-aware profile controls. |
| `site/assets/ui-v1.6.js` | Added My Children and Backup & restore to the shared header and mobile More navigation, including links from secondary pages. |
| `site/assets/ui-v1.7.js` | Reset per-row accordion state when the displayed child changes. |
| `site/service-worker.js` | Revised the offline shell and limited runtime cache writes to known public paths without query strings. |
| `tests/browser-phase1.mjs` | Extended the isolated browser harness to serve Phase 1 and Phase 2 at one origin. |
| `tests/browser-phase2.mjs` | Added Chromium profile, file, responsive, offline and rollback scenarios. |
| `tests/profiles-phase2.test.mjs` | Added family persistence, format validation, recovery and engine-parity tests. |
| `CHANGELOG.md` | Recorded the local Phase 2 candidate. |
| `QA_REPORT_PHASE_2.md` | Recorded test evidence, inventory and limits. |
| `DEPLOY_PHASE_2.md` | Added the owner preview, release, backup and rollback procedure. |

## Release limits

Physical Android/iPhone installation, Safari/WebKit, assistive-technology use, hosted Cloudflare behavior, real-device quota limits and production migration were not exercised. The layout results are browser emulation. Confirm physical-device and hosted behavior during owner preview UAT.

The origin's storage quota can prevent a write below the 8 MiB file limit. Web Locks coordinate participating family writers. An older Phase 1 window still has access to the legacy keys. A session checkpoint can disappear when its tab closes. Keep and independently verify a downloaded family backup before replacement or rollback. The released Phase 1 UI cannot display Phase 2 children.
