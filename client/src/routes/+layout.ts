import type { Auth0ClientOptions } from "@auth0/auth0-spa-js";
import { createAuth0Client } from "@auth0/auth0-spa-js";
import type { Typescale } from "core";
import { getUserData } from "../functions";
import { ENV } from "../services/env";
import { logError } from "../services/errorLogger";
import { initAnonymousAnalysis } from "../services/hotjar";
import {
	AUTH_PLACEHOLDER_GRACE_MS,
	authClient,
	authResolutionTimedOut,
	user
} from "../stores/auth";
import { PUB_API_URL } from "$env/static/public";

const authConfig: Auth0ClientOptions = {
	domain: ENV.AUTH_DOMAIN,
	clientId: ENV.AUTH_CLIENT_ID,
	authorizationParams: {
		redirect_uri: ENV.CLIENT_ORIGIN,
		audience: PUB_API_URL
	}
};

export interface LayoutData {
	successfulLoad: boolean;
	typescales?: Typescale[];
	error?: unknown;
}

/**
 * Resolves auth **off the critical path** — deliberately not awaited by `load`.
 *
 * `createAuth0Client` awaits `checkSession()` internally, which is a hidden-iframe
 * silent auth: 60s timeout, 3 retries. Whenever third-party cookies are blocked or the
 * tenant is slow, that stalls for a long time. Awaiting it in `load` blocks hydration,
 * and a page that has not hydrated cannot re-render — so the top bar would be pinned to
 * whatever the SSR pass emitted for the entire wait, placeholder included.
 *
 * Fire-and-forget instead: the `user` store settles whenever the silent login lands and
 * the UI swaps the placeholder for the real state then. Consumers are already built for
 * this — `stores/fetch.ts` rebuilds its axios instance when the token arrives, and
 * `stores/typescales.ts` waits on `silentLoginReady` before fetching.
 */
async function resolveAuth() {
	// Caps how long the UI will sit on a placeholder if the iframe never answers.
	const graceTimer = setTimeout(() => authResolutionTimedOut.set(true), AUTH_PLACEHOLDER_GRACE_MS);

	try {
		const client = await createAuth0Client(authConfig);
		authClient.set(client);

		await getUserData(client);
	} catch (err) {
		console.error("Unable to create auth client:\n", err);
		// Settle to "anonymous". The UI shows a placeholder while `user` is `undefined`,
		// so a silent return here would leave it up until the grace period expires.
		user.set(null);
	} finally {
		clearTimeout(graceTimer);
	}
}

/** @type {import('./$types').LayoutLoad} */
export async function load({ fetch }): Promise<LayoutData> {
	if (ENV.IS_BROWSER) {
		if (ENV.IS_PROD) {
			try {
				initAnonymousAnalysis();
			} catch (error) {
				logError("Unable to load hotjar:", error);
			}
		}

		// Intentionally not awaited — see resolveAuth's comment.
		resolveAuth();

		return {
			successfulLoad: true
		};
	} else {
		return {
			successfulLoad: true
		};
	}
}
