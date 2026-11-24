# QA Report — Child Vaccine Planner v1.8

## Automated static checks
- HTML pages: **15**
- Local references tested: **382**, missing **0**
- Standalone JS syntax files: **9**, errors **0**
- Inline homepage JavaScript bytes/text: **unchanged from v1.7**
- Service worker: v1.8 cache key and new CSS + SVG listed
- New hero image: original local SVG; no remote image dependency
- Persistent vaccination schema and clinical dose logic: not modified by v1.8

## Limitations
Chromium browser automation was attempted with localhost and file URLs but both were blocked by the runtime administrator; hence responsive screenshot comparison, dynamic PWA cache tests, accessibility tooling and Lighthouse scores could not be executed reliably here. This is not a claim of complete functional performance. Real-device QA is required before release.

## Regression checklist
- Initial setup with blank birth date, Bangla/English setting retained across pages
- Home form on Android 390px, tablet and desktop; no sideways scrolling
- Private-vaccine accordion, vaccine timeline accordion and actual-dose rescheduling
- Installed PWA app hides installation action, website Settings shows it
- Offline articles and vaccine chart after online visit
- Light/dark contrast, interactive focus visibility and reduced-motion preference
- Data export and backup; restoring browser records must not require clearing data

## Medical accuracy
No medical or facility directory facts were newly added. Existing clinical material requires separate authoritative review.
