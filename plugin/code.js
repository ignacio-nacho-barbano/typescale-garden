"use strict";
figma.showUI(__html__, { themeColors: true, width: 450, height: 400 });
figma.ui.onmessage = async (msg) => {
    figma.notify("Starting Plugin");
    let currentStyles = figma.getLocalTextStyles();
    console.log(currentStyles);
    if (msg.type === "import-styles") {
        const jsonStyles = msg.jsonStyles;
        const fonts = [...new Set(await Object.keys(jsonStyles).map((textName) => jsonStyles[textName]).map(({ fontName }) => fontName))];
        console.log(fonts);
        try {
            await fonts;
            await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        }
        catch (error) {
            const message = `Unable to load font: ${fonts}`;
            figma.notify(message, { error: true });
            console.error(message, fonts, error);
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
                    const avoidedProps = ["type", "fontWeight"];
                    if (!avoidedProps.includes(property)) {
                        // @ts-ignore
                        style[property] = styleProps[property];
                    }
                });
                figma.notify("Styles imported! 🌳 😄");
            });
        }
        catch (error) {
            const message = "Unable to import styles 🙁";
            figma.notify(message, { error: true });
            console.error(message, fonts, error);
        }
    }
    else if (msg.type === "cancel") {
        figma.closePlugin();
    }
};
