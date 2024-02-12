import type { Auth0Client } from "@auth0/auth0-spa-js";
import { user } from "../stores/auth";

export async function getUserData(client: Auth0Client) {
	if (client) {
		if (
			location.search.includes("state=") &&
			(location.search.includes("code=") || location.search.includes("error="))
		) {
			await client.handleRedirectCallback();
			window.history.replaceState({}, document.title, "/");
		}

		try {
			const hasToken = await client.getTokenSilently();
			if (hasToken) {
				const loggedUser = await client.getUser();

				if (loggedUser) {
					user.set(loggedUser);
				}
			}
		} catch (e) {
			return;
		}
	}
}
