import { building } from "$app/environment";
import type { Handle } from "@sveltejs/kit";
import { AUTH_DOMAIN, API_URL } from "./lib/server/config.js";
import { verifyJWT } from "./lib/server/auth.js";

export const handle: Handle = async ({ event, resolve }) => {
	// Skip auth during build
	if (building) {
		return resolve(event);
	}

	// Get authorization header
	const authHeader = event.request.headers.get("authorization");

	if (authHeader && authHeader.startsWith("Bearer ")) {
		const token = authHeader.slice(7);

		try {
			// Verify JWT using Auth0 public key
			const decoded = await verifyJWT(token, {
				audience: API_URL,
				issuer: AUTH_DOMAIN
			});

			// Populate event.locals.auth with decoded token info
			event.locals.auth = {
				payload: {
					sub: decoded.sub,
					permissions: decoded.permissions || []
				}
			};
		} catch (error) {
			// Invalid token - leave auth unset
			console.error("JWT verification failed:", error);
		}
	}

	return resolve(event);
};
