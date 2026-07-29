# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Typescale Garden (https://typescalegarden.uy) helps designers build typographic scales for a design
system. An npm-workspaces monorepo, task-run by **Turborepo** (`turbo.json` at the root, plus
per-package `turbo.json` overrides), with four packages — the workspace names are the short directory
names (`client`, `core`, `server`, `plugin`), which is what `--filter` takes:

- `core/` — the typescale math, the CSS/token generators and the shared types. Pure and
  runtime-agnostic; see "The scale itself lives in core/" below.
- `client/` — SvelteKit 4 app, the actual tool. Computes the scale and exports it as CSS or as Figma
  design tokens (JSON). Deployed to Cloudflare Pages (`@sveltejs/adapter-cloudflare`).
- `server/` — Express app running **as a Cloudflare Worker**, backed by **D1**. Stores users' saved
  typescales, and serves the Google Fonts catalogue it refreshes on a daily Cron Trigger. Deployed
  with wrangler to `api.typescalegarden.uy`.
- `plugin/` — Figma plugin ("Typescale Garden Import Tool"). Turns a scale into Figma text styles,
  either from an exported tokens JSON pasted in by hand or — after pairing with an account — from the
  user's saved scales, fetched from the Worker and computed locally with `core`.

There used to be a fifth package, `services/`, holding standalone Node scripts. Its only two
inhabitants both moved out — `WEIGHTS_MAP` into `core`, and the Google Fonts snapshot generator into
the Worker's `scheduled` handler — so it was deleted along with the `@services/*` path alias and the
`create:fonts-file` script.

## Commands

From the repo root — these fan out through turbo to every package that defines the script:

```bash
npm run build             # client bundle, worker dry-run, plugin code.js, core dist
npm run check             # type check everything (svelte-check, tsc --noEmit ×4)
npm run lint              # eslint / prettier per package
npm test                  # client + core vitest (one pass) and the plugin's node script
npm run dev               # every dev server at once
npm run client            # turbo run dev --filter=client   → vite dev --host
npm run server            # turbo run dev --filter=server   → wrangler dev
npm run deploy:server     # build + check first, then wrangler deploy
npm run format            # prettier --write across the whole repo (not a turbo task)
```

Anything can be scoped without cd-ing: `npx turbo run check --filter=server`. Note turbo scopes to the
package containing the **cwd**, so run root-level commands from the repo root. `--force` skips the
cache, `npx turbo run build --dry` prints the resolved task graph.

Client (`cd client`):

```bash
npm run dev
npm run build
npm run check             # svelte-kit sync && svelte-check — the type check for .svelte + .ts
npm run lint              # prettier --check && eslint
npm test                  # vitest --run (one pass; `npm run test:watch` for watch mode)
npx vitest src/stores/config.test.ts        # single test file
npx vitest -t "letterSpacing"               # single test by name
```

Server (`cd server`):

```bash
npm run dev               # local Worker + local SQLite under .wrangler/state
npm run check             # tsc --noEmit
npm run build             # wrangler deploy --dry-run
npm run deploy
npm run cf-typegen        # regenerate worker-configuration.d.ts after editing wrangler.jsonc

npm run db:migrate:local  # apply migrations/ to local SQLite  (…:preview, …:remote for the others)
npm run db:import:local   # load scripts/atlas-import.sql — a fresh local DB is otherwise empty
```

Plugin (`cd plugin`): `npm run build` (esbuild, via `build.mjs` → `code.js`, which is committed and is
what Figma loads), `npm run check`, `npm run lint`, `npm test`, `npm run dev` for watch mode. Note
`dev` no longer type checks — esbuild only transpiles, so run `npm run check:watch` alongside it if
you want that. `plugin#test` runs the _bundle_, so `plugin/turbo.json` gives it `dependsOn: ["build"]`.

