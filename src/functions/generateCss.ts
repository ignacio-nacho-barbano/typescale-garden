import type { mockFontsApi } from '../constants/mockFontsApi';
import type { TypeVariant } from '../models';

export const generateCss = (
	typescale: TypeVariant[],
	breakpoint: number,
	font: (typeof mockFontsApi)['items'][0]
) => {
	return `
@import url('https://fonts.googleapis.com/css2?family=${font.family.replaceAll(
		' ',
		'+'
	)}&display=swap');

body {
	font-size: ${typescale.find(({ name }) => name === 'body')?.desktopSize}px;
    font-family: "${font.family}", ${font.category};
}

 

${typescale
	.filter(({ isHeading }) => isHeading)
	.map(({ name, mapsTo }) => (mapsTo ? `${mapsTo}, .${name}` : `.${name}`))} {
		margin-bottom: 1rem;
		font-style: ${typescale[0].italics ? 'italic' : 'normal'};
		text-transform: ${typescale[0].uppercase ? 'uppercase' : 'none'};
		max-width: 50ch;
	}

	p {
		max-width: 80ch;
		margin-bottom: 2rem;
	}

${typescale
	.map(
		({ name, kerning, mobileLine, mobileSize, weight, mapsTo }) => `
${mapsTo ? `${mapsTo}, .${name}` : `.${name}`} {
    font-size: ${mobileSize}px;
    line-height: ${mobileLine}px;
    font-weight: ${weight};
    letter-spacing: ${kerning}em;
}
`
	)
	.join('')}
    
    @media (min-width: ${breakpoint}px) {
        ${typescale
					.map(
						({ desktopSize, desktopLine, name, mapsTo }) => `${
							mapsTo ? `${mapsTo}, .${name}` : `.${name}`
						} {
            font-size: ${desktopSize}px;
            line-height: ${desktopLine}px;
        }
        `
					)
					.join('')}

    }`;
};
