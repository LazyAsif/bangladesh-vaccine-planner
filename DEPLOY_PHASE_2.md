# Phase 2 owner deployment and rollback guide

This is a local review candidate for the released Phase 1 project with the homepage spacing update. The baseline worker uses `bd-child-vax-public-phase1-r3`. The final navigation update uses `bd-child-vax-public-phase2-r3`.

## Review and preview

1. Retain the current production revision, its complete source and the Phase 1 spacing update as the rollback target. The Phase 1 complete ZIP alone has the earlier r2 worker.
2. Independently review the 17 files in `Child_Vaccine_Planner_v2_Phase2_Changed_Files.zip` against the inventory in `QA_REPORT_PHASE_2.md`. This cumulative archive also updates the previous Phase 2 preview. The complete ZIP includes the Phase 1 fixture under `.qa-phase2-baseline/` and the two owner-supplied design references outside the public site.
3. When ready, the owner creates `v2-phase2-preview` from the current production `main` and manually uploads the changed files at their existing repository-relative paths. Keep `site/`, `tests/` and the root Markdown files in their respective locations. Keep the existing Cloudflare Pages configuration with `site/` as the public output and keep the existing Pages Functions.
4. On the resulting preview, open the planner online. Check that the new worker activates and all three `profiles-*` assets load. Test a normal browser and an installed PWA. Use the same preview origin for migration, reload and offline checks. Production and preview origins have independent browser storage.
5. With synthetic records, cancel a migration, then confirm it. Compare the full imported record, including false completion flags, completed doses without actual dates, hidden doses and clinician dates. Create another child, change a product, switch back, and inspect both records. Test Save, Discard and Cancel on an unsaved name or DOB change.
6. Download a family backup and an individual backup. In a separate disposable browser profile, restore the family, reload, and verify both children and the selected child. Import the individual copy and verify that the additional child has a separate history. Check Bangla/English, Light/Dark, narrow phones, and an offline reopen. A successful download alone cannot establish that a usable file was retained.
7. For any owner-authorized migration involving personal records, keep the files under the caregiver's control on their device. Close older planner tabs and installed windows. Take a Phase 1 backup, inspect the migration preview, and verify a new family backup. Keep records out of GitHub, public Pages files, issue reports and screenshots.
8. After preview acceptance, the owner reviews the pull request, approves the release and manually merges into `main`. Repeat the worker, migration, backup and offline smoke checks on production with a synthetic profile. Keep the previous release available until those checks pass.

## Data recovery

- Phase 2 stores the family in `cvp-profiles-v1`. Migration reads `vax-combined-blank-v4` and `vax-combined-blank-v3` independently and retains both. An old Phase 1 window can still edit its legacy record. Review any reported discrepancy before importing another copy.
- Family restore replaces the whole family in one verified write. Back up the existing family and check the incoming list and active child. Individual import adds a child even when name and DOB match.
- If a write fails, keep the draft, download an available copy and address storage access or quota. After a conflict or uncertain write, inspect or export the visible copies before reloading the saved family. A surviving tab-session replacement copy can be downloaded from the profile panel. The session copy may be lost when the tab closes.
- For a damaged family, download the original stored copy before choosing a validated family backup or a legacy source. If damaged text contains isolated UTF-16 surrogates, the recovery download preserves the original string under `raw` in an `.escaped.json` file. Keep that file for recovery analysis.
- The data belongs to this browser and origin. Keep an independent family backup in private storage. Legacy and individual imports are limited to 1 MiB, family imports to 8 MiB. Browser quota can be smaller. A secure context with Web Locks is required for verified family writes.

## Rollback

1. Before changing site code, close competing windows and export the latest Phase 2 family wherever profiles have been created or edited. Verify the backup in an isolated Phase 2 browser profile. Each device and browser needs its own backup. An operator cannot centrally back up caregivers' local records.
2. The owner restores the **entire released Phase 1 r3 site revision** through the existing manual release process. A partial mix of HTML, worker and assets can leave an inconsistent offline app.
3. Reopen online. Verify the r3 worker and the Phase 1 single-child screen. **Phase 1 can show its legacy record only. Newly created Phase 2 children and later family edits are invisible to Phase 1.** A code rollback cannot recover a family that was previously replaced or deleted.
4. Preserve all three storage keys. Clearing browser or site data can erase the family's only local copy. If the legacy view is empty, retain the family backup and use a compatible Phase 2 build to review it.
5. When returning to Phase 2, reopen online, confirm the Phase 2 worker, inspect the selected child and compare the family to the verified backup. Restore only after preview and confirmation if recovery is necessary. Any interim changes made with Phase 1 remain in the legacy sources and require separate review.
