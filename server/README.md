# Typescale Garden Server

This server's main purpose is to store the and handle the saved typographic scales for each user, as well as to directly connect those with the figma plugin.

It runs as a Cloudflare Worker: an Express app bridged into the Workers runtime by
`httpServerHandler` from `cloudflare:node` (see `src/index.ts`).

## Storage

Typescales live in **Cloudflare D1** (SQLite), reached through the `DB` binding
declared in `wrangler.jsonc`. `src/db/d1.ts` is the only module that talks to it.

Two databases are bound:

| Database                | Used by                                | Binding field         |
| ----------------------- | -------------------------------------- | --------------------- |
| `typescale-garden-prod` | deployed Worker                        | `database_id`         |
| `typescale-garden-dev`  | `wrangler dev --remote`                | `preview_database_id` |
| local SQLite file       | plain `wrangler dev` (.wrangler/state) | —                     |

The schema is in `migrations/`. Because SQLite has no nested documents, the 11
`base.*` settings are columns; `src/db/d1.ts` re-nests them into `base` so the JSON
on the wire is unchanged.

### Common commands

```bash
npm run dev                  # local Worker + local SQLite
npm run deploy               # deploy the Worker
npm run cf-typegen           # regenerate worker-configuration.d.ts after editing wrangler.jsonc

npm run db:migrate:local     # apply migrations/ to the local SQLite file
npm run db:migrate:preview   # ...to typescale-garden-dev
npm run db:migrate:remote    # ...to typescale-garden-prod
```

A fresh local database starts empty. To get the three default typescales (and every
user's saved scales) load the snapshot committed at `scripts/atlas-import.sql`:

```bash
npm run db:migrate:local && npm run db:import:local
```

## History: migrated off MongoDB Atlas

Storage was MongoDB Atlas via Prisma. The Mongo driver does not survive on Workers —
its background SDAM monitors need timers that live across requests, which the runtime
freezes between invocations — so it moved to D1.

Notes for anyone reading old code or data:

- `id` is still the original ObjectId hex string for every migrated row, because the
  client persists typescale ids. New rows get a `crypto.randomUUID()` instead. Both
  are opaque strings to the client.
- Prisma's `@default(now())` / `@updatedAt` have no D1 equivalent, so `createdAt` and
  `lastModifiedAt` are set explicitly in `src/db/d1.ts` as ISO-8601 strings.
- `overrides` was `Json?`, is unused by the client, and was NULL in every Atlas
  document. It survives as a nullable JSON `TEXT` column.
- `scripts/export-atlas.mjs` is the one-off exporter that produced
  `scripts/atlas-export.json` (audit trail) and `scripts/atlas-import.sql`. It needs
  `DB_STRING` in `.dev.vars` and the `mongodb` devDependency, both kept only so the
  export stays reproducible. Re-running it is safe — the SQL is `INSERT OR REPLACE`
  keyed on the original ids.
- The `Typescale` type the client imported from `@prisma/client` now lives at
  `client/src/models/typescale.ts`.
