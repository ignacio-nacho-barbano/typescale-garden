import { RequestHandler } from "express";
import { resolvePluginToken } from "../db/plugin-auth";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			/**
			 * Set by `checkPluginToken`. Deliberately a separate field from `req.auth`
			 * (which express-oauth2-jwt-bearer owns): a plugin token is a weaker
			 * credential than an Auth0 access token and must never be mistaken for one by
			 * a handler that reads `req.auth?.payload.sub`.
			 */
			pluginAuth?: { authorId: string; connectionId: string };
		}
	}
}

/**
 * Authenticates the Figma plugin's opaque bearer token.
 *
 * This is NOT interchangeable with `checkUser`: it grants read access to the caller's
 * own typescales and nothing else. Do not mount it on any route that writes.
 */
export const checkPluginToken: RequestHandler = async (req, res, next) => {
	// The auth scheme is case-insensitive per RFC 7235, so match it that way rather
	// than assuming every future caller capitalises it the way our plugin does.
	const scheme = /^Bearer +(.+)$/i.exec(req.headers.authorization ?? "");
	const token = scheme?.[1].trim() || null;

	if (!token) {
		res.status(401).json({ message: "Missing plugin token" });
		return;
	}

	try {
		const resolved = await resolvePluginToken(token);

		if (!resolved) {
			// Same answer for malformed, unknown and revoked, so this cannot be used to
			// probe which tokens ever existed.
			res.status(401).json({ message: "This plugin is not connected to an account" });
			return;
		}

		req.pluginAuth = resolved;
		next();
	} catch (error) {
		// Never surface the error body here — it is the one place a raw token could end
		// up echoed back to an unauthenticated caller.
		console.error("Plugin token check failed", error);
		res.status(500).json({ message: "Could not verify the plugin connection" });
	}
};
