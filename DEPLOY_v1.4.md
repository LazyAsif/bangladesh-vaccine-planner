# Deploy Child Vaccine Planner v1.4

1. Download `Child_Vaccine_Planner_v1.4_Changed_Files.zip` and extract.
2. Open the GitHub repository root: https://github.com/LazyAsif/bangladesh-vaccine-planner
3. Choose **Add file → Upload files**; drag the `site` folder and the `CHANGELOG.md` and `DEPLOY_v1.4.md` files, not the enclosing ZIP folder.
4. Verify paths `site/index.html`, `site/assets/header-v1.4.css`, `site/assets/header-v1.4.js`, `site/service-worker.js` and article pages. Avoid `site/site/` nesting.
5. Commit directly to `main` with message: `Release candidate: Child Vaccine Planner v1.4 responsive header`.
6. Cloudflare Pages redeploys automatically. Check the live site online first, then the installed PWA. Refresh/relaunch as needed for the new service-worker cache to take over.

## Manual acceptance tests
- Wide desktop ≥ 1101 px: header remains single row while scrolling; all nav links, theme and install actions work.
- Narrow desktop/tablet ≤ 1100 px: hamburger button toggles menu, no horizontal page scroll, menu link touch targets ≥ 44 px.
- Android phone (360–430 px): links work; theme toggle works, installed app hides Install App; menu closes on outside click, Escape (where available), and selecting navigation link.
- Scroll with hamburger expanded: menu is scrollable without hiding controls.
- Verify 14 website pages, including articles, centres, sources, about, privacy, and contact.
- Check existing saved child vaccine dates and dose history remain unchanged (export a backup first).
- Check offline navigation after one online visit; verify service worker updated to v1.4.

Status: release candidate, not yet confirmed on all devices.
