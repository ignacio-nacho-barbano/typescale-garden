import { VARIANTS } from "../constants/variants.js";
import type { TypescaleBase } from "../models/typescale.js";
import type { TypeVariant } from "../models/type-variants.js";

/** The subset of the base settings the size/weight math actually reads. */
export type TypescaleMathInputs = Pick<
	TypescaleBase,
	| "baseSize"
	| "baseUnit"
	| "desktopRatio"
	| "mobileRatio"
	| "letterSpacingRatio"
	| "useUppercaseForTitles"
	| "useItalicsForTitles"
>;

/**
 * The scale itself.
 *
 * Note what is NOT an input: fontName and breakpoint. The font only reaches
 * this through `distributedWeights`, and the breakpoint is applied later, by
 * the CSS generator.
 *
 * Ported verbatim from the `typescale` derived store — including the quirks,
 * which are load-bearing for existing users' output:
 *  - sizes round to the nearest EVEN pixel (round(x / 2) * 2)
 *  - line heights round to a multiple of baseUnit
 *  - non-heading weights come from a descending list of the >400 weights whose
 *    first entry is overwritten with 400, indexed by `location` (negative for
 *    body-2/tooltip, so it indexes from the end)
 *  - the letterSpacing formula switches coefficients at desktopSize >= baseSize
 */
export const buildTypescale = (
	inputs: TypescaleMathInputs,
	distributedWeights: readonly number[]
): TypeVariant[] => {
	const {
		baseSize,
		baseUnit,
		desktopRatio,
		mobileRatio,
		letterSpacingRatio,
		useUppercaseForTitles,
		useItalicsForTitles
	} = inputs;

	return VARIANTS.map(({ location, name, mapsTo, isHeading }, i) => {
		const sortedWeights = [...new Set(distributedWeights)]
			.filter((weight) => weight > 400)
			.sort()
			.reverse();
		sortedWeights[0] = 400;

		const desktopSizeMultiplier = Math.pow(desktopRatio, location);
		const mobileSizeMultiplier = Math.pow(mobileRatio, location - 1);
		const weight = isHeading
			? distributedWeights[i]
			: sortedWeights.at(location) || sortedWeights[0];

		const lineHeightMultiplier = Math.pow(1.1, 8 - location);
		const desktopSize = Math.round((baseSize * desktopSizeMultiplier) / 2) * 2;
		const mobileSize = Math.round((baseSize * mobileSizeMultiplier) / 2) * 2;
		const desktopLine =
			Math.round((desktopSize * (isHeading ? lineHeightMultiplier : 1.5)) / baseUnit) * baseUnit;
		const mobileLine =
			Math.round((mobileSize * (isHeading ? lineHeightMultiplier : 1.5)) / baseUnit) * baseUnit;
		const letterSpacing = parseFloat(
			(
				letterSpacingRatio *
				((desktopSize >= baseSize ? -0.00005 : -0.00625) * desktopSize +
					(desktopSize >= baseSize ? 0.00033 : 0.14) +
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
			uppercase: isHeading ? useUppercaseForTitles : false,
			italics: isHeading ? useItalicsForTitles : false
		} as TypeVariant;
	});
};
