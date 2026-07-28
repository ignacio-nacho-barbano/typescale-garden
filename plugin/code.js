// Generated from code.ts by `npm run build` (plugin/build.mjs). Do not edit by hand.
"use strict";
(() => {
  // ../core/dist/constants/variants.js
  var headingPrefix = "title-";
  var VARIANTS = [
    { isHeading: true, location: 7, name: headingPrefix + "1", mapsTo: "h1" },
    { isHeading: true, location: 6, name: headingPrefix + "2", mapsTo: "h2" },
    { isHeading: true, location: 5, name: headingPrefix + "3", mapsTo: "h3" },
    { isHeading: true, location: 4, name: headingPrefix + "4", mapsTo: "h4" },
    { isHeading: true, location: 3, name: headingPrefix + "5", mapsTo: "h5" },
    { isHeading: true, location: 2, name: headingPrefix + "6", mapsTo: "h6" },
    { isHeading: false, location: 0, name: "body-1", mapsTo: "p, button" },
    { isHeading: false, location: -1, name: "body-2", mapsTo: "label, figcaption, input" },
    { isHeading: false, location: -2, name: "tooltip" }
  ];
  var HEADING_VARIANTS = VARIANTS.filter(({ isHeading }) => isHeading);

  // ../core/dist/constants/weightsMap.js
  var WEIGHTS_MAP = {
    100: "Thin",
    200: "ExtraLight",
    300: "Light",
    400: "Regular",
    500: "Medium",
    600: "SemiBold",
    700: "Bold",
    800: "ExtraBold",
    900: "Black"
  };

  // ../core/dist/functions/expectedRange.js
  var expectedRange = (value, from, to) => value >= from && value <= to;

  // ../core/dist/functions/availableWeights.js
  var availableWeightsFor = (font) => {
    const fontVariants = [...font.variants];
    const regularIndex = fontVariants.findIndex((variant) => variant === "regular");
    if (regularIndex !== -1)
      fontVariants[regularIndex] = "400";
    return Array.from(new Set(fontVariants.map((variant) => parseInt(variant)).filter((variant) => variant)));
  };
  var clampHeadingWeights = (availableWeights, initial, final) => ({
    initial: availableWeights.includes(initial) ? initial : availableWeights[Math.floor(availableWeights.length / 2)],
    final: availableWeights.includes(final) ? final : availableWeights[availableWeights.length - 1] ?? availableWeights[0]
  });
  var weightStepsFor = (availableWeights, headingsInitialWeight, headingsFinalWeight) => {
    const ascendingWeight = headingsFinalWeight >= headingsInitialWeight;
    const starting = ascendingWeight ? headingsInitialWeight : headingsFinalWeight;
    const finishing = ascendingWeight ? headingsFinalWeight : headingsInitialWeight;
    const steps = availableWeights.filter((weight) => expectedRange(weight, starting, finishing));
    if (ascendingWeight)
      steps.reverse();
    return steps;
  };

  // ../core/dist/functions/buildTypescale.js
  var buildTypescale = (inputs, distributedWeights) => {
    const { baseSize, baseUnit, desktopRatio, mobileRatio, letterSpacingRatio, useUppercaseForTitles, useItalicsForTitles } = inputs;
    return VARIANTS.map(({ location, name, mapsTo, isHeading }, i) => {
      const sortedWeights = [...new Set(distributedWeights)].filter((weight2) => weight2 > 400).sort().reverse();
      sortedWeights[0] = 400;
      const desktopSizeMultiplier = Math.pow(desktopRatio, location);
      const mobileSizeMultiplier = Math.pow(mobileRatio, location - 1);
      const weight = isHeading ? distributedWeights[i] : sortedWeights.at(location) || sortedWeights[0];
      const lineHeightMultiplier = Math.pow(1.1, 8 - location);
      const desktopSize = Math.round(baseSize * desktopSizeMultiplier / 2) * 2;
      const mobileSize = Math.round(baseSize * mobileSizeMultiplier / 2) * 2;
      const desktopLine = Math.round(desktopSize * (isHeading ? lineHeightMultiplier : 1.5) / baseUnit) * baseUnit;
      const mobileLine = Math.round(mobileSize * (isHeading ? lineHeightMultiplier : 1.5) / baseUnit) * baseUnit;
      const letterSpacing = parseFloat((letterSpacingRatio * ((desktopSize >= baseSize ? -5e-5 : -625e-5) * desktopSize + (desktopSize >= baseSize ? 33e-5 : 0.14) + weight / 36e4)).toFixed(3));
      return {
        name,
        isHeading,
        desktopSize,
        desktopLine,
        mobileSize,
        mobileLine,
        letterSpacing,
        mapsTo,
        weight,
        uppercase: isHeading ? useUppercaseForTitles : false,
        italics: isHeading ? useItalicsForTitles : false
      };
    });
  };

  // ../core/dist/functions/distributeWeights.js
  var distributeWeights = (variantCount, weightSteps) => {
    const necessarySteps = weightSteps;
    const repetitionsPerStep = Math.floor(variantCount / necessarySteps.length);
    let extraSpaces = variantCount - repetitionsPerStep * necessarySteps.length;
    const variantWeights = [];
    for (let i = 0; i < necessarySteps.length; i++) {
      for (let j = 0; j < repetitionsPerStep; j++) {
        variantWeights.push(necessarySteps[i]);
        if (extraSpaces > 0) {
          variantWeights.push(necessarySteps[i]);
          extraSpaces--;
        }
      }
    }
    return variantWeights;
  };

  // ../core/dist/functions/computeTypescale.js
  var computeTypescale = (base, availableWeights) => {
    const { initial, final } = clampHeadingWeights(availableWeights, base.headingsInitialWeight, base.headingsFinalWeight);
    const weightSteps = weightStepsFor(availableWeights, initial, final);
    const distributedWeights = distributeWeights(HEADING_VARIANTS.length, weightSteps);
    return {
      typescale: buildTypescale(base, distributedWeights),
      weightSteps,
      distributedWeights,
      headingsInitialWeight: initial,
      headingsFinalWeight: final
    };
  };

  // ../core/dist/functions/findFont.js
  var findFont = (fonts, fontName) => fonts.find(({ family }) => fontName.toLowerCase() === family.toLowerCase());

  // ../core/dist/functions/generateTokens.js
  var buildTokens = (typescale, breakpoint, font) => {
    const tokens = {};
    typescale.forEach(({ name, weight, desktopSize, desktopLine, mobileSize, mobileLine, letterSpacing, uppercase, italics }) => {
      const base = {
        type: "TEXT",
        fontName: { family: font.family, style: WEIGHTS_MAP[weight] + (italics ? " Italic" : "") },
        textCase: uppercase ? "UPPER" : "ORIGINAL",
        letterSpacing: { value: letterSpacing * 10, unit: "PERCENT" }
      };
      const desktopName = "desktop/" + name;
      const mobileName = "mobile/" + name;
      tokens[desktopName] = {
        ...base,
        name: desktopName,
        fontSize: desktopSize,
        lineHeight: { value: desktopLine, unit: "PIXELS" }
      };
      tokens[mobileName] = {
        ...base,
        name: mobileName,
        fontSize: mobileSize,
        lineHeight: { value: mobileLine, unit: "PIXELS" }
      };
      if (name.includes("body") && WEIGHTS_MAP[weight + 200]) {
        const boldSuffix = "-bold";
        const fontName = {
          family: font.family,
          style: WEIGHTS_MAP[weight + 200] + (italics ? " Italic" : "")
        };
        tokens[desktopName + boldSuffix] = {
          ...base,
          fontName,
          name: desktopName + boldSuffix,
          fontSize: desktopSize,
          lineHeight: { value: desktopLine, unit: "PIXELS" }
        };
        tokens[mobileName + boldSuffix] = {
          ...base,
          fontName,
          name: mobileName + boldSuffix,
          fontSize: mobileSize,
          lineHeight: { value: mobileLine, unit: "PIXELS" }
        };
      }
    });
    return tokens;
  };

  // code.ts
  var API_BASE = "https://api.typescalegarden.uy";
  var TOKEN_KEY = "tsg-plugin-token-v1";
  figma.showUI(__html__, { themeColors: true, width: 460, height: 620 });
  var DEFAULT_AUTHOR = "typescale-garden";
  var loadedTypescales = [];
  var fontCatalogue = null;
  async function getToken() {
    try {
      return await figma.clientStorage.getAsync(TOKEN_KEY) ?? null;
    } catch (error) {
      console.error("Could not read the stored token", error);
      return null;
    }
  }
  async function apiGet(path, token) {
    const response = await fetch(API_BASE + path, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      throw new ApiError(response.status, `GET ${path} failed with ${response.status}`);
    }
    return await response.json();
  }
  var ApiError = class extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
      this.name = "ApiError";
    }
  };
  function postState(patch) {
    figma.ui.postMessage({ type: "state", busy: false, error: null, ...patch });
  }
  function toListed(typescale) {
    return {
      id: typescale.id,
      name: typescale.name,
      fontName: typescale.base.fontName,
      isDefault: typescale.authorId === DEFAULT_AUTHOR
    };
  }
  async function loadTypescales() {
    postState({ signedIn: false, typescales: [], busy: true });
    let token = await getToken();
    if (token) {
      try {
        const { typescales } = await apiGet(
          "/api/plugin/typescales",
          token
        );
        loadedTypescales = typescales;
        postState({ signedIn: true, typescales: typescales.map(toListed) });
        return;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await figma.clientStorage.deleteAsync(TOKEN_KEY);
          token = null;
          figma.notify("This Figma plugin was disconnected from your account.");
        } else {
          console.error(error);
          postState({
            signedIn: true,
            typescales: [],
            error: "Could not reach Typescale Garden. Check your connection and try again."
          });
          return;
        }
      }
    }
    try {
      const { typescales } = await apiGet("/api/typescales/default");
      loadedTypescales = typescales;
      postState({ signedIn: false, typescales: typescales.map(toListed) });
    } catch (error) {
      console.error(error);
      postState({
        signedIn: false,
        typescales: [],
        error: "Could not reach Typescale Garden. Check your connection and try again."
      });
    }
  }
  async function pair(rawCode) {
    if (typeof rawCode !== "string" || !rawCode.trim()) {
      postState({ signedIn: false, typescales: [], error: "Enter the code from the website." });
      return;
    }
    postState({ signedIn: false, typescales: [], busy: true });
    try {
      const response = await fetch(API_BASE + "/api/plugin/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The server normalizes case, dashes and look-alike characters, so whatever the
        // user typed goes up as-is.
        body: JSON.stringify({ code: rawCode, label: "Figma" })
      });
      if (!response.ok) {
        postState({
          signedIn: false,
          typescales: [],
          error: "That code is not valid or has expired. Generate a new one on the website."
        });
        return;
      }
      const { token } = await response.json();
      await figma.clientStorage.setAsync(TOKEN_KEY, token);
      figma.notify("Connected to your Typescale Garden account ✅");
      await loadTypescales();
    } catch (error) {
      console.error(error);
      postState({
        signedIn: false,
        typescales: [],
        error: "Could not reach Typescale Garden. Check your connection and try again."
      });
    }
  }
  async function unpair() {
    await figma.clientStorage.deleteAsync(TOKEN_KEY);
    loadedTypescales = [];
    figma.notify("Disconnected. Revoke the connection on the website too if you want it gone.");
    await loadTypescales();
  }
  async function getFontCatalogue() {
    if (fontCatalogue) {
      return fontCatalogue;
    }
    const { items } = await apiGet("/api/fonts");
    fontCatalogue = items;
    return items;
  }
  async function importTypescale(id) {
    const typescale = loadedTypescales.find((candidate) => candidate.id === id);
    if (!typescale) {
      figma.notify("That scale is no longer loaded, try refreshing.", { error: true });
      return;
    }
    figma.notify(`Importing “${typescale.name}”…`);
    let tokens;
    try {
      const catalogue = await getFontCatalogue();
      const font = findFont(catalogue, typescale.base.fontName);
      if (!font) {
        figma.notify(
          `Could not find the font “${typescale.base.fontName}”, so nothing was imported.`,
          { error: true }
        );
        return;
      }
      const { typescale: variants } = computeTypescale(typescale.base, availableWeightsFor(font));
      tokens = buildTokens(variants, typescale.base.breakpoint, font);
    } catch (error) {
      console.error(error);
      figma.notify("Could not work out that scale — see the console.", { error: true });
      return;
    }
    await applyTokens(tokens);
  }
  async function applyTokens(jsonStyles) {
    const currentStyles = await figma.getLocalTextStylesAsync();
    const fontsToLoad = /* @__PURE__ */ new Set();
    const fontsUnableToBeLoaded = /* @__PURE__ */ new Set();
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
              } else {
                lastSuccessfulFontName = fontFamily;
              }
            }
            style[property] = valueToAssign;
          }
        });
      });
      figma.notify("Styles imported! ✅");
    } catch (error) {
      const message = "Unable to import styles 🙁";
      figma.notify(message, { error: true });
      console.error(message, fontsToLoad, fontsUnableToBeLoaded, error);
    }
  }
  figma.ui.onmessage = async (msg) => {
    switch (msg.type) {
      case "init":
        await loadTypescales();
        break;
      case "refresh":
        await loadTypescales();
        break;
      case "pair":
        await pair(msg.code);
        break;
      case "unpair":
        await unpair();
        break;
      case "import-typescale":
        await importTypescale(msg.id);
        break;
      // The original paste-a-token-JSON path, kept: it is the only way to import a
      // scale that was never saved to an account.
      case "import-styles":
        await applyTokens(msg.jsonStyles);
        break;
      case "cancel":
        figma.closePlugin();
        break;
    }
  };
})();
