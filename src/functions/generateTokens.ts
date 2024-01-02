/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { TypeVariant, ApiFont } from '../models';

export const generateTokens = (
	typescale: TypeVariant[],
	breakpoint: number,
	font: ApiFont
): string => {
	const tokens: Record<string, TextStyle> = {};

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
				type: 'TEXT',
				fontName: { family: font.family, style: italics ? 'Italics' : 'Regular' },
				textCase: uppercase ? 'UPPER' : 'ORIGINAL',
				// fontWeight: weight,
				letterSpacing: { value: letterSpacing * 10, unit: 'PERCENT' }
			};
			// @ts-ignore
			tokens['desktop/' + name] = {
				...base,
				name: 'desktop/' + name,
				fontSize: desktopSize,
				lineHeight: { value: desktopLine, unit: 'PIXELS' }
			};
			// @ts-ignore
			tokens['mobile/' + name] = {
				...base,
				name: 'mobile/' + name,
				fontSize: mobileSize,
				lineHeight: { value: mobileLine, unit: 'PIXELS' }
			};
		}
	);

	return JSON.stringify(tokens, null, 4);
};
