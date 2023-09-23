import { derived, writable, type Readable, type Writable, get } from 'svelte/store';
import type { ApiFont, TypePreset, TypeVariant } from '../models';
import { mockFontsApi } from '../constants/mockFontsApi';
import { calculateDistributeWeights, expectedRange, generateCss } from '../functions';
export const presets: TypePreset[] = [
	{
		name: 'Typescale Drift',
		breakpoint: 768,
		fontName: 'Red Hat Text',
		baseSize: 22,
		baseUnit: 4,
		kerningRatio: 1.5,
		desktopRatio: 1.2,
		mobileRatio: 1.15,
		useUppercaseForTitles: false,
		useItallicsForTitles: false,
		headingsInitialWeight: 700,
		headingsFinalWeight: 500
	},
	{
		name: 'IBM Carbon Design',
		breakpoint: 768,
		fontName: 'IBM Plex Sans',
		baseSize: 16,
		baseUnit: 4,
		desktopRatio: 1.29,
		mobileRatio: 1.15,
		kerningRatio: 1.2,
		useUppercaseForTitles: false,
		useItallicsForTitles: false,
		headingsInitialWeight: 200,
		headingsFinalWeight: 400
	},
	{
		name: 'Material Design 2',
		breakpoint: 768,
		fontName: 'Roboto',
		baseSize: 16,
		baseUnit: 4,
		desktopRatio: 1.29,
		mobileRatio: 1.15,
		kerningRatio: 1.7,
		useUppercaseForTitles: false,
		useItallicsForTitles: false,
		headingsInitialWeight: 200,
		headingsFinalWeight: 600
	}
];
export const selPresetIndex: Writable<number> = writable(0);

const currentPreset = () => presets[get(selPresetIndex)];

// constants
const variants = [
	{ isHeading: true, location: 7, name: 'heading1', mapsTo: 'h1' },
	{ isHeading: true, location: 6, name: 'heading2', mapsTo: 'h2' },
	{ isHeading: true, location: 5, name: 'heading3', mapsTo: 'h3' },
	{ isHeading: true, location: 4, name: 'heading4', mapsTo: 'h4' },
	{ isHeading: true, location: 3, name: 'heading5', mapsTo: 'h5' },
	{ isHeading: true, location: 2, name: 'heading6', mapsTo: 'h6' },
	{ isHeading: false, location: 0, name: 'body-1', mapsTo: 'p, button' },
	{ isHeading: false, location: -1, name: 'body-2', mapsTo: 'label, figcaption, input' },
	{ isHeading: false, location: -2, name: 'tooltip' }
];

// writables

export const breakpoint = writable(currentPreset().breakpoint);
export const fontName = writable(currentPreset().fontName);
export const seeCode = writable(false);
export const baseSize = writable(currentPreset().baseSize);
export const baseUnit = writable(currentPreset().baseUnit);
export const visibleGrid = writable(false);
export const desktopRatio = writable(currentPreset().desktopRatio);
export const mobileRatio = writable(currentPreset().mobileRatio);
export const kerningRatio = writable(currentPreset().kerningRatio);
export const useUppercaseForTitles = writable(currentPreset().useUppercaseForTitles);
export const useItallicsForTitles = writable(currentPreset().useItallicsForTitles);

// deriveds

export const currentFont = derived(fontName, ($fontName: string): ApiFont => {
	return (
		mockFontsApi.items.find(({ family }) => $fontName.toLowerCase() === family.toLowerCase()) ||
		mockFontsApi.items[0]
	);
});
export const availableWeights = derived(currentFont, ($currentFont) => {
	const fontVariants = [...$currentFont.variants];

	const regularIndex = fontVariants.findIndex((variant) => variant === 'regular');
	fontVariants[regularIndex] = '400';
	const variants = Array.from(
		new Set(fontVariants.map((variant) => parseInt(variant)).filter((variant) => variant))
	);

	return variants;
});

export const headingsInitialWeight = writable(currentPreset().headingsInitialWeight);
export const headingsFinalWeight = writable(currentPreset().headingsFinalWeight);

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
		kerningRatio,
		useUppercaseForTitles,
		useItallicsForTitles,
		distributedWeights
	],
	([
		$baseSize,
		$baseUnit,
		$desktopRatio,
		$mobileRatio,
		$kerningRatio,
		$useUppercaseForTitles,
		$useItallicsForTitles,
		$distributedWeights
	]) =>
		variants.map(({ location, name, mapsTo, isHeading }, i) => {
			const sortedWeights = [...new Set($distributedWeights)]
				.filter((weight) => weight > 400)
				.sort()
				.reverse();
			sortedWeights[0] = 400;
			const desktopSizeMultiplier = Math.pow($desktopRatio, location);
			const mobileSizeMultiplier = Math.pow($mobileRatio, location);
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
			const kerning = parseFloat(
				(
					$kerningRatio *
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
				kerning,
				mapsTo,
				weight,
				uppercase: isHeading ? $useUppercaseForTitles : false,
				italics: isHeading ? $useItallicsForTitles : false
			} as TypeVariant;
		})
);

export const cssCode = derived(
	[typescale, breakpoint, currentFont, weightSteps],
	([$typescale, $breakpoint, $currentFont, $weightSteps]) =>
		generateCss($typescale, $breakpoint, $currentFont, $weightSteps)
);

export const randomFont = () => {
	const random = mockFontsApi.items[Math.round(Math.random() * mockFontsApi.items.length)];

	fontName.set(random.family);
};

fontName.subscribe(console.log);
