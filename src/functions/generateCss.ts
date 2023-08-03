import type { mockFontsApi } from '../constants/mockFontsApi';
import type { TypeVariant } from '../models';

export const generateCss = (
	desktopVariants: TypeVariant[],
	mobileVariants: TypeVariant[],
	breakpoint: number,
	font: (typeof mockFontsApi)['items'][0]
) => `
@import('${font.files.regular}');

table,
body {
    font-family: ${font.family}, ${font.category};
}
${mobileVariants
	.map(
		({ name, kerning, line, size, weight }, i) => `
.${name} {
    font-size: ${size}px;
    line-height: ${line}px;
    font-weight: ${weight};
    letter-spacing: ${kerning}em;
}
`
	)
	.join('')}
    
    @media (min-width: ${breakpoint}px) {
        ${desktopVariants
					.map(
						({ size, line, name }) => `.${name} {
            font-size: ${size}px;
            line-height: ${line}px;
        }
        `
					)
					.join('')}

    }`;
