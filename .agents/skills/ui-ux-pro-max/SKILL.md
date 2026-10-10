---
name: ui-ux-pro-max
description: "UI/UX Pro Max — the Runner Sports & Analytics design and interface standard. Load BEFORE creating or changing any page, layout, component, chart, table, form, navigation, empty/loading/error state, paywall, pricing, or marketing surface in runner_sports-site (app/, components/, app/globals.css). Covers the Runner design tokens, dark command-center visual language, sports-data presentation (odds, probabilities, signals, scoreboards), data-honesty labeling, accessibility (WCAG 2.2 AA), responsive/mobile rules, motion, Clerk/Stripe access UX, and a pre-merge UI QA checklist. Triggers: UI, UX, design, redesign, polish, layout, responsive, mobile, component, dashboard, card, table, chart, hero, landing page, pricing page, accessibility, a11y, contrast, dark mode, Tailwind, styling, visual bug."
metadata:
  owner: Fee The Developer LLC
  project: Runner Sports & Analytics
  version: "1.0.0"
  date: 2026-10-10
---

# UI/UX Pro Max — Runner Sports Site

You are building the presentation layer of a sports intelligence command center. Every screen must look premium, read fast under pressure, and never misrepresent data. Extend the existing system; do not invent a parallel one.

## 0. Before you touch UI

1. Read `app/globals.css` (tokens + shared classes), `components/ui/*`, and the page/component you are changing.
2. Read `docs/PRODUCTION_UI_QA.md` — it records the "honest placeholder" and dead-control conventions already enforced.
3. Reuse before creating. Existing primitives: `Badge`, `ConfidenceBadge`, `DataStatusBadge`, `EmptyState`, `FilterBar`, `ProbabilityBar`, `ProductHeading`, `SectionHeader`, `SportsTable`, `TrendIndicator`, `RunnerLogo`, `PerformanceChart`, navigation (`AppShell`, `Header`, `Sidebar`, `MobileNav`, `nav-items.ts`).
4. Stack is fixed: Next.js 15 App Router, React 19, Tailwind CSS v4 (`@theme inline` in `globals.css`, no `tailwind.config`), TypeScript. Do not add a UI kit, CSS-in-JS, or icon/animation library without King Fee's approval.

## 1. Design tokens (source of truth: `app/globals.css`)

Use Tailwind token utilities (`bg-surface`, `text-text-muted`, `border-border`, `text-accent`…). **Never hard-code hex values in components.** New tokens go in `:root` and `@theme inline` together.

| Token | Value | Use |
|---|---|---|
| `canvas` | `#04081a` | Page background |
| `surface` / `surface-2` / `surface-3` | `#0e1730` / `#162143` / `#1f2c52` | Cards → raised → inputs/tracks |
| `text` | `#f7f8fb` | Primary copy, numbers |
| `text-muted` | `#a9b1c6` | Secondary copy, labels |
| `text-subtle` | `#707c95` | Meta only — see contrast rules |
| `accent` / `accent-strong` | `#e5122b` / `#ff3b52` | Brand red: primary CTA, active state, signal |
| `analytics` | `#3d6f9e` | Model/analytics accent (fills, not small text) |
| `positive` / `negative` / `warning` | `#34d399` / `#ff6b6b` / `#f5b843` | Win/+EV/up · loss/down · stale/caution |

Shared classes: `.runner-card`, `.data-panel`, `.metric-number`, `.signal-glow`, `.blue-glow`, `.runner-grid`, `.leader-card`, `.hero-stadium`, `.hero-button-primary|secondary`, `.media-stage`. Radius `--radius-card` (0.875rem), shadow `--shadow-card`.

### Measured contrast (WCAG 2.x, against canvas / surface / surface-3)

