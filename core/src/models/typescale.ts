/**
 * The wire shape of a stored typescale.
 *
 * Previously hand-written in three places: client/src/models/typescale.ts, the
 * interfaces in server/src/db/d1.ts, and implicitly in the plugin. This is now
 * the single definition; the others re-export it.
 *
 * `base` is exactly the set of columns in server/migrations/0001_create_typescales.sql
 * (see BASE_COLUMNS in server/src/db/d1.ts) — keep the two in step. Nothing that
 * is not a column belongs in here.
 */
export interface TypescaleBase {
	breakpoint: number;
	fontName: string;
	baseUnit: number;
	baseSize: number;
	desktopRatio: number;
	mobileRatio: number;
	letterSpacingRatio: number;
	useUppercaseForTitles: boolean;
	useItalicsForTitles: boolean;
	headingsInitialWeight: number;
	headingsFinalWeight: number;
}

export interface Typescale {
	id: string;
	authorId: string;
	name: string;
	base: TypescaleBase;
	overrides: unknown | null;
	createdAt: string;
	lastModifiedAt: string;
}
