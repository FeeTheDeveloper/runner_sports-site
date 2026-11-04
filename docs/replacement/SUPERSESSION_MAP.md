# Legacy Intelligence Supersession Map

Governing scope: [RUNNER_REPLACEMENT_DIRECTIVE.md](./RUNNER_REPLACEMENT_DIRECTIVE.md)
Inventory date: 2026-11-04 · Inventoried by: Claude (Fee The Developer engineering)
Evidence basis: repository read of `runner_sports-site@8def49b` (main) and a read-only shallow clone of
`runner_sports_demon@d517ca4` (main). **No database, Vercel project, scheduled job execution, or embedding
store was inspected** — see "Not inventoried" at the end.

## Disposition codes

| Code | Meaning |
|---|---|
| **RETAIN-MAPPED** | Kept because it maps to a replacement feature ID; must still be verified against that requirement before counting as built. |
| **REFERENCE** | Stays in place because it accurately documents running code/infra, but is no longer product policy. Carries a supersession banner. |
| **ARCHIVE** | Moved to `docs/archive/legacy-intelligence/` (outside active indexes). Not loaded by agents. |
| **DISABLE-AT-CUTOVER** | Keeps running until the replacement producer is live; must be switched off at cutover to avoid duplicate/conflicting output. |
| **REWRITE** | Active instruction surface that must be regenerated from the directive. |
| **PRESERVE-RECORDS** | User/financial/provenance records. Never deleted under this directive. |
| **FIXED** | Changed in this PR. |

## A. `runner_sports-site` (this repository)

### A1. Active instruction surfaces (agent-loaded)

| Surface | Disposition | Action / status |
|---|---|---|
| `AGENTS.md` | REWRITE | **Done in this PR** — now points to the directive as governing scope; Demon/site boundary retained as infrastructure fact. |
| `CLAUDE.md` | REWRITE | **Done in this PR** — "Website priorities" replaced with replacement workstreams. |
| `.claude/skills/ui-ux-pro-max`, `.agents/skills/ui-ux-pro-max` | RETAIN-MAPPED | Design/a11y/data-honesty standard; maps to every UI feature. No legacy intelligence policy inside. |
| `.claude/skills/supabase*`, `.agents/skills/supabase*` | RETAIN-MAPPED | Vendor engineering skills, scope-neutral. |
| `.mcp.json` (Supabase MCP) | RETAIN-MAPPED | Infrastructure. |

### A2. Documentation

| File | Disposition | Notes |
|---|---|---|
| `docs/RUNNER_DATA_OWNERSHIP.md` | REFERENCE | Banner added. Ownership split is infrastructure fact; re-decide in ADR-001 once model strategy (DEP-MODEL-01) is set. |
| `docs/RUNNER_INTEGRATION_CONTRACT.md` | REFERENCE | Banner added. Describes live `runner_*` reads. |
| `docs/RUNNER_MCP_CONTROL_PLANE.md` | REFERENCE | Banner added. Maps to AI-001 / API-* only after re-verification. |
| `docs/RUNNER_RELAUNCH_CHECKLIST.md` | ARCHIVE | **Moved** to `docs/archive/legacy-intelligence/`. Relaunch plan of the superseded scope. |
| `docs/PORTFOLIO_CASE_STUDY.md` | REFERENCE | Public evidence note; truth boundary still valid. |
| `docs/ACCESS_CONTROL_QA.md`, `docs/PRODUCTION_UI_QA.md` | RETAIN-MAPPED | QA records → MEM-003, DQ-005. |
| `README.md`, `SETUP.md`, `DRIVE_SYNC.md` | REFERENCE | README links the directive. |

### A3. Product surfaces (routes / UI)