- `text` 18.8 / 16.7 / 12.8 — any size.
- `text-muted` 9.3 / 8.3 / 6.4 — any size.
- `text-subtle` 4.75 / 4.23 / 3.25 — **body text only on canvas.** On `surface` or darker-raised panels use it only for ≥18px/bold-14px text or non-essential meta; otherwise use `text-muted`.
- `accent` 4.2 / 3.8 / 2.9 — **not for small text.** Use `accent-strong` (5.7 / 5.1) for red text on dark; `accent` is for fills, borders, bars.
- White on `accent` fill 4.72 — passes for button labels.
- `analytics` 3.8 / 3.4 — fills, chart series, borders only; never body text.
- `positive`, `negative`, `warning` — pass as text on all surfaces (negative on surface-3 is 4.9).

## 2. Visual language

- **Dark command center.** Deep navy canvas, red signal accent, restrained blue analytics glow. One focal accent per view; red means "act / live / edge", not decoration.
- **Hierarchy by weight and size, not color.** Page H1 `clamp(1.75rem,3vw,2.35rem)`, tight tracking (−0.035em). Section labels: small, uppercase, wide tracking, `text-muted`.
- **Numbers are the product.** Every odds, line, probability, score, ROI, and price uses `.metric-number` or `font-mono` + `tabular-nums` so columns don't jitter on live updates. Right-align numeric table columns.
- **Spacing**: 4px grid (Tailwind default scale). Card padding `p-4` mobile / `p-5`–`p-6` desktop. Section gaps `gap-6`–`gap-8`.
- **Depth**: `runner-card` for content, `data-panel` for live data modules. Don't stack glows; at most one glow element per viewport region.
- **Brand**: "Runner Sports & Analytics" (never "Runners"). Logo via `RunnerLogo` / `/brand/*`. Team/player marks must come from licensed or provider-attributed assets.

## 3. Sports-data presentation rules

- **Odds**: show format explicitly (American `+150` / `−110`); always signed. Show the book and the timestamp the line was pulled.
- **Probabilities**: `ProbabilityBar` for model vs. market; the compare tick is the market implied probability. Format via `lib/utils/format` (`formatPercent`), never ad-hoc `toFixed`.
- **Edge / EV**: color by sign (`positive`/`negative`) **and** a sign glyph or arrow (`TrendIndicator`) — never color alone.
- **Confidence**: `ConfidenceBadge`; never imply certainty. No "lock", "guaranteed", "can't lose" copy.
- **Live state**: `DataStatusBadge` on every data module that comes from a provider. `tone="live"` only when data is actually fresh; `tone="warning"` with a plain label for delayed, cached, stale, simulated, or sample data.
- **Scoreboards/game cards**: team abbreviation + logo, score, period/clock, status (Scheduled/Live/Final). The whole card links to `/games/[id]`.
- **Tables** (`SportsTable`): sticky header, zebra or row dividers via `border-border`, horizontal scroll container on mobile with the first column (team/player) sticky.
- **Charts**: follow the `dataviz` skill for form and color; series colors from tokens; label axes with units; include a text summary or table fallback for screen readers.
- **Responsible-gaming footer** on surfaces that show picks/odds: research/entertainment framing, 21+ / jurisdiction note, no outcome guarantees.

## 4. Data honesty (non-negotiable)

- Never render fabricated numbers to fill a layout. If data is missing, show `EmptyState` with the reason ("No lines posted yet", "Provider unavailable").
- Label sample/demo data visibly in the UI, not just in code.
- Unbuilt features follow the established convention: `disabled` + `aria-disabled="true"` + `title="Coming soon"` + muted styling, optionally a "Coming soon" badge. No live-looking dead controls.
- Every link/button must resolve to a real route or real handler. Query params you add must actually be read by the target page.

## 5. States — every data surface ships all of them

| State | Requirement |
|---|---|
| Loading | Skeleton matching final layout (`animate-pulse` on `surface-2` blocks); no layout shift. Route-level `loading.tsx` where it exists. |
| Empty | `EmptyState` with a specific title + next step. |
| Error | Plain-language message, retry action, link back to dashboard (mirror `app/error.tsx`). No stack traces or provider secrets. |
| Stale/partial | `DataStatusBadge tone="warning"` + "as of <time>". |
| Locked (paywall) | Show what the tier unlocks, blurred/teaser preview allowed, one clear CTA to `/pricing`. Never leak premium data in the HTML of a locked view. |
| Signed out | Clear sign-in CTA via `AuthControls`; middleware-protected routes must not flash protected content. |