`code.ts` is **bundled**, not merely transpiled. Figma's sandbox has no module loader — it evaluates
`code.js` as one script — so the moment the plugin imports `core` the dependency graph has to be
flattened into a single IIFE. `tsc` could not do that, which is why the emit moved to esbuild while
`tsc --noEmit` stayed on as `check`. The plugin's tsconfig therefore uses `moduleResolution: Bundler`,
which both follows core's `exports` map and tolerates the `.js` extensions core's `.d.ts` files carry.
esbuild is pinned to the `0.24.2` already hoisted at the root and already listed in the root
`allowScripts`, so it needs no new install-script approval.

There is no test suite for the server. The others: `client/src` and `core/src` use vitest, and
`plugin/test/plugin.test.mjs` is a single dependency-free node script (run by `npm test` like the
rest) that executes the built `code.js` in a stubbed Figma sandbox.

### Turborepo layout

Root `turbo.json` declares the task shapes: `build`/`check`/`test` depend on `^build` (a package's
dependencies build first), `dev` and `test:watch` are `persistent` + uncached, `deploy` depends on
`build` and `check`. Cache keys include the root `tsconfig.json`, `types/**` and the root `.env*`
files (`globalDependencies`) plus every `PUB_*` var, since those are inlined into the client bundle at
build time. Cacheable outputs are declared per package in `client/turbo.json`, `core/turbo.json` and
`plugin/turbo.json`; the server emits nothing (its build is a dry-run), so it needs no override. The
`db:*` scripts are deliberately outside turbo — they mutate a real database and must never be cached.

Known pre-existing failures, unrelated to turbo: `client#check` (18 svelte-check errors) and
`client#lint` (the client's `.eslintrc.cjs` fails to load, plus wide prettier drift). `client#test`
used to fail on 3 letterSpacing assertions; rewiring the client onto `core` fixed those, and
`build` and `test` are now green across every package.

## Architecture

### The scale itself lives in `core/`

`core/` owns the computation: `buildTypescale` (sizes, line heights, letter spacing),
`availableWeightsFor` / `clampHeadingWeights` / `weightStepsFor` / `distributeWeights`,
`generateCss`, `buildTokens` / `generateTokens`, and `computeTypescale` — the composed
`base + availableWeights → scale` entry point for consumers that just want the answer. The shared
types (`TypescaleBase`, `Typescale`, `TypeVariant`, `ApiFont`, `DesignTokenSet`) live here too.

It exists so the client is not the only thing that can compute a scale — the Figma plugin and the
Worker need the same answers, byte for byte. Rules that keep it usable from all three:

- **Almost no ambient globals.** `tsconfig.json` pins `types` to exactly one entry:
  `plugin-typings`. No Node, no DOM, no Svelte. The Figma exception is deliberate — the design tokens
  exist to be imported into Figma, so `DesignTokenTextStyle` is a
  `Pick<TextStyle, "type" | "name" | "fontName" | "textCase" | "letterSpacing" | "lineHeight" | "fontSize">`
  rather than a parallel interface that can drift from Figma's API. It is a `Pick` and not the whole
  thing because `TextStyle` also carries a live style node's identity surface (`id`, `key`,
  `consumers`, `getStyleConsumersAsync()`), which a token payload cannot supply; picking only the
  emitted fields is what removes the four `@ts-ignore`s the original `generateTokens` needed. Widen a
  token by adding a field name to that `Pick`. Types only — plugin-typings emits no runtime code, so
  nothing reaches any consumer's bundle.
  - **Caveat, worth knowing before you use tokens somewhere new:** `TextStyle` is an ambient global,
    so `DesignTokenSet` is only type-safe in packages that have plugin-typings in scope — `core`,
    `plugin`, and `client` (which picks it up through the root `typeRoots`). In a package that does
    not, such as `server` with its explicit `types: ["node"]`, `skipLibCheck` hides the unresolved
    name and the type silently degrades to `any` instead of erroring. That is harmless today because
    tokens are generated in the plugin and the Worker never touches them; if the server ever does,
    add `"plugin-typings"` to its `types`.
- **No side effects.** `findFont` returns `undefined` instead of showing a notification;
  `clampHeadingWeights` returns what the weights _should_ be instead of setting a store. Callers own
  the effects.
