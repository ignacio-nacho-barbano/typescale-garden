/**
 * The environment the client is booted with for e2e runs.
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
export const PORT = 5199;
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
	// `dev` keeps hotjar out of +layout.ts and stops errorLogger from posting to Rollbar
	// (it console.errors instead — which is why the console-hygiene spec treats an
	// `Error Logger:` line as a failure rather than noise).
	PUB_APP_ENV: "dev",
	PUB_API_URL: API_URL,
	PUB_AUTH_DOMAIN: AUTH_DOMAIN,
	PUB_AUTH_CLIENT_ID: AUTH_CLIENT_ID,
	PUB_CLIENT_ORIGIN: BASE_URL,
	// Rollbar is constructed regardless of environment (errorLogger.ts does it at module
	// scope) and only the *reporting* is gated on PUB_APP_ENV, so the token has to exist.
	// Its `captureUncaught` handler can still try to POST; thirdParty.ts aborts that host.
	PUB_ROLLBAR_TOKEN: "e2e-disabled",
	// Substring-matched in Sidebar.svelte, where it now gates the Contrast accordion
	// only — the File section is unconditional. Deliberately does not contain
	// "contrast": that panel is flagged off in production, so the suite tests what
	// users actually get.
	PUB_FEATURE_FLAGS: "load-save"
};
