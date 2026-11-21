# Deploy / QA — v1.6

**Status:** Release Candidate. Upload changed `site/` subtree and root `CHANGELOG.md`, `DEPLOY_v1.6.md`, `ROLLBACK_TO_v1.5.md`, `QA_REPORT_v1.6.md`; paths must be under repository root, never nested `site/site/`.

Commit `Release candidate: Child Vaccine Planner v1.6`. Wait for Cloudflare success. Do not delete cached records.

### Manual QA to complete
1. Test 360, 390, 768, 1024, 1440px; confirm no horizontal scrolling, accessible mobile bottom nav, sticky header, keyboard Escape/focus.
2. In Bengali mode, browse Calculator → Centres → Articles → About, then English mode, then reload/reopen PWA. Confirm one selected language (some health/source labels may remain published names).
3. Check DOB → chart, existing actual dates, rotavirus product-specific guidance, dose 1/2/3 cascade and overrides. Confirm records persist and no dates change unexpectedly.
4. Verify private accordion retains data, timeline statuses, dark/light contrast, date-clear controls, print PDF and calendar export.
5. Verify Android offline cache, PWA startup, iPhone Safari installation, next deploy update and rollback using old saved records.
6. Lighthouse Accessibility/Performance/PWA (record device, URL, audit date and exact numeric reports). Test with 5–6 parents; do not fabricate results.

A deployed site is publicly accessible: verify medical content with a qualified clinician and publisher details before promotion.
