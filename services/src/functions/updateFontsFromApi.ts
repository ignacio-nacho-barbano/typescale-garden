import * as fs from "fs";

export async function updateFontsFromApi() {
	try {
		const fontsReq = await fetch(
			"https://www.googleapis.com/webfonts/v1/webfonts?key=" + process.env.FONTS_API_KEY
		);
		const fonts = await fontsReq.json();

		const fontNames = fonts.items.map(({ family }) => family);

		fs.writeFile("./client/static/fonts-data.json", JSON.stringify({ fonts, fontNames }), (err) => {
			if (err) {
				console.error("🚨 Could not create file:\n", err);
			} else {
				console.log("fonts-data file created successfully ✅");
			}
		});
	} catch (error) {
		console.error("could not create fonts file", { error });
	}
}

updateFontsFromApi();
