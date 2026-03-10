import { Prisma } from "@prisma/client";
import { prisma } from "../index";
import { ENVIRONMENT } from "../../src/secrets";

async function addTypescales() {
	const presets: Prisma.TypescaleCreateInput[] = [
		{
			name: "Typescale Garden",
			authorId: "typescale-garden",
			base: {
				breakpoint: 768,
				fontName: "Red Hat Text",
				baseSize: 22,
				baseUnit: 4,
				letterSpacingRatio: 1.5,
				desktopRatio: 1.2,
				mobileRatio: 1.15,
				useUppercaseForTitles: false,
				useItalicsForTitles: false,
				headingsInitialWeight: 700,
				headingsFinalWeight: 500
			}
		},
		{
			name: "IBM Carbon Design",
			authorId: "typescale-garden",
			base: {
				breakpoint: 768,
				fontName: "IBM Plex Sans",
				baseSize: 16,
				baseUnit: 4,
				desktopRatio: 1.29,
				mobileRatio: 1.15,
				letterSpacingRatio: 1.2,
				useUppercaseForTitles: false,
				useItalicsForTitles: false,
				headingsInitialWeight: 200,
				headingsFinalWeight: 400
			}
		},
		{
			name: "Material Design 2",
			authorId: "typescale-garden",
			base: {
				breakpoint: 768,
				fontName: "Roboto",
				baseSize: 16,
				baseUnit: 4,
				desktopRatio: 1.29,
				mobileRatio: 1.15,
				letterSpacingRatio: 1.7,
				useUppercaseForTitles: false,
				useItalicsForTitles: false,
				headingsInitialWeight: 200,
				headingsFinalWeight: 600
			}
		}
	];

	// presets.forEach(async (data) => {
	// 	await prisma.typescale.create({ data });
	// });

	console.log(await prisma.typescale.findMany({ where: { authorId: "typescale-garden" } }));
}

addTypescales();
