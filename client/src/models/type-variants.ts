import type { mockFontsApi } from "../constants/mockFontsApi";

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

export interface TypePreset extends TypeConfigOptions {
	id: number;
	name: string;
}

export type ApiFont = (typeof mockFontsApi.items)[0];
