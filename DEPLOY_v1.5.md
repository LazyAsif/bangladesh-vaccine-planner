# Deploy Child Vaccine Planner v1.5

1. Download **Child_Vaccine_Planner_v1.5_Changed_Files.zip** and extract it.
2. Go to the root of the GitHub repository `LazyAsif/bangladesh-vaccine-planner`.
3. **Add file → Upload files**. Drag the `site` folder, `CHANGELOG.md`, `DEPLOY_v1.5.md`, and `QA_REPORT.md` into the upload area (do not upload a parent project folder).
4. Verify paths `site/assets/language-v1.5.js`, `site/assets/language-v1.5.css`, `site/index.html`, `site/service-worker.js` and `CHANGELOG.md`.
5. Commit to `main` with `Release candidate: Child Vaccine Planner v1.5 language and QA`.
6. Wait for Cloudflare Pages to report a successful build; confirm the new CSS and JS URLs load, then refresh browser/PWA while online.
7. Test switching Bengali/English on Home → Articles → Article detail → Centres → Home; close/reopen the PWA and confirm language is retained. Test both desktop and Android, including offline after an online load.
8. Check saved vaccine records, date recalculation, clinician overrides, live navigation, theme mode and mobile menu. Do NOT clear site storage when updating.

This is a technical release candidate, not a clinical validation or final launch approval. Site publisher/contact placeholders and medical editorial sign-off remain outstanding.
