import type { Auth0ClientOptions } from "@auth0/auth0-spa-js";
import { createAuth0Client } from "@auth0/auth0-spa-js";
import type { Typescale } from "@prisma/client";
import { getUserData } from "../functions";
import { ENV } from "../services/env";
import { logError } from "../services/errorLogger";
import { initAnonymousAnalysis } from "../services/hotjar";
import { authClient } from "../stores/auth";

const authConfig: Auth0ClientOptions = {
	domain: ENV.AUTH_DOMAIN,
	clientId: ENV.AUTH_CLIENT_ID,
	authorizationParams: {
		redirect_uri: ENV.CLIENT_ORIGIN,
		audience: ENV.API_URL
	}
};

export interface LayoutData {
	successfulLoad: boolean;
	typescales?: Typescale[];
	error?: unknown;
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

		try {
			const client = await createAuth0Client(authConfig);
			authClient.set(client);

			await getUserData(client);

			return {
				successfulLoad: true
			};
		} catch (err) {
			console.error("Unable to create auth client:\n", err);
		}
		return {
			successfulLoad: false
		};
	} else {
		return {
			successfulLoad: true
		};
	}
}