- **`module: Node16`, so relative imports carry `.js` extensions.** Extensionless ESM would be fine
  for vite/esbuild but invalid for Node, and `server` is on TS 7 with NodeNext resolution.
- **Behaviour is pinned by golden fixtures** at `core/src/__tests__/fixtures/golden.json`, captured
  from the pre-extraction client store graph. `cssCode` and `designTokens` are asserted as exact
  strings because users copy, download and diff them. Two quirks are preserved on purpose and are
  _not_ bugs to fix: sizes round to the nearest even pixel, and `body { font-weight }` in the
  generated CSS is the _lowest_ weight (the original sorted its `weights` argument in place and then
  read index 0). Structured values are compared through a JSON round trip, because the fixtures
  cannot represent `-0` or `undefined`-valued keys.

> **Transitional:** `core/` is built and tested but not yet imported anywhere — the client still
> carries its own copy of the math in the files listed below. Rewiring it is the next change; until
> then the two must be kept in step, and the golden fixtures are what proves they are.

### The client's store graph in `client/src/stores/config.ts`

This is the heart of the app. It is a graph of Svelte writables (baseSize, baseUnit, desktopRatio,
mobileRatio, letterSpacingRatio, heading weights, …) feeding a chain of `derived` stores:

```
inputs → currentFont → availableWeights → weightSteps → distributedWeights
                                                     ↘
                        inputs ──────────────────────→ typescale (TypeVariant[])
                                                            ↓
                                              cssCode / designTokens
```

Anything visible in the UI is derived, never imperatively recomputed — add new outputs as `derived`
stores here rather than as component-local state. `typescaleObject` is the inverse: it packs the
writables back into the `{ name, base }` shape the API accepts. Loading a saved scale works by
`loadedTypescale.subscribe(...)` pushing each `base.*` field back into its writable.

Fonts come from `GET /api/fonts` on the Worker — see "The Google Fonts snapshot" below. `+layout.svelte`
fetches it on mount into the `fontsApiData` writable, which holds Google's `WebfontList` verbatim
(`{ kind, items }`). Two fallbacks sit behind it: the committed `client/static/fonts-data.json` if the
API is unreachable, and `core`'s one-family `mockFontsApi` if that fails too — which is why
`currentFont` can fall back with a plain `$fontsApiData || mockFontsApi`.

### Client → server

`stores/fetch.ts` exposes a **derived axios instance** — it rebuilds itself whenever the Auth0 access
token changes, so components should always use `$fetch`, never a bare axios import. Auth is Auth0
SPA (`@auth0/auth0-spa-js`), initialised in `routes/+layout.ts`; the access token is sent as a bearer
token and the Worker validates it with `express-oauth2-jwt-bearer` (RS256, audience = `PUB_API_URL`).

The premium tier is an Auth0 permission: `store:typescales-premium` raises the saved-typescale cap
from 5 to 100 (`server/src/controllers/typescales/index.ts`).

### Client → plugin

For **importing tokens** there is still no network link: the user copies/downloads the tokens JSON
from the Export modal and pastes it into the plugin UI, which messages `code.ts` to create/update
Figma text styles.

For **reading saved typescales** there now is one, via a pairing code — see below.
`manifest.json` allows `https://api.typescalegarden.uy`; to develop against a local Worker, change
both that list and `API_BASE` in `code.ts` (a plugin has no env system).

`code.ts` is the whole application — network, stored token, all document access — and `ui.html` is
presentation talking to it over `postMessage`. Two reasons the fetches live in the sandbox rather
than the iframe: Figma's sandbox `fetch` is not browser-CORS-governed (the manifest gates it
instead, so no preflight and no origin allowlist), and it keeps the bearer token out of the iframe
entirely. An unpaired install lists the community defaults rather than showing a login wall, and a
401 — the connection was revoked from the website — drops the token and quietly degrades to those
defaults.

**The plugin derives `availableWeights` itself** from `GET /api/fonts`, rather than the API
precomputing it. The Worker deliberately never parses that payload (see the fonts snapshot section:
the whole design treats it as opaque bytes to stay inside the Cron CPU budget), and doing it in the
plugin means the same core function runs over the same catalogue as the web app — which is what makes
the two emit identical tokens. The catalogue is fetched lazily on the first import, never just to
draw the list, and cached for the session.

