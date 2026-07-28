/**
 * An entry from the Google Fonts webfonts API snapshot.
 *
 * This replaces the client's `type ApiFont = (typeof mockFontsApi.items)[0]`,
 * which inferred its shape from the mock constant and therefore typed `files`
 * with Red Hat Text's literal variant keys — meaning real API entries were not
 * actually assignable to it. `files` is widened to an index signature here,
 * which is a strict loosening. `category` stays required to match what the
 * inferred type promised (generateCss reads it unconditionally).
 */
export interface ApiFont {
	family: string;
	category: string;
	variants: string[];
	subsets: string[];
	version: string;
	lastModified: string;
	files: Record<string, string>;
	kind?: string;
	menu?: string;
}

/** The minimum generateTokens needs. */
export interface FontFamilyRef {
	family: string;
}

/** The minimum generateCss needs. */
export interface CssFont extends FontFamilyRef {
	category: string;
}
