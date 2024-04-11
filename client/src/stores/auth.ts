import type { Auth0Client, User } from "@auth0/auth0-spa-js";
import { derived, writable } from "svelte/store";

export const authClient = writable<Auth0Client>();
export const user = writable<User | null>();
export const authToken = writable<string>();
export const idToken = writable<string>();
export const authState = derived([user], ([user]) => {
	return {
		silentLoginReady: user !== undefined,
		isAuthenticated: !!user?.email
	};
});