**One deliberate divergence from the web app:** when the font is missing from the catalogue, the
website substitutes its fallback family and carries on, while the plugin refuses and imports nothing.
Writing 22 text styles in the wrong font into someone's document is worse than an error message.
core permits both — `findFont` returns `undefined` rather than falling back, so the caller decides
what absence means. `plugin/test/plugin.test.mjs` asserts both behaviours.

### Plugin auth — the pairing code

The plugin cannot run Auth0's login: Figma's sandbox has no redirect surface, and pasting a raw Auth0
access token into a plugin would hand it a credential valid against every other API scope. So the web
app (where the user is signed in) mints a short code, the user types it into the plugin once, and the
plugin swaps it for its own token. `server/src/db/plugin-auth.ts` owns the whole credential lifecycle;
`server/src/routes/plugin.ts` is deliberately the one router carrying more than one credential type,
so they stay visible side by side:

| route                                  | credential                              | why                                 |
| -------------------------------------- | --------------------------------------- | ----------------------------------- |
| `POST /api/plugin/pairing-codes`       | Auth0 (`checkUser`)                     | mints a code for the signed-in user |
| `POST /api/plugin/tokens`              | **none** — the code _is_ the credential | the plugin has nothing else yet     |
| `GET /api/plugin/typescales`           | plugin token (`checkPluginToken`)       | read-only, owner-scoped             |
| `GET`/`DELETE /api/plugin/connections` | Auth0 (`checkUser`)                     | list / revoke from the web app      |

Load-bearing details:

- **The plugin token is strictly weaker than an Auth0 token.** `checkPluginToken` sets `req.pluginAuth`,
  never `req.auth`, so a handler reading `req.auth?.payload.sub` cannot be reached with one by
  accident. Keep the plugin router read-only; writes stay behind `checkUser`.
- **Only hashes are stored**, for both codes and tokens, and every lookup is _by_ hash — so no app code
  ever compares against stored secret material and there is no constant-time comparison to get wrong.
  A 40-bit pairing code hash is admittedly brute-forceable offline; the real protections are its
  ten-minute TTL and single use.
- **Redemption is one conditional `UPDATE … RETURNING`** filtering on `consumedAt IS NULL AND
expiresAt > now`. SQLite picks the winner, so concurrent submissions of the same code cannot mint
  two tokens. Do not refactor this into a read-then-write.
- **All four redemption failure modes answer identically** (malformed, unknown, expired, already used)
  so the endpoint is not an oracle for which codes exist. Keep them identical.
- **`POST /api/plugin/tokens` is the one guessable endpoint in the API** and it needs a Cloudflare WAF
  rate-limiting rule on its path before the plugin goes to Figma review — application-level limiting
  is not available here (see the `express-rate-limit` note in `src/index.ts`). Unthrottled, 8 symbols
  over a 32-symbol alphabet gives ~1.1e12 possibilities against a ten-minute single-use window.
- `lastUsedAt` is refreshed at most hourly, so a busy plugin does not turn every read into a D1 write.
- Issuing a code sweeps that author's previous codes plus anyone's expired rows, so pairing needs no
  scheduled cleanup job.

**Testing this locally needs two env changes**, because the web app talks to the Worker for the first
time on this path: `PUB_API_URL` points at `http://localhost:3000` while `wrangler dev` listens on
**8787**, and `ALLOWED_ORIGINS` in `src/index.ts` does not include `http://localhost:5173`, so the
browser will report a CORS error. The redeem side needs neither — Figma's sandbox `fetch` is not
CORS-governed (it enforces `manifest.networkAccess` instead), and it can be exercised with `curl` by
seeding a row into `plugin_pairing_codes` with a hash you compute yourself.

### Server on Workers — the constraints that shaped it

Express is bridged into the Workers runtime via `httpServerHandler` from `cloudflare:node`
(`src/index.ts`), with `nodejs_compat`. Several idioms do not survive there and were removed
deliberately — read the comments in `src/index.ts` before re-adding anything:

