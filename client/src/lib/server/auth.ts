import { jwtVerify, importJWK } from "jose";

// JWKS cache for edge runtime - revalidates every 24 hours
let cachedJWKS: any = null;
let jwksCacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch JWKS from Auth0 with caching
 * Edge-compatible version for Cloudflare Workers
 */
async function getJWKS(issuer: string) {
	const now = Date.now();

	// Use cached JWKS if still valid
	if (cachedJWKS && now - jwksCacheTime < CACHE_DURATION) {
		return cachedJWKS;
	}

	try {
		const jwksUrl = `${issuer}.well-known/jwks.json`;
		const response = await fetch(jwksUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch JWKS: ${response.status}`);
		}

		cachedJWKS = await response.json();
		jwksCacheTime = now;
		return cachedJWKS;
	} catch (error) {
		console.error("Failed to fetch JWKS:", error);
		if (cachedJWKS) {
			return cachedJWKS; // Return stale cache on fetch failure
		}
		throw error;
	}
}

/**
 * Find the signing key from JWKS
 */
function getSigningKey(jwks: any, kid: string) {
	const key = jwks.keys.find((k: any) => k.kid === kid);
	if (!key) {
		throw new Error(`Key not found: ${kid}`);
	}
	return key;
}

/**
 * Verify JWT token using Auth0 public key
 * Edge-compatible - works on Cloudflare Workers
 */
export async function verifyJWT(
	token: string,
	options: { audience: string; issuer: string }
): Promise<{
	sub: string;
	permissions?: string[];
	aud?: string | string[];
	iss?: string;
	[key: string]: any;
}> {
	try {
		// Decode header to get kid
		const headerBase64 = token.split(".")[0];
		const header = JSON.parse(Buffer.from(headerBase64, "base64").toString("utf-8"));

		// Fetch JWKS
		const jwks = await getJWKS(options.issuer);
		const key = getSigningKey(jwks, header.kid);

		// Import the JWK
		const importedKey = await importJWK(key);

		// Verify and decode JWT
		const verified = await jwtVerify(token, importedKey, {
			audience: options.audience,
			issuer: options.issuer
		});

		return verified.payload as any;
	} catch (error) {
		console.error("JWT verification failed:", error);
		throw error;
	}
}
