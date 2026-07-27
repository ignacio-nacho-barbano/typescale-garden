-- Migration number: 0001 	 2026-07-27T00:00:00.000Z
--
-- Replaces the MongoDB `Typescale` collection (Prisma model `Typescale`).
--
-- The Mongo document nested the scale settings under `base`; SQLite has no
-- nested documents, so those 11 fields become real columns and the API layer
-- re-nests them into `base` on the way out. Every row in the Atlas export had
-- all 11 populated with consistent types, so they are all NOT NULL.
--
-- `id` stays a TEXT ObjectId hex string rather than becoming an INTEGER
-- rowid: the client stores typescale ids (loadedTypescaleId, DELETE
-- /saved/:id), so the migrated rows must keep the ids they already had.
-- New rows get a UUID from the API — both are opaque strings to the client.
CREATE TABLE IF NOT EXISTS typescales (
	id                    TEXT    PRIMARY KEY,
	authorId              TEXT    NOT NULL,
	name                  TEXT    NOT NULL,

	-- base.*
	breakpoint            INTEGER NOT NULL,
	fontName              TEXT    NOT NULL,
	baseUnit              REAL    NOT NULL,
	baseSize              REAL    NOT NULL,
	desktopRatio          REAL    NOT NULL,
	mobileRatio           REAL    NOT NULL,
	letterSpacingRatio    REAL    NOT NULL,
	useUppercaseForTitles INTEGER NOT NULL DEFAULT 0,
	useItalicsForTitles   INTEGER NOT NULL DEFAULT 0,
	headingsInitialWeight INTEGER NOT NULL,
	headingsFinalWeight   INTEGER NOT NULL,

	-- Prisma's `overrides Json?`. Unused by the client today and NULL in every
	-- Atlas document, kept so the column is there if the feature lands.
	overrides             TEXT,

	-- ISO-8601 strings, matching what the Mongo driver serialized Dates to in
	-- JSON responses, so the client sees identical values.
	createdAt             TEXT    NOT NULL,
	lastModifiedAt        TEXT    NOT NULL
);

-- GET /typescales/default filters on authorId; GET /typescales/saved filters on
-- authorId and orders by lastModifiedAt. POST counts rows per authorId.
CREATE INDEX IF NOT EXISTS idx_typescales_author ON typescales (authorId);
CREATE INDEX IF NOT EXISTS idx_typescales_author_modified ON typescales (authorId, lastModifiedAt DESC);
