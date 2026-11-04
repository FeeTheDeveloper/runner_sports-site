# Runner Sports & Analytics — Intelligence Replacement Directive

> **Status in this repository:** ACTIVE. This is the governing product scope for
> `runner_sports-site`. Committed 2026-11-04 from the owner directive as issued.
> Supporting records: [README](./README.md) · [Supersession map](./SUPERSESSION_MAP.md) ·
> [Feature register](./FEATURE_REGISTER.md) · [Dependency register](./DEPENDENCY_REGISTER.md) ·
> [Migration manifest](./MIGRATION_MANIFEST.md) · [Architecture decisions](./ARCHITECTURE_DECISIONS.md)

Owner: Alfreddie Postell II / King Fee
Decision date: November 3, 2026 (America/Chicago)
Status: Owner-directed replacement scope; implementation and exhaustive parity audit pending.

## Objective

Replace the existing Runner intelligence product scope with a comprehensive sports research and betting tools platform benchmarked against BettingPros. Functional breadth and workflow depth are the target. Runner owns its identity, interface, analysis and implementation. Build an independently developed product; use licensed data and original content.

This directive supersedes previous Runner intelligence positioning, source-priority assumptions, feature restrictions and analytic workflow prescriptions wherever they conflict with the new product scope. Historical documents become reference material rather than active instructions. No old intelligence feature is automatically grandfathered in: retain it only when mapped to the replacement requirements.

## Current condition and evidence boundaries

The installed Runner instructions describe an existing intelligence desk and identify FeeTheDeveloper/runner_sports-site as the presentation repository and FeeTheDeveloper/runner_sports_demon as the intelligence repository. These repository identities are leads for Claude to verify, not evidence of current code or production health. No current repository, database, scheduled job or deployment was audited or modified in preparing this handoff.

Public BettingPros pages were reviewed. Navigation establishes advertised feature families, not full behavior. Interactive tables, authenticated tools, entitlements, mobile interactions, hidden states, calculations and proprietary methods remain unverified. This document is an initial replacement scope, not an exhaustive feature certification.

## Observed benchmark catalog

Public navigation advertises picks, props, odds, tools, research and prediction markets. Listed capabilities include prop analyzers and cheat sheets; projections; expert/community picks and accuracy; smart-money and systems picks; market-based EV; parlay tools; PrizePicks/Underdog optimizers; game/prop/futures odds; calculators; stats/trends; sport-specific reports; brackets; media; sportsbook sync; API access; and an AI assistant.

Sports listed include NFL, NBA, NCAAF, NHL, NCAAB, MLB, WNBA, UFC, golf and soccer, with additional sections for NASCAR, tennis, Olympics, horse racing, boxing and entertainment. A listed section does not imply every tool supports that sport.

Source: https://www.bettingpros.com/

The premium page advertises Plus and Elite, with Sharp AI and Betting Systems on Elite. Exact limits and full entitlements require verification.
Source: https://www.bettingpros.com/premium/

The API overview advertises REST JSON containing odds, props and projections, with membership-dependent access. Commercial redistribution rights and operational suitability have not been established.
Source: https://www.bettingpros.com/sports-betting-api/

The public prop page exposes an analyzer heading and AI entry point; its rendered research table was not inspectable in the retrieved text. The sync link redirects to a sports-apps page; actual account-linking behavior is unverified.
Sources: https://www.bettingpros.com/nfl/props/ and https://www.bettingpros.com/sports-betting-apps/?action=sync

## Proposed Runner replacement requirements

The following are Runner design requirements, not claims about BettingPros implementation.

| Workstream | Required Runner outcome | Completion evidence |
|---|---|---|
| Discovery and navigation | Sport hubs, market search, date selection, consistent routes and mobile navigation | Route map and desktop/mobile walkthroughs |
| Games and odds | Comparable market definitions, current prices, provider coverage, timestamps, movement history and explicit stale states | Provider-to-screen trace for sample events |
| Player research | Searchable profiles, game logs, relevant splits, opponent context, sample sizes and injury context | Reproducible filters and cited source data |
| Projections and value | Versioned estimates, fair probabilities, market comparison, uncertainty and documented ratings | Model cards, calibration and out-of-sample evaluation |
| Picks and consensus | Distinguishable model, editorial, expert and community selections with traceable histories | Immutable publication snapshots and audited results |
| Combination tools | Configurable legs, restrictions, payout rules, dependency handling and comparison | Payout fixtures and correlated-leg validation |
| Systems research | Saved filters, historical evaluation and reproducible methodology | Leakage controls and time-separated evaluation |
| Tracking | Manual entries, provider-supported imports, settlement, corrections, profit/loss and exports | Reconciliation and duplicate-import checks |
| AI research interface | Questions answered from authorized current Runner data with source traceability | Grounding, stale-data and access-control evaluations |
| Membership | Configurable entitlements, account lifecycle, billing states and support | Access matrix and billing lifecycle checks |
| Editorial and community | Publishing workflow, moderation, profiles, disclosures and corrections | Role permissions and correction audit trail |
| Developer platform | Documented data contracts, API authentication, quotas and usage visibility | Contract and authorization checks |
| Operations | Feed monitoring, model runs, settlement queues, content controls and incident handling | Operations walkthrough and recovery rehearsal |

