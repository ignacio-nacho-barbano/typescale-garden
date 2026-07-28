/**
 * Pairing codes and plugin tokens — the credential path for the Figma plugin.
 *
 * The flow, in full:
 *
 *   1. Web app (user signed in via Auth0) → POST /api/plugin/pairing-codes
 *      → this module mints an 8-character code, stores its hash, returns the code.
 *   2. User types the code into the plugin.
 *   3. Plugin → POST /api/plugin/tokens { code }  (no auth — it has none yet)
 *      → this module atomically claims the code and returns a 256-bit opaque token.
 *   4. Plugin keeps the token in figma.clientStorage and sends it as a bearer token.
 *
 * Nothing here stores a secret in the clear, and nothing here logs one. The token is
 * returned exactly once, at step 3; after that only its hash exists.
 *
 * Reaching D1 goes through `db()` from ./d1 so the binding is still resolved in one
 * place (see the comment on that export).
 */
import { db } from "./d1";

/**
 * Crockford-style base32 minus the four ambiguous letters (I, L, O, U). 32 symbols
 * exactly, which is what makes the modulo below unbiased.
 */
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;

/**
 * Ten minutes: long enough to alt-tab into Figma and retype eight characters,
 * short enough that the guessing window below stays small.
 */
const CODE_TTL_MS = 10 * 60 * 1000;

/**
 * How stale `lastUsedAt` may get before a read bothers writing. Without this, every
 * plugin request would cost a D1 write for information nobody needs to the second.
 */
const LAST_USED_REFRESH_MS = 60 * 60 * 1000;

const TOKEN_PREFIX = "tsg_";
const TOKEN_BYTES = 32;

/** A payload that cannot be a credential. Distinguished so controllers answer 400. */
export class BadPluginAuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BadPluginAuthError";
	}
}

