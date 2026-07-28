import type { DesignTokenSet, DesignTokenTextStyle } from "core";

figma.showUI(__html__, { themeColors: true, width: 450, height: 500 });

figma.ui.onmessage = async (msg) => {
	figma.notify("Starting Plugin");
	const currentStyles = await figma.getLocalTextStylesAsync();

	if (msg.type === "import-styles") {
		// The same type the generator emits, straight from core — so the payload shape is
		// stated once instead of being asserted independently at each end.
		const jsonStyles = msg.jsonStyles as DesignTokenSet;

		const fontsToLoad = new Set<string>();
		const fontsUnableToBeLoaded = new Set<string>();

		Object.keys(jsonStyles).forEach((textName) => {
			const { fontName } = jsonStyles[textName];

			fontsToLoad.add(JSON.stringify(fontName));
		});

		try {
			await Promise.allSettled(
				Array.from(fontsToLoad.values()).map((font) => {
					const parsedFont = JSON.parse(font);
					return figma.loadFontAsync(parsedFont).catch(() => {
						fontsUnableToBeLoaded.add(parsedFont.style);
					});
				})
			);
		} catch (error) {
			const message = `Unable to load one of the font weights: ${error}`;
			figma.notify(message, { error: true });
			console.error(message, fontsToLoad, error);
		}

		try {
			let lastSuccessfulFontName: FontName;

			Object.keys(jsonStyles).forEach((styleName) => {
				const styleProps = jsonStyles[styleName];

				let style = currentStyles.find(({ name }) => name === styleName);

				if (!style) {
					style = figma.createTextStyle();
					style.name = styleName;
				}

				Object.keys(styleProps).forEach((property) => {
					// Was `keyof Omit<TextStyle, "id" | "key" | "consumers" | "remote">` — an
					// approximation of "the fields a token can carry". core's Pick is that set
					// exactly, so the two can no longer drift apart.
					type PropertyKeys = keyof DesignTokenTextStyle;
					// `type` is readonly on TextStyle and `fontWeight` is not a token field at
					// all; both are skipped defensively, since these keys come off a
					// user-pasted object at runtime.
					const avoidedProps = ["type", "fontWeight"];

					if (!avoidedProps.includes(property)) {
						let valueToAssign = styleProps[property as PropertyKeys];

						if (property === "fontName") {
							const fontFamily = valueToAssign as FontName;

							if (fontsUnableToBeLoaded.has(fontFamily.style)) {
								valueToAssign = lastSuccessfulFontName || {
									family: fontFamily.family,
									style: "Regular"
								};
							} else {
								lastSuccessfulFontName = fontFamily;
							}
						}

						style[property as PropertyKeys] = valueToAssign as never;
					}
				});
			});

			figma.notify("Styles imported! ✅");
		} catch (error) {
			const message = "Unable to import styles 🙁";
			figma.notify(message, { error: true });
			console.error(message, fontsToLoad, fontsUnableToBeLoaded, error);
		}
	} else if (msg.type === "cancel") {
		figma.closePlugin();
	}
};
