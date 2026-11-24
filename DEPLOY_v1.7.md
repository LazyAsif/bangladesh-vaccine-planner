# Child Vaccine Planner v1.7 — Deployment and Rollback

## Release candidate
This package extends v1.6 and has not been deployed from this environment. Keep an export of vaccination data before making changes. Do not clear site data or uninstall the existing PWA to force updates.

## Deployment to GitHub / Cloudflare Pages
1. Download the **Changed Files** ZIP and extract it.
2. At the **repository root**, upload the included `site/` directory and root-level `CHANGELOG.md`, `DEPLOY_v1.7.md`, and `README.md` (and `QA_REPORT_v1.7.md` if desired). Do not create `site/site/`.
3. Verify these new paths: `site/assets/ui-v1.7.js`, `site/assets/ui-v1.7.css`.
4. Verify `site/service-worker.js` and all 15 HTML pages are updated.
5. Commit to `main` with `Release candidate: Child Vaccine Planner v1.7`. Cloudflare Pages should redeploy automatically.
6. Once the new deployment succeeds, open the web site online, then reopen any installed PWA to allow the new cache to activate.

## Regression tests
- Open the chart with sample birth date 2026-10-08; first incomplete vaccine card is expanded and other cards are collapsed.
- Expand/collapse both an EPI and a private vaccine card. Check the checkbox works when collapsed.
- Record an actual rotavirus first dose of 2027-01-20 in an appropriate test configuration. Check the later provisional interval dates (2027-02-17, 2027-03-17 where a 3-dose product applies), while respecting product age-limit warnings. Reset test data afterwards.
- Check a changed vaccine date re-renders the timeline without losing unrelated saved data. Check the English-language labels.
- In the browser (desktop/tablet), open Settings: Install App is visible and clicking it invokes the existing browser-supported installation flow.
- In an **installed standalone PWA** on Android AND desktop, Settings / More must not show Install App. Browser tab may still show it even if installation exists: the installed window is what is detected.
- Test mobile 390px and desktop 1440px layouts, offline opening, and print/PDF export (collapsed cards should print expanded).

## Safe rollback to v1.6
Prefer GitHub **Revert** of the v1.7 commit, which creates a reversing commit and triggers Cloudflare deployment. Alternately restore the exact v1.6 complete-project ZIP in a separate rollback commit. Old localStorage records should remain untouched because v1.7 does not modify their keys or schema. Do not clear browser storage as part of rollback.

## Notes
- This is an interface update, not a medical schedule revision.
- No browser can force its native PWA install prompt when `beforeinstallprompt` is unavailable; a manual-instruction fallback already exists.
- Versioning remains: v1.7, v1.8, v1.9, v1.10, then v2.
