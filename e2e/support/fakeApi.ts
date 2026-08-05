import type { BrowserContext, Route } from "@playwright/test";
import { API_PREFIX } from "./env";
import { claimsFromBearer } from "./fakeAuth0";
import { fontsApiPayload, type GoldenInputs } from "./golden";

/**
 * A fake Worker, served by route interception. It stands in for `server/`, which cannot
 * run here: `wrangler dev` would need D1, migrations, seed data and a CORS allowlist
 * entry for this port, and every one of those is a way for the suite to fail for reasons
 * that have nothing to do with the client.
 *
 * It mirrors `server/src/controllers/typescales/index.ts` closely enough that the client's
 * error handling is exercised for real, including the oddities:
 * - every mutation answers with the caller's **whole list**, newest-first, because that is
 *   what `findByAuthors(ids, true)` does and what `SaveControl` relies on when it reads
 *   `res.data.typescales[0].id` to select the scale it just created;
 * - the community defaults are included in a signed-in user's list too (`findByAuthors`
 *   is called with `[authorId, DEFAULT_AUTHOR]`), which is what makes them appear in the
 *   Load menu labelled "by Typescale Garden" and undeletable;
 * - exceeding the cap answers **401**, not 402/403. `SaveControl` special-cases that
 *   status into "you have reached the maximum", so getting it wrong here would hide a
 *   real message from the user.
 *
 * State lives in the returned handle, one per test, so specs can seed rows and read back
 * what the app wrote.
 */
const DEFAULT_AUTHOR = "typescale-garden";
const FREE_CAP = 5;
const PREMIUM_CAP = 100;
const PREMIUM_PERMISSION = "store:typescales-premium";

export interface StoredTypescale {
	id: string;
	authorId: string;
	name: string;
	base: GoldenInputs;
	overrides?: unknown;
	createdAt: string;
	lastModifiedAt: string;
}

export interface ApiHandle {
	rows: StoredTypescale[];
	/** Every request the app made, as `METHOD /path`. Order is asserted by some specs. */
	calls: string[];
	/** Bearer subs seen, so a spec can prove the token really was attached. */
	seenSubs: (string | undefined)[];
	/** Flip to make the next typescale write fail with this status. */
	failWith: number | null;
	/** Flip to make `GET /api/fonts` fail, exercising the static fallback. */
	failFonts: boolean;
	seed(row: Partial<StoredTypescale> & { name: string; base: GoldenInputs }): StoredTypescale;
}

/**
 * Ids are sequential and readable rather than UUIDs. `crypto.randomUUID()` is what the
 * real D1 layer uses, but a deterministic id makes a failure message legible and keeps
 * the suite free of the `Math.random`-style nondeterminism that makes traces useless.
 */
let idCounter = 0;
const nextId = () => `e2e-typescale-${++idCounter}`;

/**
 * A fixed clock. `lastModifiedAt` only has to be monotonic for the newest-first ordering
 * to be meaningful, and a real `Date.now()` would make two writes inside the same
 * millisecond order arbitrarily.
 */
let clockTick = 0;
const nextTimestamp = () => new Date(Date.UTC(2026, 0, 1, 0, 0, clockTick++)).toISOString();

export const newApiHandle = (): ApiHandle => {
	const handle: ApiHandle = {
		rows: [],
		calls: [],
		seenSubs: [],
		failWith: null,
		failFonts: false,
		seed(row) {
			const stamp = nextTimestamp();
			const stored: StoredTypescale = {
				id: row.id ?? nextId(),
				authorId: row.authorId ?? DEFAULT_AUTHOR,
				name: row.name,
				base: row.base,
				createdAt: row.createdAt ?? stamp,
				lastModifiedAt: row.lastModifiedAt ?? stamp
			};
			handle.rows.push(stored);
			return stored;
		}
	};

	return handle;
};