All benchmark sports and peripheral sections remain in the discovery backlog. For each sport, verify individual feature availability rather than duplicating a universal menu. Implementation sequencing does not remove deferred features from the agreed parity target.

## Required exhaustive audit

Create a feature register with one row for each distinct feature and subfeature. Record:

- Feature ID, sport, platform, reference URL and observation date.
- Evidence status: observed public, observed authenticated, advertised only, inferred, or unknown.
- Entry points, user goals, inputs, defaults, filters, columns, sorting, charts, actions and exports.
- Desktop/mobile behavior, persistence, account requirements and subscription restrictions.
- Loading, empty, unavailable, stale, error and permission-denied states.
- Data sources, update timing, market definitions and settlement rules.
- Proposed Runner behavior, original visual design, dependencies and acceptance criteria.
- Implementation status, reviewer, verification evidence and unresolved differences.

Audit onboarding, search, personalization, saved research, notifications, billing, account deletion, support and accessibility as discovery questions. Their specific BettingPros behavior has not been established here.

Do not mark a feature complete because a route exists. Completion requires working data, interactions, access rules and failure states. Record premium access gaps explicitly; do not infer concealed formulas from marketing language.

## Replacement and migration handoff for Claude

1. Confirm repository identities and inspect current branches, instruction files, architecture, runtime dependencies and deployment destinations. Read local instructions without exposing secrets.
2. Inventory all legacy intelligence surfaces: plugin rules, knowledge indexes, prompts, model jobs, source adapters, stored embeddings, scheduled tasks, reports, dashboards and automated outputs. Distinguish product content from user records and infrastructure.
3. Commit this owner directive and a supersession map into the canonical repository. Remove legacy intelligence instructions from active loading and retrieval. Archive versioned historical material outside active indexes so old policy cannot silently return.
4. Establish a recoverable snapshot and migration manifest. Preserve user accounts, historical picks, tracked transactions, billing records and source provenance. The scope replacement is not authorization to indiscriminately erase these records.
5. Implement the replacement behind a controlled transition. Reuse infrastructure only after verifying it serves the new requirements. Disable obsolete producers and publication jobs during cutover; prevent duplicate notifications and conflicting calculations.
6. Update the Runner plugin, knowledge references and Claude/Gemini/Copilot handoffs from the same canonical requirements. Keep Fee The Developer Main as the project persona.
7. Verify restoration and cutover. Return changed paths, commit identifiers, migration results, checks and deployment evidence. Report blocked features individually.

This handoff contains no implementation code and does not claim that the installed plugin has already been rewritten.

## Dependencies and decisions needed

Proceed with discovery and repository audit now. Before committing paid or externally dependent capabilities, resolve:

- Data contracts: sports, historical depth, live latency, caching, derived outputs and commercial display/redistribution rights.
- Model strategy: independently developed Runner estimates versus licensed third-party estimates; label each origin.
- Integration access: supported account synchronization provider and explicit consent/revocation flow.
- Commercial design: Runner plan names, entitlements, prices, launch regions and supported platforms.
- Coverage order: recommended first delivery is one complete sport/market workflow, followed by verified expansion; the full feature register remains the scope.
- Legacy content disposition: archive by default; specific permanent deletion requires an exact inventory and retention assessment.

A personal premium subscription is not evidence of commercial data rights. Evaluate BettingPros' advertised API as a potential dependency only after reviewing its actual terms and obtaining the needed agreement.

## Security considerations

Keep Runner credentials, customer information and data stores separated from portfolio entities. Store secrets server-side. Enforce tenant and role permissions on every protected operation. Keep administrative and provider credentials out of browser code, prompts, logs and downloadable handoffs. Use consent-based integrations and support revocation. Preserve separation between sponsorship and analytical conclusions.

Maintain clear source attribution, data timestamps and estimate origins. Never label copied or licensed third-party predictions as Runner-generated model output. Develop Runner branding, text, components and methods independently. Research access does not authorize wagering or automatic transactions.

## Acceptance criteria and verification

- Every discovered benchmark feature maps to a Runner requirement, a verified unsupported dependency or a documented backlog item; unknowns remain visible.
- Legacy scope is absent from active prompts, retrieval indexes and scheduled intelligence outputs after cutover.
- Every published recommendation resolves to its source snapshot, market, price, publication time and model/editorial origin.
- Odds formats, voids, pushes, settlement corrections, combination payouts and provider duplicates are verified with meaningful fixtures.
- Projection quality is evaluated on time-separated data; uncertainty and calibration are reported before performance claims.
- Subscription restrictions and private records pass authorization checks across users and entities.
- Missing feeds produce explicit unavailable or stale states; no invented lines, hit rates or performance records fill the gaps.
- Supported mobile and desktop workflows pass end-to-end review, including error states and accessibility.
- Migration counts reconcile, rollback is demonstrated and monitoring detects feed/model/settlement failures.

## Completion evidence required

Return the feature register, legacy supersession map, architecture and data-flow decisions, dependency register, migration manifest, commit/PR references, meaningful test results, workflow demonstrations and remaining parity gaps. Separate planned, built, verified and deployed status. A complete-looking interface is insufficient evidence of complete intelligence replacement.
