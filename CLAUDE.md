# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Typescale Garden (https://typescalegarden.uy) helps designers build typographic scales for a design
system. An npm-workspaces monorepo, task-run by **Turborepo** (`turbo.json` at the root, plus
per-package `turbo.json` overrides), with five packages — the workspace names are the short directory
names (`client`, `core`, `e2e`, `server`, `plugin`), which is what `--filter` takes:

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
- `e2e/` — Playwright browser tests that drive the real client and assert its exported CSS and design
  tokens against core's golden fixtures. No source of its own ships anywhere; see "The e2e suite"
  below.

There used to be a fifth package, `services/`, holding standalone Node scripts. Its only two
inhabitants both moved out — `WEIGHTS_MAP` into `core`, and the Google Fonts snapshot generator into
the Worker's `scheduled` handler — so it was deleted along with the `@services/*` path alias and the
`create:fonts-file` script.

`scripts/` at the repo root is **not** a package and has no `package.json`: it holds two
dependency-free node scripts that two different packages' builds both need (the Sentry release string
and the source-map upload — see "Source maps" below). They live outside the workspaces precisely
because `client` and `plugin` share them.

## Commands

### `package-lock.json` is committed, and has to stay that way

It used to be gitignored, which broke the Cloudflare Pages build for the client: Pages runs a bare
`npm install`, so with no lockfile it resolved the tree from scratch and hit `ERESOLVE`. Two of the
client's devDependencies declare peers this repo has outgrown —
`@sveltejs/vite-plugin-svelte@3` peers `vite@^5` while the client is on `vite@^8`, and
`@typescript-eslint@5` peers `eslint@^6 || ^7 || ^8` while the client is on `eslint@^10`. Neither can
be fixed by upgrading: the first `vite-plugin-svelte` that accepts vite 8 is 7.x, which requires
**Svelte 5** (the client is on 4), and downgrading vite to 5 would break `vitest@4`, whose peer is
`^6 || ^7 || ^8`.

A local `node_modules` never notices, because npm resolves the conflict positionally — vite 5 and
eslint 8 hoisted to the root to satisfy the stale peers, vite 8 and eslint 10 nested under
`client/node_modules`. The lockfile records exactly that arrangement, and installing _from_ it is
conflict-free even on npm 9. So the lockfile is the only thing making CI reproduce a working tree.
Consequences:

- **Don't re-ignore it, and commit it whenever it changes.**
- `npm install <new-package>` can force a re-resolve and resurrect the `ERESOLVE`. The fix is the
  **`overrides` block in the root `package.json`**, which relaxes exactly the two stale peer ranges
  (`@sveltejs/vite-plugin-svelte`'s `vite`, `@typescript-eslint/*`'s `eslint`) and nothing else. With
  those in place a plain `npm install` resolves, and it reproduces the hoisting above _identically_ —
  root vite 5 / eslint 8, client vite 8 / eslint 10, no version changes anywhere. The real fix is
  still upstream (Svelte 5 + `vite-plugin-svelte@7`; eslint flat config + `typescript-eslint@8`);
  the overrides just stop the repo from being unable to add a dependency until then.
- **Never `--legacy-peer-deps`.** It appears to work and breaks the Pages deploy. It makes npm ignore
  peer declarations entirely, so nothing pulls `vite` to the root any more — and `@sveltejs/kit`
  needs it there, via a _peer_ dependency, to `import "vite"` at build time. The result is a lockfile
  whose clean install dies with
  `Cannot find package 'vite' imported from node_modules/@sveltejs/kit/src/core/env.js`. It also
  evicts root eslint 8 and drops ~95 packages. A local `node_modules` hides all of it, because an
  incremental install leaves the previous tree's copies on disk and the build keeps finding them.
- **Verify a lockfile change the way Pages will see it**, not the way your `node_modules` does:
  `rsync -a --exclude node_modules --exclude .git . /tmp/check/ && cd /tmp/check && npm install && cd client && npm run build`.
  That is the only check that catches the failure above.
- The eslint half of this is the same root cause as the known `client#lint` failure below: eslint 10
  dropped `.eslintrc` support entirely, so `client/.eslintrc.cjs` cannot load.

### The Cloudflare Pages build does not go through turbo

Pages is configured with **`client/` as the root directory** and `npm run build` as the build command,
under what its log calls the "v2 root directory strategy": it installs at the **repo root** (so
workspaces resolve) but runs the build command **inside `client/`**. So the thing Pages executes is
`client`'s own `build` script — `vite build` — and turbo, along with its `dependsOn: ["^build"]` edge,
never runs. Two consequences, both of which bit a real deploy:

- **`core` must be built by `client#build` itself.** `core`'s `exports` map points at `dist/`, which is
  gitignored, so without turbo the client build died on
  `Rolldown failed to resolve import "core"`. Hence `client`'s **`prebuild`** script,
  `npm run build --prefix ../core`. It is deliberately an npm lifecycle hook rather than a turbo task,
  because npm is the only thing Pages invokes. The cost is that `turbo run build` builds `core` twice —
  once as client's declared dependency, once again via `prebuild` — which is wasted time but not
  incorrect. It also means `cd client && npm run build` works standalone, which it previously did not.
