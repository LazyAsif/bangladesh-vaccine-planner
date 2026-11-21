# Child Vaccine Planner — Changelog

## v1.1 — 21 November 2026 (Deployment pending)
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
