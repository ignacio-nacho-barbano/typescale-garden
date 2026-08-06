# Feature Name

Transversal sentry integration

## Description

1. Include sentry in sveletekit app detecting issues in both server and client
2. Detect BE server failures
   2.1 Detect errors on fonts cron job
3. Log extension plugin errors

## Status — done

Implemented across all three surfaces. Sentry replaced Rollbar (which only ever covered the client;
`server` carried the dependency and never imported it). The architecture, and the reasoning behind the
non-obvious parts, is documented under "Error reporting — Sentry, on three runtimes" in `CLAUDE.md`.

| #   | item                   | state | where                                                        |
| --- | ---------------------- | ----- | ------------------------------------------------------------ |
| 1   | SvelteKit client       | done  | `client/src/hooks.client.ts`, `services/errorLogger.ts`      |
| 1   | SvelteKit server (SSR) | done  | `client/src/hooks.server.ts`, `services/sentryEnvelope.ts`   |
| 2   | BE server failures     | done  | `server/src/index.ts`, `utils/error-handling.ts`             |
| 2.1 | fonts cron job         | done  | `server/src/index.ts` `scheduled`, `src/sentry.ts`           |
| 3   | Figma plugin           | done  | `plugin/sentry.ts`, `code.ts`, `ui.html`, `manifest.json`    |
| —   | Source maps            | done  | `scripts/sentryRelease.mjs`, `scripts/sentry-sourcemaps.mjs` |

Verified: `npm run build`, `npm test` (5/5 tasks), `npm run test:e2e` (47 passed, 3 skipped),
`server#check`, `plugin#check`, `plugin#lint`. `client#check` is at 17 errors, down from the 18
pre-existing on main, and none are in the new files. A clean-copy `npm install` + `client` build was
run to confirm the Pages deploy path still works.

### DSN — wired, and ingestion verified

The project is `typescale-garden-app` in org `nacho-barbano`, region **`de`**:

```
https://d67d38563f6359c0766c81e5126ad044@o4511689468608512.ingest.de.sentry.io/4511809570144336
```

Set in the root `.env` (`PUB_SENTRY_DSN`), `server/wrangler.jsonc` (`SENTRY_DSN`) and
`plugin/sentry.ts`. Verified live: a hand-built envelope POST to that endpoint returned
`HTTP 200 {"id":"72c4cb6d551d1d77c532e3dbd450e3e9"}`, which confirms both the DSN and the envelope
format the SSR and plugin reporters use. That event is titled "Sentry wiring smoke test — safe to
resolve/delete".

Note `SENTRY_TOKEN` in `.env` is a different, unused value — a DSN public key, not an API token.

**Three deploy-time steps remain, and none is in this repo:**

1. **Cloudflare Pages → the client's environment variables**: add `PUB_SENTRY_DSN` for Production and
   Preview. `.env` is gitignored so the Pages build never sees it, and `PUB_*` values are inlined at
   build time — without this the deployed site reports nothing, however the repo is configured.
2. **`npm run deploy:server`** to push the Worker's new `SENTRY_DSN` var.
3. **A `SENTRY_AUTH_TOKEN`**, for the source-map upload — see the next section.

### Three environments

`PUB_APP_ENV` gained a third value so "a dev machine" and "a deployed non-production build" stop
being the same thing:

| `PUB_APP_ENV` | is                                     | Sentry             | analytics |
| ------------- | -------------------------------------- | ------------------ | --------- |
| `local`       | a dev machine, and the e2e suite       | **no** — console   | no        |
| `dev`         | a deployed build, i.e. a Pages preview | yes, tagged `dev`  | no        |
| `prod`        | typescalegarden.uy                     | yes, tagged `prod` | yes       |

The local `.env` is now `PUB_APP_ENV=local` (it was `dev`), and the e2e suite boots the app the same
way. `SENTRY_ENABLED` is `Boolean(DSN) && !IS_LOCAL` on the client and the Worker; the plugin's
`ENVIRONMENT` constant does the same job. Unrecognised values still report — losing errors is worse
than an oddly named environment in the UI.

Two places `local` cannot be inferred and has to be set by hand:

