import type { ApiFont } from "../models/fonts.js";

/**
 * Case-insensitive family lookup.
 *
 * Returns undefined rather than falling back, because the fallback in the app
 * is a side effect (a toast plus a substitute font) and core stays pure — the
 * caller decides what absence means.
 */
export const findFont = (fonts: readonly ApiFont[], fontName: string): ApiFont | undefined =>
	fonts.find(({ family }) => fontName.toLowerCase() === family.toLowerCase());
