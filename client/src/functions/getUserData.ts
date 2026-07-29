import type { Auth0Client } from "@auth0/auth0-spa-js";
import { authToken, user } from "../stores/auth";

/**
 * Resolves the `user` store to either a user or `null` — never leaves it `undefined`.
 * The UI treats `undefined` as "still resolving" and renders a placeholder, so any
 * path out of here that skipped the store would leave that placeholder up for good.
 */
export async function getUserData(client: Auth0Client) {
	if (!client) {
		user.set(null);
		return null;
	}

	if (
		location.search.includes("state=") &&
		(location.search.includes("code=") || location.search.includes("error="))
	) {
		await client.handleRedirectCallback();
		window.history.replaceState({}, document.title, "/");
	}

	try {
		const token = await client.getTokenSilently();
		authToken.set(token);

		if (token) {
			const loggedUser = (await client.getUser()) || null;

			user.set(loggedUser);

			return loggedUser;
		}
	} catch (e) {
		user.set(null);
		return null;
	}

	user.set(null);
	return null;
}
