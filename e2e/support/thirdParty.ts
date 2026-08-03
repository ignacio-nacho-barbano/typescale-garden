import type { BrowserContext, Route } from "@playwright/test";
import { API_PREFIX, AUTH_PREFIX, BASE_URL } from "./env";
import { fontsStaticPayload } from "./golden";

/**
 * Everything the app reaches for on first paint that is not ours.
 *
 * The font catalogue is *not* here: it moved to `GET /api/fonts` on the Worker, which
 * under these fake env values is same-origin under `API_PREFIX`, so it belongs to
 * fakeApi.ts. What is left is genuinely third-party — webfont files, analytics, favicon.
 */
const GOOGLE_FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
const ANALYTICS = /googletagmanager\.com|google-analytics\.com|hotjar\.com|api\.rollbar\.com/;
const FAVICON = /typescalegarden\.uy\/ico\.ico$/;

/** The committed snapshot `+layout.svelte` falls back to when `/api/fonts` fails. */
const STATIC_FONTS = /\/fonts-data\.json$/;

/** Requests that arrived without a handler expecting them. Asserted empty per test. */
export type UnexpectedRequests = string[];

/**
 * A catch-all that aborts anything unrecognised and records it.
 *
 * Register this FIRST: Playwright consults handlers in reverse registration order, so
 * the earliest-registered one is consulted last and acts as the fallback.
 *
 * It matters more than it looks. `GetTypescales` wraps its call in
 * `asyncRetry(fn, 10, 3)`, so a single unmatched API route is a silent 30-second stall
 * rather than an error. Aborting turns that into an immediate, named failure.
 */
export async function installGuard(
	context: BrowserContext,
	unexpected: UnexpectedRequests
): Promise<void> {
	await context.route(/.*/, (route: Route) => {
		const url = route.request().url();

		// Our own dev server: vite modules, HMR, SvelteKit routes, static assets.
		// Anything under the two fake prefixes must be answered by a real handler,
		// so it is deliberately not let through here.
		const isOwnOrigin = url.startsWith(BASE_URL);
		const isFakeService = url.includes(AUTH_PREFIX + "/") || url.includes(API_PREFIX + "/");

		if (isOwnOrigin && !isFakeService) {
			return route.continue();
		}

		unexpected.push(`${route.request().method()} ${url}`);
		return route.abort();
	});
}

export async function installThirdParty(context: BrowserContext): Promise<void> {
	// Empty stylesheets rather than aborts: an aborted <link rel=stylesheet> logs a
	// console error, and one of the specs asserts the console stayed clean.
	await context.route(GOOGLE_FONTS, (route) =>
		route.fulfill({ status: 200, contentType: "text/css", body: "" })
	);

	// Answered rather than aborted, for the same reason as the stylesheets: an aborted
	// subresource logs `Failed to load resource: net::ERR_FAILED` to the console, and the
	// hygiene spec would then be asserting against noise this harness created itself.
	await context.route(ANALYTICS, (route) =>
		route.fulfill({ status: 200, contentType: "application/javascript", body: "" })
	);
	await context.route(FAVICON, (route) => route.fulfill({ status: 200, body: "" }));

	// `/fonts-data.json` is deliberately NOT stubbed here. It is same-origin, so the guard
	// lets it through to the real committed file — a 1.2 MB snapshot of the actual Google
	// catalogue, whose families are not the fixture's. That is the point: if `/api/fonts`
	// ever stops answering, the fallback yields a *different* catalogue and the golden
	// assertions fail loudly instead of quietly passing on the wrong data.
}

/**
 * Serves the fixture catalogue at `/fonts-data.json`, in that file's older wrapped shape
 * (`{ fonts, fontNames }`, which `+layout.svelte` unwraps with `data.fonts ?? data`).
 * Only the spec that exercises the documented degradation path needs this.
 */
export async function installStaticFontsFallback(context: BrowserContext): Promise<void> {
	await context.route(STATIC_FONTS, (route) => route.fulfill({ json: fontsStaticPayload }));
}

/**
 * The only interception a **live** run performs. Everything else — the real API, the real
 * Auth0 tenant, Google's webfonts — goes through untouched, because the point of a live run
 * is that they are real.
 *
 * Telemetry is the exception, and it is not about noise in the report. A deployed build runs
 * with `PUB_APP_ENV=prod`, which is the condition on both `initAnonymousAnalysis()` in
 * `+layout.ts` and the Rollbar branch of `logError`. Left alone, an hourly cron would inject
 * 24 sessions a day into the analytics someone actually reads, and file real error reports
 * for failures that are tests. Answered rather than aborted, so no `net::ERR_FAILED` lands
 * in the console.
 */
export async function installTelemetryGuard(context: BrowserContext): Promise<void> {
	await context.route(ANALYTICS, (route) =>
		route.fulfill({ status: 200, contentType: "application/javascript", body: "" })
	);
}
