import { LOCAL_PORT } from "./target";

/**
 * The environment the **hermetic** target's client is booted with, and the fake origins
 * that go with it. None of this applies to a live target, which runs an already-built app
 * whose `PUB_*` values were inlined at build time and cannot be influenced from here.
 *
 * `client/svelte.config.js` sets `env.dir: "../"` and `publicPrefix: "PUB_"`, and vite's
 * `loadEnv` applies `process.env` after the `.env` files, so passing these through
 * Playwright's `webServer.env` wins over any repo-root `.env` a developer happens to have.
 * That is deliberate: the suite must not depend on — or be perturbed by — local secrets.
 *
 * Every `PUB_*` name the client imports has to be present. `$env/static/public` is a virtual
 * module built from what is defined, so a missing name is a build error, and
 * `client/src/services/env.ts` additionally throws when `PUB_API_URL` is falsy.
 */
export const PORT = LOCAL_PORT;
export const BASE_URL = `http://localhost:${PORT}`;

/**
 * Auth0 and the API are served from *our own origin* under these prefixes.
 *
 * Two reasons, both load-bearing:
 * - `Auth0-Client` (on `POST /oauth/token`) and `Authorization` (on every API call) are
 *   non-safelisted headers. Cross-origin they force an `OPTIONS` preflight, which Chromium
 *   does not reliably surface to `page.route`, so the fulfilment never gets a chance to run.
 * - A path prefix means a *missed* route falls through to SvelteKit's 404 instead of serving
 *   the app again — which, inside the silent-auth iframe, would recurse.
 *
 * auth0-spa-js accepts this because its `getDomain` only prepends `https://` when the value
 * has no scheme, and the token issuer it checks is simply `${domain}/`.
 */
export const AUTH_PREFIX = "/idp";
export const API_PREFIX = "/mock-api";
export const AUTH_DOMAIN = `${BASE_URL}${AUTH_PREFIX}`;
export const API_URL = `${BASE_URL}${API_PREFIX}`;
export const AUTH_CLIENT_ID = "e2eClientId";

/**
 * `stores/fetch.ts` appends `/api` to PUB_API_URL, and `+layout.svelte` builds the fonts
 * URL the same way by hand. So every API path the app reaches lives under this.
 */
export const API_BASE = `${API_URL}/api`;

export const E2E_PUB_ENV: Record<string, string> = {
	// `local` — one of three values (`local` | `dev` | `prod`; see client/src/services/env.ts).
	// It keeps hotjar out of +layout.ts and stops errorLogger from posting to Sentry (it
	// console.errors instead — which is why the console-hygiene spec treats an
	// `Error Logger:` line as a failure rather than noise).
	//
	// It has to be `local` specifically, not merely "not prod": `dev` is a *deployed* Pages
	// preview and reports to Sentry exactly like production does.
	PUB_APP_ENV: "local",
	PUB_API_URL: API_URL,
	PUB_AUTH_DOMAIN: AUTH_DOMAIN,
	PUB_AUTH_CLIENT_ID: AUTH_CLIENT_ID,
	PUB_CLIENT_ORIGIN: BASE_URL,
	// Imported from `$env/static/public` by client/src/services/sentry.ts, so the name has
	// to exist or the build fails on a missing export. Empty on purpose, and that is the
	// whole of what keeps a hermetic run from talking to Sentry: `SENTRY_ENABLED` is
	// `Boolean(PUB_SENTRY_DSN) && !IS_LOCAL`, so an empty DSN means the SDK is never even
	// initialised — no global error listeners, no transport, nothing to intercept.
	// (A *live* run is the opposite case: that build has a real DSN baked in, which is why
	// thirdParty.ts's telemetry guard has to catch Sentry's ingest host.)
	PUB_SENTRY_DSN: "",
	// Substring-matched in Sidebar.svelte, where it now gates the Contrast accordion
	// only — the File section is unconditional. Deliberately does not contain
	// "contrast": that panel is flagged off in production, so the suite tests what
	// users actually get.
	PUB_FEATURE_FLAGS: "load-save"
};
