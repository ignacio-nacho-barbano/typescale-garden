import { ENVIRONMENT, SENTRY_DSN, SENTRY_ENABLED } from "./secrets";

/**
 * The Worker's Sentry configuration, in one place.
 *
 * `@sentry/cloudflare` and not `@sentry/node`: the Worker runs on workerd, where
 * @sentry/node's OpenTelemetry instrumentation has no APIs to hook (no `http` module
 * to patch, no process to read). The Cloudflare SDK instruments the handler itself
 * instead, which is why the export in src/index.ts is wrapped rather than a
 * `Sentry.init()` sitting at module scope.
 *
 * It needs AsyncLocalStorage to associate a captured error with the invocation that
 * caused it. `nodejs_compat` (already set in wrangler.jsonc, for Express) provides it,
 * so no extra compatibility flag is required.
 */
export function workerSentryOptions() {
	return {
		// Blanked rather than merely unused when reporting is off, so a `wrangler dev` run
		// cannot post to the production project. An empty DSN disables the SDK outright.
		dsn: SENTRY_ENABLED ? SENTRY_DSN : "",
		// "local" | "dev" | "prod" — the same three values the client uses, so one Sentry
		// project's environment filter covers every surface.
		environment: ENVIRONMENT,
		// Errors only, no performance tracing. Spans are the expensive half of Sentry's
		// free quota and nothing here is latency-sensitive enough to justify spending it;
		// the point of this integration is finding out that something broke. Raise this
		// deliberately if traces are ever wanted.
		tracesSampleRate: 0,
		// Explicit rather than relying on the default. Every authenticated request to this
		// API carries an Auth0 bearer token, and `/api/plugin/tokens` carries a pairing
		// code in its body — none of which should ever reach an issue report.
		sendDefaultPii: false,
		initialScope: {
			// All three surfaces (client, Worker, Figma plugin) can report into one Sentry
			// project, so the tag is what makes an issue list triageable. Keep the values
			// in step with the ones set in client/src/services/sentry.ts and plugin/sentry.ts.
			tags: { surface: "worker" }
		}
	};
}

/**
 * The Sentry cron monitor slug for the daily Google Fonts refresh, and its schedule.
 *
 * The schedule is duplicated from `triggers.crons` in wrangler.jsonc on purpose: Sentry
 * upserts the monitor from these values, and it is what lets Sentry alert on a run that
 * never *started*. That is the failure this repo could not previously see — snapshot.ts
 * fails closed, so a broken refresh leaves the last good catalogue serving and "a missed
 * day is invisible". A captured exception only covers the runs that do execute.
 *
 * Keep `value` in step with wrangler.jsonc; a drift means Sentry reports phantom misses.
 */
export const FONTS_CRON_MONITOR = {
	slug: "fonts-snapshot",
	schedule: { type: "crontab", value: "17 4 * * *" },
	// Minutes late before Sentry calls the run missed. Cloudflare does not guarantee a
	// cron fires on the minute, so this is deliberately loose.
	checkinMargin: 30,
	// Minutes before an in-progress run is called timed out. The refresh is one fetch
	// plus one KV put, so anything near this is genuinely stuck.
	maxRuntime: 5,
	timezone: "UTC"
} as const;
