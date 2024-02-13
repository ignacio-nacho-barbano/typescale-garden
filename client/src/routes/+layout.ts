import { browser } from "$app/environment";
import {
	PUB_API_URL,
	PUB_AUTH_CLIENT_ID,
	PUB_AUTH_DOMAIN,
	PUB_CLIENT_ORIGIN
} from "$env/static/public";
import type { Auth0ClientOptions } from "@auth0/auth0-spa-js";
import { createAuth0Client } from "@auth0/auth0-spa-js";
import type { StoredTypescale } from "../models/type-variants.js";
import { authClient } from "../stores/auth";

const authConfig: Auth0ClientOptions = {
	domain: PUB_AUTH_DOMAIN,
	clientId: PUB_AUTH_CLIENT_ID,
	authorizationParams: {
		redirect_uri: PUB_CLIENT_ORIGIN,
		audience: PUB_API_URL
	}
};

export interface LayoutData {
	successfulLoad: boolean;
	typescales?: StoredTypescale[];
	error?: unknown;
}

/** @type {import('./$types').LayoutLoad} */
export async function load({ fetch }): Promise<LayoutData> {
	const res = await fetch(PUB_API_URL + "/api/typescales/default");
	const data = await res.json();

	if (browser) {
		try {
			authClient.set(await createAuth0Client(authConfig));
			return {
				...data,
				successfulLoad: true
			};
		} catch (error) {
			console.error("Unable to create auth client", error);
			return {
				successfulLoad: false,
				error
			};
		}
	} else {
		return { ...data, successfulLoad: true };
	}
}
