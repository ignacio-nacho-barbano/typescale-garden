import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { ApiFont, TypeVariant } from '../models';
import { mockFontsApi } from '../constants/mockFontsApi';
import { calculateDistributeWeights, generateCss } from '../functions';

// constants
const variants = [
	{ isHeading: true, location: 7, name: 'heading1', mapsTo: 'h1' },
	{ isHeading: true, location: 6, name: 'heading2', mapsTo: 'h2' },
	{ isHeading: true, location: 5, name: 'heading3', mapsTo: 'h3' },
	{ isHeading: true, location: 4, name: 'heading4', mapsTo: 'h4' },
	{ isHeading: true, location: 3, name: 'heading5', mapsTo: 'h5' },
	{ isHeading: true, location: 2, name: 'heading6', mapsTo: 'h6' },
	{ isHeading: false, location: 0, name: 'body', mapsTo: 'p, button' },
	{ isHeading: false, location: -1, name: 'small' },
	{ isHeading: false, location: -2, name: 'very-small' }
];
const initialFont: ApiFont =
	mockFontsApi.items[Math.round(Math.random() * mockFontsApi.items.length)];
// writables

export const breakpoint = writable(768);
export const count = writable(0);
export const fontName = writable(initialFont.family);
export const seeCode = writable(false);
export const baseSize = writable(22);
export const baseUnit = writable(4);
export const desktopRatio = writable(1.18);
export const mobileRatio = writable(1.12);
export const kerningRatio = writable(0.05);
export const useUppercaseForTitles = writable(false);
export const useItallicsForTitles = writable(false);

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

export const headingsInitialWeight = derived(availableWeights, ($aw) => {
	return $aw[Math.floor($aw.length / 2)];
});
export const headingsFinalWeight = derived(availableWeights, ($aw) => $aw.at(-1) || $aw[0]);

export const weightSteps: Readable<number[]> = derived(
	[headingsInitialWeight, headingsFinalWeight],
	([$hiw, $hfw]) => {
		const ascendingWeight = $hfw >= $hiw;
		const starting = ascendingWeight ? $hiw : $hfw;
		const finishing = ascendingWeight ? $hfw : $hiw;
		const stepsCount = (finishing - starting) / 100 + 1;

		return new Array(stepsCount)
			.fill(0)
			.map((_, i) => starting + (ascendingWeight ? 100 : -100) * i);
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
			const desktopSizeMultiplier = Math.pow($desktopRatio, location);
			const mobileSizeMultiplier = Math.pow($mobileRatio, location);
			const kerning = parseFloat(
				(Math.pow($kerningRatio, 8 - Math.abs(location)) * (location > 0 ? -0.05 : 10)).toFixed(2)
			);
			const lineHeightMultiplier = Math.pow(1.1, 8 - location);
			const desktopSize = Math.round(($baseSize * desktopSizeMultiplier) / 4) * 4;
			const mobileSize = Math.round(($baseSize * mobileSizeMultiplier) / 4) * 4;
			const desktopLine =
				Math.round((desktopSize * (isHeading ? lineHeightMultiplier : 1.5)) / $baseUnit) *
				$baseUnit;
			const mobileLine =
				Math.round((mobileSize * (isHeading ? lineHeightMultiplier : 1.5)) / $baseUnit) * $baseUnit;

			return {
				name,
				isHeading,
				desktopSize,
				desktopLine,
				mobileSize,
				mobileLine,
				kerning,
				mapsTo,
				uppercase: isHeading ? $useUppercaseForTitles : false,
				italics: isHeading ? $useItallicsForTitles : false,
				weight: isHeading ? $distributedWeights[i] : 400
			} as TypeVariant;
		})
);

export const cssCode = derived(
	[typescale, breakpoint, currentFont, weightSteps],
	([$typescale, $breakpoint, $currentFont, $weightSteps]) =>
		generateCss($typescale, $breakpoint, $currentFont, $weightSteps)
);
