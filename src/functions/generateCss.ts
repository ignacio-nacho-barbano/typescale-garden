import type { ApiFont, TypeVariant } from '../models';

export const generateCss = (
	typescale: TypeVariant[],
	breakpoint: number,
	font: ApiFont,
	weights: number[]
) => {
	// 	<style>
	//   @import url('https://fonts.googleapis.com/css2?family=Indie+Flower&family=Roboto:ital,wght@0,700;1,900&display=swap');
	// </style>
	return `
@import url('https://fonts.googleapis.com/css2?family=${font.family.replaceAll(
		' ',
		'+'
	)}:wght@${Array.from(new Set(weights.sort((a, b) => (a >= b ? 1 : -1)))).join(
		';'
	)}&display=swap');

body {
	font-size: ${typescale.find(({ name }) => name === 'body-1')?.desktopSize}px;
    font-family: "${font.family}", ${font.category};
	--paragraph-space: 2rem;
	--title-space: 1rem;
}

.space-text-above,
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
	margin-top: var(--paragraph-space);
}

h1 + p,
h2 + p,
h3 + p,
h4 + p,
h5 + p,
h6 + p {
	margin-top: var(--title-space);
}

p + p {
	margin-top: var(--title-space);
}

h1 + p,
h2 + p,
h3 + p,
h4 + p,
h5 + p,
h6 + p,
.space-text-below {
	margin-bottom: var(--paragraph-space);
}

p,
span,
.body-1,
.body-2 {
	&.bold,
	.bold,
	b,
	strong {
		font-weight: 700;
	}
}

${typescale
	.filter(({ isHeading }) => isHeading)
	.map(({ name, mapsTo }) => (mapsTo ? `${mapsTo}, .${name} ` : `.${name} `))} {
		font-style: ${typescale[0].italics ? 'italic' : 'normal'};
		text-transform: ${typescale[0].uppercase ? 'uppercase' : 'none'};
		max-width: 768px;
	}

	p {
		max-width: 768px;
	}

${typescale
	.map(
		({ name, letterSpacing, mobileLine, mobileSize, weight, mapsTo }) => `
${mapsTo ? `${mapsTo}, .${name}` : `.${name}`} {
    font-size: ${mobileSize}px;
    line-height: ${mobileLine}px;
    font-weight: ${weight};
    letter-spacing: ${letterSpacing}em;
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