- **The Sentry source-map upload is a `postbuild` hook for exactly the same reason**, and it also has
  to run _after_ the adapter, on what Pages will actually deploy. See "Source maps" below; it exits 0
  on every failure precisely because it sits in the deploy's critical path.
- **The node version file must live in `client/`, not the repo root.** Pages reads it from the
  configured root directory; a `.node-version` at the repo root was committed, ignored, and the build
  ran on node 18.17.1 anyway, where vite 8's rolldown dies on
  `'node:util' does not provide an export named 'styleText'`. `client/.node-version` is the one Pages
  honours; the copy at the repo root is only there for local version managers. Both pin **22.20.0** —
  above the engines of vite 8 (`^20.19.0 || >=22.12.0`), eslint 10 (`^22.13.0`) and wrangler
  (`>=22.0.0`). Keep the two in step, or set `NODE_VERSION` in the Pages dashboard instead.

Switching the Pages build command to `npx turbo run build --filter=client` would make both of these
unnecessary (it works from `client/`, and builds `core` first through the task graph) and would give
the deploy turbo's cache. The committed setup avoids depending on a dashboard change.

### Deploying the Worker

`.github/workflows/deploy-server.yml` does it, on a push to main that touches the Worker bundle.
`npm run deploy:server` from a laptop still works and is what a hotfix should use, but it is no
longer the normal path. The job type checks, bundles (`wrangler deploy --dry-run`, which resolves
every binding), applies pending D1 migrations, deploys, and then smoke tests the result.

- **Its path filter covers `core` too**, not only `server`: `src/db/`, the fonts snapshot and the
  plugin routes all import `core`, so a scale-math change ships in this bundle as much as in the
  client's. The root manifests are in the filter for the same class of reason — a dependency bump
  changes the bundle without touching `server/`.
- **Migrations run before the upload,** so new code cannot outrun its schema. They are
  forward-only and there is no automated rollback — a bad one is corrected by the next migration.
  Wrangler's confirmation prompt auto-answers yes in CI, and an empty queue is a no-op.
- **Two repository secrets are required**, `CLOUDFLARE_API_TOKEN` (Workers Scripts / D1 / KV: Edit)
  and `CLOUDFLARE_ACCOUNT_ID` — `wrangler.jsonc` carries no `account_id`, and a token with access
  to more than one account cannot infer it. A step checks for both up front, because a missing
  token otherwise surfaces as wrangler trying to open an OAuth browser flow on a headless runner.
- **Worker secrets are not deployed by CI.** `wrangler secret put` state lives on Cloudflare and
  survives a deploy, so the workflow needs no copy of `JWT_SECRET`, `SESSION_SECRET` or
  `FONTS_API_KEY`.
- **`concurrency` does not cancel in flight** (unlike `e2e.yml`): a deploy interrupted between the
  migration and the upload is worse than a queued one, so runs serialise.
- **The smoke test gates on `/api/__liveness`, not on `/api/fonts`,** and this is the non-obvious
  part. `/api/fonts` looks like the ideal probe — one unauthenticated GET, answered before Express,
  exercising the KV binding — but it is edge-cached at `s-maxage=86400` and **the cache key ignores
  the query string**, so no cache-buster reaches the origin and it keeps answering 200 for a day
  after the Worker has died. Any unmatched path (`/api/__liveness`) is answered by Express's 404
  handler with no `cf-cache-status` at all, so it hits the fresh bundle every time; that 404 body
  is the assertion. `/api/fonts` is still probed, but only logged.

From the repo root — these fan out through turbo to every package that defines the script:

```bash
npm run build             # client bundle, worker dry-run, plugin code.js, core dist
npm run check             # type check everything (svelte-check, tsc --noEmit ×4)
npm run lint              # eslint / prettier per package
npm test                  # client + core vitest (one pass) and the plugin's node script
npm run test:e2e          # Playwright, in a real Chromium against a real dev server
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
what Figma loads), `npm run check`, `npm run lint`, `npm test`, `npm run dev` for watch mode, and
`npm run sourcemaps:upload` at publish time (see "Source maps" under Error reporting). Note
`dev` no longer type checks — esbuild only transpiles, so run `npm run check:watch` alongside it if
you want that. `plugin#test` runs the _bundle_, so `plugin/turbo.json` gives it `dependsOn: ["build"]`.

`code.ts` is **bundled**, not merely transpiled. Figma's sandbox has no module loader — it evaluates
`code.js` as one script — so the moment the plugin imports `core` the dependency graph has to be
flattened into a single IIFE. `tsc` could not do that, which is why the emit moved to esbuild while
`tsc --noEmit` stayed on as `check`. The plugin's tsconfig therefore uses `moduleResolution: Bundler`,
which both follows core's `exports` map and tolerates the `.js` extensions core's `.d.ts` files carry.
esbuild is pinned to the `0.24.2` already hoisted at the root and already listed in the root
`allowScripts`, so it needs no new install-script approval.

There is no test suite for the server. The others: `client/src` and `core/src` use vitest,
`plugin/test/plugin.test.mjs` is a single dependency-free node script (run by `npm test` like the
rest) that executes the built `code.js` in a stubbed Figma sandbox, and `e2e/` is Playwright.

### The e2e suite

`e2e/` drives the real client in a real Chromium and asserts the bytes it exports. It exists because
`core`'s golden test proves the pure functions turn a `TypescaleBase` into those bytes but cannot
prove the sidebar is _wired_ to them — every input could be bound to the wrong store and every unit
test would still pass.

