import { browser } from "$app/environment";
import { SENTRY_ENABLED } from "./sentry";

/**
 * The app's deliberate, annotated error reports — as opposed to the uncaught exceptions
 * and rejected promises the SDK picks up on its own (see hooks.client.ts).
 *
 * This used to construct a Rollbar instance at module scope and call `rollbar.error`. The
 * signature is unchanged so every call site is untouched; only the transport moved.
 *
 * ## The `browser &&` is load-bearing, not a convenience
 *
 * This module is imported by `+error.svelte`, `+layout.svelte`, `+layout.ts` and the
 * stores, so it is part of the **SSR graph**. `browser` is a build-time constant, which
 * makes `browser && …` statically false in the server build and lets the bundler drop
 * `report` — and with it the `@sentry/sveltekit` import — out of `_worker.js` entirely.
 * That is what keeps a static `node:async_hooks` import out of the Pages Worker; see the
 * comment at the top of services/sentryEnvelope.ts for why that matters and how to check.
 *
 * Nothing is lost on the server side: `handleError` in hooks.server.ts reports every SSR
 * failure through the envelope reporter, and every `logError` call outside `+error.svelte`
 * is already behind an `IS_BROWSER` guard at its call site.
 */
export const logError = (message: string, error?: Record<string, any> | unknown) => {
	if (browser && SENTRY_ENABLED) {
		// Fire and forget: no call site awaits this, and an error report is never worth
		// delaying the UI for.
		void report(message, error);

		return;
	}

	// The dev path, and what the e2e suite asserts against — see services/sentry.ts.
	console.error("🚨 Error Logger: ", message, error);
};

async function report(message: string, error?: Record<string, any> | unknown) {
	try {
		const Sentry = await import("@sentry/sveltekit");

		if (error instanceof Error) {
			// Report the real exception so Sentry gets its stack and groups by it; the call
			// site's message is the human context around it.
			Sentry.captureException(error, { extra: { context: message } });
		} else {
			// No Error to attach — the message is all there is, so it becomes the title.
			// `error` here is whatever the call site had (an axios error body, a string,
			// nothing at all), which is worth keeping but cannot be grouped on.
			Sentry.captureMessage(message, { level: "error", extra: { error } });
		}
	} catch (loadFailure) {
		console.error("🚨 Error Logger (Sentry unavailable): ", message, error, loadFailure);
	}
}
