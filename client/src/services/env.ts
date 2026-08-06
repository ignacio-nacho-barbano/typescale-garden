import { browser } from "$app/environment";
import {
	PUB_API_URL,
	PUB_APP_ENV,
	PUB_AUTH_CLIENT_ID,
	PUB_AUTH_DOMAIN,
	PUB_CLIENT_ORIGIN
} from "$env/static/public";

if (!PUB_API_URL) {
	throw new Error("There was an issue loading env variables");
}

/**
 * `PUB_APP_ENV` has three values, and the distinction between the first two is what keeps
 * a developer's own mistakes out of the error tracker:
 *
 * - `local` — a machine running `npm run dev`. **Never reports to Sentry**; errors go to
 *   the console instead (see services/sentry.ts). The e2e suite boots the app this way.
 * - `dev` — a deployed non-production build, i.e. a Cloudflare Pages preview. Reports to
 *   Sentry tagged `environment: "dev"`, so preview noise is filterable but not lost.
 * - `prod` — typescalegarden.uy. Reports, and is the only value that enables analytics.
 *
 * Anything unrecognised behaves as a deployed environment: reporting is opt-*out* so a
 * misspelled value loses visibility rather than silently dropping every error.
 */
export const ENV = {
	API_URL: PUB_API_URL,
	APP_ENV: PUB_APP_ENV,
	AUTH_CLIENT_ID: PUB_AUTH_CLIENT_ID,
	AUTH_DOMAIN: PUB_AUTH_DOMAIN,
	CLIENT_ORIGIN: PUB_CLIENT_ORIGIN,
	IS_LOCAL: PUB_APP_ENV === "local",
	IS_DEV: PUB_APP_ENV === "dev",
	IS_PROD: PUB_APP_ENV === "prod",
	IS_BROWSER: browser
} as const;
