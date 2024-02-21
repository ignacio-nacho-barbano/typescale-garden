import type { Auth0Client, User } from "@auth0/auth0-spa-js";
import { derived, writable } from "svelte/store";

export const authClient = writable<Auth0Client>();
export const user = writable<User>();
export const authToken = writable<string>();
export const idToken = writable<string>();
export const isAuthenticated = derived([user], ([user]) => !!user?.email);
