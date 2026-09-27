# Game-day UI implementation and QA

Date: 2026-09-26. Scope: public homepage, shared game-day skins, product skin selector, and the narrow native-control fixes identified by the premium audit.

## Implemented

- Runner Demon car is the homepage centerpiece. Asset is copied unchanged from the sibling Demon repository, displayed with a generated-concept caption and stable image dimensions. It is eager and served directly to avoid first-request image-optimization delay.
- Philadelphia-inspired skins: Eagles Kelly Green/Midnight Green, Phillies, 76ers, Flyers, Union, plus Runner original. First visit starts Kelly Green; a whitelisted cookie controls later server rendering. No schedule or uniform assertion is made.
- Shared native selectors use one context and one polite status announcement. Browser-owned popup behavior is intentional. Semantic positive/negative/warning colors never change.
- Missing market data has distinct empty/read-error text and no fabricated model, win-rate, live-count or price values.
- The static audit's existing subscriber search/native date and FilterBar findings were repaired narrowly: app-owned email validation, inline error association, `noValidate`, and documented native calendar ownership. Server authorization and workflows are unchanged.

## Evidence

Parent browser QA used localhost:3002:

- Mobile 390 × 844: car visible; document scrollWidth equals clientWidth (380), with no horizontal overflow.
- Both native selectors reflected Flyers; the selection survived reload; Kelly Green was restored afterward.
- Desktop 1536 × 674: loaded car image measured 1030 × 579.67 at x472.8/y222.7. Initial optimized-image delay was observed. The image was switched to direct eager loading and moved higher in a shorter desktop hero in response.
- Parent retains browser ownership and conducts final screenshots/keyboard checks after the last edits. Open native-popup and complete cross-browser/200% zoom coverage are not inferred from static evidence.

`docs/GAME_DAY_PREMIUM_AUDIT.json` records the strict full app/components scan. It currently reports zero findings. DESIGN.md lint and palette/whitelist tests run separately; production build/lint belongs to the parent after all concurrent edits settle.

## Design reconciliation

| Prior state | Change | Reason |
|---|---|---|
| Generic media placeholders on homepage | Real Runner Demon concept art | User's requested marketing centerpiece |
| Core red/navy palette only | Separate expressive skin variables | Personal fan preference without status meaning drift |
| WebKit-only translucent scrollbar | Global standards/engine-fallback token baseline | Visible consistent scrolling and forced-color support |
| No project visual/behavior context files | DESIGN.md and focused UX-CONTRACT.md | Shared theme ownership and durable implementation contract |

## Remaining boundary

This local UI does not establish production provider connectivity, deployed freshness, calibrated predictions, Systems Engine readiness or a live wardrobe integration. Brand car art and fan palettes are presentation preferences; no team sponsorship is claimed. Production readiness remains governed by the separate release-gate documents.
