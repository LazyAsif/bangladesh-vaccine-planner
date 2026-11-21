# Deploy Child Vaccine Planner v1.3

1. Download **Changed Files Only ZIP** and extract it.
2. In GitHub repository `LazyAsif/bangladesh-vaccine-planner`, select **Add file → Upload files** at the repository root.
3. Drag `site/` plus `CHANGELOG.md` from the ZIP; preserve paths (do not upload an extra enclosing folder).
4. Confirm these destinations: `site/index.html`, `site/assets/private-centres.js`, `site/service-worker.js`, `CHANGELOG.md`.
5. Commit to `main` using `Release candidate: Child Vaccine Planner v1.3`.
6. Confirm successful automatic Cloudflare Pages deployment. Refresh website and installed PWA online; reopen PWA after close.
7. Validate the chart form on left and the two-button panel to its right on desktop; stacked layout on mobile. Click links and ensure Government or Private tab is active, respectively.
8. With a saved chart, confirm the panel does not obscure vaccination data; use the edit action to show the form and panel again.
9. Test light/dark mode, offline access after online refresh, existing local records and browser Back/Forward category navigation.

**Notes:** Government centre listing remains sourced-link navigation, not a complete verified centre database. No personal medical data is transmitted by these links. Do not clear browser storage to update the PWA.
