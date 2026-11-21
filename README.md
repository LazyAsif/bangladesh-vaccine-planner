# Bangladesh Child Vaccine Planner — Static PWA

A public, bilingual vaccination planning website based on the latest supplied vaccine chart. No backend, trackers, remote fonts, ads or accounts included. The calendar includes government EPI and optional private vaccine planning with recorded-date recalculation and product cautions. Not medical advice.

## Upload to GitHub / Deploy with Cloudflare Pages
1. Upload the **contents of this ZIP**, maintaining the `site/` and `functions/` directories, to a GitHub repository.
2. In Cloudflare **Workers & Pages**, create a Pages project and connect the repository.
3. Framework: **None**, build command: **leave empty**, build output directory: **`site`**, root directory: repository root.
4. Deploy. `functions/sitemap.xml.js` and `functions/robots.txt.js` generate correct full URLs on the deployed domain, so no placeholder domain is published.
5. Open `/`, `/sitemap.xml`, `/robots.txt`, `/sources/`, and test mobile + offline.
6. Connect a custom domain via Pages > Custom domains, then submit `/sitemap.xml` in Google Search Console. The dynamic sitemap follows the visited origin; submit the canonical domain's sitemap only.

## Before public launch — REQUIRED
- Fill in a **real publisher identity** on `/about/` and a **working contact route** on `/contact/`. Both pages intentionally mark missing information.
- Obtain an independent qualified medical review of the published vaccination schedule, product ages/intervals, emergency text and the six educational articles; do not imply approval otherwise.
- Review source accuracy, local brand approval, infant age restrictions and actual EPI card. Review TCV and IPV guidance before launch.
- If enabling analytics, AdSense, forms or a backend, update the privacy policy, consent handling, CSP, cookies and data-flow statements first. No ads / analytics are currently integrated.
- To get best multilingual SEO, consider separate `/bn/` and `/en/` versions with real translations and hreflang. The chart still uses in-app language switching. Informational pages presently contain bilingual material.

## Offline / PWA
Service workers require HTTPS or localhost (not `file://`). On first online visit it caches public pages and assets. System fonts are used instead of distributing font binaries. Some devices may use their default Bengali typeface. User records are stored in browser localStorage only (do not confuse with the PWA public-page cache). Clearing browser data can erase the record. A JSON backup download is supplied. Google Calendar links explicitly share event text with Google when clicked.

## Local testing
Run `python3 -m http.server 8000 -d site` and visit http://localhost:8000/ to test basic static pages. Cloudflare-specific Functions routes `/sitemap.xml` and `/robots.txt` only work under Cloudflare Pages or Wrangler Pages local development.

## Source files
`site/index.html` contains the supplied interactive planner and local-only adjustments. `site/assets/site.css` styles informational pages. `site/manifest.webmanifest`, `site/service-worker.js`, `site/assets/icons/` enable installability. `functions/` generates origin-correct sitemap and robots.txt.

## Critical limitation
The site is **deployment-ready from a technical perspective**, but **not medically or legally cleared for publication or AdSense approval**. There is no claim of AdSense eligibility or guaranteed indexing.

## Navigation fix (November 2026)
The pages now use relative links ending in `index.html`, so opening `site/index.html` directly from an extracted ZIP also allows About, Articles, Sources and other pages to open without a local web server. For PWA installation and offline caching, use HTTPS or `http://localhost` instead: `file://` cannot run service workers.

**Important:** Extract the entire ZIP before opening `site/index.html`. Do not move `index.html` away from the `site/` directory or its other pages/assets.

## Mobile date clear fix (November 2026)

- Each actual dose date and clinician-confirmed date has its own **Clear / মুছুন** button.
- Clearing an actual dose date also resets its Done checkbox; dependent proposed dates are recalculated from the remaining records.
- Clearing a clinician-confirmed date restores the automatically calculated planning date (based on birth date and earlier recorded doses).
- No other vaccination records are deleted. The PWA service-worker cache version was incremented.
- To update Cloudflare Pages, replace `site/index.html`, `site/service-worker.js` in GitHub and commit them. The complete ZIP includes all existing files too.


## v1.1 Change Summary
See CHANGELOG.md. Includes a partial government vaccination centre *finder* with 8 division/64 district navigation and links to official registries. It does NOT yet represent a complete verified registry of actual EPI sessions/centres. To keep district centre data current, obtain validated EPI microplanning export and validate operational status/phone numbers with DGHS prior to publishing such data.

## v1.2
Public version labels removed; private vaccination providers with source-backed contact data added to the government directory. Developer changelog remains `CHANGELOG.md`. See `DEPLOY_v1.2.md`.