```bash
npm run test:e2e                    # from the repo root (turbo builds core first)
cd e2e && npm run test:e2e:ui       # the Playwright UI, for debugging
npx playwright test -g "roboto"     # one case
npx playwright install chromium     # once per machine; browsers are not an npm dep

E2E_TARGET=prod npx playwright test # the same suite against the deployed production build
E2E_TARGET=https://…  …             # …or any deployment; E2E_API_URL overrides its API
E2E_LIVE_WRITES=0 …                 # make a live run strictly read-only
```

#### Two targets, two oracles

`E2E_TARGET` (resolved in `support/target.ts`) is the only switch, and everything else follows from
it. Unset or `local` is **hermetic**: Playwright starts the dev server and every dependency is faked.
`prod` or a URL is **live**: an already-deployed build, the real API, and a real Auth0 user.

They cannot share an oracle, and this is the thing to understand before touching `support/subjects.ts`.
The committed fixtures describe a six-family catalogue, four of which are synthetic and do not exist
on Google Fonts — and of the two that do, `Roboto` has since gained weights 200/600/800, which changes
`weightSteps` and therefore every generated byte. Measured against the live catalogue, **1 of 12
fixtures still reproduces, and only by luck.** So:

- **hermetic** asserts the exported bytes against `core/src/__tests__/fixtures/golden.json`. Strongest
  assertion available: a value a human reviewed, and it fails if `core` drifts. This is the PR gate.
- **live** picks one family per _shape_ (multi-weight ascending and descending, single-weight,
  no-`regular`) out of the catalogue the app actually received, and derives the expected bytes by
  calling `core` at runtime. **No family is named anywhere**, which is what makes adding fonts unable
  to break it — the worst a new font can do is change which family a shape resolves to, and the
  expectation moves with it. It is still byte-exact, just against a runtime expectation.

The live oracle shares an implementation with what it measures, so it cannot catch a bug inside
`core` — it is not meant to, and both of the other layers do. What it uniquely proves is that the
deployed build, CORS, real auth and the catalogue endpoint all still agree with `core`. The layering:

| layer          | proves                                                |
| -------------- | ----------------------------------------------------- |
| `core`'s tests | core matches the committed bytes                      |
| e2e hermetic   | the app matches the committed bytes, end to end       |
| e2e live       | the deployed app matches core over the live catalogue |

Subjects are resolved **once per run** by `globalSetup` and written to `e2e/playwright/.cache/` for
the workers to read synchronously. Two reasons: Playwright collects tests synchronously and these
files transpile to CommonJS, so there is no top-level `await` to fetch a catalogue with — and
resolving once means every worker compares against the same snapshot, which matters because the
Worker rewrites its KV catalogue on a daily cron. `catalogueDisagreement` in `support/subjects.ts`
backstops the remaining window by comparing the weights the app itself reports (its
`availableWeights`, read off the heading-range control) against the ones the expectation was built on,
so a mid-run rotation reads as "the snapshot rotated" rather than as an inscrutable byte diff.

Cases a live run cannot drive are skipped through `hermeticOnly(reason)`, and the reason prints in the
report — so the live run documents its own coverage gap instead of quietly having one. That covers the
tier cap and premium permission, forced API failures, the fonts-API-down fallback, the
`authorizeDelayMs` placeholder case, signed-out state, console hygiene (a deployed page's console is
not ours), and the synthetic font shapes.

Things worth knowing before changing it:

- **Live runs still intercept telemetry, and must keep doing so.** A deployed build has
  `PUB_APP_ENV=prod`, which is the condition on both `initAnonymousAnalysis()` in `+layout.ts` and the
  Rollbar branch of `logError`. Left alone, the hourly cron would inject 24 sessions a day into the
  analytics someone actually reads and file real error reports for failures that are tests.
  `installTelemetryGuard` is the whole of what a live run fakes.
- **Live writes are prefixed, swept and capped.** Every scale the suite creates is named `e2e-…`,
  deleted in teardown, and any leftover from a killed run is swept _before_ writing — against a free
  cap of 5, a few orphans would otherwise make every subsequent hourly run fail on a 401 that has
  nothing to do with the code. A genuinely full account skips with a message rather than failing.
- **Live auth logs in exactly once**, in a Playwright setup project that saves `storageState`; every
  other test resolves through silent auth. That is a correctness measure, not a speed one: automated
  logins from datacenter IPs are what trip Auth0's attack protection, and the symptom is a CAPTCHA in
  front of the form that no retry can clear.
- **Nothing real is on the other end — hermetically.** `support/fakeAuth0.ts` is a whole fake Auth0 tenant and
  `support/fakeApi.ts` a fake Worker, both served by route interception, and
  `support/thirdParty.ts` installs a **guard** that aborts and records any request nothing expected
  (asserted empty after every test). Both fakes are mounted under path prefixes on our _own_ origin
  (`/idp`, `/mock-api`) rather than on their real hostnames, because a cross-origin request carrying
  `Authorization` or `Auth0-Client` triggers a preflight that Chromium does not reliably surface to
  `page.route`.
