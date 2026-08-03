import type { Page } from "@playwright/test";
import { TARGET } from "./target";

/**
 * Talking to the real API directly, for the housekeeping a live write test needs but should
 * not do through the UI.
 *
 * Every scale the suite creates is named with this prefix, which is what makes cleanup
 * possible at all — there is no other way to tell a test's row from one the account's owner
 * made. Change it and the sweep stops recognising older leftovers.
 */
export const LIVE_NAME_PREFIX = "e2e-";

/** The free tier's cap, from server/src/controllers/typescales/index.ts. */
export const FREE_CAP = 5;
const PREMIUM_CAP = 100;

export interface LiveScale {
	id: string;
	authorId: string;
	name: string;
}

/**
 * The access token the app is holding, lifted out of the page.
 *
 * There is no seam for this — `authToken` is a module-private Svelte store — so it is read
 * from the wire instead: the next authenticated request the app makes carries it as a bearer
 * header. Waiting for `GET /api/typescales/saved`, which `stores/typescales.ts` fires as soon
 * as the silent login settles, means no extra interaction is needed to provoke one.
 */
export async function bearerFromPage(page: Page): Promise<string> {
	const prefix = `${TARGET.apiUrl}/api/`;

	const request = await page.waitForRequest(
		(candidate) => candidate.url().startsWith(prefix) && !!candidate.headers()["authorization"],
		{ timeout: 30_000 }
	);

	return request.headers()["authorization"];
}

const call = async (
	authorization: string,
	method: string,
	path: string
): Promise<{ status: number; typescales?: LiveScale[] }> => {
	const response = await fetch(`${TARGET.apiUrl}/api${path}`, {
		method,
		headers: { authorization }
	});

	if (!response.ok) return { status: response.status };

	const body = (await response.json()) as { typescales?: LiveScale[] };
	return { status: response.status, typescales: body.typescales };
};

export async function listSaved(authorization: string): Promise<LiveScale[]> {
	const { status, typescales } = await call(authorization, "GET", "/typescales/saved");

	if (status !== 200 || !typescales) {
		throw new Error(`GET /api/typescales/saved answered ${status}`);
	}

	return typescales;
}

/**
 * Deletes every `e2e-` scale the account holds, and answers how many went.
 *
 * Called before the write specs, not only after them: a run that is killed between creating
 * a scale and deleting it leaves a row behind, and against a cap of 5 a handful of those
 * would make every subsequent hourly run fail on a 401 that has nothing to do with the code.
 * Sweeping up front makes the suite self-healing instead.
 */
export async function sweepLeftovers(authorization: string): Promise<number> {
	const mine = (await listSaved(authorization)).filter(
		(scale) => scale.authorId !== "typescale-garden" && scale.name.startsWith(LIVE_NAME_PREFIX)
	);

	for (const scale of mine) {
		await call(authorization, "DELETE", `/typescales/saved/${scale.id}`);
	}

	return mine.length;
}

export async function deleteByName(authorization: string, name: string): Promise<void> {
	for (const scale of await listSaved(authorization)) {
		if (scale.name === name && scale.authorId !== "typescale-garden") {
			await call(authorization, "DELETE", `/typescales/saved/${scale.id}`);
		}
	}
}

/**
 * Whether the account has room for one more scale.
 *
 * The cap is enforced with a **401**, which `SaveControl` renders as "you have reached the
 * maximum". Without this check an account that is legitimately full would make the hourly
 * cron fail forever, reporting a cap message as though it were a regression. A skip that
 * says the account is full is the honest outcome.
 */
export async function headroom(
	authorization: string,
	isPremium = false
): Promise<{ ok: boolean; reason: string }> {
	const owned = (await listSaved(authorization)).filter(
		(scale) => scale.authorId !== "typescale-garden"
	).length;
	const cap = isPremium ? PREMIUM_CAP : FREE_CAP;

	return owned < cap
		? { ok: true, reason: "" }
		: {
				ok: false,
				reason: `the account already holds ${owned} of its ${cap} saved scales, so there is no room to test a save. Delete some, or grant the store:typescales-premium permission.`
		  };
}

/** A name unique to this run, so parallel workers cannot collide on it. */
export const liveScaleName = (suffix: string): string =>
	`${LIVE_NAME_PREFIX}${suffix}-${process.pid.toString(36)}`;