| Surface | Feature IDs | Disposition |
|---|---|---|
| `/odds`, `/api/markets` | ODD-001, VAL-002 | RETAIN-MAPPED (verify provider-to-screen trace) |
| `/props`, `/api/props` | ODD-002, PRP-001 | RETAIN-MAPPED |
| `/games`, `/games/[id]`, scoreboard components | ODD-006, ODD-007 | RETAIN-MAPPED |
| `/edge`, `/api/edges`, `lib/models/edgeCalculator.ts` (RSA EDGE MODEL v0.1) | VAL-001, CAL-003 | RETAIN-MAPPED **as market-derived EV only**; must not be labeled a Runner predictive model. |
| `lib/models/marketConfirmation.ts` | ODD-002 | RETAIN-MAPPED |
| `/picks` ("For You" edge board) | PCK-007 | REWRITE — must become origin-labeled, snapshot-backed picks. |
| `/models`, `lib/data/models.ts` | PRJ-003 | REWRITE — model cards per directive; current entries are legacy heuristics with zeroed metrics. |
| `/systems` | SYS-001..003 | **FIXED** — illustrative system records (records/units/ROI/win%) removed; explicit "not connected" state. |
| `/research`, `/research/[sport]`, `/research/injuries`, `/teams`, `/players` | RSC-*, NAV-001 | RETAIN-MAPPED |
| `/tracker`, `/api/tracker`, `tracked_bets` | TRK-002 | RETAIN-MAPPED + **security finding SEC-01** (see below) |
| `/performance`, `/api/performance/*`, `lib/juice-reel/*` | TRK-001, TRK-003, TRK-004 | RETAIN-MAPPED (admin-only import; becomes one provider import path) |
| `/analytics` | TRK-004 | RETAIN-MAPPED |
| `/prediction-markets`, `/markets` | PMK-001, ODD-004 | RETAIN-MAPPED |
| `/pricing`, `/billing`, `/account`, Stripe webhook, `lib/billing/plans.ts` (Runner Pro / Runner Command) | MEM-001..004 | RETAIN-MAPPED; plan names/entitlements pending DEP-COMM-01. |
| Veteran discount (`/api/veteran-discount/*`) | MEM-004 | RETAIN-MAPPED |
| `/mcp` (runner-sports-intelligence v0.3.0) | AI-001, API-001 | REFERENCE until AI/API contracts are defined; control tools stay allowlisted. |
| `/api/runner/*` (status, live, signals, game-flow, totals, pick-health) | OPS-001, OPS-002, PRJ-002 | REFERENCE — legacy Demon intelligence reads; re-map after model strategy decision. |
| `/dashboard`, `/sportsbooks` | NAV-* | REFERENCE — re-scope during NAV-003 route map. |

### A4. Scheduled producers (`vercel.json`)

| Job | Writes | Disposition |
|---|---|---|
| `/api/cron/sync-odds` (*/15) | `games`, `market_movements`, **`signals`** (RSA EDGE v0.1) | Odds ingestion RETAIN-MAPPED (ODD-*). `signals` generation **DISABLE-AT-CUTOVER** once replacement picks/EV producer exists — prevents conflicting calculations. |
| `/api/cron/sync-prediction-markets` (*/10) | `prediction_markets*` | RETAIN-MAPPED (PMK-001), pending DEP-DATA-09 terms. |
| `/api/cron/sync-espn` (*/5) | `espn_records`, `team_registry` | RETAIN-MAPPED (RSC-*, ODD-007), pending DEP-DATA-05 (ESPN endpoints are unofficial). |

No notification producers exist in this repo (no email/push/alert jobs found) — no duplicate-notification risk here.

### A5. Data stores (Supabase migrations) — see [MIGRATION_MANIFEST.md](./MIGRATION_MANIFEST.md)

## B. `runner_sports_demon` (read-only inventory; not modified — no push access in this session)

