/**
 * Minimal JWT minting and reading. No crypto — deliberately.
 *
 * auth0-spa-js v2 verifies the id_token's *claims* only (iss, aud, sub, nonce, alg,
 * iat/exp, three non-empty segments); it never checks the signature, because in a SPA
 * the token arrives over a channel it already trusts. So a token with a placeholder
 * signature is accepted, and the suite needs no keypair, no JWKS endpoint and no
 * asymmetric crypto.
 *
 * If a future SDK version starts verifying signatures, this is the file that has to
 * grow — not the app.
 */
const b64url = (value: string): string =>
	Buffer.from(value, "utf8").toString("base64url").replace(/=+$/, "");

const fromB64url = (value: string): string => Buffer.from(value, "base64url").toString("utf8");

export const mintJwt = (payload: Record<string, unknown>): string => {
	// `alg` must be RS256: the SDK rejects anything else outright.
	const header = { alg: "RS256", typ: "JWT", kid: "e2e" };
	return [b64url(JSON.stringify(header)), b64url(JSON.stringify(payload)), "e2e-signature"].join(
		"."
	);
};

export const readJwt = <T = Record<string, unknown>>(token: string): T | null => {
	const parts = token.split(".");
	if (parts.length !== 3) return null;
	try {
		return JSON.parse(fromB64url(parts[1])) as T;
	} catch {
		return null;
	}
};

export const encodeState = (value: Record<string, unknown>): string =>
	b64url(JSON.stringify(value));

export const decodeState = <T = Record<string, unknown>>(value: string): T =>
	JSON.parse(fromB64url(value)) as T;
