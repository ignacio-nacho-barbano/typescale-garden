import type { Auth0Client } from "@auth0/auth0-spa-js";
import { showNotification } from "../stores/notifications";

export function logIn(e: Event, authClientState: Auth0Client, signUp?: boolean) {
	e.preventDefault();

	// The page is interactive before the Auth0 client exists — auth is resolved off the
	// critical path (see `resolveAuth` in routes/+layout.ts), and the log-in buttons also
	// render when client creation failed outright. Clicking in that window used to throw.
	if (!authClientState) {
		showNotification("Still connecting to the login service — please try again in a moment.");
		return;
	}

	let config;

	if (signUp) {
		config = {
			authorizationParams: {
				screen_hint: "signup"
			}
		};
	}

	authClientState.loginWithRedirect(config);
}
