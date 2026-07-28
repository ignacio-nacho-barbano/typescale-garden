import type { VariantDefinition } from "../models/type-variants.js";

export const headingPrefix = "title-";

/**
 * The scale's steps, in output order. `location` is the exponent applied to the
 * size ratios, so it is what spaces the steps apart; body-1 sits at 0 (the base
 * size) and the two small steps go negative.
 */
export const VARIANTS: readonly VariantDefinition[] = [
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

export const HEADING_VARIANTS: readonly VariantDefinition[] = VARIANTS.filter(
	({ isHeading }) => isHeading
);
