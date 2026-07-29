import type { Auth0Client, User } from "@auth0/auth0-spa-js";
import { derived, writable } from "svelte/store";

/**
 * How long auth-dependent UI is allowed to show a placeholder before it gives up and
 * renders the logged-out state. A healthy silent login lands in well under a second;
 * this only bites when the hidden auth iframe stalls — blocked third-party cookies, an
 * unreachable tenant — where auth0-spa-js waits 60s per attempt and retries 3 times.
 * Without a ceiling the placeholder could outlive the user's patience by minutes.
 */
export const AUTH_PLACEHOLDER_GRACE_MS = 3000;

export const authClient = writable<Auth0Client>();

/** Set once the grace period above has elapsed with `user` still unresolved. */
export const authResolutionTimedOut = writable(false);

/**
 * Three-state on purpose: `undefined` means the silent login has not answered yet,
 * `null` means it answered "nobody". Anything that renders auth-dependent UI must
 * branch on all three — see `isResolving` below — or a logged-in user gets a flash
 * of the logged-out UI. During SSR it is always `undefined`, since `getUserData`
 * only ever runs in the browser.
 */
export const user = writable<User | null>();
export const authToken = writable<string>();
export const idToken = writable<string>();
export const authState = derived([user, authResolutionTimedOut], ([user, timedOut]) => {
	return {
		/**
		 * True until the silent login resolves one way or the other (or the grace
		 * period runs out). This is what the SSR pass always sees, so UI keyed on it
		 * renders a placeholder in the served HTML rather than committing to "logged
		 * out". Every failure path in `getUserData` / `+layout.ts` settles `user`, and
		 * the timeout backstops the paths that never settle at all.
		 */
		isResolving: user === undefined && !timedOut,
		silentLoginReady: user !== undefined,
		isAuthenticated: !!user?.email
	};
});
