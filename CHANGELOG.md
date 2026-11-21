# Child Vaccine Planner — Internal Changelog (developer only)

## v1.3 — 21 November 2026 (Release candidate; not yet deployed)
### Added
- Responsive vaccination-centre discovery panel beside the birth-date form on the landing screen, stacked below the form on mobile.
- Two direct destination links: **See EPI Centre / সরকারি টিকা কেন্দ্র দেখুন** → `/centres/index.html#government`; **See Private Vaccination Centres / বেসরকারি টিকা কেন্দ্র দেখুন** → `/centres/index.html#private`.
### Changed
- Retained the home navigation without an additional Vaccine Centres tab, per owner request.
- Directory tabs now preserve the selected category in the URL hash and respond to hash navigation.
- PWA service worker cache key updated to `bd-child-vax-public-v1.3`.
### Unchanged
- Vaccine dates and medical content; calculator storage and saved vaccination records; other pages and existing private centres data.
- Public footer stays as the single Bengali medical disclaimer; version history remains developer-only.
### Modified files
- `site/index.html`, `site/assets/private-centres.js`, `site/service-worker.js`, `CHANGELOG.md`.
### QA
- Static structure, link targets and JavaScript syntax validated. Android/iPhone visual and PWA offline test pending after Cloudflare deployment.

# Child Vaccine Planner — Internal Changelog (developer only)

## v1.2 — 21 November 2026 (Release candidate; deployment pending)
### Changed
- Removed visible version label and public changelog link from all public page footers.
- Public footer now shows only the exact Bengali clinical disclaimer provided by the owner.
- Removed public `Content checked`, version and analytics-status footer metadata.
- Removed public `/changelog/` page from the deployed site; historical entries retained in this repository markdown.
- Vaccine Centres page now provides Private and Government tabs; Government EPI source lookup preserved.
### Added
- 8 non-government hospital / clinic vaccination-service listings, grouped by division/district, with addresses, published phone numbers and official source links; source-reviewed 21 November 2026.
- Search and division/district filters for private listings.
- Static offline-ready dataset and versioned service worker cache.
### Limitations
- This is a limited verified-source shortlist, NOT a full national private-centre database or a guarantee of active services, stock, costs or current phone operability.
- Source publication is not the same as phone confirmation. Confirm before travelling.
### QA
- Automated source-file/path checks and JavaScript syntax checks; live-device/browser PWA verification pending.
### Files
- `site/index.html`, all public HTML footers, `site/centres/index.html`, `site/assets/site.css`, `site/assets/private-centres.js`, `site/assets/private-centres.json`, `site/service-worker.js`; public site changelog route removed.

# Child Vaccine Planner — Changelog

## v1.1 — 21 November 2026 (Deployed; reported by owner)
### Added
- Government Vaccine Centres / সরকারি টিকাদান কেন্দ্র menu: all eight divisions and 64 district selections.
- Official DGHS Facility Registry and EPI session/microplanning source links; no unverified phone numbers or centre claims.
- Light/dark theme toggle and persistent preference.
- Version history page.
### Changed
- Calculator / ক্যালকুলেটর renamed See Chart / চার্ট দেখুন.
- Install App hidden inside standalone PWA (also iOS standalone).
- Service worker cache updated to v1.1.
### Data limitation
- Full verified individual government vaccination centre database is NOT yet integrated. A health facility is not necessarily a functioning EPI vaccination session.
### Modified files
- All existing site HTML navigation, new site/centres, assets/theme.*, assets/centres.js, site/service-worker.js, changelog page, README.md.
### Tests
- Static paths and JavaScript syntax checked; real Android/iOS UI and official records verification still needed.

## v1 — 21 November 2026 (previous production baseline)
- Bilingual government/private vaccine planner, automatic recalculation, private vaccine product options, offline PWA, install menu, mobile date-clear controls.
