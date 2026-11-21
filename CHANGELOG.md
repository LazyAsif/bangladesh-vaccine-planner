# Child Vaccine Planner — Version History

## v1.6 — Release Candidate (21 November 2026)

### Added
- Presentation-only mobile navigation: Chart, Centres, Articles and More; safe-area padding and accessible More panel.
- Header settings menu with persistent Bangla/English and dark/light controls.
- Collapsible private vaccine product information with per-field help buttons.
- Responsive vertical vaccine timeline cards, readable completion/upcoming/overdue indicators, and government/private presentation cues.
- Print/PDF browser action, real `.ics` calendar file export, and private-data-free website sharing via Web Share API (with link-copy fallback).
- Compact sources/guidance disclosure and discreet reminder text near chart; self-contained shield/cross SVG logo.
- Local progressive install reminder after a second page visit (browser support permitting).

### Changed
- Calm light and dark CSS palettes, improved typography, spacing and mobile target sizes.
- DOB form and primary vaccination schedule action receive stronger visual priority; centre discovery becomes secondary.
- Public-facing content remains one selected language where translations exist.
- Service worker version advanced to v1.6.

### Safety and compatibility
- Preserved vaccine scheduling and date-calculation JavaScript, all dose/input IDs, saved record storage key and existing export handlers.
- No account analytics, backend or automatic sharing of child/vaccine data added.
- A complete product-label/clinical schedule audit and independent user testing remain required before public medical use.

### Status
Release Candidate, not released until verified on Cloudflare Desktop/Android/iPhone. v1.5 preserved for rollback.

---

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
