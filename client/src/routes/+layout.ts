import { PUB_AUTH_CLIENT_ID, PUB_AUTH_DOMAIN, PUB_CLIENT_ORIGIN } from "$env/static/public";
import type { Auth0ClientOptions } from "@auth0/auth0-spa-js";
import { createAuth0Client } from "@auth0/auth0-spa-js";
import { authClient } from "../stores/auth";
import { browser } from "$app/environment";

const authConfig: Auth0ClientOptions = {
	domain: PUB_AUTH_DOMAIN,
	clientId: PUB_AUTH_CLIENT_ID,
	authorizationParams: {
		redirect_uri: PUB_CLIENT_ORIGIN
	}
};

export async function load() {
	if (browser) {
		try {
			authClient.set(await createAuth0Client(authConfig));
			return {
				successfulLoad: true
			};
		} catch (error) {
			console.error("Unable to create auth client", error);
			return {
				successfulLoad: false,
				error
			};
		}
	}
}
