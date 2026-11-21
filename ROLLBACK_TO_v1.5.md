# Restore Child Vaccine Planner v1.5

1. **Before deploy:** Export child vaccination data locally from the existing application. Never upload this personal export to public GitHub.
2. In GitHub open `LazyAsif/bangladesh-vaccine-planner` → **Commits**. Find the last verified v1.5 commit. Use GitHub’s revert workflow for the v1.6 commit (preferred) or restore that commit’s `site/` and config files through git locally.
3. Cloudflare Pages automatically redeploys the reverted `main` commit. Verify the old v1.5 UI and local records.
4. A ZIP of the exact v1.5 release is preserved separately as `Child_Vaccine_Planner_v1.5_Rollback.zip` beside this release.
5. Do not clear site data/cache/storage merely to force an update. Uninstall/reinstall can remove local child records. If there is a safe export, retain it before any destructive troubleshooting.

**Important:** GitHub rollback should revert the complete site, not just CSS. Never restore a ZIP into an extra parent folder; project root contains `site/` and `functions/`.