/** `findByAuthors([authorId, DEFAULT_AUTHOR], true)`. */
const listFor = (handle: ApiHandle, authorId: string | undefined): StoredTypescale[] =>
	handle.rows
		.filter((row) => row.authorId === authorId || row.authorId === DEFAULT_AUTHOR)
		.slice()
		.sort((a, b) => b.lastModifiedAt.localeCompare(a.lastModifiedAt));

export async function installFakeApi(context: BrowserContext, handle: ApiHandle): Promise<void> {
	const routePattern = new RegExp(`${API_PREFIX}/api/`);

	await context.route(routePattern, async (route: Route) => {
		const request = route.request();
		const url = new URL(request.url());
		// Everything after the prefix, so the switch below reads like the Express router.
		const path = url.pathname.slice(url.pathname.indexOf(`${API_PREFIX}/api`) + API_PREFIX.length);
		const method = request.method();

		handle.calls.push(`${method} ${path}`);

		if (method === "GET" && path === "/api/fonts") {
			if (handle.failFonts) {
				return route.fulfill({ status: 503, json: { message: "e2e: fonts unavailable" } });
			}
			// The real endpoint answers a static `*` and is deliberately not credentialed.
			return route.fulfill({
				json: fontsApiPayload,
				headers: { "access-control-allow-origin": "*" }
			});
		}

		const { sub, permissions } = claimsFromBearer(request.headers()["authorization"]);

		if (method === "GET" && path === "/api/typescales/default") {
			return route.fulfill({
				json: { typescales: handle.rows.filter((row) => row.authorId === DEFAULT_AUTHOR) }
			});
		}

		// Everything below is `checkUser`-protected in the real router.
		if (path.startsWith("/api/typescales/saved")) {
			handle.seenSubs.push(sub);

			if (!sub) {
				// express-oauth2-jwt-bearer's shape for a missing/invalid token.
				return route.fulfill({
					status: 401,
					json: { message: "Requires authentication" }
				});
			}

			if (method === "GET") {
				return route.fulfill({ json: { typescales: listFor(handle, sub) } });
			}

			if (handle.failWith) {
				return route.fulfill({
					status: handle.failWith,
					json: { message: "e2e: forced failure" }
				});
			}

			const body = JSON.parse(request.postData() || "{}") as {
				data?: { name?: string; base?: GoldenInputs };
			};
			const data = body.data ?? {};

			if (method === "POST") {
				const owned = handle.rows.filter((row) => row.authorId === sub).length;
				const cap = permissions.includes(PREMIUM_PERMISSION) ? PREMIUM_CAP : FREE_CAP;

				if (owned >= cap) {
					// 401 is what the real controller answers, and what SaveControl reads.
					return route.fulfill({
						status: 401,
						json: { message: "You have reached the maximum amount of typescales" }
					});
				}

				handle.seed({
					authorId: sub,
					name: data.name ?? "",
					base: data.base as GoldenInputs
				});

				return route.fulfill({ json: { typescales: listFor(handle, sub) } });
			}

			const id = path.slice("/api/typescales/saved/".length);
			const row = handle.rows.find(
				(candidate) => candidate.id === id && candidate.authorId === sub
			);

			if (!row) {
				// A miss means it does not exist or belongs to someone else — the real
				// controller does not distinguish, and neither does this.
				return route.fulfill({ status: 404, json: { message: "No typescale of yours matches" } });
			}

			if (method === "PUT") {
				row.name = data.name ?? row.name;
				row.base = (data.base as GoldenInputs) ?? row.base;
				row.lastModifiedAt = nextTimestamp();
				return route.fulfill({ json: { typescales: listFor(handle, sub) } });
			}

			if (method === "DELETE") {
				handle.rows = handle.rows.filter((candidate) => candidate !== row);
				return route.fulfill({ json: { typescales: listFor(handle, sub) } });
			}
		}

		// Anything else is a route the app reached for that this fake does not model.
		// Answering 404 rather than continuing keeps it visible: SvelteKit would
		// otherwise serve the app shell and the failure would surface much later.
		return route.fulfill({ status: 404, json: { message: `e2e: unhandled ${method} ${path}` } });
	});
}