- morgan's named formats compile with `new Function` → forbidden; pass a **format function**.
- `express-rate-limit` calls `setInterval` at module init → forbidden in global scope. Rate limiting
  belongs at the Cloudflare WAF / Rate Limiting binding level.
- `express.static` — no filesystem.
- MongoDB's driver keeps background monitors alive across requests → storage moved to D1.

CORS origins are an explicit allowlist in `src/index.ts`; a missing entry surfaces in the browser as
an opaque "CORS error", so add new client hosts there. The one exception is `GET /api/fonts` — see
below.

### The Google Fonts snapshot

`server/src/fonts/snapshot.ts` refreshes the catalogue from the Google Fonts API on a daily Cron
Trigger (`triggers.crons` in `wrangler.jsonc`, 04:17 UTC) into the `FONTS` KV namespace, and serves it
as `GET /api/fonts`. It replaced a committed `client/static/fonts-data.json` that could only be updated
by a Pages rebuild — and that had gone 20 months stale because the generator it relied on was never
actually invoked.

Four things here are load-bearing:

- **The cron never parses the payload.** A Cron Trigger gets 10ms of CPU on the free plan and the
  response is ~1.9 MB, so it is stored verbatim and validated with string checks only (a length floor
  plus the `"webfonts#webfontList"` marker). Waiting on fetch/KV I/O costs no CPU; `JSON.parse` would.
  This is also why what lands in KV — and therefore in `fontsApiData` — is Google's raw
  `{ kind, items }` with no wrapper.
- **Validation fails closed.** A non-2xx or implausible body throws _before_ the `KV.put`, leaving the
  previous snapshot serving. A missed day is invisible; an error page written over the catalogue would
  not be. Do not soften this into a warning.
- **`/api/fonts` is handled before Express**, in the `fetch` export rather than as a route, because
  `helmet()` sets `Cross-Origin-Resource-Policy: same-origin` (which blocks the client's cross-origin
  read) and Express's default weak ETag would hash 1.9 MB per request.
- **It answers with a static `Access-Control-Allow-Origin: *`,** not the echoing `ALLOWED_ORIGINS`
  allowlist. The response is cached, the Cache API keys on URL alone, and `Vary: Origin` is not
  honoured below Enterprise — so an echoed origin could be served to the wrong one. Safe because the
  catalogue is public, credential-free and GET-only. It also means the client must fetch it with plain
  `fetch`, never the `$fetch` axios instance, whose `Authorization` header would force a preflight.

`FONTS_API_KEY` is a Worker secret (`wrangler secret put`) and lives in `server/.dev.vars` locally.
Note that file is the _only_ source of local secrets — wrangler does not read the root `.env`, so
anything omitted from `.dev.vars` is simply undefined under `wrangler dev`. Trigger the cron by hand
with `curl "http://localhost:8787/cdn-cgi/handler/scheduled"`; `wrangler dev` never fires it on
schedule. The Cache API is a no-op on `*.workers.dev`, so cache behaviour is only observable on
`api.typescalegarden.uy`.

### D1 access

`server/src/db/` is the **only** place that touches the database — `d1.ts` for typescales,
`plugin-auth.ts` for pairing codes and plugin tokens. The binding itself is still resolved in exactly
one function, `d1.ts`'s exported `db()`, which `plugin-auth.ts` imports; that is the invariant worth
keeping, rather than "one module holds every query". `d1.ts` reaches the `DB` binding via
`import { env } from "cloudflare:workers"` (Express handlers run outside the `fetch(request, env, ctx)`
signature). SQLite has no nested documents, so the 11 `base.*` settings are real columns; that module
flattens them going in and re-nests them going out, so the JSON on the wire is unchanged from the
Mongo era. Consequences to respect when changing the schema:

- `BASE_COLUMNS` in `d1.ts` must stay in sync with `migrations/0001_create_typescales.sql`.
- Request bodies are untrusted and arrive with strings where numbers belong; `baseBindValues` coerces
  per column and throws `BadTypescaleError` (→ 400) rather than letting anything reach SQLite.
