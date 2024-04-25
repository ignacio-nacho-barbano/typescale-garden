"use strict";
figma.showUI(__html__, { themeColors: true, width: 450, height: 500 });
figma.ui.onmessage = async (msg) => {
    figma.notify("Starting Plugin");
    const currentStyles = await figma.getLocalTextStylesAsync();
    if (msg.type === "import-styles") {
        const jsonStyles = msg.jsonStyles;
        const fontsToLoad = new Set();
        const fontsUnableToBeLoaded = new Set();
        Object.keys(jsonStyles).forEach((textName) => {
            const { fontName } = jsonStyles[textName];
            fontsToLoad.add(JSON.stringify(fontName));
        });
        try {
            await Promise.allSettled(Array.from(fontsToLoad.values()).map((font) => {
                const parsedFont = JSON.parse(font);
                return figma.loadFontAsync(parsedFont).catch(() => {
                    fontsUnableToBeLoaded.add(parsedFont.style);
                });
            }));
        }
        catch (error) {
            const message = `Unable to load one of the font weights: ${error}`;
            figma.notify(message, { error: true });
            console.error(message, fontsToLoad, error);
        }
        try {
            let lastSuccessfulFontName;
            Object.keys(jsonStyles).forEach((styleName) => {
                const styleProps = jsonStyles[styleName];
                let style = currentStyles.find(({ name }) => name === styleName);
                if (!style) {
                    style = figma.createTextStyle();
                    style.name = styleName;
                }
                Object.keys(styleProps).forEach((property) => {
                    const avoidedProps = ["type", "fontWeight"];
                    if (!avoidedProps.includes(property)) {
                        let valueToAssign = styleProps[property];
                        if (property === "fontName") {
                            const fontFamily = valueToAssign;
                            if (fontsUnableToBeLoaded.has(fontFamily.style)) {
                                valueToAssign = lastSuccessfulFontName || {
                                    family: fontFamily.family,
                                    style: "Regular"
                                };
                            }
                            else {
                                lastSuccessfulFontName = fontFamily;
                            }
                        }
                        style[property] = valueToAssign;
                    }
                });
            });
            figma.notify("Styles imported! ✅");
        }
        catch (error) {
            const message = "Unable to import styles 🙁";
            figma.notify(message, { error: true });
            console.error(message, fontsToLoad, fontsUnableToBeLoaded, error);
        }
    }
    else if (msg.type === "cancel") {
        figma.closePlugin();
    }
};