| Surface | Count | Disposition |
|---|---|---|
| `plugin/runner-sports-analytics/` (canonical source of the installed Claude plugin, v0.1.0; skills `intelligence-desk`, `slate-research`, `live-desk`, `media-research`, `engineering-handoff`, `campaign-director`; lock `RUNNER-GPT-LOCK-20260925-V1`; `RSA_Go_Live_Plan.md`) | 6 skills + refs | **REWRITE** (directive step 6). `intelligence-desk` lock and go-live plan → ARCHIVE; `engineering-handoff`, `campaign-director` → RETAIN-MAPPED after edit; `slate-research`/`live-desk`/`media-research` → re-map to RSC-*, ODD-007, MED-*. **Blocked:** needs push access to the Demon repo and plugin re-publication. |
| `.github/prompts/*.prompt.md` (Copilot) | 27 | REWRITE — `runner-*` intelligence prompts (slate, pregame, live, halftime, totals, team-total, props, best, verse, calibrate…) → ARCHIVE; generic `audit-repo`, `debug-runtime`, `implement-feature`, `verify-release` → RETAIN-MAPPED. |
| `.github/agents/*.agent.md` (Copilot) | 18 | REWRITE — intelligence personas (totals-specialist, game-flow-analyst, verse-historian, market-intelligence…) → ARCHIVE; `debugger`, `qa-release`, `data-pipeline` → RETAIN-MAPPED. |
| `.github/copilot-instructions.md` | 1 | REWRITE from the directive. |
| Root policy docs (`RUNNER_INTELLIGENCE_STATE.md`, `RUNNER_RESEARCH_MEMORY.md`, `SIGNAL_REGISTRY.md`, `TOTALS_ENGINE.md`, `MODEL_NOTES.md`, `MODEL_REGISTRY.*`, `PROJECT_HANDOFF.md`, `VSCODE_AGENT_PLAYBOOK.md`, `ENTERPRISE_RESOURCE_CONTROL_PLANE.md`) | 9+ | ARCHIVE as policy; technical facts (`DATA_SCHEMA.md`, `DATA_SOURCES.md`, `DATA_SOURCE_REGISTRY.md`, `ARCHITECTURE.md`, `BACKTESTING.md`, `HISTORICAL_DATA_WORKFLOW.md`) → REFERENCE. |
| `src/` engine (connectors odds-api/polymarket, normalization, state, models vig/probability/pregame, signals/divergence, totals, game-flow, adversity, publishing) | ~40 files | Infrastructure. RETAIN-MAPPED candidates for ODD-*, PRJ-*, OPS-*; each must pass the directive's evaluation bar before reuse. `publishing` → DISABLE-AT-CUTOVER for superseded `runner_*` outputs. |
| `contracts/*.schema.json` | 10 | REFERENCE → basis for the Developer-platform data contracts (API-*). |
| `.runner/` (handoffs, audit, command registry, sync manifest, empty predictions/model-runs/postgame) | — | Handoffs → REFERENCE; command registry → re-map OPS-*. |
| `scripts/push-runner-intel.mjs`, `runner-drive-sync.ps1`, `install-drive-sync-task.ps1` | 3 | DISABLE-AT-CUTOVER (publication/scheduled producers). Windows scheduled task state on the owner's machine **not verifiable from here**. |

## C. Not inventoried (blocked — report individually)

| Item | Why | Needed |
|---|---|---|
| Supabase row counts, RLS state, stored embeddings | Supabase MCP failed to connect (proxy tunnel error); no DB credentials in session | Reconnect Supabase MCP or run the manifest count queries |
| Vercel cron execution state / production deployment | Not queried in this pass | Vercel project read |
| Installed plugin copies on other devices / ChatGPT GPT "Runner lock" / Gemini knowledge | Outside repo | Owner-side inventory |
| Dropbox / Google Drive legacy reports | Not in scope of this pass | Drive/Dropbox listing |
| Windows scheduled tasks (Drive sync) | Owner machine | Owner-side check |

## D. Security findings surfaced during inventory

| ID | Finding | Severity | Status |
|---|---|---|---|
| SEC-01 | `GET/POST /api/tracker`, `/api/tracker/[id]`, `/api/tracker/summary` have no authentication; middleware does not cover `/api/tracker`; `tracked_bets` has no owner column, and writes use the service-role client. Anyone can read or insert tracked bets. | High | **Open — not changed in this PR** (needs owner decision on who may write; see report). |
| SEC-02 | Read APIs for premium data (`/api/props`, `/api/edges`, `/api/signals`, `/api/runner/*`, etc.) are not entitlement-gated while the matching pages are paywalled. | Medium | Open — resolve with MEM-003 entitlement map. |
