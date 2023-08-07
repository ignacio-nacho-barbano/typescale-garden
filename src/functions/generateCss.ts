import type { mockFontsApi } from '../constants/mockFontsApi';
import type { TypeVariant } from '../models';

export const generateCss = (
	typescale: TypeVariant[],
	breakpoint: number,
	font: (typeof mockFontsApi)['items'][0],
	weights: number[]
) => {
	// 	<style>
	//   @import url('https://fonts.googleapis.com/css2?family=Indie+Flower&family=Roboto:ital,wght@0,700;1,900&display=swap');
	// </style>
	return `
@import url('https://fonts.googleapis.com/css2?family=${font.family.replaceAll(
		' ',
		'+'
	)}:wght@${weights.join(';')}&display=swap');

body {
	font-size: ${typescale.find(({ name }) => name === 'body')?.desktopSize}px;
    font-family: "${font.family}", ${font.category};
}

.space-above,
p + h1,
p + h2,
p + h3,
p + h4,
p + h5,
p + h6,
h1 + h2,
h2 + h3,
h3 + h4,
h4 + h5,
h5 + h6 {
	margin-bottom: 1.5rem;
}

 

${typescale
	.filter(({ isHeading }) => isHeading)
	.map(({ name, mapsTo }) => (mapsTo ? `${mapsTo}, .${name}` : `.${name}`))} {
		font-style: ${typescale[0].italics ? 'italic' : 'normal'};
		text-transform: ${typescale[0].uppercase ? 'uppercase' : 'none'};
		max-width: 50ch;
	}

	p {
		max-width: 80ch;
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