- `server/.dev.vars` needs `PUB_APP_ENV=local`, because `wrangler dev` reads `vars` from
  `wrangler.jsonc` where it is `"prod"`.
- `plugin/sentry.ts`'s `ENVIRONMENT` is a committed constant — a Figma plugin has no env system.
  Set it to `"local"` while developing against a local Worker.

If a Pages preview should report as `dev`, set `PUB_APP_ENV=dev` in the Pages **Preview** environment
variables (alongside `PUB_SENTRY_DSN`); Production stays `prod`.

### Source maps — implemented for the browser bundle and the plugin

Two dependency-free node scripts at the repo root, no `@sentry/cli` and no `sentrySvelteKit()` vite
plugin; the reasoning is in the header of `scripts/sentry-sourcemaps.mjs` and summarised under "Source
maps" in `CLAUDE.md`. The join is release-based, and the release is computed in one place
(`scripts/sentryRelease.mjs`) so the bundle and the upload cannot disagree:

| surface        | release            | maps                    | uploaded by                              |
| -------------- | ------------------ | ----------------------- | ---------------------------------------- |
| client browser | `client@<sha>`     | `build.sourcemap: true` | `client`'s `postbuild`, every build      |
| plugin         | `plugin@<version>` | esbuild `sourcemap`     | `npm run sourcemaps:upload` in `plugin/` |
| client SSR     | —                  | —                       | skipped, see below                       |

**What is verified, and what is not.** The maps are emitted, the artifact names are right
(`SENTRY_DRY_RUN=1` prints them), the release is inlined into the browser chunks and into `code.js`,
the plugin's events carry parsed frames pointing at `app:///code.js` (asserted in
`plugin/test/plugin.test.mjs`), the `node:async_hooks` invariant still holds at 1, the maps are gone
from `.svelte-kit/cloudflare` afterwards, and both failure paths (no token, unreachable Sentry) exit 0
without failing the build. **The upload itself has never run** — it needs an org auth token, which did
not exist when this was written. First real run to check: the build log says `sentry: uploaded 34
artifact(s) …`, and an issue's stack trace names `.svelte` / `.ts` files.

**To finish it:**

1. Create an **org** auth token (Sentry → Settings → Auth Tokens) with `project:releases`. Note this
   is not `SENTRY_TOKEN` in `.env`, which is a DSN public key.
2. Add it as `SENTRY_AUTH_TOKEN` in the **Cloudflare Pages** environment variables, Production and
   Preview — the same place `PUB_SENTRY_DSN` has to go. That is the client half; nothing in this repo
   can do it.
3. For the plugin, export it locally and run `npm run sourcemaps:upload --workspace plugin` after
   `npm run build`, at publish time. Bump `plugin/package.json`'s `version` when publishing, or two
   bundles share a release and the second upload replaces the first one's maps.

### Follow-ups, deliberately not done

- **Symbolicating the SSR half.** It reports through a hand-built envelope that sends an unparsed
  stack string, so there are no frames for a map to resolve, and the upload skips `_worker.js` for
  that reason. Doing it needs frames plus certainty about the filename workerd puts in a frame — and
  what runs is not SvelteKit's server output but a re-bundle adapter-cloudflare's own esbuild pass
  makes of it. Enabling `nodejs_als` on the Pages project (see the next bullet) and moving to the SDK
  would solve both halves at once and is the better order to do this in.
- **Richer SSR context.** The SSR half posts a hand-built envelope instead of using an SDK, because
  every Cloudflare-capable Sentry SDK forces a static `node:async_hooks` import into `_worker.js` and
  the Pages project's compatibility flags are not in this repo. Enabling `nodejs_als` on the Pages
  project (Settings → Functions → Compatibility flags, Production **and** Preview) would allow
  swapping `services/sentryEnvelope.ts` for `initCloudflareSentryHandle` + `sentryHandle`. Read the
  comment at the top of that file first — the failure mode of getting it wrong is the site not booting.
- **Tracing and session replay** are off (`tracesSampleRate: 0`, no replay integration) on all
  surfaces. Both bill against the same free quota as errors and neither answers "did something break".
- **Alerting.** Nothing configures Sentry alert rules or the cron monitor's notification target; the
  `fonts-snapshot` monitor is upserted by the first run but who gets told is a dashboard setting.
