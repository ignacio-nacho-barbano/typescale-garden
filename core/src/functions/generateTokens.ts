import { WEIGHTS_MAP } from "../constants/weightsMap.js";
import type { FontFamilyRef } from "../models/fonts.js";
import type { DesignTokenSet, DesignTokenTextStyle } from "../models/tokens.js";
import type { TypeVariant } from "../models/type-variants.js";

/**
 * The Figma design tokens, as an object.
 *
 * Emits `desktop/<name>` and `mobile/<name>` for every step, plus `-bold` twins
 * for the two body steps (guarded on WEIGHTS_MAP having a weight+200 entry) —
 * 22 keys for a full scale.
 *
 * The `-bold` twins spread `...base` first and then override `fontName`, so
 * fontName keeps its original position in the object. Do not "tidy" that: key
 * insertion order is what JSON.stringify writes out, and the JSON is a
 * user-visible artefact that gets diffed and pasted around.
 *
 * `breakpoint` is unused, and was unused in the original. Kept in the signature
 * because every call site passes it and responsive tokens are the obvious next
 * use for it.
 */
export const buildTokens = (
	typescale: readonly TypeVariant[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	breakpoint: number,
	font: FontFamilyRef
): DesignTokenSet => {
	const tokens: DesignTokenSet = {};

	typescale.forEach(
		({
			name,
			weight,
			desktopSize,
			desktopLine,
			mobileSize,
			mobileLine,
			letterSpacing,
			uppercase,
			italics
		}) => {
			const base: Omit<DesignTokenTextStyle, "name" | "fontSize" | "lineHeight"> = {
				type: "TEXT",
				fontName: { family: font.family, style: WEIGHTS_MAP[weight] + (italics ? " Italic" : "") },
				textCase: uppercase ? "UPPER" : "ORIGINAL",
				letterSpacing: { value: letterSpacing * 10, unit: "PERCENT" }
			};
			const desktopName = "desktop/" + name;
			const mobileName = "mobile/" + name;

			tokens[desktopName] = {
				...base,
				name: desktopName,
				fontSize: desktopSize,
				lineHeight: { value: desktopLine, unit: "PIXELS" }
			};
			tokens[mobileName] = {
				...base,
				name: mobileName,
				fontSize: mobileSize,
				lineHeight: { value: mobileLine, unit: "PIXELS" }
			};

			if (name.includes("body") && WEIGHTS_MAP[weight + 200]) {
				const boldSuffix = "-bold";
				const fontName = {
					family: font.family,
					style: WEIGHTS_MAP[weight + 200] + (italics ? " Italic" : "")
				};

				tokens[desktopName + boldSuffix] = {
					...base,
					fontName,
					name: desktopName + boldSuffix,
					fontSize: desktopSize,
					lineHeight: { value: desktopLine, unit: "PIXELS" }
				};
				tokens[mobileName + boldSuffix] = {
					...base,
					fontName,
					name: mobileName + boldSuffix,
					fontSize: mobileSize,
					lineHeight: { value: mobileLine, unit: "PIXELS" }
				};
			}
		}
	);

	return tokens;
};

/** The same tokens, serialized exactly as the Export modal has always emitted them. */
export const generateTokens = (
	typescale: readonly TypeVariant[],
	breakpoint: number,
	font: FontFamilyRef
): string => JSON.stringify(buildTokens(typescale, breakpoint, font), null, 4);
