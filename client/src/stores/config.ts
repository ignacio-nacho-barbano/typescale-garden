import { derived, get, writable, type Readable } from "svelte/store";
import { mockFontsApi } from "../constants/mockFontsApi";
import {
	calculateDistributeWeights,
	expectedRange,
	generateCss,
	generateTokens
} from "../functions";
import type { Typescale } from "@prisma/client";
import type { ApiFont, TypeVariant } from "../models";
import { showNotification } from "./notifications";
import { loadedTypescale } from "./typescales";
const headingPrefix = "title-";

// constants
const variants = [
	{ isHeading: true, location: 7, name: headingPrefix + "1", mapsTo: "h1" },
	{ isHeading: true, location: 6, name: headingPrefix + "2", mapsTo: "h2" },
	{ isHeading: true, location: 5, name: headingPrefix + "3", mapsTo: "h3" },
	{ isHeading: true, location: 4, name: headingPrefix + "4", mapsTo: "h4" },
	{ isHeading: true, location: 3, name: headingPrefix + "5", mapsTo: "h5" },
	{ isHeading: true, location: 2, name: headingPrefix + "6", mapsTo: "h6" },
	{ isHeading: false, location: 0, name: "body-1", mapsTo: "p, button" },
	{ isHeading: false, location: -1, name: "body-2", mapsTo: "label, figcaption, input" },
	{ isHeading: false, location: -2, name: "tooltip" }
];

// writables

export const breakpoint = writable(768);
export const typescaleName = writable("");
export const fontName = writable("Red Hat Text");
export const baseSize = writable(22);
export const baseUnit = writable(4);
export const visibleGrid = writable(false);
export const desktopRatio = writable(1.22);
export const mobileRatio = writable(1.15);
export const letterSpacingRatio = writable(1.5);
export const useUppercaseForTitles = writable(false);
export const useItalicsForTitles = writable(false);
export const fontsApiData = writable<{ fontNames: string[]; fonts: { items: ApiFont[] } }>();

// deriveds
export const currentFont = derived(
	[fontName, fontsApiData],
	([$fontName, $fontsApiData]): ApiFont => {
		const fontsArray = $fontsApiData?.fonts || mockFontsApi;

		const font = fontsArray.items.find(
			({ family }) => $fontName.toLowerCase() === family.toLowerCase()
		);
		if (font) {
			return font;
		} else {
			showNotification(`🚨 Unable to find font: ${$fontName}, make sure there aren't any typos.`);
			return mockFontsApi.items[0];
		}
	}
);
export const availableWeights = derived(currentFont, ($currentFont) => {
	const fontVariants = [...$currentFont.variants];

	const regularIndex = fontVariants.findIndex((variant) => variant === "regular");
	fontVariants[regularIndex] = "400";
	const variants = Array.from(
		new Set(fontVariants.map((variant) => parseInt(variant)).filter((variant) => variant))
	);

	return variants;
});

export const headingsInitialWeight = writable(700);
export const headingsFinalWeight = writable(300);

availableWeights.subscribe(($aw) => {
	if (!$aw.includes(get(headingsInitialWeight)))
		headingsInitialWeight.set($aw[Math.floor($aw.length / 2)]);
	if (!$aw.includes(get(headingsFinalWeight))) headingsFinalWeight.set($aw.at(-1) || $aw[0]);
});

export const weightSteps: Readable<number[]> = derived(
	[headingsInitialWeight, headingsFinalWeight, availableWeights],
	([$hiw, $hfw, $aw]) => {
		const ascendingWeight = $hfw >= $hiw;
		const starting = ascendingWeight ? $hiw : $hfw;
		const finishing = ascendingWeight ? $hfw : $hiw;

		const steps = $aw.filter((weight) => expectedRange(weight, starting, finishing));

		if (ascendingWeight) steps.reverse();

		return steps;
	}
);

export const distributedWeights = derived([weightSteps], ([$weightSteps]) =>
	calculateDistributeWeights(
		variants.filter(({ isHeading }) => isHeading),
		$weightSteps
	)
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
		variants.map(({ location, name, mapsTo, isHeading }, i) => {
			const sortedWeights = [...new Set($distributedWeights)]
				.filter((weight) => weight > 400)
				.sort()
				.reverse();
			sortedWeights[0] = 400;
			const desktopSizeMultiplier = Math.pow($desktopRatio, location);
			const mobileSizeMultiplier = Math.pow($mobileRatio, location - 1);
			const weight = isHeading
				? $distributedWeights[i]
				: sortedWeights.at(location) || sortedWeights[0];

			const lineHeightMultiplier = Math.pow(1.1, 8 - location);
			const desktopSize = Math.round(($baseSize * desktopSizeMultiplier) / 2) * 2;
			const mobileSize = Math.round(($baseSize * mobileSizeMultiplier) / 2) * 2;
			const desktopLine =
				Math.round((desktopSize * (isHeading ? lineHeightMultiplier : 1.5)) / $baseUnit) *
				$baseUnit;
			const mobileLine =
				Math.round((mobileSize * (isHeading ? lineHeightMultiplier : 1.5)) / $baseUnit) * $baseUnit;
			const letterSpacing = parseFloat(
				(
					$letterSpacingRatio *
					((desktopSize >= $baseSize ? -0.00005 : -0.00625) * desktopSize +
						(desktopSize >= $baseSize ? 0.00033 : 0.14) +
						weight! / 360000)
				).toFixed(3)
			);

			return {
				name,
				isHeading,
				desktopSize,
				desktopLine,
				mobileSize,
				mobileLine,
				letterSpacing,
				mapsTo,
				weight,
				uppercase: isHeading ? $useUppercaseForTitles : false,
				italics: isHeading ? $useItalicsForTitles : false
			} as TypeVariant;
		})
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
