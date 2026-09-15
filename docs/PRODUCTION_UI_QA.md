# Production UI QA — Control Inventory

Scope: every primary control (nav item, CTA, auth/subscription/admin button,
game-card link) across `app/` and `components/`, verified by reading the
actual source — not by assumption. Produced as part of the pre-launch
spelling / dead-control sweep on `release/runner-production`.

Each row's **Actual result** reflects the code **after** the fixes made
during this same pass (see "Fixed in this pass" below the table). Rows
marked `Not runtime-verified` mean the control's wiring was confirmed by
reading the code, but its live behavior (network response, Clerk session
state, Stripe/Supabase data) was not exercised in a running browser during
this pass — no dev server/live credentials were used.

## Fixed in this pass

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `app/page.tsx` | Footer copyright read "Runners Sports & Analytics" (extra trailing s) | Corrected to "Runner Sports & Analytics" |
| 2 | `app/teams/page.tsx` | A–Z anchor strip rendered a live `<a href="#letter">` for all 26 letters, but only letters with at least one team get a matching `<section id="letter">` — the rest were dead anchors | Only letters present in the grouped team data render as links; the rest render as disabled, greyed-out spans (`title="No teams"`), matching the existing `comingSoonSports` disabled-span convention |
| 3 | `components/navigation/Header.tsx` | "Search Runner" button, "Open alerts" button, and the "More +" sport-pill both/all rendered as live-looking controls with no `onClick`/`href` — pure dead ends shown on every authenticated page (Header renders site-wide via `AppShell`) | All three now carry `disabled`/`aria-disabled` + `title="Coming soon"` and matching visual treatment, honestly signaling "not yet built" instead of silently doing nothing |
| 4 | `app/research/page.tsx` | "Runner AI Research" question box + "Research" button had no form, `onSubmit`, `onClick`, or client-side state (server component) — looked like a working AI Q&A feature but did nothing | Input/button disabled, `title="Coming soon"`, plus a "Coming soon" badge next to the section heading |
| 5 | `components/sports/GameCard.tsx` | Card used on `/games` and `/dashboard` had zero `href`/`onClick` anywhere — no way to reach the real, working `/games/[id]` matchup detail page (which `app/odds/page.tsx` already links to via a "Matchup →" link) | Wrapped the card's existing markup in `next/link`'s `<Link href={/games/${game.id}}>` with a hover affordance; no internal markup/styling changed |
| 6 | `app/sportsbooks/page.tsx` | "View available lines" linked to `/odds?book=<name>`, but `GameQuery`/`getGames()`/the odds page's `searchParams` type have no `book` field at all — the filter was silently ignored, so every sportsbook's card led to the exact same unfiltered board | Removed the non-functional `?book=` query param; the link still goes to the real, useful `/odds` board, just without falsely implying a per-book filter |
| 7 | `app/systems/page.tsx` | "Ask Runner AI to find a system" input/button and 5 quick-filter pills (`Home favorites`, `Back-to-back`, …) were plain server-rendered elements with no state, no client boundary, no handlers | Same "coming soon" honesty treatment as #3/#4: disabled, `title="Coming soon"`, badge added next to the heading |
| 8 | `app/props/page.tsx`, `app/props/PropsExplorer.tsx` | `components/games/GameDetailView.tsx`'s "Open prop board →" link passes `?gameId=<id>`, but the props page never read `searchParams` and `PropsExplorer` never filtered by game — the param was silently dropped, showing the full unfiltered prop board instead of this matchup's props | Wired `gameId` through as a real filter (data already carried `PlayerProp.gameId`); added a "Showing props for this matchup only / Clear" chip so the filter is visible and removable |
| 9 | `app/error.tsx` | Copy read "Retry the request **or return to the dashboard**" but only a "Try again" button existed — no dashboard link, unlike `app/not-found.tsx`'s equivalent screen | Added a "Return to Dashboard" link next to "Try again", matching the `not-found.tsx` pattern |

All nine fixes are small, targeted, and were verified with a clean
`npx tsc --noEmit` and `npm run lint` both before and after.

## Global navigation & chrome

Header/Sidebar/MobileNav render on every route except the public marketing
pages (`/`, `/sign-in`, `/sign-up`, `/pricing`, `/checkout/success`,
`/checkout/cancel`) — see `components/navigation/AppShell.tsx`'s
`publicPaths` list.

