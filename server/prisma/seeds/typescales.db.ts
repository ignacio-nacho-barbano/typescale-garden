import { prisma } from "..";

async function main() {
	await prisma.$connect();

	const typescales = await prisma.typescale.createMany({
		data: [
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
		]
	});

	console.log({ typescales });
}
main()
	.then(async () => {
		console.log("completed insert");

		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
