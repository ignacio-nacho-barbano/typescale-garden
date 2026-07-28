export type NumericWeights = "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

export type Weights =
	| NumericWeights
	| "regular"
	| "italic"
	| "100italic"
	| "200italic"
	| "300italic"
	| "400italic"
	| "500italic"
	| "600italic"
	| "700italic"
	| "800italic"
	| "900italic";

/** One computed step of the scale. */
export interface TypeVariant {
	isHeading: boolean;
	name: string;
	desktopSize: number;
	desktopLine: number;
	mobileSize: number;
	mobileLine: number;
	letterSpacing: number;
	uppercase: boolean;
	italics: boolean;
	weight: number;
	mapsTo?: string;
}

/**
 * A row in the hardcoded variant table — the definition of a step, before any
 * math runs. `location` is the exponent the size ratios are raised to.
 */
export interface VariantDefinition {
	isHeading: boolean;
	location: number;
	name: string;
	mapsTo?: string;
}

/** Structurally identical to TypescaleBase; kept for the client's existing imports. */
export interface TypeConfigOptions {
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