| Page | Control | Expected behavior | Auth requirement | Actual result | PASS/FAIL |
|---|---|---|---|---|---|
| Sidebar (`components/navigation/Sidebar.tsx`) | "For You" / Odds / Games / Props / Runner Edge / Research / Systems / Models / Tracker nav links | Navigate to `/picks`, `/odds`, `/games`, `/props`, `/edge`, `/research`, `/systems`, `/models`, `/tracker` respectively | Sign-in required (middleware); most also require paid/manual/admin access via per-page Paywall | Each `href` resolves to a real route with a matching `app/**/page.tsx`; all confirmed by grep + read | PASS |
| Sidebar | "Admin" link | Navigate to `/admin`, shown only `isAdmin` | Admin only | Rendered conditionally on `isAdmin` prop (from `getRunnerAccess().isAdmin` in `app/layout.tsx`); real route exists and self-guards again (`app/admin/page.tsx` redirects non-admins) | PASS |
| Sidebar | "Compare Sportsbooks →" | Navigate to `/sportsbooks` | Sign-in required (middleware only, no Paywall) | Real route exists | PASS |
| Header (`components/navigation/Header.tsx`) | Picks / Odds / Tools / Research / Models / Prediction Markets nav links | Navigate to matching routes with active-state underline | Sign-in required; most also paywalled | All hrefs resolve to real routes | PASS |
| Header | Sport pills (For You, MLB, NFL, NBA, NCAAF, WNBA, NHL, UFC, Golf) | "For You" → `/picks`; others → `/odds?sport=<slug>` | Sign-in required | `/odds` reads `searchParams.sport` and passes it into `getGames({ sport })` — real, working filter | PASS |
| Header | "Search Runner" button | — | — | **Fixed in this pass (#3):** now `disabled` + `title="Coming soon"` instead of a silent dead end | PASS (honest placeholder) |
| Header | "Open alerts" button | — | — | **Fixed in this pass (#3):** now `disabled` + `title="Coming soon"` | PASS (honest placeholder) |
| Header | "More +" sport-pill | — | — | **Fixed in this pass (#3):** now `title="Coming soon"`, non-interactive styling | PASS (honest placeholder) |
| MobileNav (`components/navigation/MobileNav.tsx`) | Same 9 nav items (+ Admin if `isAdmin`) | Navigate to matching routes | Same as Sidebar | Real `href`s, `NavIcon` renders correctly | PASS |
| AgentNavigator (`components/navigation/AgentNavigator.tsx`) | Floating "Ask Runner" toggle + 9 nav shortcut links | Open/close a panel of the same nav links | Sign-in required (rendered inside `AppShell`, not on public pages) | Toggle is real client state (`useState`); links are the same real `nav-items.ts` hrefs; panel is honestly labeled "PREVIEW" | PASS |
| `RunnerTicker` (marketing ticker, public + app) | — (decorative, no controls) | Scrolling ticker of feature copy | None | Purely presentational, `prefers-reduced-motion` respected | PASS (no control to test) |

## Public marketing pages

| Page | Control | Expected behavior | Auth requirement | Actual result | PASS/FAIL |
|---|---|---|---|---|---|
| `/` (`app/page.tsx`) | "Sign In" (nav) | Navigate to `/sign-in` | None (public) | Real route | PASS |
| `/` | "GET RUNNER ACCESS →" (nav) | Navigate to `/sign-up` | None | Real route | PASS |
| `/` | In-page anchors "Best Plays" `#best-plays`, "Live Events" `#events`, "The Platform" `#platform` | Scroll to matching section on the same page | None | Each target `id` (`best-plays`, `events`, `platform`) exists on this same page — confirmed matching `<section id=…>` | PASS |
| `/` | "See the breakdown →" (each play card) | Navigate to `/picks` | None | Real route | PASS |
| `/` | "OPEN ALL PICKS" | Navigate to `/picks` | None | Real route | PASS |
| `/` | "VIEW FULL SLATE" | Navigate to `/games` | None | Real route | PASS |
| `/` | Platform tiles (PICKS/ODDS/RESEARCH/SYSTEMS) | Navigate to `/picks`, `/odds`, `/research`, `/systems` | None | Real routes | PASS |
| `/` | "VIEW ACCESS" | Navigate to `/pricing` | None | Real route | PASS |
| `/` | "BUILD YOUR EDGE →" | Navigate to `/sign-up` | None | Real route | PASS |
| `/` | Footer copyright text | Correct brand name | — | **Fixed in this pass (#1):** "Runners Sports" → "Runner Sports" | PASS |
| `/pricing` | "Sign in" / "Create account" (nav) | Navigate to `/sign-in` / `/sign-up` | None | Real routes | PASS |
| `/pricing` | "Runner Scout" (free) → "Start scouting" | Navigate to `/sign-up` | None | Real route | PASS |
| `/pricing` | "Runner Pro" / "Runner Command" → `CheckoutButton` | POST `/api/checkout`, redirect to Stripe Checkout URL | Any signed-in user (route itself is public; the API call requires a Clerk session and returns 401 otherwise) | Button disabled with "Stripe price pending" when `getStripePriceId()` has no configured price; otherwise POSTs to a real, auth-checked endpoint and follows the returned Stripe URL; surfaces fetch/API errors inline | PASS (client wiring); **Not runtime-verified** end-to-end against live Stripe |
| `/checkout/success` | "View billing" / "Best plays" | Navigate to `/billing` / `/picks` | Sign-in required (middleware) | Real routes | PASS |
| `/checkout/cancel` | "Back to pricing" | Navigate to `/pricing` | None | Real route | PASS |

## Auth controls

| Page | Control | Expected behavior | Auth requirement | Actual result | PASS/FAIL |
|---|---|---|---|---|---|
| `components/auth/AuthControls.tsx` (in Header, all app pages) | "Sign in" (shown via Clerk `<Show when="signed-out">`) | Navigate to `/sign-in` | Shown to signed-out visitors only | Real route; Clerk `Show` component gates visibility | PASS (wiring); **Not runtime-verified** without a live Clerk session |
| `AuthControls.tsx` | `UserButton` → "Account" menu item | Navigate to `/account` | Shown to signed-in users only (`<Show when="signed-in">`) | Real route | PASS (wiring); **Not runtime-verified** live |
| `AuthControls.tsx` | `UserButton` → "Billing" menu item | Navigate to `/billing` | Signed-in only | Real route | PASS (wiring); **Not runtime-verified** live |
| `AuthControls.tsx` | Fallback "RS" avatar link (when Clerk env vars are absent) | Navigate to `/sign-in` | — | Real route | PASS |
| `app/sign-in/[[...sign-in]]/page.tsx` | Clerk `<SignIn>` widget | Full Clerk-hosted sign-in flow | None (public) | Renders Clerk's own component when configured, else `AuthSetupState` fallback copy | PASS (wiring); **Not runtime-verified** without live Clerk keys |
| `app/sign-up/[[...sign-up]]/page.tsx` | Clerk `<SignUp>` widget | Full Clerk-hosted sign-up flow | None (public) | Same pattern | PASS (wiring); **Not runtime-verified** |
| `app/account/page.tsx` | "Billing" / "Best plays" links (signed-in state) | Navigate to `/billing` / `/picks` | Sign-in required (middleware) | Real routes | PASS |
| `app/account/page.tsx` | "Open sign in" (Clerk-not-configured fallback) | Navigate to `/sign-in` | — | Real route | PASS |

## Billing controls

| Page | Control | Expected behavior | Auth requirement | Actual result | PASS/FAIL |
|---|---|---|---|---|---|
| `app/billing/page.tsx` | `PortalButton` ("Manage billing") | POST `/api/billing/portal`, redirect to Stripe billing portal | Signed-in user with a Stripe customer ID; API returns 401 without a session | Only rendered when `user && isStripeConfigured() && hasCustomer`; button POSTs to a real, auth-checked route and follows the returned URL, with inline error handling | PASS (wiring); **Not runtime-verified** against live Stripe |
| `app/billing/page.tsx` | "View access levels" | Navigate to `/pricing` | Sign-in required (page-level, via middleware) | Real route | PASS |

## Admin controls

| Page | Control | Expected behavior | Auth requirement | Actual result | PASS/FAIL |
|---|---|---|---|---|---|
| `app/admin/page.tsx` | Page-level guard | Redirect signed-out users to `/sign-in`, non-admins to `/account` | Admin only | `getRunnerAccess()` checked explicitly in addition to middleware; `redirect()` calls confirmed | PASS |
| `components/admin/AdminSubscribers.tsx` | "Search" (find a subscriber) | GET `/api/admin/users/search?email=` | Admin only (`requireAdminAccess()` in the route) | Real fetch, error state surfaced, results rendered | PASS (wiring); **Not runtime-verified** against live Clerk user search |
| `AdminSubscribers.tsx` | "Grant full access" (per search result) | POST `/api/admin/grants` | Admin only | Real fetch, disabled while submitting, reloads grant list on success | PASS |
| `AdminSubscribers.tsx` | "Grant access" (grant-by-email form) | POST `/api/admin/grants` | Admin only | Real fetch, disabled until an email is entered, inline error state | PASS |
| `AdminSubscribers.tsx` | "Revoke" (per active grant) | PATCH `/api/admin/grants/[id]` | Admin only | Real fetch, reloads grant list on completion | PASS |

## Game-card / matchup links

| Page | Control | Expected behavior | Auth requirement | Actual result | PASS/FAIL |
|---|---|---|---|---|---|
| `/games` (`components/sports/GameCard.tsx`) | Entire card | Navigate to `/games/[id]` matchup detail | Sign-in required (middleware only; no Paywall on `/games`) | **Fixed in this pass (#5):** card is now a `next/link` wrapping the existing markup | PASS |
| `/dashboard` ("Today's Games" section, same `GameCard`) | Entire card | Navigate to `/games/[id]` | Sign-in + full access (Paywall on `/dashboard`) | Same fix applies automatically (shared component) | PASS |
| `/odds` (row markup, not `GameCard`) | "Matchup →" link | Navigate to `/games/[id]` | Sign-in required only | Pre-existing, already correctly wired | PASS |
| `/games/[id]` (`app/games/[id]/page.tsx`, `components/games/GameDetailView.tsx`) | Tab bar (Game/Odds/Props/Players/Trends/Models/Injuries/News/Line Movement) | Switch panel content via client state | Sign-in required | Real `onClick`/`useState`; unimplemented tabs show an honest "will populate automatically" message instead of blank/broken content | PASS |
| `/games/[id]` | "Open prop board →" (Props tab) | Navigate to `/props?gameId=<id>`, pre-filtered to this game | Sign-in + full access (Paywall on `/props`) | **Fixed in this pass (#8):** `gameId` now actually filters the prop board, with a visible "Clear" affordance | PASS |
| `/dashboard` | "View all games →" / "Open Edge Board →" / "View all props →" | Navigate to `/games`, `/edge`, `/props` | Sign-in + full access | Real routes | PASS |
| `/props`, `/edge` (`PropCard.tsx`, `EdgeCard.tsx`) | Entire card | (No detail route exists for either) | — | Correctly has no link — no `/props/[id]` or `/edge/[id]` route exists in the app; unlike `GameCard`, these are not missing anything | PASS (by design, not a gap) |
| `/teams` | A–Z jump strip | Jump to the matching letter's section | Sign-in required | **Fixed in this pass (#2):** only letters with at least one team are live links; others are disabled spans | PASS |
| `/teams` | Team row → `/teams/[league]/[id]` | Navigate to team detail | Sign-in required | Real route, confirmed working (`notFound()` on missing team) | PASS |
| `/sportsbooks` | "View available lines" (per book) | Navigate to the odds board | Sign-in required | **Fixed in this pass (#6):** stripped the non-functional `?book=` param that the odds page never consumed | PASS |
| `/odds` | `FilterBar` sport/date selects + matchup search | Filter the board via real query-string navigation | Sign-in required | Confirmed real `router.push` / form `action` wiring, not decorative | PASS |
| `/systems` | "RUN TEST" / quick-filter pills / "Ask Runner AI" input | — | — | **Fixed in this pass (#7):** all disabled with `title="Coming soon"` instead of silently doing nothing | PASS (honest placeholder) |
| `/props` (`PropsExplorer.tsx`) | Sport/Market/Team/Confidence filter selects | Client-side filter of the prop list | Sign-in + full access | Confirmed real `useState`/`useMemo` filtering | PASS |
| `/edge` (`EdgeBoard.tsx`) | Sport filter pills | Client-side filter of the edge list/table | Sign-in + full access | Confirmed real `useState` filtering | PASS |
| `app/error.tsx` | "Try again" | Re-render the failed route (`reset()`) | — | Real `onClick={reset}` | PASS |
| `app/error.tsx` | "Return to Dashboard" | Navigate to `/dashboard` | — | **Fixed in this pass (#9):** link added; previously promised in copy ("…or return to the dashboard") with no corresponding control | PASS |
| `app/not-found.tsx` | "Return to Dashboard" | Navigate to `/dashboard` | — | Pre-existing, already correctly wired | PASS |

## Observed but intentionally not changed

These were read and considered in scope for the sweep, but are either
correct as-is or are genuinely out of scope for a "small, targeted edit":

- **`components/legal/ResponsibleGamblingNotice.tsx` line 1–2**: a `// TODO(legal): …` comment. It is a source comment, not rendered UI copy, so it is not a "stray TODO visible in the UI" — left as-is.
- **`app/tracker/page.tsx` / `app/analytics/page.tsx`**: both explicitly tell the user data populates via `POST /api/tracker` rather than offering an in-app "log a bet" form. This is honest, intentional copy (no form exists to create the false impression one does) rather than a dead control — flagged here for product awareness, not fixed.
- **`components/markets/MarketMovementCard.tsx`**: labels its timestamp "Demo snapshot", consistent with the app's broader convention of labeling data provenance — not a leftover dev label, left as-is.
- **`components/auth/AuthSetupState.tsx`**: uses the compressed forms "signup and signin" in one sentence, whereas the rest of the app says "Sign in" / "Sign up". This is grammatically correct, just a minor style inconsistency, not a typo from the task's list — left as-is to keep this pass minimal; worth a follow-up copy pass if desired.
