figma.showUI(__html__, { themeColors: true, width: 450, height: 500 });

figma.ui.onmessage = async (msg) => {
	figma.notify("Starting Plugin");
	const currentStyles = await figma.getLocalTextStylesAsync();

	if (msg.type === "import-styles") {
		const jsonStyles = msg.jsonStyles as Record<string, TextStyle>;

		const fontsToLoad = new Set<string>();

		Object.keys(jsonStyles).forEach((textName) => {
			const { fontName } = jsonStyles[textName];

			fontsToLoad.add(JSON.stringify(fontName));
		});

		try {
			console.log(
				Array.from(fontsToLoad.values()).map((font) => {
					console.log(font);

					return JSON.parse(font);
				})
			);

			await Promise.all(
				Array.from(fontsToLoad.values()).map((font) => figma.loadFontAsync(JSON.parse(font)))
			);
		} catch (error) {
			const message = `Unable to load one of the font weights: ${error}`;
			figma.notify(message, { error: true });
			console.error(message, fontsToLoad, error);
		}

		try {
			Object.keys(jsonStyles).forEach((styleName) => {
				const styleProps = jsonStyles[styleName];
				let style = currentStyles.find(({ name }) => name === styleName);

				if (!style) {
					style = figma.createTextStyle();
					style.name = styleName;
				}

				Object.keys(styleProps).forEach((property) => {
					type PropertyKeys = keyof Omit<TextStyle, "id" | "key" | "consumers" | "remote">;
					const avoidedProps = ["type", "fontWeight"];

					if (!avoidedProps.includes(property)) {
						style[property as PropertyKeys] = styleProps[property as PropertyKeys] as never;
					}
				});
			});

			figma.notify("Styles imported! ✅");
		} catch (error) {
			const message = "Unable to import styles 🙁";
			figma.notify(message, { error: true });
			console.error(message, fontsToLoad, error);
		}
	} else if (msg.type === "cancel") {
		figma.closePlugin();
	}
};
