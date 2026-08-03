import {
	HEADING_VARIANTS,
	availableWeightsFor,
	buildTypescale,
	clampHeadingWeights,
	distributeWeights,
	findFont,
	generateCss,
	generateTokens,
	mockFontsApi,
	weightStepsFor,
	type ApiFont,
	type Typescale
} from "core";
import { derived, get, writable, type Readable } from "svelte/store";
import { showNotification } from "./notifications";
import { loadedTypescale } from "./typescales";

// The scale math, the variant table and the generators all live in `core` — this
// file is only the reactive wiring around them, plus the two side effects core
// deliberately refuses to own (the not-found toast, and writing the clamped
// heading weights back into their writables).

// writables

export const breakpoint = writable(768);
export const typescaleName = writable("");
export const fontName = writable("Red Hat Text");
export const baseSize = writable(20);
export const baseUnit = writable(4);
export const visibleGrid = writable(false);
export const desktopRatio = writable(1.2);
export const mobileRatio = writable(1.15);
export const letterSpacingRatio = writable(1.5);
export const useUppercaseForTitles = writable(false);
export const useItalicsForTitles = writable(false);
// Google's WebfontList verbatim, as served by GET /api/fonts. The Worker stores the
// upstream response unparsed (see server/src/fonts/snapshot.ts), so there is no
// wrapper object around it — the shape matches `mockFontsApi`, which is what makes
// the fallback in `currentFont` a plain `||`.
export const fontsApiData = writable<{ items: ApiFont[] }>();

// deriveds
export const currentFont = derived(
	[fontName, fontsApiData],
	([$fontName, $fontsApiData]): ApiFont => {
		const fontsArray = $fontsApiData || mockFontsApi;

		// core's findFont reports absence by returning undefined; deciding that a
		// miss means "warn the user and fall back" is this app's call, not core's.
		const font = findFont(fontsArray.items, $fontName);
		if (font) {
			return font;
		} else {
			showNotification(`🚨 Unable to find font: ${$fontName}, make sure there aren't any typos.`);
			return mockFontsApi.items[0];
		}
	}
);
export const availableWeights = derived(currentFont, availableWeightsFor);

export const headingsInitialWeight = writable(700);
export const headingsFinalWeight = writable(300);

// Snap the chosen endpoints onto weights the font actually offers. core computes
// what they should be; the store write has to happen out here.
availableWeights.subscribe(($aw) => {
	const { initial, final } = clampHeadingWeights(
		$aw,
		get(headingsInitialWeight),
		get(headingsFinalWeight)
	);

	if (initial !== get(headingsInitialWeight)) headingsInitialWeight.set(initial);
	if (final !== get(headingsFinalWeight)) headingsFinalWeight.set(final);
});

export const weightSteps: Readable<number[]> = derived(
	[headingsInitialWeight, headingsFinalWeight, availableWeights],
	([$hiw, $hfw, $aw]) => weightStepsFor($aw, $hiw, $hfw)
);

export const distributedWeights = derived([weightSteps], ([$weightSteps]) =>
	// Takes a count, not the variants array — the original only ever read its length.
	distributeWeights(HEADING_VARIANTS.length, $weightSteps)
);

export const typescale = derived(
	[
		baseSize,
		baseUnit,
		desktopRatio,
		mobileRatio,
		letterSpacingRatio,
		useUppercaseForTitles,
		useItalicsForTitles,
		distributedWeights
	],
	([
		$baseSize,
		$baseUnit,
		$desktopRatio,
		$mobileRatio,
		$letterSpacingRatio,
		$useUppercaseForTitles,
		$useItalicsForTitles,
		$distributedWeights
	]) =>
		buildTypescale(
			{
				baseSize: $baseSize,
				baseUnit: $baseUnit,
				desktopRatio: $desktopRatio,
				mobileRatio: $mobileRatio,
				letterSpacingRatio: $letterSpacingRatio,
				useUppercaseForTitles: $useUppercaseForTitles,
				useItalicsForTitles: $useItalicsForTitles
			},
			$distributedWeights
		)
);

// selPresetIndex.subscribe((i) => {
// 	const p = presets[i];

// 	fontName.set(p.fontName);
// 	breakpoint.set(p.breakpoint);
// 	baseSize.set(p.baseSize);
// 	baseUnit.set(p.baseUnit);
// 	letterSpacingRatio.set(p.letterSpacingRatio);
// 	desktopRatio.set(p.desktopRatio);
// 	mobileRatio.set(p.mobileRatio);
// 	useUppercaseForTitles.set(p.useUppercaseForTitles);
// 	useItalicsForTitles.set(p.useItalicsForTitles);
// 	headingsInitialWeight.set(p.headingsInitialWeight);
// 	headingsFinalWeight.set(p.headingsFinalWeight);
// });

export const cssCode = derived(
	[typescale, breakpoint, currentFont, weightSteps],
	([$typescale, $breakpoint, $currentFont, $weightSteps]) =>
		generateCss($typescale, $breakpoint, $currentFont, $weightSteps)
);

// export const randomFont = () => {
// 	const random = mockFontsApi.items[Math.round(Math.random() * mockFontsApi.items.length)];

// 	fontName.set(random.family);
// };

export const designTokens = derived(
	[typescale, breakpoint, currentFont],
	([$typescale, $breakpoint, $currentFont]) => generateTokens($typescale, $breakpoint, $currentFont)
);

loadedTypescale.subscribe((typescale) => {
	if (typescale) {
		const tsb = typescale.base;

		typescaleName.set(typescale.name);
		breakpoint.set(tsb.breakpoint);
		fontName.set(tsb.fontName);
		baseUnit.set(tsb.baseUnit);
		baseSize.set(tsb.baseSize);
		desktopRatio.set(tsb.desktopRatio);
		mobileRatio.set(tsb.mobileRatio);
		useUppercaseForTitles.set(tsb.useUppercaseForTitles);
		useItalicsForTitles.set(tsb.useItalicsForTitles);
		headingsInitialWeight.set(tsb.headingsInitialWeight);
		headingsFinalWeight.set(tsb.headingsFinalWeight);
		letterSpacingRatio.set(tsb.letterSpacingRatio);
	}
});

export const typescaleObject: Readable<Pick<Typescale, "base" | "name">> = derived(
	[
		typescaleName,
		fontName,
		breakpoint,
		baseSize,
		baseUnit,
		desktopRatio,
		mobileRatio,
		letterSpacingRatio,
		useUppercaseForTitles,
		useItalicsForTitles,
		headingsInitialWeight,
		headingsFinalWeight
	],
	([
		$typescaleName,
		$fontName,
		$breakpoint,
		$baseSize,
		$baseUnit,
		$desktopRatio,
		$mobileRatio,
		$letterSpacingRatio,
		$useUppercaseForTitles,
		$useItalicsForTitles,
		$headingsInitialWeight,
		$headingsFinalWeight
	]) => ({
		name: $typescaleName,
		base: {
			fontName: $fontName,
			breakpoint: $breakpoint,
			baseSize: $baseSize,
			baseUnit: $baseUnit,
			desktopRatio: $desktopRatio,
			mobileRatio: $mobileRatio,
			letterSpacingRatio: $letterSpacingRatio,
			useUppercaseForTitles: $useUppercaseForTitles,
			useItalicsForTitles: $useItalicsForTitles,
			headingsInitialWeight: $headingsInitialWeight,
			headingsFinalWeight: $headingsFinalWeight
		}
	})
);
