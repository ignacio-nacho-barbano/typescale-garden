/**
 * core — the typescale business logic.
 *
 * Pure and runtime-agnostic: no Node, no DOM, no Svelte, no Figma. Consumed by
 * the client (vite), the server (wrangler) and the Figma plugin (esbuild), so
 * anything added here has to stay free of ambient globals — tsconfig sets
 * `types: []` to enforce that.
 */

export { HEADING_VARIANTS, VARIANTS, headingPrefix } from "./constants/variants.js";
export { WEIGHTS_MAP } from "./constants/weightsMap.js";
export { mockFontsApi, mockFontsApiNames } from "./constants/mockFontsApi.js";

export type { ApiFont, CssFont, FontFamilyRef } from "./models/fonts.js";
export type { DesignTokenSet, DesignTokenTextStyle } from "./models/tokens.js";
export type { Typescale, TypescaleBase } from "./models/typescale.js";
export type {
	NumericWeights,
	TypeConfigOptions,
	TypeVariant,
	VariantDefinition,
	Weights
} from "./models/type-variants.js";

export {
	availableWeightsFor,
	clampHeadingWeights,
	weightStepsFor
} from "./functions/availableWeights.js";
export { buildTypescale, type TypescaleMathInputs } from "./functions/buildTypescale.js";
export { computeTypescale, type ComputedTypescale } from "./functions/computeTypescale.js";
export { distributeWeights } from "./functions/distributeWeights.js";
export { expectedRange } from "./functions/expectedRange.js";
export { findFont } from "./functions/findFont.js";
export { generateCss } from "./functions/generateCss.js";
export { buildTokens, generateTokens } from "./functions/generateTokens.js";
