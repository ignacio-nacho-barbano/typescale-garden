import { PUB_SENTRY_DSN } from "$env/static/public";
import type { HandleServerError } from "@sveltejs/kit";
import { ENV } from "./services/env";
import { SENTRY_ENABLED } from "./services/sentry";
import { captureToSentry } from "./services/sentryEnvelope";

/**
 * SSR error reporting for the render pass running on Cloudflare Pages.
 *
 * There is deliberately **no `handle` hook and no Sentry SDK import here** — see the long
 * comment in services/sentryEnvelope.ts. The short version: any SDK that works on
 * Cloudflare drags a static `node:async_hooks` import into `_worker.js`, and on a Pages
 * project without the `nodejs_als` compatibility flag that stops the Worker from starting
 * at all. `handleError` plus a hand-built envelope covers the failures without betting the
 * site on a dashboard setting.
 *
 * `handleError` is called for every unhandled exception thrown while rendering or in a
 * `load`, which is exactly the set of server-side failures worth knowing about.
 */
export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	// 404s are answers, not failures — neither reported nor logged. Reporting them would
	// mean one issue per crawler probing a path that never existed, and logging them buries
	// the real errors: the hermetic e2e run alone produces one per test, because the fakes
	// intercept browser requests and `+layout.svelte`'s SSR fetch of `/api/fonts` therefore
	// 404s by design.
	if (status === 404) {
		return { message: "Not found" };
	}

	if (SENTRY_ENABLED) {
		const report = captureToSentry(error, {
			dsn: PUB_SENTRY_DSN,
			environment: ENV.APP_ENV,
			surface: "ssr",
			tags: { route: event.route.id ?? event.url.pathname, method: event.request.method },
			extra: { status, message, url: event.url.href }
		});

		// Handed to `waitUntil` so the POST survives the response being returned — a
		// Worker's pending promises are cancelled once it answers, which would otherwise
		// drop the report for exactly the fast failures worth seeing. `platform` is absent
		// under `vite dev`, where the awaited fallback is fine.
		if (event.platform?.context) {
			event.platform.context.waitUntil(report);
		} else {
			await report;
		}
	}

	console.error("🚨 SSR error:", error);

	return { message: "Something went wrong" };
};
