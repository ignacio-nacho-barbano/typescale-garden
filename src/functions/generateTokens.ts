import type { TypeVariant, ApiFont } from '../models';

export const generateTokens = (
	typescale: TypeVariant[],
	breakpoint: number,
	font: ApiFont,
	isItalics: boolean,
	isUppercase: boolean
): string => {
	const tokens: Record<string, Record<string, any>> = {};

	typescale.forEach(
		({
			name,
			weight,
			isHeading,
			desktopSize,
			desktopLine,
			mobileSize,
			mobileLine,
			letterSpacing,
			uppercase,
			italics
		}) => {
			const base = {
				type: 'TEXT',
				fontName: { family: font.family, style: isHeading && isItalics ? 'italics' : 'Regular' },
				textCase: isHeading && isUppercase ? 'UPPER' : 'ORIGINAL',
				fontWeight: weight,
				letterSpacing: { value: letterSpacing * 10, unit: 'PERCENT' },
				textDecoration: italics ? 'italics' : ''
			};
			tokens['desktop/' + name] = {
				...base,
				name: 'desktop/' + name,
				fontSize: desktopSize,
				lineHeight: { value: desktopLine, unit: 'PIXELS' }
			};
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
