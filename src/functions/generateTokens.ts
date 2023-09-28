import type { TypeVariant, ApiFont } from '../models';

export const generateTokens = (
	typescale: TypeVariant[],
	breakpoint: number,
	font: ApiFont,
	weights: number[]
): string => {
	const fontId = font.family.toLowerCase().replaceAll(' ', '-');
	const tokens: Record<string, Record<string, any>> = {
		fontFamilies: {}
	};

	tokens.fontFamilies[fontId] = {
		value: font.family,
		type: 'fontFamilies'
	};

	typescale.forEach(({ name, weight, desktopSize, letterSpacing, uppercase, italics }) => {
		tokens[name] = {
			type: 'typography',
			value: {
				fontFamily: `{fontFamilies.${fontId}}`,
				fontWeight: weight,
				fontSize: desktopSize,
				letterSpacing: letterSpacing * 10 + '%',
				textCase: uppercase ? 'uppercase' : '',
				textDecoration: italics ? 'italics' : ''
			}
		};
	});
	return JSON.stringify(tokens, null, 4);
};

const jsonExample = {
	fontFamilies: {
		poppins: {
			value: 'Poppins',
			type: 'fontFamilies'
		}
	},
	lineHeights: {
		'0': {
			value: '84',
			type: 'lineHeights'
		},
		'1': {
			value: '40',
			type: 'lineHeights'
		}
	},
	fontWeights: {
		'poppins-0': {
			value: 'Medium',
			type: 'fontWeights'
		},
		'poppins-1': {
			value: 'Light',
			type: 'fontWeights'
		}
	},
	fontSize: {
		'0': {
			value: '32',
			type: 'fontSizes'
		},
		'1': {
			value: '84',
			type: 'fontSizes'
		}
	},
	letterSpacing: {
		'0': {
			value: '-2%',
			type: 'letterSpacing'
		},
		'1': {
			value: '-1%',
			type: 'letterSpacing'
		}
	},
	paragraphSpacing: {
		'0': {
			value: '0',
			type: 'paragraphSpacing'
		}
	},
	'title-1': {
		value: {
			fontFamily: '{fontFamilies.poppins}',
			fontWeight: '{fontWeights.poppins-0}',
			lineHeight: '{lineHeights.0}',
			fontSize: '{fontSize.1}',
			letterSpacing: '{letterSpacing.0}',
			paragraphSpacing: '{paragraphSpacing.0}',
			paragraphIndent: '{paragraphIndent.0}',
			textCase: '{textCase.none}',
			textDecoration: '{textDecoration.none}'
		},
		type: 'typography'
	},
	'title-6': {
		value: {
			fontFamily: '{fontFamilies.poppins}',
			fontWeight: '{fontWeights.poppins-1}',
			lineHeight: '{lineHeights.1}',
			fontSize: '{fontSize.0}',
			letterSpacing: '{letterSpacing.1}',
			paragraphSpacing: '{paragraphSpacing.0}',
			paragraphIndent: '{paragraphIndent.0}',
			textCase: '{textCase.none}',
			textDecoration: '{textDecoration.none}'
		},
		type: 'typography'
	},
	textCase: {
		none: {
			value: 'none',
			type: 'textCase'
		}
	},
	textDecoration: {
		none: {
			value: 'none',
			type: 'textDecoration'
		}
	},
	paragraphIndent: {
		'0': {
			value: '0px',
			type: 'dimension'
		}
	}
};
