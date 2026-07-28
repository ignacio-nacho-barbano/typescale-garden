-- Migration number: 0002 	 2026-07-28T00:00:00.000Z
--
-- Lets the Figma plugin read a user's saved typescales.
--
-- The plugin cannot do Auth0's browser login: Figma's sandbox has no redirect
-- surface, and pasting a raw Auth0 access token into a plugin would hand it a
-- credential that is also valid against every other API scope. So instead the web
-- app (where the user IS signed in) mints a short pairing code, the user types that
-- into the plugin once, and the plugin swaps it for its own long-lived opaque token
-- scoped to reading typescales and nothing else.
--
-- Both tables store only SHA-256 hashes of the secret, never the secret. A database
-- dump therefore cannot be replayed as a credential.

-- Short, user-typed, single-use, short-lived. Deliberately NOT keyed by authorId:
-- redemption happens from the plugin, which knows only the code.
CREATE TABLE IF NOT EXISTS plugin_pairing_codes (
	-- SHA-256 hex of the normalized (uppercased, de-ambiguated) code.
	--
	-- Honest caveat: a 40-bit code is brute-forceable offline from a stolen hash, so
	-- this hash is worth much less than the token hash below. It still helps — the
	-- window is ten minutes and the code is single-use — but the real protections are
	-- the TTL, the single-use claim, and platform rate limiting.
	codeHash   TEXT PRIMARY KEY,
	authorId   TEXT NOT NULL,
	createdAt  TEXT NOT NULL,
	expiresAt  TEXT NOT NULL,
	-- NULL until redeemed. The redeeming UPDATE filters on `consumedAt IS NULL`, so
	-- SQLite itself decides the winner if the same code is submitted twice at once.
	consumedAt TEXT
);

-- Issuing a code opportunistically clears that author's older codes and anything
-- expired, so this index serves the sweep rather than any read path.
CREATE INDEX IF NOT EXISTS idx_plugin_pairing_codes_sweep
	ON plugin_pairing_codes (authorId, expiresAt);

-- One row per paired plugin install. No expiry: this is the credential the user
-- chose to create, and it is revocable from the web app.
CREATE TABLE IF NOT EXISTS plugin_tokens (
	id         TEXT PRIMARY KEY,
	-- SHA-256 hex of the 256-bit opaque token. Every request looks the row up BY this
	-- hash, so no comparison against stored secret material ever happens in app code
	-- and there is no timing side channel to get wrong.
	tokenHash  TEXT NOT NULL UNIQUE,
	authorId   TEXT NOT NULL,
	-- Free-text, user-supplied at pairing time ("work laptop"), so a user with several
	-- paired installs can tell them apart when revoking. NULL when not provided.
	label      TEXT,
	createdAt  TEXT NOT NULL,
	-- Refreshed lazily — at most once an hour — so a busy plugin does not turn every
	-- read into a write.
	lastUsedAt TEXT
);

-- Listing and revoking connections both filter by owner.
CREATE INDEX IF NOT EXISTS idx_plugin_tokens_author ON plugin_tokens (authorId);
