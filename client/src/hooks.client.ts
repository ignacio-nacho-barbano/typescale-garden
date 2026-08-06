import * as Sentry from "@sentry/sveltekit";
import type { HandleClientError } from "@sveltejs/kit";
import { SENTRY_ENABLED, sentryOptions } from "./services/sentry";

/**
 * Browser-side error reporting.
 *
 * A static import is safe here, unlike in hooks.server.ts: the `browser` export condition
 * resolves `@sentry/sveltekit` to its @sentry/browser build, which needs nothing from
 * Node. See the comment in hooks.server.ts for why the server half cannot do the same.
 *
 * This replaces what `services/errorLogger.ts` used to do with Rollbar's
 * `captureUncaught` / `captureUnhandledRejections`. The SDK installs the same global
 * listeners, so uncaught exceptions and rejected promises are reported without any call
 * site asking for it; `logError` remains for the deliberate, annotated reports.
 */
if (SENTRY_ENABLED) {
	Sentry.init(sentryOptions("browser"));
}

/**
 * SvelteKit's client-side error hook. `handleErrorWithSentry` reports the error and then
 * delegates to the callback for whatever else should happen — here, the console line that
 * was the only output before Sentry existed.
 *
 * It is deliberately not gated on `SENTRY_ENABLED`: with no client initialised,
 * `captureException` is a no-op, so a dev build simply gets the console output.
 */
export const handleError: HandleClientError = Sentry.handleErrorWithSentry(({ error, event }) => {
	console.error("🚨 Client error:", error, event);

	return {
		message: error instanceof Error ? error.message : "Something went wrong"
	};
});
