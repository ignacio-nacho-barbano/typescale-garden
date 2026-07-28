/**
 * Byte-for-byte regression check against output captured from the pre-refactor
 * client store graph (client/src/stores/__capture-golden.test.ts, since deleted).
 *
 * `cssCode` and `designTokens` are user-visible artefacts — people copy them,
 * download them and paste them into Figma — so these assert with `toBe`, not
 * `toMatchObject`. A one-character difference is a real regression.
 */
import { describe, expect, it } from "vitest";
import golden from "./fixtures/golden.json";
import { HEADING_VARIANTS } from "../constants/variants.js";
import { mockFontsApi } from "../constants/mockFontsApi.js";
import type { ApiFont } from "../models/fonts.js";
import type { TypescaleBase } from "../models/typescale.js";
import {
	availableWeightsFor,
	clampHeadingWeights,
	weightStepsFor
} from "../functions/availableWeights.js";
import { buildTypescale } from "../functions/buildTypescale.js";
import { computeTypescale } from "../functions/computeTypescale.js";
import { distributeWeights } from "../functions/distributeWeights.js";
import { findFont } from "../functions/findFont.js";
import { generateCss } from "../functions/generateCss.js";
import { generateTokens } from "../functions/generateTokens.js";

// Via unknown: TS infers the imported JSON's `files` objects as a union of the
// per-entry literal shapes (each with the other entries' keys as `?: undefined`),
// which is not comparable to Record<string, string>.
const catalogue = golden.catalogue as unknown as ApiFont[];

/**
 * The fixtures were serialized with JSON.stringify, which erases two things the
 * live values carry: `-0` becomes `0`, and keys whose value is undefined (the
 * tooltip step has no `mapsTo`) disappear. Comparing structured values against
 * them therefore has to go through the same round trip, or it fails on
 * artefacts of the capture rather than on behaviour.
 *
 * Neither loss can reach a user: String(-0) is "0", so -0 renders as "0" in both
 * the CSS and the tokens JSON — and those two are asserted below as exact
 * strings, with no round trip.
 */
const asSerialized = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Reproduces what the client's store graph does, in the same order: resolve the
 * font (falling back to the mock, which is the client's not-found behaviour),
 * derive the weights, clamp the heading endpoints, then run the math.
 */
const runStoreGraph = (inputs: TypescaleBase) => {
	const font = findFont(catalogue, inputs.fontName) ?? mockFontsApi.items[0];
	const availableWeights = availableWeightsFor(font);
	const { initial, final } = clampHeadingWeights(
		availableWeights,
		inputs.headingsInitialWeight,
		inputs.headingsFinalWeight
	);
	const weightSteps = weightStepsFor(availableWeights, initial, final);
	const distributedWeights = distributeWeights(HEADING_VARIANTS.length, weightSteps);
	const typescale = buildTypescale(inputs, distributedWeights);

	return { font, availableWeights, weightSteps, distributedWeights, typescale };
};

describe.each(golden.fixtures)("$label", (fixture) => {
	// The captured `inputs` already carry the post-clamp heading weights, so
	// feeding them back in is idempotent — which is itself worth asserting.
	const inputs = fixture.inputs as TypescaleBase;

	it("derives the same weights", () => {
		const { availableWeights, weightSteps, distributedWeights } = runStoreGraph(inputs);

		expect(availableWeights).toEqual(fixture.availableWeights);
		expect(weightSteps).toEqual(fixture.weightSteps);
		expect(distributedWeights).toEqual(fixture.distributedWeights);
	});

	it("builds the same typescale", () => {
		expect(asSerialized(runStoreGraph(inputs).typescale)).toEqual(fixture.typescale);
	});

	it("generates the same CSS", () => {
		const { font, typescale, weightSteps } = runStoreGraph(inputs);

		expect(generateCss(typescale, inputs.breakpoint, font, weightSteps)).toBe(fixture.cssCode);
	});

	it("generates the same design tokens", () => {
		const { font, typescale } = runStoreGraph(inputs);

		expect(generateTokens(typescale, inputs.breakpoint, font)).toBe(fixture.designTokens);
	});

	it("computeTypescale agrees with the step-by-step graph", () => {
		const graph = runStoreGraph(inputs);
		const font = findFont(catalogue, inputs.fontName) ?? mockFontsApi.items[0];
		const composed = computeTypescale(inputs, availableWeightsFor(font));

		expect(asSerialized(composed.typescale)).toEqual(asSerialized(graph.typescale));
		expect(composed.weightSteps).toEqual(graph.weightSteps);
		expect(composed.distributedWeights).toEqual(graph.distributedWeights);
		expect(composed.headingsInitialWeight).toBe(inputs.headingsInitialWeight);
		expect(composed.headingsFinalWeight).toBe(inputs.headingsFinalWeight);
	});

	it("does not mutate the weights array it is handed", () => {
		const { font, typescale, weightSteps } = runStoreGraph(inputs);
		const before = [...weightSteps];

		generateCss(typescale, inputs.breakpoint, font, weightSteps);

		// The original sorted this array in place — the weightSteps store's own
		// array — which is why the reversed-steps fixture exists.
		expect(weightSteps).toEqual(before);
	});
});