## 6. Accessibility — WCAG 2.2 AA minimum

- Semantic HTML first: `<nav>`, `<main>`, `<header>`, one `<h1>` per page, ordered headings, `<table>` for tabular data with `<th scope>`.
- Keyboard: everything clickable is a `<button>` or `<Link>`; visible focus uses the global `:focus-visible` ring — never `outline-none` without a replacement.
- Targets ≥ 24×24px (aim 44×44 on mobile nav and primary CTAs).
- Icon-only buttons need `aria-label`; decorative icons `aria-hidden="true"`.
- Live-updating scores/odds: wrap the changing value in `aria-live="polite"` sparingly (summary level, not every cell).
- Color is never the only signal (pair with sign, icon, or text).
- Respect `prefers-reduced-motion` (global rule exists — don't override it with inline durations).
- Images: meaningful `alt`; team logos `alt="<Team> logo"`; decorative backgrounds via CSS.
- Forms: visible `<label>`, inline error text tied with `aria-describedby`, don't rely on placeholder as label.

## 7. Responsive & mobile

- Mobile-first Tailwind. Verify at 360, 390, 768, 1024, 1440px.
- No horizontal page scroll at 360px; wide tables scroll inside their own container.
- `MobileNav` handles small screens; `Sidebar` is desktop. Don't add a third nav pattern.
- Respect safe areas on fixed bottom UI (`pb-[env(safe-area-inset-bottom)]`).
- Hero type uses `clamp()`; never fixed px headings above `text-4xl`.

## 8. Motion

- Purposeful only: state change, live update pulse, hover affordance. 150–250ms, `ease-out`. Animate `opacity`/`transform` only.
- Live value change: brief color flash (`positive`/`negative`) ≤ 600ms, then settle.
- No autoplaying carousels; tickers (`RunnerTicker`) must stay reduced-motion-safe.

## 9. Performance & Next.js patterns

- Server Components by default; add `"use client"` only for real interactivity, as low in the tree as possible.
- `next/image` for raster assets with explicit `width`/`height` or `fill` + `sizes`; `priority` only for the LCP hero.
- `next/link` for internal navigation.
- No secrets or server-only modules in client components (`server-only` guards exist — keep them).
- Targets: LCP < 2.5s, CLS < 0.1, INP < 200ms on mid-range mobile.

## 10. Copy voice

Direct, confident, data-first. Short labels in UI chrome; explanatory sentences only in empty/locked states and research text. Sentence case for body, uppercase-tracked for small section labels and hero CTAs (existing convention). No hype that implies guaranteed outcomes.

## 11. Workflow

1. **Audit** the current screen: tokens used, primitives reused, states present, a11y gaps.
2. **Plan** the smallest change that hits the requirement; list files.
3. **Build** with tokens and existing primitives; extract a new `components/ui/*` primitive only when a pattern repeats ≥ 2 times.
4. **Verify** (below).
5. **Document**: update `docs/PRODUCTION_UI_QA.md` when controls, routes, or placeholder status change.

## 12. Pre-merge UI checklist

- [ ] `npm run lint` and `npm run build` pass (and `npx tsc --noEmit`).
- [ ] No hard-coded hex colors in `components/` or `app/` outside `globals.css`.
- [ ] Every numeric value uses tabular numerals; numeric columns right-aligned.
- [ ] Loading / empty / error / stale / locked states exist where data loads.
- [ ] Every provider-backed module shows a truthful `DataStatusBadge`.
- [ ] No dead controls; unbuilt features use the "Coming soon" convention.
- [ ] Keyboard pass: tab order logical, focus ring visible, no traps.
- [ ] Contrast respects §1 rules (no small `accent` or `analytics` text; `text-subtle` only where allowed).
- [ ] 360px viewport: no page-level horizontal scroll; tap targets adequate.
- [ ] Reduced motion honored.
- [ ] Premium data not present in locked-state markup.
- [ ] If a browser check was not run (no dev server/credentials), say so explicitly in the report — do not claim visual verification.
