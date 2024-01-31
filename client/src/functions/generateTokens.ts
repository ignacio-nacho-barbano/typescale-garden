/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { TypeVariant, ApiFont } from "../models";

export const generateTokens = (
	typescale: TypeVariant[],
	breakpoint: number,
	font: ApiFont
): string => {
	const tokens: Record<string, TextStyle> = {};
	const weightsMap: Record<number, string> = {
		100: "Thin",
		200: "ExtraLight",
		300: "Light",
		400: "Regular",
		500: "Medium",
		600: "SemiBold",
		700: "Bold",
		800: "ExtraBold",
		900: "Black"
	};

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
			const base: Partial<TextStyle> = {
				type: "TEXT",
				fontName: { family: font.family, style: weightsMap[weight] + (italics ? " Italic" : "") },
				textCase: uppercase ? "UPPER" : "ORIGINAL",
				// fontWeight: weight,
				letterSpacing: { value: letterSpacing * 10, unit: "PERCENT" }
			};
			// @ts-ignore
			tokens["desktop/" + name] = {
				...base,
				name: "desktop/" + name,
				fontSize: desktopSize,
				lineHeight: { value: desktopLine, unit: "PIXELS" }
			};
			// @ts-ignore
			tokens["mobile/" + name] = {
				...base,
				name: "mobile/" + name,
				fontSize: mobileSize,
				lineHeight: { value: mobileLine, unit: "PIXELS" }
			};
		}
	);

	return JSON.stringify(tokens, null, 4);
};
