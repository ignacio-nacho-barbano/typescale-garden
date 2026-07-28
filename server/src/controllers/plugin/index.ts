import { Request, Response } from "express";
import { describeError, findByAuthors } from "../../db/d1";
import {
	formatPairingCode,
	issuePairingCode,
	listPluginConnections,
	normalizePairingCode,
	redeemPairingCode,
	revokePluginConnection
} from "../../db/plugin-auth";

/**
 * POST /api/plugin/pairing-codes — Auth0 protected.
 *
 * Returns the plaintext code once, for display in the web app.
 */
export async function postPairingCode(req: Request, res: Response) {
	try {
		const authorId = req.auth?.payload.sub as string;

		const { code, expiresAt } = await issuePairingCode(authorId);

		// no-store: this response body is a credential, and a cache — browser, CDN or
		// otherwise — has no business holding it.
		res.set("Cache-Control", "no-store");
		res.status(201).json({ code, displayCode: formatPairingCode(code), expiresAt });
	} catch (error) {
		res.status(500).json({
			message: "Could not create a pairing code",
			error: describeError(error)
		});
	}
}

/**
 * POST /api/plugin/tokens — **unauthenticated by construction**: the plugin has no
 * credential yet, the code IS the credential.
 *
 * That makes this the one guessable endpoint in the API, so note what bounds it. The
 * code is 8 symbols over a 32-symbol alphabet (2^40 ≈ 1.1e12 possibilities), lives ten
 * minutes, and is single-use. Even an unthrottled attacker managing 1,000 guesses per
 * second gets ~6e5 tries per window, i.e. a ~5e-7 chance of hitting a *specific* live
 * code. A Cloudflare WAF rate-limiting rule on this path should still be configured
 * before the plugin goes to Figma review — see CLAUDE.md. Application-level rate
 * limiting is not an option here (express-rate-limit cannot run on Workers; see
 * src/index.ts).
 */
export async function postPluginToken(req: Request, res: Response) {
	try {
		const code = normalizePairingCode(req.body?.code);

		// Identical response for "not a code" and "not a live code" — see below.
		if (!code) {
			res.status(400).json({ message: "That pairing code is not valid or has expired" });
			return;
		}

		const redeemed = await redeemPairingCode(code, req.body?.label);

		if (!redeemed) {
			// Unknown, expired and already-redeemed all answer the same, so this cannot be
			// used to learn which codes exist.
			res.status(400).json({ message: "That pairing code is not valid or has expired" });
			return;
		}

		res.set("Cache-Control", "no-store");
		res.status(201).json({ token: redeemed.token, connectionId: redeemed.connectionId });
	} catch (error) {
		res.status(500).json({
			message: "Could not complete the pairing",
			error: describeError(error)
		});
	}
}

/**
 * GET /api/plugin/typescales — plugin-token protected.
 *
 * Read-only, and scoped to the token's owner. Returns the same `Typescale` shape as
 * GET /api/typescales/saved, minus the shared defaults: the plugin asks for these
 * separately when signed out, so folding them in here would make "my scales" and
 * "the community defaults" indistinguishable in the response.
 */
export async function getPluginTypescales(req: Request, res: Response) {
	try {
		// From checkPluginToken, never from req.auth — this route has no Auth0 token.
		const authorId = req.pluginAuth?.authorId;

		if (!authorId) {
			res.status(401).json({ message: "This plugin is not connected to an account" });
			return;
		}

		res.status(200).json({ typescales: await findByAuthors([authorId], true) });
	} catch (error) {
		res.status(500).json({
			message: "Could not load your typescales",
			error: describeError(error)
		});
	}
}

/** GET /api/plugin/connections — Auth0 protected. No secret material in the response. */
export async function getPluginConnections(req: Request, res: Response) {
	try {
		const authorId = req.auth?.payload.sub as string;

		res.status(200).json({ connections: await listPluginConnections(authorId) });
	} catch (error) {
		res.status(500).json({
			message: "Could not load your connected plugins",
			error: describeError(error)
		});
	}
}

/**
 * DELETE /api/plugin/connections/:connectionId — Auth0 protected.
 *
 * Revocation is immediate: `resolvePluginToken` reads the row on every request, so a
 * deleted row means the next plugin call 401s. There is no cached session to outlive it.
 */
export async function deletePluginConnection(req: Request, res: Response) {
	try {
		const authorId = req.auth?.payload.sub as string;

		if (!(await revokePluginConnection(req.params.connectionId, authorId))) {
			res.status(404).json({ message: "No connection of yours matches that id" });
			return;
		}

		res.status(200).json({ connections: await listPluginConnections(authorId) });
	} catch (error) {
		res.status(500).json({
			message: "Could not disconnect that plugin",
			error: describeError(error)
		});
	}
}