async function sha256Hex(value: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));

	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function randomCode(): string {
	const bytes = new Uint8Array(CODE_LENGTH);
	crypto.getRandomValues(bytes);

	// 256 is an exact multiple of 32, so `% 32` maps bytes onto the alphabet with no
	// modulo bias and no rejection loop.
	return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

function randomToken(): string {
	const bytes = new Uint8Array(TOKEN_BYTES);
	crypto.getRandomValues(bytes);

	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	// base64url, unpadded — safe to put in a header without escaping.
	const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

	return TOKEN_PREFIX + encoded;
}

/**
 * Accepts what a human actually types: any case, with or without the display dash,
 * and with the usual look-alike substitutions folded in. `U` is intentionally NOT
 * remapped — it is not in the alphabet, so a code containing one simply cannot match.
 *
 * Returns null when the input could not be a code, so the caller answers 400 without
 * touching the database.
 */
export function normalizePairingCode(raw: unknown): string | null {
	if (typeof raw !== "string") {
		return null;
	}

	const cleaned = raw
		.toUpperCase()
		.replace(/[^0-9A-Z]/g, "")
		.replace(/O/g, "0")
		.replace(/I/g, "1")
		.replace(/L/g, "1");

	return cleaned.length === CODE_LENGTH ? cleaned : null;
}

/** `ABCD-EFGH` — grouped for reading aloud and retyping, stripped again on the way in. */
export function formatPairingCode(code: string): string {
	return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export interface IssuedPairingCode {
	/** Plaintext, for display. Never stored and never logged. */
	code: string;
	expiresAt: string;
}

/**
 * Mint a code for a signed-in user.
 *
 * Also sweeps: this author's previous codes (so an abandoned one cannot be redeemed
 * later, and only the newest code shown is ever valid) plus anyone's expired rows,
 * which keeps the table from accumulating dead pairing attempts without needing a
 * scheduled job.
 */
export async function issuePairingCode(authorId: string): Promise<IssuedPairingCode> {
	const now = new Date();
	const nowIso = now.toISOString();
	const expiresAt = new Date(now.getTime() + CODE_TTL_MS).toISOString();

	const code = randomCode();
	const codeHash = await sha256Hex(code);

	await db()
		.prepare("DELETE FROM plugin_pairing_codes WHERE authorId = ? OR expiresAt <= ?")
		.bind(authorId, nowIso)
		.run();

	await db()
		.prepare(
			"INSERT INTO plugin_pairing_codes (codeHash, authorId, createdAt, expiresAt) VALUES (?, ?, ?, ?)"
		)
		.bind(codeHash, authorId, nowIso, expiresAt)
		.run();

	return { code, expiresAt };
}

export interface RedeemedPairingCode {
	/** Plaintext, returned to the plugin exactly once. Never stored, never logged. */
	token: string;
	connectionId: string;
}

/**
 * Claim a code and mint the plugin's token.
 *
 * The claim is a single conditional UPDATE ... RETURNING: filtering on
 * `consumedAt IS NULL AND expiresAt > now` inside the statement means SQLite, not this
 * code, decides the winner when the same code is submitted twice concurrently. A
 * read-then-write would race and could mint two tokens from one code.
 *
 * Returns null for every failure mode — unknown, expired, already used — so the
 * caller cannot turn this into an oracle that distinguishes them.
 */
export async function redeemPairingCode(
	code: string,
	label: unknown
): Promise<RedeemedPairingCode | null> {
	const nowIso = new Date().toISOString();
	const codeHash = await sha256Hex(code);

	const claimed = await db()
		.prepare(
			`UPDATE plugin_pairing_codes SET consumedAt = ?
			 WHERE codeHash = ? AND consumedAt IS NULL AND expiresAt > ?
			 RETURNING authorId`
		)
		.bind(nowIso, codeHash, nowIso)
		.first<{ authorId: string }>();

	if (!claimed) {
		return null;
	}

	const token = randomToken();
	const connectionId = crypto.randomUUID();

	await db()
		.prepare(
			"INSERT INTO plugin_tokens (id, tokenHash, authorId, label, createdAt) VALUES (?, ?, ?, ?, ?)"
		)
		.bind(connectionId, await sha256Hex(token), claimed.authorId, normalizeLabel(label), nowIso)
		.run();

	return { token, connectionId };
}

/** Untrusted and purely cosmetic, so it is length-capped and never allowed to be empty. */
function normalizeLabel(label: unknown): string | null {
	if (typeof label !== "string") {
		return null;
	}
	const trimmed = label.trim().slice(0, 60);

	return trimmed || null;
}

export interface ResolvedPluginToken {
	authorId: string;
	connectionId: string;
}

/**
 * Bearer token → owner, or null if it is not a live credential.
 *
 * The lookup is BY hash, so the secret is never compared against stored material and
 * there is no constant-time comparison to get wrong.
 */
export async function resolvePluginToken(token: unknown): Promise<ResolvedPluginToken | null> {
	if (typeof token !== "string" || !token.startsWith(TOKEN_PREFIX)) {
		return null;
	}

	const row = await db()
		.prepare("SELECT id, authorId, lastUsedAt FROM plugin_tokens WHERE tokenHash = ?")
		.bind(await sha256Hex(token))
		.first<{ id: string; authorId: string; lastUsedAt: string | null }>();

	if (!row) {
		return null;
	}

	const now = Date.now();
	const lastUsed = row.lastUsedAt ? Date.parse(row.lastUsedAt) : 0;

	// Deliberately not awaited-on-failure-critical: a bookkeeping write must never be
	// the reason a valid request fails.
	if (!Number.isFinite(lastUsed) || now - lastUsed > LAST_USED_REFRESH_MS) {
		try {
			await db()
				.prepare("UPDATE plugin_tokens SET lastUsedAt = ? WHERE id = ?")
				.bind(new Date(now).toISOString(), row.id)
				.run();
		} catch (error) {
			console.warn("Could not refresh plugin token lastUsedAt", error);
		}
	}

	return { authorId: row.authorId, connectionId: row.id };
}

export interface PluginConnection {
	id: string;
	label: string | null;
	createdAt: string;
	lastUsedAt: string | null;
}

/** For the web app's "connected plugins" list. Returns no secret material. */
export async function listPluginConnections(authorId: string): Promise<PluginConnection[]> {
	const { results } = await db()
		.prepare(
			"SELECT id, label, createdAt, lastUsedAt FROM plugin_tokens WHERE authorId = ? ORDER BY createdAt DESC"
		)
		.bind(authorId)
		.all<PluginConnection>();

	return results;
}

/** Scoped to the owner, so one user cannot revoke another's connection. */
export async function revokePluginConnection(id: string, authorId: string): Promise<boolean> {
	const { meta } = await db()
		.prepare("DELETE FROM plugin_tokens WHERE id = ? AND authorId = ?")
		.bind(id, authorId)
		.run();

	return meta.changes > 0;
}
