/**
 * Favorite fonts — the families a signed-in user starred in the font picker.
 *
 * Reaching D1 goes through `db()` from ./d1 so the binding is still resolved in one
 * place (see the comment on that export).
 */
import { db } from "./d1";

/** Per user. Far more than anyone stars by hand; it only bounds abuse. */
export const MAX_FAVORITE_FONTS = 200;

/** The longest Google Fonts family is ~40 characters; anything near this is not one. */
const MAX_FAMILY_LENGTH = 100;

export class BadFavoritesError extends Error {}

export class TooManyFavoritesError extends Error {}

/** Validates an untrusted family name, trimming it. Throws BadFavoritesError. */
export function normalizeFamily(value: unknown): string {
	if (typeof value !== "string") {
		throw new BadFavoritesError("A font family must be a string");
	}
	const family = value.trim();

	if (!family || family.length > MAX_FAMILY_LENGTH) {
		throw new BadFavoritesError(`A font family must be 1–${MAX_FAMILY_LENGTH} characters`);
	}
	return family;
}

/** Alphabetical, which is also the order the picker pins them in. */
export async function listFavorites(authorId: string): Promise<string[]> {
	const { results } = await db()
		.prepare("SELECT family FROM favorite_fonts WHERE authorId = ? ORDER BY family COLLATE NOCASE")
		.bind(authorId)
		.all<{ family: string }>();

	return results.map(({ family }) => family);
}

/**
 * Adds families, ignoring ones already favorited, so the client can send its whole
 * local list on sign-in without diffing. All or nothing: over the cap, nothing lands.
 */
export async function addFavorites(authorId: string, families: string[]): Promise<void> {
	const existing = new Set(await listFavorites(authorId));
	const fresh = [...new Set(families)].filter((family) => !existing.has(family));

	if (!fresh.length) {
		return;
	}
	if (existing.size + fresh.length > MAX_FAVORITE_FONTS) {
		throw new TooManyFavoritesError(`At most ${MAX_FAVORITE_FONTS} favorite fonts`);
	}

	const now = new Date().toISOString();
	const insert = db().prepare(
		"INSERT OR IGNORE INTO favorite_fonts (authorId, family, createdAt) VALUES (?, ?, ?)"
	);

	await db().batch(fresh.map((family) => insert.bind(authorId, family, now)));
}

export async function removeFavorite(authorId: string, family: string): Promise<void> {
	await db()
		.prepare("DELETE FROM favorite_fonts WHERE authorId = ? AND family = ?")
		.bind(authorId, family)
		.run();
}
