# Feature name

CI auto deploy on server

## Description

Auto deploy BE to CF worker when server code is merged to main

## Status — done

`.github/workflows/deploy-server.yml`. A push to main that touches anything ending up in the Worker
bundle type checks it, bundles it, applies pending D1 migrations and runs `wrangler deploy`, then
smoke tests the result. `workflow_dispatch` redeploys the current main without an empty commit.

| step       | command                                     | why                                              |
| ---------- | ------------------------------------------- | ------------------------------------------------ |
| gate       | `npx turbo run check build --filter=server` | `tsc --noEmit` + `wrangler deploy --dry-run`     |
| migrations | `npm run db:migrate:remote` in `server/`    | before the upload, so no code outruns its schema |
| deploy     | `npm run deploy` in `server/`               | `wrangler deploy`                                |
| smoke test | `GET /api/fonts`, 3 attempts                | proves the deployed Worker actually answers      |

Paths watched: `server/**`, `core/**` (the Worker bundles it), `types/**`, and the root manifests —
a dependency bump changes the bundle without touching `server/`.

### Setup still required on the repo

Two **repository secrets**, without which the first run fails at the credentials check with a named
error rather than hanging on wrangler's OAuth flow:

- `CLOUDFLARE_API_TOKEN` — needs Workers Scripts: Edit, D1: Edit, and Workers KV Storage: Edit.
- `CLOUDFLARE_ACCOUNT_ID` — `wrangler.jsonc` carries no `account_id`, and inference is ambiguous
  when a token can see more than one account.

The job declares `environment: worker-production`; creating that environment in Settings is optional
(it is auto-created on first use) but is where a required-reviewer gate would go.

### Deliberately not done

- **Secrets are not deployed.** `JWT_SECRET`, `SESSION_SECRET` and `FONTS_API_KEY` live on
  Cloudflare via `wrangler secret put` and survive a deploy, so CI needs no copy of them.
- **No rollback.** D1 migrations are forward-only and `wrangler rollback` is a separate manual
  decision; a bad migration is corrected by the next one.
- **Not folded into `e2e.yml`.** Different triggers, and that workflow's jobs deliberately exclude
  `client#check` / `client#lint` for being known-failing on main.
