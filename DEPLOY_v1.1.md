# Child Vaccine Planner v1.1 — GitHub Deployment

1. Back up any vaccination records using the live planner export feature before testing.
2. Download/extract the v1.1 ZIP.
3. Open the `bangladesh-vaccine-planner` GitHub repository root.
4. Add file → Upload files, drag the `site` directory and `CHANGELOG.md` (optionally `README.md`) from the extracted project root. **Do not upload the parent `Child_Vaccine_Planner_v1.1` folder.**
5. Verify paths start `site/index.html`, `site/centres/index.html`, `site/assets/theme.js`, `site/assets/theme.css`, `site/assets/centres.js`, `site/service-worker.js`, `CHANGELOG.md`.
6. Commit to `main` with `Release candidate: Child Vaccine Planner v1.1`. Cloudflare Pages automatically redeploys.
7. In a fresh browser window, verify theme preference, navigation, and standalone PWA hides Install App. Test offline loading after first online visit.
8. Verify vaccine calculations and stored data are unchanged. If an older cached PWA is served, close/reopen after an online visit; do not clear storage before backing up.

## Centre directory limitations
Includes 8 divisions, 64 districts and links to DGHS Facility Registry / EPI microplanning. It does not contain the complete verified individual government EPI center listing or telephone numbers. DGHS facility presence does not guarantee a currently active vaccination service. For full records obtain approved machine-readable export, validate sites/sessions/contacts and record last verification date.

## Status
v1.1 is a release candidate until the GitHub commit, Cloudflare deployment and device tests are completed.
