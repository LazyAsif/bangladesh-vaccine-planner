# Child Vaccine Planner v1.5 — QA Report

## Static checks

- HTML pages inspected: 15
- External JS syntax checks (Node.js): 7
- Inline JS syntax checks: 15
- Internal HTML references inspected: 306
- Language-aware content nodes: 118
- Missing referenced files or duplicate HTML ids: 0
- Checked JSON and PWA manifest parsing.
- Isolated JavaScript behaviour test passed for language selection, localStorage persistence, translated text, and change events.
- Confirmed calculator data storage keys remain unchanged, and shared language resources appear in the service-worker pre-cache.
- Confirmed legacy public changelog page is not reintroduced.

## Regression scope and limitations

- Existing vaccine age limits, product/dose calculations and previous data schema were not intentionally modified.
- Inspected translations for medical-context consistency but **this does not constitute a medical/clinical review**.
- Browser automation on localhost and file:// was blocked by sandbox policy (`ERR_BLOCKED_BY_ADMINISTRATOR`), so mobile/desktop runtime interactions and native PWA install flows **require testing on your deployed Cloudflare Pages site**.
- Sources, clinic contact data and product stock/availability have not been reverified for this UI release.
- Existing publisher and medical-review placeholders remain; they must be completed before public promotion.

## Release gate

Keep v1.5 as a release candidate until Cloudflare deployment, browser language persistence, PWA offline switch, calculator date recalculation, saved-record persistence, theme, navigation, and Android tests pass.
