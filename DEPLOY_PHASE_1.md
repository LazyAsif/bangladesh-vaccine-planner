# Phase 1 · Owner deployment and rollback guide

This local corrective candidate awaits owner review. `Child_Vaccine_Planner_v2_Phase1_Changed_Files.zip` overlays the v1.10 project. `Child_Vaccine_Planner_v2_Phase1_Complete_Project.zip` contains the full updated source. Retain the original v1.10 archive separately for rollback.

## Review the package

| Paths in the changed archive | Purpose |
|---|---|
| `site/index.html` | Single-child planner integration, verified status, DOB editor, property-based calendar links and backup panel |
| `site/assets/backup-v1.js`, `site/assets/backup-v1.css` | Local storage and backup implementation, bilingual interface and scoped responsive styling |
| `site/service-worker.js` | Updated chart and directory shell, offline index aliases and unavailable-page handling |
| `tests/backup-phase1.test.mjs`, `tests/engine-baseline.mjs`, `tests/v1.10-engine.json` | Synthetic storage tests, v1.10 engine runner and pre-change expected results |
| `tests/browser-phase1.mjs` | Isolated Chromium integration test |
| `CHANGELOG.md`, `QA_REPORT_PHASE_1.md`, `DEPLOY_PHASE_1.md` | Release history, test evidence and owner instructions |
| `functions/robots.txt.js`, `functions/sitemap.xml.js`, `DEPLOY_v1.1.md`, `DEPLOY_v1.2.md` | Existing project files absent from the supplied v1.10 ZIP. Included so applying the overlay reconstructs the complete project. These four files received no corrective edits. |

Extract locally with relative paths intact. In the repository root, `site/`, `functions/` and `tests/` are siblings. Never upload a ZIP containing child records. Use the synthetic test commands in the QA report for package checks.

## Record handling

1. The owner or caregiver controls all personal backups. In v1.10 use **Export my local record** and retain the downloaded file somewhere private before updating. The browser cannot confirm that a download was retained.
2. Close other planner tabs and installed windows, then tick the acknowledgement before replacing an existing record. Phase 1 writers cooperate through a Web Lock. A v1.10 window can still overwrite v4. Without Web Locks, restore and deletion are disabled. Ordinary edits compare storage snapshots and verify the write.
3. Select a JSON backup to preview. The limit is 1 MiB. Compare both records, expand **All stored fields**, and use the current-copy download before confirming a replacement. A valid fallback or damaged raw copy can also be downloaded separately. The raw recovery text preserves the stored contents for inspection. Unsupported formats require separate review.
4. If an unsubmitted name/DOB form is open, Cancel keeps the text in the form. Discarding it requires a separate acknowledgement. A saved-record backup contains the saved record only. After a rejected dose date, both status areas and a field-level message explain that the accepted value was restored.
5. The confirming tab verifies a recovery copy in sessionStorage before writing the primary record. It retains the intended payload and the expected primary value across reloads. If that preparation fails, replacement stops. If the primary changes externally, close the older windows, download the intended copy, compare both records, and explicitly choose which to keep. A different incoming file requires resolving the existing recovery conflict first. The application never automatically reapplies the intended copy.
6. The tab-session copy contains private child data. Download it before closing the tab, clearing site data, uninstalling or rolling back. **Release this recovery copy** explicitly removes it from that tab. A later confirmed restore replaces that tab’s recovery copy. Explicit deletion clears both legacy keys and the current tab’s recovery copy. Other open tabs can retain their own copies. If save/read-back fails, keep an export and verify storage before retrying.
7. To correct DOB, open **Edit**, optionally back up and confirm the old and new dates. An unchanged name is preserved from the record, even if a single-line input cannot represent it. The exact original is shown in that case. Review recalculated plans and warnings.

## Manual GitHub upload after release approval

1. Record the known-good v1.10 commit or keep a verified complete v1.10 archive. Review the changed-file inventory and the outstanding device checks with the owner.
2. The owner manually uploads the **extracted files** at repository root and checks the paths in the GitHub diff. Commit all runtime files together so the homepage, required resources and worker agree. Use the existing Cloudflare Pages project settings: repository root, framework None, empty build command and static output `site`.
3. For the homepage spacing update on the existing `v2-phase1-preview` branch, use `Child_Vaccine_Planner_v2_Phase1_Button_Spacing_Changed_Files.zip`. After the owner's commit triggers Pages, open the planner online first and verify worker cache `bd-child-vax-public-phase1-r3`. Close and reopen the installed app online before the offline check.
4. On an isolated test profile, confirm a synthetic raw backup can be previewed, cancelled, restored and exported again. Verify offline restart and the existing accordion on narrow screens. The QA report identifies the outstanding physical-device and production HTTPS checks.

## Rollback

The owner can revert the complete Phase 1 release commit on GitHub, or manually restore the known-good v1.10 source as a new reversing commit. Reopen online after Pages finishes. The earlier worker can activate and reclaim its public cache. Keep browser site data intact throughout.

v1.10 can read the restored single-child payload at `vax-combined-blank-v4`. Phase 1 stores the envelope in the downloaded file only. The legacy v3 key survives a restore. Explicit deletion removes both keys.

**A code rollback cannot recover a record that a caregiver deliberately replaced.** To recover the previous record, use its retained pre-replacement backup in a restore-capable build on the same origin before rolling back, or follow the owner's separately approved recovery procedure. v1.10 has no import action. Clearing storage, uninstalling the PWA or switching to a different origin can make local records unavailable.

