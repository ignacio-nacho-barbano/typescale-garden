import { ENV } from "./env";

/**
 * Shared Sentry configuration for both halves of the app — the browser bundle
 * (`hooks.client.ts`) and the SSR pass running on Cloudflare Pages
 * (`hooks.server.ts`).
 *
 * A DSN is a public identifier that only grants "write an event", which is why this one
 * is `PUB_`-prefixed and inlined into the client bundle like any other public var.
 */

/**
 * `PUB_SENTRY_DSN`, replaced at build time by vite's `define` — set on Cloudflare Pages for
 * the deployed app, in the root `.env` locally, and to `""` by the e2e suite.
 *
 * It is read through `define` rather than imported from `$env/static/public` on purpose:
 * that module exports only the names something defined, so an unset var is a build-breaking
 * missing export rather than an empty string. The full argument is in the `define` block in
 * client/vite.config.ts. The `typeof` guard is the same belt-and-braces as `RELEASE` below —
 * a build whose `define` went missing degrades to "reporting off" instead of throwing a
 * `ReferenceError` while this module is being evaluated, which on the browser side would
 * mean the app never hydrates.
 *
 * Empty is a supported, deliberate state: it means report nothing, which is exactly the
 * pre-Sentry behaviour.
 */
declare const __SENTRY_DSN__: string;

export const SENTRY_DSN = typeof __SENTRY_DSN__ === "string" ? __SENTRY_DSN__ : "";

/**
 * Reporting is off unless a DSN is configured *and* this is not a local build.
 *
 * `local` is the only environment excluded — `dev` (a Pages preview) reports just like
 * `prod`, tagged as `dev`, which is the point of having the three values. See the comment
 * on `PUB_APP_ENV` in ./env.ts.
 *
 * Excluding `local` preserves what `logError` did with Rollbar: on a developer's machine
 * errors go to the console rather than into a paid service and someone else's inbox. The
 * e2e suite depends on that specific behaviour — it boots the app with
 * `PUB_APP_ENV=local` and its console-hygiene spec treats an `Error Logger:` line as a
 * failure, which only works while nothing is swallowing errors into a network call. See
 * e2e/support/env.ts.
 *
 * Note this is deliberately `!IS_LOCAL` rather than `IS_DEV || IS_PROD`: an unrecognised
 * `PUB_APP_ENV` should still report, because losing errors is worse than an oddly named
 * environment in the Sentry UI.
 */
export const SENTRY_ENABLED = Boolean(SENTRY_DSN) && !ENV.IS_LOCAL;

/**
 * `client@<commit sha>`, replaced at build time by vite's `define` — see the `define` block
 * in vite.config.ts for why it is not an env var, and scripts/sentryRelease.mjs for how the
 * same value reaches the source-map upload.
 *
 * The `typeof` guard is not ceremony: without it, a build whose `define` went missing would
 * throw a `ReferenceError` while this module is still being evaluated, which on the browser
 * side means the app never hydrates. Unsymbolicated reports are the correct failure here.
 */
declare const __SENTRY_RELEASE__: string;

const RELEASE = typeof __SENTRY_RELEASE__ === "string" ? __SENTRY_RELEASE__ : undefined;

/**
 * `surface` is what makes a shared Sentry project triageable: the client, the Worker and
 * the Figma plugin can all report into `typescale-garden-app`, and without a tag an issue
 * list mixes three unrelated runtimes. Keep the values in step with
 * server/src/sentry.ts and plugin/sentry.ts.
 */
export function sentryOptions(surface: "browser" | "ssr") {
	return {
		dsn: SENTRY_DSN,
		environment: ENV.APP_ENV,
		// What joins a minified frame to its uploaded source map. Only the browser half acts
		// on this — the SSR envelope sends no frames for a map to resolve; see the comment in
		// services/sentryEnvelope.ts.
		release: RELEASE,
		// Errors only — no performance tracing, no session replay. Both are billed against
		// the same free quota as errors, and neither answers the question this integration
		// exists to answer ("did something break, and where"). Turn them on deliberately.
		tracesSampleRate: 0,
		// This app has authenticated users; an Auth0 access token lives in memory and is
		// sent on every API call. Explicitly opting out of PII keeps headers and cookies
		// out of issue reports rather than relying on Sentry's default scrubbing.
		sendDefaultPii: false,
		initialScope: {
			tags: { surface }
		}
	};
}
