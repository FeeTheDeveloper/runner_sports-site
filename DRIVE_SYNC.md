# Runner Sports Site — Google Drive Sync

## Purpose
Define the local Google Drive Desktop bridge used by the website development environment. Drive transports company research, approved intelligence reports, website/content requirements, and deployment/reporting artifacts. It is not the production website database.

## Company Drive lanes
Existing Runner Sports warehouse folders:

### Drive -> local development
`00 VS Code Outbox - IMPORT TO LOCAL`
Folder ID: `1tnRhBIik9rApeQUEI9BrytZnrE9oUU7A`

Use for approved company inputs such as:
- research intake
- model/signal specifications relevant to website presentation
- market/competitor research
- content requirements
- dashboard requirements
- approved Demon intelligence/report packages

### Local development -> Drive
`08 VS Code Inbox - EXPORT FROM LOCAL`
Folder ID: `1x8UsvxpuxG9TAfXSYVk757LzIyB3kn3y`

Use for:
- website QA reports
- dashboard snapshots/reports
- release notes
- deployment reports
- data/source-health summaries intended for company review
- product analytics exports
- implementation handoffs

## Local paths
Google Drive Desktop determines the actual filesystem path. Do not hardcode a user-specific absolute path in Git.

Recommended local-only environment variables:

```env
RUNNER_SITE_DRIVE_IMPORT_DIR=
RUNNER_SITE_DRIVE_EXPORT_DIR=
RUNNER_DEMON_API_URL=http://localhost:8787
```

These values belong in `.env.local`, never committed.

## Data flow

```text
Runner company Drive
  -> Drive Desktop
  -> RUNNER_SITE_DRIVE_IMPORT_DIR
  -> website development/research ingestion
  -> runner_sports-site
  -> build/QA/product output
  -> RUNNER_SITE_DRIVE_EXPORT_DIR
  -> Drive Desktop
  -> company Drive
```

Live website intelligence follows a separate path:

```text
runner_sports_demon
  -> normalized API / approved shared data store
  -> runner_sports-site server layer
  -> customer dashboard
```

Do not make Google Drive the transport for latency-sensitive live game/market updates.

## Security
Never sync `.env`, `.env.local`, Kalshi private keys, Supabase service-role credentials, Stripe/Clerk secrets, webhook secrets, raw authentication material, or other production credentials into the company reporting folders.
