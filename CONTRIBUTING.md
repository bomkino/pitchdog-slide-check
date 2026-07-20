# Contributing

Useful contributions make Slide Check more honest, legible, accessible, or reliable.

## Before coding

Use the tool on a real slide. Name the screen, viewing condition, and decision affected. “Make it more modern” is not a problem statement. “At 390 px wide, the result action falls below the viewport after changing delivery mode” is.

Open an issue before a substantial product change.

## Local setup

```bash
git clone https://github.com/bomkino/pitchdog-slide-check.git
cd pitchdog-slide-check
npm install
npm run verify
```

Use Node.js 22.18 or newer.

## Product rules

- Preserve the quick route; expert depth requires explicit consent.
- Free text belongs only where the engine measures the text.
- Do not describe copy load as creative judgment.
- Keep the preview genuinely 16:9.
- Put finite choices in `src/content.ts` and deterministic evidence in `src/analyse.ts` or `src/measure.ts`.
- Add a focused test for every changed decision rule.
- Keep all user material local. Do not add runtime AI, analytics, accounts, remote fonts, or an email gate.
- Preserve keyboard, touch, screen-reader, system-theme, and reduced-motion behavior.
- Explain the mechanism behind visual flourishes. No noise overlays or generic motion garnish.

## Pull requests

Include the user problem, the decision taken, before/after screenshots for visible work, tests, `npm run verify` output, and any privacy, accessibility, or licensing effect.

Contributions use the existing license for the part changed: AGPL-3.0-or-later for software and documentation; CC BY-SA 4.0 for original visual assets.
