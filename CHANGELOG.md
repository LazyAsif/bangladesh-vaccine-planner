# Child Vaccine Planner — Internal Changelog

## v1.5 — Release Candidate (21 November 2026)

### Added
- Shared Bengali/English language selector in the responsive header on every page.
- Browser-local persistent language preference (`cvp-language-v1`), used across navigation and application relaunch.
- English/Bengali localized explanatory information on articles and key informational pages, with directory listings responding to language changes.

### Changed
- Removed the calculator's duplicated language toggle; its language is now controlled by the common header.
- Improved navigation language labels, touch targets and compact mobile language controls.
- Refreshed PWA asset cache version and included the new language assets for offline use.

### Fixed / QA
- Prevented calculator language from resetting to Bangla when navigating back from other pages.
- Narrowed service-worker cache cleanup to this project's cache namespace.
- Ran static HTML references, JS syntax, combined app/calculator and browser interaction checks (see QA_REPORT.md).

### Not changed
- Vaccine rules, medical age constraints, vaccination records, provider dataset, user storage keys, export calculations and brand rules are preserved.

## v1.4 — Prior release
Responsive sticky header and compact accessible mobile navigation.

## v1.3 — Prior release
Home page links to EPI and private vaccination centre directories.

## v1.2 — Prior release
Private-centre sourced directory and removal of public-facing version metadata.

## v1.1 — Prior release
Theme switching and division/district navigation.

## v1 — Initial version baseline
Bilingual EPI/private vaccination calculator and offline PWA.
