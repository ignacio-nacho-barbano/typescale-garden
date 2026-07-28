import { env } from "cloudflare:workers";

// The Google Fonts catalogue, refreshed daily by the Cron Trigger in wrangler.jsonc
// and served to the client from KV. This replaced the committed
// client/static/fonts-data.json: the data now refreshes without a Pages rebuild.
//
// Bindings are reached through `cloudflare:workers` rather than the handler's `env`
// argument, matching src/db/d1.ts — `env` there is populated for any invocation
// context, scheduled ones included.
function fontsKv(): KVNamespace {
	if (!env.FONTS) {
		throw new Error("KV binding FONTS is not available — check kv_namespaces in wrangler.jsonc");
	}
	return env.FONTS;
}

const SNAPSHOT_KEY = "fonts-data:latest";
const FONTS_API = "https://www.googleapis.com/webfonts/v1/webfonts";
const FONTS_CACHE = "fonts-snapshot";

// Google's response is ~1.9 MB / 1951 families as of July 2026. Anything under this
// is not a catalogue — it is an error page, a truncated body or an empty result.
const MIN_PLAUSIBLE_BYTES = 500_000;
// The `kind` discriminator every WebfontList carries. Checked as a substring rather
// than by parsing; see refreshFontsSnapshot.
const LIST_KIND_MARKER = '"webfonts#webfontList"';

interface SnapshotMetadata {
	refreshedAt: string;
	bytes: number;
}

/**
 * Fetch the catalogue from Google and store it verbatim.
 *
 * Deliberately never calls JSON.parse. A Cron Trigger gets 10ms of CPU on the free
 * plan and parsing ~1.9 MB would blow that on its own, while waiting on fetch and KV
 * I/O costs no CPU at all. So validation is string-only: one UTF-8 decode plus a
 * substring scan. This also means what lands in KV is Google's raw `{ kind, items }`,
 * which is exactly what the client consumes.
 */
export async function refreshFontsSnapshot(): Promise<SnapshotMetadata> {
	const kv = fontsKv();

	if (!env.FONTS_API_KEY) {
		throw new Error("FONTS_API_KEY is not set — `wrangler secret put` it, or add it to .dev.vars");
	}

	const response = await fetch(`${FONTS_API}?key=${env.FONTS_API_KEY}`);
	if (!response.ok) {
		throw new Error(`Google Fonts API responded ${response.status} ${response.statusText}`);
	}

	const body = await response.text();

	// Fail closed. A throw here leaves the previous snapshot in place, so the site
	// keeps serving slightly stale data instead of an error page — always the better
	// outcome. Never relax this into a warning.
	if (body.length < MIN_PLAUSIBLE_BYTES || !body.includes(LIST_KIND_MARKER)) {
		throw new Error(
			`Refusing to overwrite the snapshot with an implausible response (${body.length} bytes)`
		);
	}

	const metadata: SnapshotMetadata = {
		refreshedAt: new Date().toISOString(),
		bytes: body.length
	};

	await kv.put(SNAPSHOT_KEY, body, { metadata });
	console.log(`[fonts]: snapshot refreshed — ${metadata.bytes} bytes at ${metadata.refreshedAt}`);

	return metadata;
}

/**
 * Serve the stored snapshot.
 *
 * Called before Express (see src/index.ts) on purpose: helmet sets
 * Cross-Origin-Resource-Policy: same-origin, which would block the client's
 * cross-origin read, and Express's default weak ETag would hash ~1.9 MB on every
 * request. Streaming KV straight into a Response avoids both.
 */
export async function serveFontsSnapshot(
	request: Request,
	ctx: ExecutionContext
): Promise<Response> {
	// Keyed on a bare URL so query strings cannot fragment the cache. Note the Cache
	// API is a no-op on *.workers.dev — only api.typescalegarden.uy caches for real.
	const cacheKey = new Request(new URL("/api/fonts", request.url).toString(), { method: "GET" });
	// A named namespace rather than `caches.default`: @types/node pulls in undici's
	// CacheStorage, which declares no `default` and wins the global merge, so
	// `caches.default` does not type-check here. `open()` is on both declarations, and
	// an isolated namespace is the better fit for a key we manage ourselves anyway.
	const cache = await caches.open(FONTS_CACHE);

	const cached = await cache.match(cacheKey);
	if (cached) {
		return cached;
	}

	// `stream` is the cheapest of KV's read types and the documented choice for large
	// values; cacheTtl keeps the value hot in the colo between Cache API misses.
	const stored = await fontsKv().getWithMetadata<SnapshotMetadata>(SNAPSHOT_KEY, {
		type: "stream",
		cacheTtl: 86400
	});

	if (!stored.value) {
		// No snapshot yet (a fresh KV namespace, or every refresh so far has failed).
		// The client falls back to its bundled catalogue on a non-200.
		return new Response(JSON.stringify({ error: "fonts snapshot unavailable" }), {
			status: 503,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
				"Access-Control-Allow-Origin": "*"
			}
		});
	}

	const response = new Response(stored.value, {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
			// A static `*`, NOT the echoing allowlist in src/index.ts. This response is
			// cached, the Cache API keys on URL alone, and Vary: Origin is not honoured
			// below Enterprise — so an echoed origin could be served to the wrong one.
			// Safe here because the catalogue is public, credential-free and GET-only.
			"Access-Control-Allow-Origin": "*",
			// Makes staleness observable without opening the dashboard.
			"X-Snapshot-Refreshed-At": stored.metadata?.refreshedAt ?? "unknown"
		}
	});

	ctx.waitUntil(cache.put(cacheKey, response.clone()));

	return response;
}
