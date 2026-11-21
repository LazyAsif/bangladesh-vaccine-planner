# v1.2 Deployment Instructions

Use the **Changed Files** ZIP: drag `site/` and `CHANGELOG.md` to the repository ROOT (not inside an extra folder). Commit to `main` with message `Release candidate: Child Vaccine Planner v1.2`. Cloudflare Pages uses build output directory `site`.

**Important:** The repository previously contains `site/changelog/index.html`. GitHub browser uploads do **not** delete old repository files. To hide that public development-history page, manually navigate to `site/changelog/index.html` on GitHub, select Delete file, and commit the deletion. The navigation links and visible version labels are removed with v1.2 regardless. If not deleted, the old URL remains publicly accessible and potentially indexed.

**After deployment:** Verify no public footer displays versions or content-checked text, check private centre division/district filters, click telephone links, switch Government and confirm DGHS links, test Android offline mode and dark/light mode; preserve users' localStorage data.

**Source verification:** Private entries based on provider official pages, reviewed 2026-11-21. Do not label this shortlist a complete national directory. Confirm clinic hours and vaccine stock before travel.
