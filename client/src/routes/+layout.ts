import { browser } from "$app/environment";
import {
	PUB_API_URL,
	PUB_APP_ENV,
	PUB_AUTH_CLIENT_ID,
	PUB_AUTH_DOMAIN,
	PUB_CLIENT_ORIGIN
} from "$env/static/public";
import type { Auth0ClientOptions } from "@auth0/auth0-spa-js";
import { createAuth0Client } from "@auth0/auth0-spa-js";
import type { Typescale } from "@prisma/client";
import { getUserData } from "../functions";
import { logError } from "../services/errorLogger";
import { authClient } from "../stores/auth";
import {} from "$env/dynamic/public";

const authConfig: Auth0ClientOptions = {
	domain: PUB_AUTH_DOMAIN,
	clientId: PUB_AUTH_CLIENT_ID,
	authorizationParams: {
		redirect_uri: PUB_CLIENT_ORIGIN
	}
};

// remove the following if once backend is deployed
if (PUB_APP_ENV === "dev") {
	authConfig.authorizationParams.audience = PUB_API_URL;
}

export interface LayoutData {
	successfulLoad: boolean;
	typescales?: Typescale[];
	error?: unknown;
}

/** @type {import('./$types').LayoutLoad} */
export async function load({ fetch }): Promise<LayoutData> {
	let data = {};

	try {
		const res = await fetch(PUB_API_URL + "/api/typescales/default");
		data = await res.json();
	} catch (err) {
		logError("Unable to load default typescales:\n", err);
	}

	if (browser) {
		try {
			const client = await createAuth0Client(authConfig);
			authClient.set(client);

			await getUserData(client);

			return {
				...data,
				successfulLoad: true
			};
		} catch (err) {
			console.error("Unable to create auth client:\n", err);
			return {
				successfulLoad: false,
				error: err
			};
		}
	} else {
		return { ...data, successfulLoad: true };
	}
}
