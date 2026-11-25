# Child Vaccine Planner v1.10 — Deployment & Rollback

## Upload
1. Download the **Changed Files Only** ZIP and extract it.
2. Upload `site/`, `CHANGELOG.md`, `README.md`, `DEPLOY_v1.10.md` and `QA_REPORT_v1.10.md` into the **repository root**, retaining relative paths.
3. Check in GitHub: `site/index.html`, `site/assets/mobile-v1.10.css`, `site/service-worker.js`.
4. Commit on `main` with message `Release candidate: Child Vaccine Planner v1.10 mobile timeline repair`.
5. Cloudflare Pages will redeploy automatically. Wait for the deployment to finish, then open the website online first so the new service worker caches v1.10.

## Important first check on installed PWA
- Take a JSON backup before any update.
- Do **not** clear app storage or Chrome site data, as records are stored on-device.
- Close and reopen the Android PWA after it has refreshed online; if stale CSS remains, reopen it online again and check Cloudflare's latest deployment.
- With a test DOB, inspect the BCG card and several collapsed/expanded vaccine cards, and check date field interactions.
- Confirm no sideways scrolling and no stacked-text overlap, including Android display-font scaling.

## Rollback
Revert the v1.10 commit from the GitHub repository. Cloudflare Pages will redeploy the prior v1.9 code. The vaccination storage schema was not changed. If a GitHub revert is unavailable, restore the v1.9 complete-project archive without deleting personal site storage. Retain version history in `CHANGELOG.md`.
