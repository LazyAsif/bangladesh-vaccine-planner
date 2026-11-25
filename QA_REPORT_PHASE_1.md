# Phase 1 corrective QA · 25 November 2026

**READY for owner release review.** The final local run passed 10 Node tests and the Chromium integration suite. All data was synthetic. No production or remote repository was accessed.

## Baseline and method

The archived release used for upgrade and overlay verification was `Child_Vaccine_Planner_v1.10_Complete_Project.zip`. Its SHA-256 digest is

```text
0664a2852bca39eab1c2c9af0931dbcad1e42d4fae465b59a2f924762ffe8336
```

Node ran the original engine from the extracted archive and compared it directly with the six frozen fixtures (16, 14, 16, 16, 15 and 16 rows). The corrected engine and the restored/reloaded records each matched the same 93 expected rows, including date order, baseline, earliest and effective dates, date sources, visibility and warning text.

The browser runner used headless Chromium, a fresh temporary profile, a local HTTPS server and a temporary self-signed certificate accepted only by that test browser. It first served the actual v1.10 files and retained a live v1.10 page. It then served the corrective candidate on the same origin. Offline tests refused network requests at the server. Native installation and production hosting were outside this test.

## Corrections and observed results

| Area | Passed checks |
|---|---|
| Rejected administration/confirmed dates | Chromium rejected a five-digit year in each field. The visible value returned to the accepted date. Both languages showed the adjacent alert linked to the input. The backup and chart messages agreed. An accepted subsequent edit and quota-error retry were exercised. |
| DOB-only correction | A name containing Bangla, an apostrophe, CRLF, a tab and markup-like text was safely displayed and preserved exactly. Cancel wrote nothing. Confirmation retained clinical maps and products. |
| Unsubmitted form | With a changed name and DOB, closing the preview with Cancel kept both fields and made zero storage writes. Restore remained disabled after old-tab acknowledgement until the separate form-discard option was selected. |
| Legacy recovery and fidelity | Opened valid v3 under malformed v4; prevented ordinary edits until recovery; rejected duplicate JSON; exported through the real download action, selected the file, restored and reopened a fresh document. Canonical payload equality included explicit false, hidden IDs, unknown administration date and distinct actual/confirmed dates. |
| Failed writes | Fault injection covered denied writes, unreadable/mismatched read-back, stale snapshots and retry. A failed tab-session preparation or stale preview produced no primary-record write. Chromium also simulated unavailable sessionStorage and verified that the existing v4 value survived. |
| Older writer | After a verified restore, a real v1.10 tab deliberately saved its stale chart. The new tab warned immediately. The recovery copy survived reload and exported the exact intended payload. The old writer's value stayed in v4 until a newly acknowledged, explicitly confirmed restore. |
| Concurrent Phase 1 writers and unsupported browsers | A second Phase 1 tab invalidated the preview; a stale ordinary save could not overwrite the newer value. With Web Locks removed, preview and export worked and restore/deletion stayed disabled. |
| PWA upgrade and navigation | Updated from the archived v1.10 worker to `bd-child-vax-public-phase1-r2`; verified preceding cache cleanup and presence of the new script. Opened both actual mobile directory links offline before visiting those pages. Centres and Articles displayed their own content. An uncached index path returned an explicit offline message. The chart reopened offline and completed a verified restore. Both directories also opened online. |
| Mobile, accordion and appearance | 320, 360, 390, 393, 412, 540, 767 and 768 CSS pixels × Bangla/English × Light/Dark produced 32 passing checks. The restore comparison stayed visible, the document had no measured horizontal overflow, and the expanded first-cell overlap check passed below 768 px. |
| Validation and data boundaries | The original test suite still covers both storage keys independently, legacy/raw and enveloped JSON, invalid calendar days and types, duplicate member detection, unsupported fields, unsafe property names, numeric fidelity, 1 MiB size limits and read-only preview. |

## Repeat the tests

Use Node 24 and an installed Chromium browser. Set `CVP_V110_SITE` to the **site directory of a separate extracted v1.10 archive**, then run:

```powershell
node --test tests/backup-phase1.test.mjs
node tests/browser-phase1.mjs
```

The browser test supports `CVP_TEST_BROWSER` for an alternate Chromium executable. By default it uses loopback HTTP and explicitly registers the test worker. With `CVP_TEST_PFX` set to a base64-encoded passwordless temporary **test** certificate, it runs on loopback HTTPS. Without `CVP_V110_SITE`, the archive-only engine check is skipped and the browser suite uses a synthetic predecessor. The final reported run supplied the archive and test certificate. Windows sandbox restrictions initially blocked Chrome's helper; the final runs used an isolated browser with permission.

## Package checks

The changed archive contains the byte differences and missing files relative to the original ZIP. This includes the two pre-existing Pages Functions and two historical deployment notes absent from that ZIP. The complete archive contains the project and synthetic fixtures. Each archive entry was extracted and compared against workspace bytes. Applying the changed archive to a disposable extraction of the v1.10 ZIP reproduced the complete project file set. See the deployment guide for inventory and rollback.

## Remaining risks and checks

- Old JavaScript can still overwrite v4. The owner must accept the close-other-windows procedure and the recovery workflow. The app cannot detect every still-open legacy window before it writes.
- The recovery copy contains private child information in this tab’s sessionStorage. It survives ordinary reloads. Closing the tab, losing the session or clearing browser data can remove it. Export to a private location for longer retention. The browser cannot verify that a download was kept.
- Physical Redmi 13C, physical iPhone/Safari, native installed-window UX, large system fonts, assistive technology, hosted Cloudflare routing and production rollback were not tested. The owner controls all release and device testing.
- Final automated failures or skipped tests in the archive-enabled run: zero.

