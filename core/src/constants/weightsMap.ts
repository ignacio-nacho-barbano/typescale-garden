/**
 * Numeric weight → the style name Figma expects on a FontName.
 *
 * Was duplicated byte-for-byte in client/src/functions/generateTokens.ts and
 * services/src/constants/WEIGHTS_MAP.ts; both now come from here.
 */
export const WEIGHTS_MAP: Record<number, string> = {
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
