import type { BrowserContext } from "@playwright/test";
import { API_URL, AUTH_CLIENT_ID, AUTH_DOMAIN, AUTH_PREFIX, BASE_URL } from "./env";
import { decodeState, encodeState, mintJwt, readJwt } from "./jwt";

/**
 * A fake Auth0 tenant, served entirely by route interception. No app changes.
 *
 * Why this works, all verified against @auth0/auth0-spa-js v2 in node_modules:
 * - `+layout.ts` sets no `cacheLocation`, so the token cache is in-memory and the whole
 *   handshake re-runs on every page load (SvelteKit's universal `load` runs again on
 *   hydration). Nothing to seed in localStorage — and nothing stale to clear.
 * - `useRefreshTokens` is unset, so `getTokenSilently` always takes the hidden-iframe
 *   path and never spins up the Web Worker (whose requests are awkward to intercept).
 * - `route.fulfill` keeps the request URL, so the iframe document really does have the
 *   auth domain's origin and `runIframe`'s `e.origin` check passes for free.
 * - `getDomain` only prepends https:// when the value has no scheme, so an
 *   `http://localhost:5199/idp` domain is legal and the issuer becomes
 *   `http://localhost:5199/idp/`.
 * - the id_token's signature is never checked (see jwt.ts).
 */
export interface AuthUser {
	sub: string;
	email: string;
	name: string;
	nickname: string;
	picture: string;
}

export interface AuthSession {
	loggedIn: boolean;
	user: AuthUser;
	/** Auth0 permissions on the access token. `store:typescales-premium` raises the cap. */
	permissions: string[];
	/**
	 * Holds `/authorize` open for this long, so `user` stays `undefined` and the top bar
	 * is pinned to its placeholder. The only way to observe the resolving state — with an
	 * instant fake tenant the skeleton is gone before a spec can look at it.
	 */
	authorizeDelayMs: number;
}

/** A 1x1 transparent SVG as a data URI, so the avatar never hits the network. */
const AVATAR =
	"data:image/svg+xml;base64," +
	Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>').toString("base64");

export const E2E_USER: AuthUser = {
	sub: "auth0|e2e-user",
	email: "e2e@example.com",
	name: "E2E User",
	nickname: "e2e",
	picture: AVATAR
};

export const newSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
	loggedIn: true,
	user: { ...E2E_USER },
	permissions: [],
	authorizeDelayMs: 0,
	...overrides
});

const ISSUER = `${AUTH_DOMAIN}/`;
const ONE_DAY = 86_400;

/**
 * The `nonce` is round-tripped through the authorization code, which keeps the fake IdP
 * stateless: /oauth/token can mint an id_token whose nonce matches the transaction the
 * SDK is waiting on without either endpoint remembering anything.
 */
const packCode = (nonce: string, sub: string): string => encodeState({ nonce, sub });

const unpackCode = (code: string): { nonce: string; sub: string } => {
	try {
		return decodeState<{ nonce: string; sub: string }>(code);
	} catch {
		return { nonce: "", sub: E2E_USER.sub };
	}
};

const authorizeResponseHtml = (response: Record<string, unknown>): string => `<!DOCTYPE html>
<html><body><script>
	parent.postMessage(
		{ type: "authorization_response", response: ${JSON.stringify(response)} },
		${JSON.stringify(BASE_URL)}
	);
</script></body></html>`;

export async function installFakeAuth0(
	context: BrowserContext,
	session: AuthSession
): Promise<void> {
	await context.route(new RegExp(`${AUTH_PREFIX}/authorize(\\?|$)`), async (route) => {
		if (session.authorizeDelayMs) {
			await new Promise((resolve) => setTimeout(resolve, session.authorizeDelayMs));
		}

		const url = new URL(route.request().url());
		const state = url.searchParams.get("state") ?? "";
		const nonce = url.searchParams.get("nonce") ?? "";
		const mode = url.searchParams.get("response_mode");

		const response = session.loggedIn
			? { code: packCode(nonce, session.user.sub), state }
			: { error: "login_required", error_description: "Login required", state };

		// `prompt=none` silent auth uses web_message; loginWithRedirect uses a plain
		// redirect back to redirect_uri. Both are supported so the Log In button is
		// testable too.
		if (mode === "web_message") {
			return route.fulfill({
				status: 200,
				contentType: "text/html; charset=utf-8",
				body: authorizeResponseHtml(response)
			});
		}

		const redirectUri = url.searchParams.get("redirect_uri") ?? BASE_URL;
		const target = new URL(redirectUri);
		for (const [key, value] of Object.entries(response)) {
			target.searchParams.set(key, String(value));
		}
		return route.fulfill({ status: 302, headers: { location: target.toString() }, body: "" });
	});

	await context.route(new RegExp(`${AUTH_PREFIX}/oauth/token$`), (route) => {
		// The SDK posts form-encoded by default (`useFormData`), not JSON.
		const body = new URLSearchParams(route.request().postData() ?? "");
		const { nonce, sub } = unpackCode(body.get("code") ?? "");
		const now = Math.floor(Date.now() / 1000);

		// Anything outside the SDK's reserved-claim list surfaces on `getUser()`, which
		// is what fills the `user` store. `authState.isAuthenticated` is `!!user?.email`,
		// so the email claim is what actually flips the app into its logged-in state.
		const idToken = mintJwt({
			iss: ISSUER,
			aud: AUTH_CLIENT_ID,
			sub,
			nonce,
			iat: now,
			exp: now + ONE_DAY,
			email: session.user.email,
			email_verified: true,
			name: session.user.name,
			nickname: session.user.nickname,
			picture: session.user.picture
		});

		// Nothing verifies the access token; the fake API just decodes `sub` and
		// `permissions` from it, exactly where the real Worker reads `req.auth.payload`.
		const accessToken = mintJwt({
			iss: ISSUER,
			aud: API_URL,
			sub,
			azp: AUTH_CLIENT_ID,
			scope: "openid profile email",
			permissions: session.permissions,
			iat: now,
			exp: now + ONE_DAY
		});

		return route.fulfill({
			json: {
				access_token: accessToken,
				id_token: idToken,
				scope: "openid profile email",
				expires_in: ONE_DAY,
				token_type: "Bearer"
			}
		});
	});

	// Mutates the session so the tenant actually remembers: `logout()` navigates the page,
	// which re-runs the whole silent-auth handshake, and a stateless fake would hand the
	// user straight back their session — making "log out" untestable.
	await context.route(new RegExp(`${AUTH_PREFIX}/v2/logout`), (route) => {
		session.loggedIn = false;
		return route.fulfill({ status: 302, headers: { location: BASE_URL + "/" }, body: "" });
	});
}

/** Reads what the fake API needs out of an `Authorization: Bearer <jwt>` header. */
export const claimsFromBearer = (
	header: string | undefined
): { sub?: string; permissions: string[] } => {
	const token = header?.replace(/^Bearer\s+/i, "");
	if (!token) return { permissions: [] };

	const payload = readJwt<{ sub?: string; permissions?: string[] }>(token);
	return { sub: payload?.sub, permissions: payload?.permissions ?? [] };
};
