import type { Auth0Client } from "@auth0/auth0-spa-js";

export function logIn(e: Event, authClientState: Auth0Client, signUp?: boolean) {
	e.preventDefault();

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