- `id` is a TEXT column: migrated rows keep their original ObjectId hex, new rows get
  `crypto.randomUUID()`. Both are opaque to the client, which persists ids.
- `createdAt` / `lastModifiedAt` have no D1 default and are set explicitly as ISO-8601 strings.

### Types

Root `tsconfig.json` maps `@tsg-types` → `types/index` (Google Fonts API shapes). The alias is not
imported anywhere yet. `Typescale` now comes from `core` (the client's own
`src/models/typescale.ts` is gone), but it is still hand-written and must be kept in step with the
server's interfaces in `db/d1.ts`; nothing is generated from the other.

#### The TypeScript version is deliberately not uniform

`server` is on **TypeScript 7**; `plugin` is on **6.0.3** and `client` on **5.x**. This
split is forced, not an oversight. TS 7 is the native (Go) compiler and its npm package exports only
`lib/version.cjs` — the JS compiler API is gone (moved to a different `typescript/unstable/*` surface)
and there is no `tsserver`. So a package can be on 7 only if it uses nothing but the `tsc` CLI, which
is true of `server`. Everything else in the toolchain — `typescript-eslint`
(peer `>=4.8.4 <6.1.0`), `svelte-check` and `svelte-preprocess` (both `^5 || ^6`) — still calls
`ts.createProgram` / the language service, so it hard-crashes on 7 with
`Cannot read properties of undefined`. `plugin` sits at 6.0.3, the last release with the JS API,
purely so its type-aware eslint keeps working; the client is capped by svelte-check. Revisit when
those tools ship TS 7 support.

TS 7 changed five things this repo relied on, all already handled — don't reintroduce them:
`baseUrl` is removed (`paths` values are now relative to the file declaring them and must be written
`./`-prefixed); `strict` defaults to **true**; `@types` packages are **no longer included implicitly**,
so every package names what it needs in `types` (`node`, `plugin-typings`) and `typeRoots` now only
serves to resolve those names; and `rootDir` must be explicit when emitting, which is why
`core` pins `"rootDir": "./src"` to keep its output at `dist/functions/…` rather than `dist/src/…`.

## Environment variables

One root `.env` serves both apps. SvelteKit is configured with `env.dir: "../"` and
`publicPrefix: "PUB_"`, so any `PUB_`-prefixed var is client-visible and imported from
`$env/static/public` (wrapped by `client/src/services/env.ts`). The Worker reads the same names from
`process.env`, sourced from `vars` in `wrangler.jsonc` (public) plus `wrangler secret put` / a local
`server/.dev.vars` (`DB_STRING`, `JWT_SECRET`, `SESSION_SECRET`, `FONTS_API_KEY`).
`PUB_FEATURE_FLAGS` is a substring-matched string (e.g. `"load-save"`, `"contrast"`).

The root `.env` is **not** shared with the Worker, despite the name: wrangler only reads
`server/.dev.vars`, so a secret that exists in the root `.env` alone is undefined under
`wrangler dev`. `wrangler types` reflects whatever `.dev.vars` currently holds, which means deleting a
key there silently drops it from the generated `Env` too.

Note `server/src/secrets.ts`: `IS_PRODUCTION` fails closed — anything other than `PUB_APP_ENV=dev`
is treated as production.

## Conventions

Prettier with **tabs**, double quotes, no trailing commas, 100 columns (`.prettierrc`). Client styles
are SCSS; `client/src/scss/design-system.scss` is auto-injected into every component's styles by the
vite config, so its variables/mixins are available without importing, and CSS custom properties
(`--size-*`, `--c-*`) are the design tokens for the UI itself. That injected `@use` carries an
**absolute** path, computed from `import.meta.url` — vite 8 compiles SCSS with sass's modern API,
which resolves a relative `@use` against the importing stylesheet rather than the project root, so
the relative path it used to carry failed for every file not sitting at `client/` and broke the
build. Details in the comment in `client/vite.config.ts`.

`.claude/worktrees/` contains stale snapshots of an older (Express-on-Fly, Prisma/Mongo) layout —
ignore them when searching; they are not the current code.
