# Child Vaccine Planner v1.9 — Deployment and Rollback

1. Back up actual vaccination records with the existing local export feature before deployment.
2. Extract **Changed Files Only** ZIP, and upload its `site/` folder and root-level `CHANGELOG.md`, `DEPLOY_v1.9.md`, `QA_REPORT_v1.9.md` to the **repository root** via GitHub Add file > Upload files.
3. Check that paths are `site/index.html`, `site/assets/mobile-v1.9.css`, `site/service-worker.js`, `site/manifest.webmanifest` and `site/assets/icons/icon-512-maskable.png` (never `site/site/`).
4. Commit message: `Release candidate: Child Vaccine Planner v1.9 mobile optimization`.
5. Cloudflare Pages automatically deploys. Open the website online on phones and the installed PWA; refresh/relaunch once to pick up cache v1.9.
6. Check mobile chart accordion, date fields, theme switch, language switch, bottom nav, three FAQ panels, offline calculator, and installed mode on Android. Check Safari Add to Home Screen on iPhone.
7. To roll back, revert the v1.9 GitHub commit, or re-upload the preserved `Child_Vaccine_Planner_v1.8_Complete_Project.zip` (repository root structure intact). **Do not clear browser/PWA storage** when rolling back.

QA notes: browser emulation is not a substitute for physical device, VoiceOver/TalkBack, or full Lighthouse mobile run.
