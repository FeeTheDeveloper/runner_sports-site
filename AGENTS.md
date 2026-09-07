# Runner Sports Site — Agent Operating Contract

## Repository
`FeeTheDeveloper/runner_sports-site`

This repository is the public/product presentation layer for Runner Sports & Analytics and deploys the website. The sibling `runner_sports_demon` repository is the local-first quantitative/live intelligence engine.

## Shared development environment
Codex, Claude Code, GitHub Copilot, and VS Code use this repository as the source of truth for website implementation. Do not create agent-specific forks of production logic.

Before changing code:
1. Read repository documentation and inspect the relevant app/lib/provider implementation.
2. Check git status/current branch.
3. Preserve working behavior unless the task explicitly changes it.
4. Treat the Demon as an upstream intelligence source, not as duplicated website logic.

After changing code:
1. Run `npm run build`.
2. Run lint/tests when available and relevant.
3. Review the diff.
4. Update docs/env contract when interfaces, feeds, routes, or deployment behavior changes.

## Environment contract
`.env.example` defines variable names. Real credentials belong only in `.env.local`, local runtime configuration, or Vercel environment variables. Never commit API keys, Clerk/Stripe secrets, Supabase service-role keys, Kalshi private keys, webhook secrets, or Drive credentials.

## Runner architecture boundary
`runner_sports_demon` = ingestion, normalization, game state, models, probabilities, signals, replay/backtesting, intelligence generation.

`runner_sports-site` = website, customer-facing dashboards, authenticated product UX, subscriptions, visualization, public/premium intelligence presentation, and approved API consumption.

Do not duplicate the Demon database or model engine inside the website. Consume approved normalized intelligence through stable APIs/data stores.

## Google Drive bridge
The company Drive is a reporting/research bridge, not the live website database. Local Drive sync may exchange reports, research specifications, content packages, and approved website intelligence artifacts. Never expose raw secrets or private local database files through the public site.

## Source control/deployment
Use focused branches/commits and PRs. `main` is production-bound. Vercel environment variables remain deployment secrets. Do not force-push or rewrite shared history without explicit authorization.