- **`app.open()` waits for `.user-controls-skeleton` to disappear, and that is load-bearing.** The
  sidebar is server-rendered, so every control is present and visible long before hydration; a
  `fill` in that window writes to the DOM and no store hears it. The skeleton is rendered
  unconditionally by the SSR pass and can only vanish once hydration _and_ the silent login have
  settled.
- **The generated CSS/tokens are read off the clipboard,** not out of the modal. `copyToClipboard`
  hands the store value straight to `navigator.clipboard.writeText`, so the clipboard is byte-exact;
  Svelte trims the whitespace around `{$cssCode}` in the template, so the modal's `<code>` is only
  good for "the modal shows the same thing".
- **`workers` is capped at 2 and `globalSetup` warms the dev server.** All workers share one vite dev
  server, and a parallel cold start queues module transforms long enough that hydration outlives the
  assertion waiting for it — a flake that reads as an auth bug.
- **`global.scss` puts `transition: font-weight 200ms` on `*`.** Reading a computed `font-weight`
  straight after changing the scale catches it mid-interpolation — a real read returned `720.75` on
  its way to `700`. `preview.spec.ts` wraps each step's assertions in `toPass` for that reason; don't
  unwrap them.
- **The font menu closes on `clickOutside`, not on Escape,** and while open it sits over the category
  pills and makes them unclickable. Use `app.closeFontMenu()`. Relatedly, `actions/clickOutside.ts`
  listens in the **capture** phase and calls `stopPropagation()`, so the next click outside an open
  menu is swallowed as well as closing it — which is why `openFontMenu()` retries rather than clicking
  a fixed number of times.
- **The numeric writables hold strings.** The sidebar's inputs have no `type="number"`, so after any
  UI edit `$baseSize` is `"22"`, and that is what goes on the wire; the Worker coerces per column in
  `baseBindValues`. `typescales.spec.ts` asserts through `Number(...)` for that reason.
- One family is deliberately unreachable from the UI (`unknown-font-falls-back`): the picker only
  emits a value when a listed option is clicked, so an unknown family cannot be typed into the store.
  It stays covered by core's unit test — see `UI_UNREACHABLE` in `support/golden.ts`.

#### CI

