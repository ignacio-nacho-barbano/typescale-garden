import { expectedRange } from "./expectedRange.js";

/**
 * The numeric weights a font offers, from its Google Fonts `variants` list.
 *
 * "regular" is rewritten to "400"; everything else is parseInt-ed, so
 * "300italic" collapses onto 300 and a bare "italic" yields NaN and is dropped
 * by the falsy filter (which also drops 0). Order follows the variants list.
 */
export const availableWeightsFor = (font: { variants: readonly string[] }): number[] => {
	const fontVariants = [...font.variants];

	const regularIndex = fontVariants.findIndex((variant) => variant === "regular");
	// Guarded, unlike the original: a font with no "regular" used to assign to
	// index -1, which is a harmless no-op on an array but would be a real write
	// on any other object. Behaviour is identical.
	if (regularIndex !== -1) fontVariants[regularIndex] = "400";

	return Array.from(
		new Set(fontVariants.map((variant) => parseInt(variant)).filter((variant) => variant))
	);
};

/**
 * Snaps the two heading weights onto weights the font actually has.
 *
 * Pure: returns what the values SHOULD be. Applying them is the caller's job,
 * because in the app that is a store write.
 */
export const clampHeadingWeights = (
	availableWeights: readonly number[],
	initial: number,
	final: number
): { initial: number; final: number } => ({
	initial: availableWeights.includes(initial)
		? initial
		: availableWeights[Math.floor(availableWeights.length / 2)],
	final: availableWeights.includes(final)
		? final
		: availableWeights[availableWeights.length - 1] ?? availableWeights[0]
});

/**
 * The weights the headings step through, between the two chosen endpoints.
 *
 * Comes out DESCENDING when the range is ascending (final >= initial) — the
 * reverse is what makes title-1 the heaviest.
 */
export const weightStepsFor = (
	availableWeights: readonly number[],
	headingsInitialWeight: number,
	headingsFinalWeight: number
): number[] => {
	const ascendingWeight = headingsFinalWeight >= headingsInitialWeight;
	const starting = ascendingWeight ? headingsInitialWeight : headingsFinalWeight;
	const finishing = ascendingWeight ? headingsFinalWeight : headingsInitialWeight;

	const steps = availableWeights.filter((weight) => expectedRange(weight, starting, finishing));

	if (ascendingWeight) steps.reverse();

	return steps;
};
