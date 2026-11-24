# Child Vaccine Planner v1.5

Cloudflare Pages static site, all source pages in `site/`, optional Pages functions in `functions/`.

Static no-build deploy: Framework None; build command blank; output `site`; root repository root; branch `main`.

v1.5 adds shared language switching and technical QA. The preference is stored only in browser localStorage. No backend is added and existing vaccination records are not migrated or deleted. Source and content limitations are described on the existing Sources/Disclaimer pages.

See `DEPLOY_v1.5.md`, `QA_REPORT.md`, and the internal `CHANGELOG.md`.


## v1.6 UI release

Presentation-only redesign with `site/assets/ui-v1.6.css`, `site/assets/ui-v1.6.js` and `site/assets/logo.svg`. The existing calculator engine and localStorage key are retained. See `CHANGELOG.md`, `DEPLOY_v1.6.md`, `ROLLBACK_TO_v1.5.md`.


## v1.7 UI update
Dose timelines are independently collapsible. Web Settings provides Install App; installed standalone PWAs do not show the installation action. Deployment steps and rollback instructions: `DEPLOY_v1.7.md`. See `QA_REPORT_v1.7.md` for test limitations.
