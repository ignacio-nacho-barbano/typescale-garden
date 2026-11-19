-- Migration number: 0003 	 2026-11-19T00:00:00.000Z
--
-- Fonts a signed-in user starred in the font picker. Signed-out users keep the same
-- list in localStorage; on sign-in the client merges it into these rows.
--
-- One row per (user, family). The family is a Google Fonts family name, stored as
-- the client sent it: the catalogue changes daily, so it is deliberately not checked
-- against it — a favorite that drops out of the catalogue is simply not shown.
CREATE TABLE IF NOT EXISTS favorite_fonts (
	authorId  TEXT NOT NULL,
	family    TEXT NOT NULL,
	createdAt TEXT NOT NULL,
	PRIMARY KEY (authorId, family)
);
