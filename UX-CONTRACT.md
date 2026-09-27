# Runner UI behavior contract

This contract records shared theme behavior added in the game-day lane. Existing server access, billing and data contracts remain authoritative. Visual values are maintained in `DESIGN.md` and the documented runtime owners.

## Business-context sources

| Concern | Source | UI consequence |
|---|---|---|
| Intelligence and availability | `docs/MARKET_TRUTH_CONTRACT.md` | Never substitute market consensus for a model; absent data stays unavailable. |
| Product versus engine ownership | `AGENTS.md`, `docs/RUNNER_DATA_OWNERSHIP.md` | Website presents approved data; it does not invent a local model engine. |
| Permissions | `lib/auth/access.ts`, `docs/ACCESS_CONTROL_QA.md` | Theme preferences confer no identity, capability or access. |
| Personal style | Current user request for Eagles/Philadelphia game-day skins | Local visual choice, no schedule, uniform or affiliation assertion. |

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | `components/theme/GameDaySkinSelector.tsx` | Native HTML select and shared skin catalog | Default and compact; OS owns popup | Keyboard, narrow viewport, selected state and reload |
| Scrollbar | `app/globals.css` | Global scrollbar tokens | Standard and forced colors | Computed root styles and visible scrolling |
| Date | `components/admin/AdminSubscribers.tsx` native input | Existing date-only expiry field | Browser calendar and keyboard entry; platform locale/popup accepted | Accessible label; existing server authorization and validation unchanged |

## Theme flow

Choose a skin → apply palette immediately → announce selected label → retain the whitelisted preference for up to 180 days. A browser that blocks storage still gets the current selection and an honest visit-only message. The selector stays in place; changing colors does not navigate, reload data, or change sport filters. The cookie contains only the skin ID. Unknown IDs fall back to Runner original. A new visitor starts in Eagles Kelly Green.

The same shared context updates both homepage selectors and product chrome. Native arrow/Enter/Escape behavior and platform popup geometry are accepted. Focus remains on the select. The shared component provides a real label; a single provider-owned polite status announces changes. No confirmation is needed for this reversible preference. Existing FilterBar and PropsExplorer selects retain native platform behavior. Admin subscriber search owns email validation and inline error feedback rather than invoking native validation bubbles; its server permission checks remain unchanged.

## Marketing state and navigation

Public links lead to existing research, Sunday HQ, tracker, sign-in and access routes. Hero skip navigation targets the main content. At narrow widths, the primary actions and sign-in remain available; game-day selection remains inline. Fixed heights never trap the mobile document.

Market reads distinguish load failure from no qualifying records. Their action leads to the existing odds or research route. No placeholder market numbers are rendered. Dates on homepage source captions explicitly use Central time; language is en-US. The artwork is a generated brand concept, with stable dimensions and useful alt text.

## Scope and verification

This contract introduces no CRUD, billing, privilege, secret or publishing behavior. Legacy UI outside the touched workflows is not certified by this contract. The full static audit and a focused theme audit are recorded separately if unrelated existing findings remain. Browser evidence is required for actual keyboard, mobile, cookie persistence and theme rendering claims.