There are three workflows: `e2e.yml` (this section), `ci.yml` (everything non-browser — see "The
rest of CI" below) and `deploy-server.yml` (see "Deploying the Worker" above).

`.github/workflows/e2e.yml` runs the one suite three ways:

| job        | trigger                             | `E2E_TARGET`               |
| ---------- | ----------------------------------- | -------------------------- |
| `hermetic` | `pull_request`, `push` to main      | (unset) — the PR gate      |
| `live`     | `deployment_status` (prod, success) | the URL that just deployed |
| `live`     | `schedule`, hourly at `:17`         | `prod`                     |

It deliberately does not also run `check`/`lint`, which are known-failing on main (below) and would
make the signal permanently red. Non-obvious details:

- `npm rebuild sharp` in the hermetic job only: vite-imagetools needs sharp's native binary to
  transform the image `+page.svelte` imports, and sharp is not in the root `allowScripts`, so npm ≥ 11
  skips the install script that fetches it. The live job never compiles the client, so it does not
  need this — but it does need `core` built, which is what the oracle imports.
- The `deployment_status` trigger only fires from the **default branch's** copy of the workflow file,
  so it does nothing until merged to main. The cron is on `:17` to stay clear of the Worker's own
  04:17 UTC catalogue cron, so a run never straddles the KV rewrite.
- Live credentials come from the `E2E_AUTH0_USERNAME` / `E2E_AUTH0_PASSWORD` secrets. Without them the
  signed-in and write specs skip with a reason and the rest still runs anonymously, which is a useful
  signal on its own. `E2E_LIVE_WRITES` is a repository variable, so writes can be turned off without
  touching code. GitHub disables scheduled workflows after 60 days of repo inactivity.

#### The rest of CI

`.github/workflows/ci.yml` is the non-browser PR gate, on `pull_request` and `push` to main. Before
it, the hermetic Playwright suite was the repo's only check — so nothing type checked the Worker,
nothing ever built the client **bundle** (the suite drives the dev server), and no unit test ran. A
broken `server/` reached main and was caught only by `deploy-server.yml`, after it had deployed; a
broken client bundle was caught by Pages, also after merge.

| job               | gates                                                       |
| ----------------- | ----------------------------------------------------------- |
| `server`          | `turbo run check build --filter=server` — the deploy's gate |
| `build-and-test`  | `turbo run build`, `turbo run test`, plus two invariants    |
| `static-analysis` | `turbo run check lint --filter='!client'`                   |
| `known-failing`   | `client#check` / `client#lint` — `continue-on-error`        |

- **The workflow defines the `PUB_*` vars itself**, at workflow level, and without them neither
  `client#build` nor `client#test` can pass — `$env/static/public` is a virtual module built from
  what is defined, so a name the client imports and CI does not define is a build error. Throwaway
  values: CI never deploys its bundle, Pages builds its own with the dashboard's values. Keep them
  in step with `E2E_PUB_ENV` in `e2e/support/env.ts`, which is the same list for the same reason.
- **`server` is its own job** rather than a step of `build-and-test`, running exactly what
  `deploy-server.yml` runs as its gate — so a merge cannot produce a deploy that fails its own gate.
- **Two invariants are asserted that no test covers.** The `node:async_hooks` grep over
  `client/.svelte-kit/cloudflare/_worker.js` (see "Error reporting" — expects exactly 1, SvelteKit's
  own dynamic probe; counted with `grep -o` and not `grep -c`, since `_worker.js` is bundled and
  `grep -c` counts lines); and `git diff --quiet -- plugin/code.js` after a rebuild, since that file
  is committed because it **is** what Figma loads, and a stale one means the reviewed source and the
  published plugin have diverged. The plugin bundle is reproducible because its release string is
  `plugin@<version>`, not a commit sha.
- **`known-failing` cannot fail the workflow.** It exists so the two known-failing client tasks stay
  visible and a PR that makes them worse shows up in review. When the eslint flat-config migration
  lands it goes green, and gets promoted by deleting `--filter='!client'` in `static-analysis`.
- `npm ci` doubles as the lockfile-freshness check: it fails outright if `package.json` and
  `package-lock.json` have drifted apart.

#### Pointing a live run at a preview deployment

`E2E_TARGET` takes any URL, so this is configuration rather than code — but three things outside the
suite block it today, and all three have to change together:

1. **Auth0** — Allowed Callback/Logout/Web Origins need `https://*.<project>.pages.dev`.
2. **The client build** — `redirect_uri` is `ENV.CLIENT_ORIGIN`, i.e. `PUB_CLIENT_ORIGIN`, which
   SvelteKit **inlines at build time**, and Pages holds one Preview value for every preview. So a
   preview currently sends its login redirect to production and silent auth posts its `web_message` to
   an origin that is not the parent — login cannot complete. Derive `PUB_CLIENT_ORIGIN` from Pages'
   `CF_PAGES_URL` in the build.
3. **The Worker** — `ALLOWED_ORIGINS` is an exact-match array and `cors`' array form compares strings,
   so a wildcard entry does nothing; it needs a regex or an origin function.

Production needs none of these: it is already in `ALLOWED_ORIGINS` and its baked `PUB_CLIENT_ORIGIN`
matches its own origin.

### Turborepo layout

Root `turbo.json` declares the task shapes: `build`/`check`/`test` depend on `^build` (a package's
dependencies build first), `dev` and `test:watch` are `persistent` + uncached, `deploy` depends on
`build` and `check`. Cache keys include the root `tsconfig.json`, `types/**` and the root `.env*`
files (`globalDependencies`) plus every `PUB_*` var, since those are inlined into the client bundle at
build time.

**`build`, `check` and `test` all declare `"env": ["PUB_*"]`, and on the latter two that is not
about caching.** Turbo filters a task's environment down to what it declares, so a task missing the
declaration cannot see those vars _at all_, whatever the developer's `.env` holds:

- `test` without it — `stores/config.test.ts` fails to collect. It imports `errorLogger` →
  `sentry` → `services/env.ts`, which throws `There was an issue loading env variables` when
  `PUB_API_URL` is falsy. `npm test --workspace client` passes at the same moment, which is what
  makes this look like a turbo bug rather than a missing line.
- `check` without it — `svelte-kit sync` generates the `$env/static/public` ambient types from
  whatever is defined, so svelte-check reports six phantom `has no exported member 'PUB_…'`
  errors on top of the real ones.

Cacheable outputs are declared per package in `client/turbo.json`, `core/turbo.json` and
`plugin/turbo.json`; the server emits nothing (its build is a dry-run), so it needs no override. The
`db:*` scripts are deliberately outside turbo — they mutate a real database and must never be cached.

`test:e2e` is `cache: false` for the same reason as `dev`: it boots a real dev server and drives a
real browser, so a cache hit would report a pass without having proved anything. `e2e/turbo.json`
gives it `dependsOn: ["core#build"]` specifically — not `^build` — because Playwright starts the
client's dev server itself (`webServer.command`), bypassing turbo, so nothing else would produce the
`core/dist` that the client's `import "core"` resolves into. `client#build` would be the wrong
dependency: the suite drives the dev server, not the bundle.

Known pre-existing failures, unrelated to turbo: `client#check` (17 svelte-check errors) and
`client#lint` (the client's `.eslintrc.cjs` fails to load, plus wide prettier drift). `client#test`
used to fail on 3 letterSpacing assertions; rewiring the client onto `core` fixed those, and
`build` and `test` are now green across every package. Both known failures run in `ci.yml`'s
`known-failing` job, which cannot fail the workflow — see "CI" below.

Note the 17: it used to be quoted as 18 because the count was taken without `PUB_*` reaching
svelte-check. With the `env` declaration above, the six phantom `$env/static/public` errors are
gone and 17 is the real number.

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

### Error reporting — Sentry, on three runtimes

Sentry replaced Rollbar, which only ever covered the client (`server` carried the dependency and
never imported it). All three surfaces report into the one `typescale-garden-app` project and are
told apart by a **`surface` tag** — `browser`, `ssr`, `worker`, `plugin`. Keep those values in step
across `client/src/services/sentry.ts`, `server/src/sentry.ts` and `plugin/sentry.ts`; without the
tag a shared project mixes three unrelated runtimes into one issue list.

The DSN is configured per surface, and **empty is a supported state everywhere** — it means "report
nothing" and restores exactly the pre-Sentry behaviour. All four point at the one project
(`typescale-garden-app`, org region `de`):

| where                          | value            | reaches                             |
| ------------------------------ | ---------------- | ----------------------------------- |
| root `.env` (gitignored)       | `PUB_SENTRY_DSN` | local client builds                 |
| **Cloudflare Pages env vars**  | `PUB_SENTRY_DSN` | the deployed client — browser + SSR |
| `server/wrangler.jsonc` `vars` | `SENTRY_DSN`     | the Worker                          |
| `plugin/sentry.ts` (a `const`) | `SENTRY_DSN`     | the Figma plugin                    |

The Pages row is easy to miss and is the one that matters in production: `.env` is gitignored, so the
Pages build never sees it, and `PUB_*` values are **inlined at build time** from the dashboard's
environment variables. A DSN set only in `.env` means local builds report and the deployed site does
not.

A DSN is a public identifier — it only grants "write an event" — which is why it is `PUB_`-prefixed,
lives in `vars` rather than behind `wrangler secret put`, and is hardcoded in a published plugin.
`PUB_SENTRY_DSN` must **exist** in `.env` even when empty: `services/sentry.ts` imports it from
`$env/static/public`, and SvelteKit fails the build on a missing name.

Reporting is additionally gated on the environment, and **`PUB_APP_ENV` has three values** for this
reason — `local` used to be spelled `dev`, which left no way to say "a deployed non-production build":

| `PUB_APP_ENV` | is                                     | Sentry             | analytics |
| ------------- | -------------------------------------- | ------------------ | --------- |
| `local`       | a dev machine, and the e2e suite       | **no** — console   | no        |
| `dev`         | a deployed build, i.e. a Pages preview | yes, tagged `dev`  | no        |
| `prod`        | typescalegarden.uy                     | yes, tagged `prod` | yes       |

`SENTRY_ENABLED` is `Boolean(DSN) && !IS_LOCAL` on both the client and the Worker, and the plugin's
`ENVIRONMENT` const does the same. Note it is `!IS_LOCAL` and not `IS_DEV || IS_PROD` on purpose: an
unrecognised value should still report, because losing errors is worse than an oddly named
environment in the Sentry UI. `IS_PRODUCTION` in `server/src/secrets.ts` keeps failing closed the
other way (anything that is not `dev` or `local` is production), since what it guards is whether raw
errors are echoed in a response.

Two footguns in the `local` row:

- **`wrangler dev` reads `vars` from `wrangler.jsonc`, where `PUB_APP_ENV` is `"prod"`.** A local
  Worker therefore looks like production and would file issues against the real project. Put
  `PUB_APP_ENV=local` in `server/.dev.vars` — that file is the only local override wrangler reads.
- **The plugin has no env system at all**, so `ENVIRONMENT` in `plugin/sentry.ts` is a committed
  constant. Set it to `"local"` while developing against a local Worker, i.e. whenever you also
  change `API_BASE` in `code.ts`.

**The client's server half deliberately does not use a Sentry SDK.** This is the one non-obvious
thing here, and `client/src/services/sentryEnvelope.ts` carries the full explanation. In short: every
SDK that works on Cloudflare (`@sentry/cloudflare`, which `@sentry/sveltekit` re-exports through its
`worker` export condition) has a top-level `import { AsyncLocalStorage } from "node:async_hooks"`,
and a _dynamic_ `import()` does not keep it out of the bundle — the adapter bundles `_worker.js` with
esbuild, which hoists a lazily-reached module's external imports into static top-level ones. workerd
only resolves `node:` specifiers when `nodejs_als` / `nodejs_compat` is enabled, and the Pages
project's flags live in the Cloudflare dashboard rather than in this repo, so a static import there
risks the Worker failing to **start** — the whole site, not just error reporting. So SSR reports
through a hand-built envelope POST over plain `fetch`, and the invariant to preserve is:

```bash
# Nothing in the SSR graph may pull in a Sentry SDK. Expect exactly 1 — SvelteKit's own
# `import("node:async_hooks").then(…).catch(…)` probe, which is dynamic and harmless.
grep -c "node:async_hooks" client/.svelte-kit/cloudflare/_worker.js
```

That is also why `services/errorLogger.ts` guards its dynamic import with `browser &&` rather than
just checking it at runtime: `browser` is a build-time constant, so the server build drops the branch
and the SDK with it. The browser half does use the real SDK (`hooks.client.ts`), where none of this
applies — that is what buys automatic uncaught-exception and unhandled-rejection reporting.

Per surface:

- **client, browser** — `hooks.client.ts` inits the SDK and exports `handleError`; `logError` in
  `services/errorLogger.ts` keeps its old signature, so no call site changed, and reports through
  `captureException` (real `Error`, so Sentry groups on its stack) or `captureMessage`. This is the
  half `release` and the uploaded source maps apply to — see "Source maps" below.
- **client, SSR** — `hooks.server.ts` exports only `handleError`, no `handle`. 404s return early:
  they are answers, not failures, and the hermetic e2e run produces one per test because
  `+layout.svelte`'s SSR fetch of `/api/fonts` is not intercepted by the browser-level fakes.
- **Worker** — `Sentry.withSentry(…)` wraps the exported handler in `src/index.ts`, which covers
  `fetch` _and_ `scheduled`. Express errors never reach it (its error middleware answers a 500
  first), so `utils/error-handling.ts` captures separately, and only for `status >= 500` — the 404
  handler manufactures an `Error("Not Found")` for every unmatched path, so reporting 4xx would mean
  one issue per crawler.
- **fonts cron** — wrapped in `Sentry.withMonitor(…)` with the schedule duplicated from
  `triggers.crons` (`FONTS_CRON_MONITOR` in `src/sentry.ts` — keep the two in step or Sentry reports
  phantom misses). The check-ins are the point: `snapshot.ts` fails closed, so a refresh that breaks
  leaves the last good catalogue serving and **a missed day is otherwise invisible**. An exception can
  only be reported by a run that happened; the monitor is what catches a cron that stopped firing.
- **plugin** — no SDK, by necessity as much as taste: `code.js` is committed and reviewed, and
  Figma's sandbox has no `window`, `crypto` or even `URL`, so `plugin/sentry.ts` parses the DSN with a
  regex and builds the event id from `Math.random`. `plugin/test/plugin.test.mjs` enforces this by
  running the bundle in a `vm` context with an explicit global whitelist. Coverage comes from
  wrapping `figma.ui.onmessage` (the sandbox's only entry point — there is no global `onerror` to
  hook) plus the individual `catch` blocks; `ui.html` forwards its own `onerror` /
  `onunhandledrejection` as a `ui-error` message rather than reporting from the iframe, which keeps
  the DSN out of it for the same reason the bearer token is kept out. **`manifest.json` must allow
  the host** — the exact ingest host is listed rather than a `https://*.sentry.io` wildcard, because
  a single-label wildcard is not guaranteed to match a four-label host like
  `o<orgId>.ingest.de.sentry.io`. A sandbox `fetch` outside `allowedDomains` is blocked outright, so
  changing the DSN's org or region means changing the manifest too.

**The e2e suite is telemetry-silent in both modes, and both mechanisms matter.** Hermetically
`PUB_SENTRY_DSN` is `""` so the SDK is never initialised — nothing to intercept. A live run is the
opposite: that build has a real DSN inlined, and the SDK reports uncaught errors whether or not the
app asks it to, so `installTelemetryGuard` in `support/thirdParty.ts` has to catch `sentry.io`.
Without it the hourly cron would file real issues for failures that are tests.

#### Source maps

The browser bundle and the plugin bundle are symbolicated; the SSR half is not (see the end of this
section). Two dependency-free node scripts at the repo root do it, and there is no `@sentry/cli` and
no `sentrySvelteKit()` vite plugin — the header of `scripts/sentry-sourcemaps.mjs` argues that at
length, but the short version is that a postinstall-fetched binary and a plugin that auto-instruments
`load` functions (i.e. injects `@sentry/sveltekit` into the **SSR** graph, the one thing
`sentryEnvelope.ts` exists to prevent) both cost more here than three HTTP calls.

The join is **release-based**, not debug-id-based: an event carries a `release`, the artifacts are
uploaded under that same release, and Sentry matches them by name. So the release string is computed
in exactly one place, `scripts/sentryRelease.mjs`, and read by both sides of each surface:

| surface | release            | inlined by                                       | uploaded by                                       |
| ------- | ------------------ | ------------------------------------------------ | ------------------------------------------------- |
| client  | `client@<sha>`     | `vite.config.ts` `define` → `__SENTRY_RELEASE__` | `client`'s **`postbuild`**, on every build        |
| plugin  | `plugin@<version>` | `build.mjs` `define` → `__PLUGIN_RELEASE__`      | `npm run sourcemaps:upload` in `plugin/`, by hand |

A mismatch fails nothing loudly — it just silently leaves every trace unsymbolicated — which is why
both sides call the same function rather than keeping two copies of a snippet. Things worth knowing:

- **`SENTRY_AUTH_TOKEN` is the switch, and it is not in `.env`.** An **org** auth token with
  `project:releases` scope (`SENTRY_TOKEN` in `.env` is a DSN public key, not an API token). Absent =
  the upload is skipped with a log line, which is the normal state on a developer's machine. For the
  deployed client it has to be set as a **Cloudflare Pages environment variable**, the same easy-to-miss
  place as `PUB_SENTRY_DSN`. `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_URL` have working defaults in
  the script and only need setting if the org, project or **region** changes (`de` today, and the plain
  `sentry.io` API host does not route release-file writes for a `de` org).
- **The upload never fails a build.** It runs as an npm `postbuild` hook, so a non-zero exit would
  fail the Pages deploy; every failure path logs `sentry: WARNING …` and exits 0. A Sentry outage must
  not be able to take the site down.
- **`postbuild` is an npm lifecycle hook for the same reason `prebuild` is** — Pages runs `npm run build`
  inside `client/` and turbo never enters the picture (see the Pages section above).
- **The maps are deleted from `.svelte-kit/cloudflare` after uploading**, because that directory _is_
  what Pages deploys. `SENTRY_KEEP_SOURCEMAPS=1` keeps them; `SENTRY_DRY_RUN=1` prints the artifact
  names and touches neither Sentry nor the disk, which is the only way to check the naming without a
  token. The plugin's `code.js.map` is gitignored and never deleted — it never leaves the machine.
- **`build.sourcemap` is `true`, not `"hidden"`.** The `//# sourceMappingURL=` comment each chunk keeps
  is how Sentry finds which artifact holds that chunk's map. Since the maps themselves are deleted,
  what ships is a comment pointing at a file that is not there — deliberate, and the reason the upload
  also attaches a `Sourcemap` header to each `.js` artifact as a second route to the same answer.
- **The plugin parses its stack into frames** (`parseStack` in `plugin/sentry.ts`) rather than sending
  a string, because Sentry resolves a map per _frame_. Every frame is reported as `app:///code.js`
  whatever Figma's sandbox calls the script: the bundle is a single IIFE, so there is exactly one file
  to be in, and the name the sandbox reports is not something this repo can pin. `app:///` is the
  conventional scheme for a bundle never served over HTTP, and Sentry resolves it to the `~/code.js`
  artifact. The raw stack stays in `extra` as the check on that normalization, and
  `plugin/test/plugin.test.mjs` asserts the frame shape — a wrong shape is invisible otherwise.
- **Bump `plugin/package.json`'s `version` when publishing to Figma.** The plugin's release is its
  version, not a commit sha, because what a user runs is the `code.js` of a published version; two
  different bundles sharing one release means the second upload replaces the first one's maps.
- **`_worker.js` is skipped, so the SSR half is still unsymbolicated.** Not an oversight: it reports
  through the hand-built envelope, which sends an unparsed stack string rather than frames, so there
  is nothing for a map to resolve. Symbolicating it needs frames _and_ certainty about the filename
  workerd reports, and the file that actually runs is a re-bundle adapter-cloudflare's own esbuild
  pass makes out of SvelteKit's server chunks. Its map is still deleted from the deploy output.

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
`PUB_SENTRY_DSN` and the Worker's `SENTRY_DSN` are covered under "Error reporting" above — both may be
empty, but `PUB_SENTRY_DSN` has to be _present_ in `.env` or the client build fails on a missing
`$env/static/public` export. `SENTRY_TOKEN` in `.env` is unused by any code: it is a DSN public key,
not an API token, and the DSN it belongs to is what `PUB_SENTRY_DSN` wants.

`SENTRY_AUTH_TOKEN` is the one Sentry value that is a real secret, and it is deliberately _not_ a
`PUB_*` var: it is read only by `scripts/sentry-sourcemaps.mjs`, at build time, on the machine doing
the build — a developer's shell for the plugin, and the Cloudflare Pages build environment for the
client. Nothing at runtime ever sees it. `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_URL`,
`SENTRY_DRY_RUN` and `SENTRY_KEEP_SOURCEMAPS` are optional overrides on the same script.

The root `.env` is **not** shared with the Worker, despite the name: wrangler only reads
`server/.dev.vars`, so a secret that exists in the root `.env` alone is undefined under
`wrangler dev`. `wrangler types` reflects whatever `.dev.vars` currently holds, which means deleting a
key there silently drops it from the generated `Env` too — and note this cuts both ways: running
`npm run cf-typegen` in a checkout that has **no** `.dev.vars` (a fresh clone, or a git worktree,
since the file is gitignored) silently drops `FONTS_API_KEY` and friends from `Env` and breaks
`npm run check`. Regenerate only where `.dev.vars` is populated.

Note `server/src/secrets.ts`: `IS_PRODUCTION` fails closed — anything other than `PUB_APP_ENV=dev`
or `PUB_APP_ENV=local` is treated as production.

`PUB_APP_ENV` is a three-value enum (`local` | `dev` | `prod`); what each one turns on is tabulated
under "Error reporting" above, and `client/src/services/env.ts` is where the flags are derived.

## Conventions

Prettier with **tabs**, double quotes, no trailing commas, 100 columns (`.prettierrc`). Client styles
are SCSS; `client/src/scss/design-system.scss` is auto-injected into every component's styles by the
vite config, so its variables/mixins are available without importing, and CSS custom properties
(`--size-*`, `--c-*`) are the design tokens for the UI itself. That injected `@use` carries an
**absolute** path, computed from `import.meta.url` — vite 8 compiles SCSS with sass's modern API,
which resolves a relative `@use` against the importing stylesheet rather than the project root, so
the relative path it used to carry failed for every file not sitting at `client/` and broke the
build. Details in the comment in `client/vite.config.ts`.

`client/vite.config.ts` carries two other workarounds for the same underlying bind — vite 8 pinned
against `@sveltejs/vite-plugin-svelte@3` and Svelte 4. Both are load-bearing and commented at length
in the file; **`pinKitToSvelte4`** and **`keepInlineQueryOnSvelteStyles`**. The second is what makes
`npm run dev` work at all: SvelteKit's dev server inlines component CSS by re-requesting each style
module with `?inline`, vite-plugin-svelte 3 rebuilds `type=style` ids from scratch and throws that
query away, and vite ≥6 no longer hands a server-consumer environment the CSS string unless the id
still carries the flag — so every request answered `500 TypeError: css is not a function` from inside
`kit/src/runtime/server/page/render.js`. The plugin re-attaches `inline` after the resolve, splicing
it in _before_ `lang.css` because vite gates its CSS pipeline on `/\.(css|…)(?:$|\?)/`. This was never
turbo-specific; `npm run client` and a bare `cd client && npm run dev` failed identically.

`.claude/worktrees/` contains stale snapshots of an older (Express-on-Fly, Prisma/Mongo) layout —
ignore them when searching; they are not the current code.
