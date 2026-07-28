import { HEADING_VARIANTS } from "../constants/variants.js";
import type { TypescaleBase } from "../models/typescale.js";
import type { TypeVariant } from "../models/type-variants.js";
import { clampHeadingWeights, weightStepsFor } from "./availableWeights.js";
import { buildTypescale } from "./buildTypescale.js";
import { distributeWeights } from "./distributeWeights.js";

export interface ComputedTypescale {
	typescale: TypeVariant[];
	weightSteps: number[];
	distributedWeights: number[];
	/** Post-clamp — may differ from what was passed in, if the font lacks that weight. */
	headingsInitialWeight: number;
	headingsFinalWeight: number;
}

/**
 * Base settings + the font's available weights → the finished scale.
 *
 * The whole pipeline in one call, for consumers that just want the answer (the
 * Figma plugin, the API). The client does NOT use this: it needs each
 * intermediate value as its own reactive store, so it calls the primitives
 * individually. Both paths must agree — that is what the golden fixtures check.
 */
export const computeTypescale = (
	base: TypescaleBase,
	availableWeights: readonly number[]
): ComputedTypescale => {
	const { initial, final } = clampHeadingWeights(
		availableWeights,
		base.headingsInitialWeight,
		base.headingsFinalWeight
	);

	const weightSteps = weightStepsFor(availableWeights, initial, final);
	const distributedWeights = distributeWeights(HEADING_VARIANTS.length, weightSteps);

	return {
		typescale: buildTypescale(base, distributedWeights),
		weightSteps,
		distributedWeights,
		headingsInitialWeight: initial,
		headingsFinalWeight: final
	};
};
