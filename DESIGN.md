---
version: alpha
name: Runner Sports and Analytics
description: A game-day research platform with a Runner Demon garage identity and personal Philadelphia color themes.
colors:
  canvas: "#04081a"
  surface: "#0e1730"
  text: "#f7f8fb"
  muted: "#a9b1c6"
  primary: "#e5122b"
  runnerAction: "#bd1630"
  onAction: "#ffffff"
  positive: "#34d399"
  negative: "#ff6b6b"
  warning: "#f5b843"
typography:
  display:
    fontFamily: 'Impact, "Arial Narrow", "Franklin Gothic Medium", sans-serif'
  sans:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif'
  mono:
    fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace'
rounded:
  DEFAULT: "0.875rem"
  control: "0.35rem"
spacing:
  page-max: "1280px"
  section-gap: "6.5rem"
  section-gap-mobile: "3.5rem"
components:
  game-day-select:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text}"
  marketing-button:
    backgroundColor: "{colors.runnerAction}"
    textColor: "{colors.onAction}"
---

# Runner visual system

## Overview

Runner is a sports research product for US English readers moving between a phone on game day and a desktop research board. The homepage and Sunday HQ are brand surfaces; authenticated research pages remain compact product surfaces. The memorable element is the Runner-wrapped Demon-inspired car in a dark garage. Its red/navy identity remains visible while the surrounding color theme responds to the fan's choice.

The current brief explicitly requests Kelly Green and Philadelphia team themes. Kelly Green is the first-visit preference, not a statement about a coming game or a team's uniform. Returning visitors keep their chosen skin. No team logos or league endorsements are implied by this color system.

Avoid generic glowing dashboards, invented live counters, fake odds, and uniform product-card grids in marketing sections. The car is the expressive centerpiece; typography, dividers, source captions and native controls support it quietly.

Token ownership is **Model B**: `app/globals.css` owns the existing runtime palette and layout. `lib/theme/gameDaySkins.ts` owns expressive skin values. This document mirrors the stable values and explains their intent. No generated CSS pipeline is introduced.

## Colors

The established navy canvas, white text and red Runner brand remain. Status colors never change with fan preference: positive, negative and warning continue to communicate the same meanings. Team-inspired colors control only four expressive variables: `--skin-accent`, `--skin-action`, `--skin-wash`, and `--skin-secondary`.

The canonical catalog contains Runner original, Eagles Kelly Green, Eagles Midnight Green, Phillies, 76ers, Flyers and Union. The catalog flows through `GameDaySkinProvider` inline CSS variables into the homepage, preview, and product skin strip. This single mapping avoids separate values per screen. Dark text, disabled, error, and financial semantics are not remapped to team colors.

Scrollbar tokens in `globals.css` apply globally with standards properties and WebKit fallback. Forced colors preserve system colors and visible outlines.

## Typography

Use the locally available condensed display stack for the hero, car-themed finale and fan preview. This suggests a garage stencil and sports headline without downloading a font. The established system stack handles prose and controls. Monospace is reserved for source captions and market values. Headings use a compact line height; reading copy uses approximately 1.7–1.8. Avoid uppercase body paragraphs.

## Layout

Homepage content is capped at 1280px with 2.5rem desktop gutters and 1.25rem mobile gutters. A wide hero provides a deliberate stage for the real car artwork. Below 768px, that image enters normal document flow so the complete car and caption remain reachable. Image width/height reserve a stable ratio.

The desktop research section uses three open columns with divider lines; mobile uses a natural-height stack. Market cards are bounded to the three records requested from the existing API. Their empty/error state occupies a visible section and offers a route onward. Product table ownership is unchanged.

## Elevation & Depth

Use tonal surfaces and a single atmosphere behind the vehicle. Avoid animating the car, simulating engine data, or applying a second layer of ornamental gauges. The skin preview uses a restrained diagonal stripe to evoke clothing and team colorways. Cards require visible boundaries rather than relying on shadows.

## Shapes

The existing 0.875rem product-card radius remains. Marketing actions are 0.35rem rounded; the skin preview is 0.8rem rounded. Select popup geometry belongs to the operating system. Focus outlines stay visible and are not clipped by containers.

## Components

| Value/role | Canonical owner | Runtime mapping | Consumers |
|---|---|---|---|
| Core colors and semantic status | `app/globals.css` | `:root` → `@theme inline` | Existing product components |
| Fan palette | `lib/theme/gameDaySkins.ts` | Provider → four `--skin-*` variables | Homepage, preview, selector, chrome strip |
| Display typography | `app/globals.css` | `--font-display` | Hero, preview, finale |
| Skin selection | `GameDaySkinSelector` | Native select + shared context | Homepage hero/studio, AppShell |
| Scrollbar | `app/globals.css` | Global standards + engine fallback | All owned scroll surfaces |

Controls have hover, active and focus states. Skin choice applies immediately, announces the selected label, and writes only a whitelisted nonsecret preference cookie. Cookie failure leaves the visual choice usable for the current visit. The server reads the cookie for matching initial rendering, with no localStorage theme flash.

No asynchronous success claims are used for market data. Missing, stale or unverified records stay off the board, following `docs/MARKET_TRUTH_CONTRACT.md`. A temporary read error is distinguishable from a genuinely empty qualifying board.

## Do's and Don'ts

- Keep the supplied/generated brand artwork intact; state its provenance in the caption and asset note.
- Preserve unavailable model values and real source times. Theme selection cannot manufacture data.
- Keep fan colors expressive and semantic colors stable.
- Use actual links for navigation and the shared native selector for all skin changes.
- Respect reduced motion and platform-owned select behavior; no custom listbox is necessary.
- Treat mobile screenshots, keyboard operation and cookie persistence as runtime checks, not conclusions from static lint.
