# Child Vaccine Planner v1.8 — Deployment and rollback

**Release candidate:** Visual redesign; keep v1.7 production until tested.

## Deploy
1. Download and extract the **Changed Files Only** ZIP.
2. Export any important local vaccination record backup before testing.
3. GitHub repository `LazyAsif/bangladesh-vaccine-planner` → Add file → Upload files.
4. Upload the top-level `site` directory and Markdown files without adding any enclosing parent folder. Existing paths must be replaced.
5. Commit message: `Release candidate: Child Vaccine Planner v1.8 premium UI`.
6. Cloudflare Pages builds from `site` (framework: None, build command: empty, root: repository root).
7. Open the website online once to activate the new service worker; close and reopen the installed PWA. Do not clear storage.

## Device QA
- Android and desktop: hero illustration, first-screen DOB form and secondary centres links.
- Light and dark themes, Bangla and English, sticky header and mobile bottom navigation.
- After entering a test date of birth, timeline accordion, private product selection, complete/date overrides and calculations.
- Rotavirus sample arithmetic: DOB 8 October 2026; recorded first dose 20 January 2027; provisional 2nd 17 February and 3rd 17 March, with appropriate product safety warnings. This is **not** a medical recommendation.
- Test calendar and CSV export, print view, link sharing, record backup and offline restart.
- Check screen widths 320, 390, 768 and 1440px for horizontal scrolling and overlaps.
- Manual check for content integrity and clinician review remains necessary.

## Roll back to v1.7
Preferred: revert only the v1.8 commit in GitHub (using GitHub's Revert feature if available or a new commit restoring the previous files). Cloudflare will redeploy v1.7. Alternative: re-upload the preserved `Child_Vaccine_Planner_v1.7_Complete_Project.zip` files at repository root.
**Never use Clear Site Data / Clear Storage to roll back.** Doing so may delete locally stored vaccination records.

The new design does not change localStorage schema or the underlying scheduling algorithms.
