/**
 * A dependency-free Sentry reporter: one `fetch` of one envelope.
 *
 * ## Why this exists instead of the SDK
 *
 * The SSR pass runs on Cloudflare Pages, and every Sentry SDK that works there
 * (`@sentry/cloudflare`, which `@sentry/sveltekit` re-exports through its `worker` export
 * condition) contains a top-level `import { AsyncLocalStorage } from "node:async_hooks"`.
 *
 * A *dynamic* `import()` in hooks.server.ts is not enough to keep that out of the bundle:
 * the adapter bundles `_worker.js` with esbuild, and esbuild hoists a lazily-reached
 * module's external imports into static top-level imports of the output. Verified — the
 * SDK-based version of this put `import { AsyncLocalStorage } from "node:async_hooks";`
 * into `_worker.js`. workerd only resolves `node:` specifiers when the `nodejs_als` or
 * `nodejs_compat` compatibility flag is on, so on a Pages project without it the Worker
 * fails to *start*: the whole site 500s, not just error reporting.
 *
 * The Pages project's flags live in the Cloudflare dashboard, not in this repo, so the
 * safe assumption is that the flag is absent. Hence: no SDK on the server side, and the
 * browser keeps the real SDK (see hooks.client.ts), where none of this applies.
 *
 * If `nodejs_als` is ever enabled for the Pages project, this file can be replaced with
 * `initCloudflareSentryHandle` + `sentryHandle` from `@sentry/sveltekit` for richer
 * context. Until then, keep `@sentry/sveltekit` out of anything reachable from the SSR
 * graph, and check it stayed out with:
 *
 *     grep -c "node:async_hooks" client/.svelte-kit/cloudflare/_worker.js   # expect 1
 *
 * (the one remaining hit is SvelteKit's own `import(...).catch(() => {})` probe, which is
 * dynamic and therefore harmless).
 *
 * The trade-off is a thinner report: no breadcrumbs, no automatic request context, and an
 * unparsed stack string rather than frames. It still answers "what threw, where, on which
 * route", which is the whole point.
 */

/** The pieces of a DSN needed to address the ingest endpoint. */
interface ParsedDsn {
	envelopeUrl: string;
	publicKey: string;
}

/**
 * A DSN is `https://<publicKey>@<host>/<projectId>`. Returns `undefined` for anything
 * unparseable rather than throwing — a malformed DSN must never be able to break a render.
 */
export function parseDsn(dsn: string): ParsedDsn | undefined {
	try {
		const { protocol, username, host, pathname } = new URL(dsn);
		const projectId = pathname.replace(/^\//, "");

		if (!username || !projectId) {
			return undefined;
		}

		return {
			envelopeUrl: `${protocol}//${host}/api/${projectId}/envelope/`,
			publicKey: username
		};
	} catch {
		return undefined;
	}
}

interface EnvelopeContext {
	dsn: string;
	environment: string;
	/** Matches the `surface` tag the SDK-based surfaces set. See services/sentry.ts. */
	surface: string;
	tags?: Record<string, string>;
	extra?: Record<string, unknown>;
}

/**
 * Build and POST one `event` envelope. Resolves (never rejects) once the request settles,
 * so callers can hand the promise to `ctx.waitUntil` without risking an unhandled
 * rejection taking down the invocation.
 */
export async function captureToSentry(
	error: unknown,
	{ dsn, environment, surface, tags, extra }: EnvelopeContext
): Promise<void> {
	const parsed = parseDsn(dsn);
	if (!parsed) {
		return;
	}

	const eventId = crypto.randomUUID().replace(/-/g, "");
	const sentAt = new Date().toISOString();

	const event = {
		event_id: eventId,
		timestamp: Date.now() / 1000,
		platform: "javascript",
		level: "error",
		environment,
		tags: { surface, ...tags },
		exception: {
			values: [
				{
					type: error instanceof Error ? error.name : "Error",
					value: error instanceof Error ? error.message : String(error)
				}
			]
		},
		extra: {
			// Unparsed on purpose, and the reason is *not* "there are no source maps" any
			// more — the client build emits and uploads them (see
			// scripts/sentry-sourcemaps.mjs). It is that they would not resolve this half:
			// what runs here is `_worker.js`, which adapter-cloudflare re-bundles out of
			// SvelteKit's server chunks with its own esbuild pass, so the positions in an SSR
			// stack belong to a file whose map the upload deliberately skips. Symbolicating
			// this half means uploading that map and knowing what filename workerd reports in
			// a frame, which cannot be established from inside this repo.
			//
			// The plugin does parse its stack (plugin/sentry.ts) — there the bundle Figma runs
			// is exactly the file whose map is uploaded.
			stack: error instanceof Error ? error.stack : undefined,
			...extra
		}
	};

	const body = [
		JSON.stringify({ event_id: eventId, sent_at: sentAt, dsn }),
		JSON.stringify({ type: "event" }),
		JSON.stringify(event)
	].join("\n");

	try {
		await fetch(`${parsed.envelopeUrl}?sentry_key=${parsed.publicKey}&sentry_version=7`, {
			method: "POST",
			headers: { "Content-Type": "application/x-sentry-envelope" },
			body
		});
	} catch {
		// Reporting an error must never itself become an error. Swallowed deliberately:
		// there is nowhere better to send this, and a throw here would surface to the user
		// as a failed render of a page that had already failed for another reason.
	}
}
