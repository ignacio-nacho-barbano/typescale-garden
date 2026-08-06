// Generated from code.ts by `npm run build` (plugin/build.mjs). Do not edit by hand.
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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

  // sentry.ts
  var SENTRY_DSN = "https://d67d38563f6359c0766c81e5126ad044@o4511689468608512.ingest.de.sentry.io/4511809570144336";
  var ENVIRONMENT = "prod";
  var RELEASE = true ? "plugin@1.1.3" : void 0;
  var DSN_PATTERN = /^(https?:)\/\/([0-9a-f]+)@([^/]+)\/(\d+)$/i;
  var FRAME_FILE = "app:///code.js";
  var MAX_FRAMES = 50;
  function parseStack(stack) {
    const frames = [];
    for (const rawLine of stack.split("\n")) {
      const trimmed = rawLine.trim();
      const line = trimmed.replace(/^at\s+/, "").replace(/^async\s+/, "");
      if (!line) {
        continue;
      }
      const parenthesized = /^(.*?)\s*\(([^()]*)\)$/.exec(line);
      const atSign = /^([^@]*)@(.*)$/.exec(line);
      if (!/^at\s+/.test(trimmed) && !atSign) {
        continue;
      }
      const name = parenthesized ? parenthesized[1] : atSign ? atSign[1] : "";
      const location = parenthesized ? parenthesized[2] : atSign ? atSign[2] : line;
      const position = /:(\d+)(?::(\d+))?$/.exec(location);
      if (!position) {
        continue;
      }
      const frame = {
        filename: FRAME_FILE,
        abs_path: FRAME_FILE,
        lineno: Number(position[1]),
        in_app: true
      };
      if (position[2]) {
        frame.colno = Number(position[2]);
      }
      if (name) {
        frame.function = name;
      }
      frames.push(frame);
      if (frames.length === MAX_FRAMES) {
        break;
      }
    }
    return frames.reverse();
  }
  var endpoint;
  function resolveEndpoint() {
    if (endpoint !== void 0) {
      return endpoint;
    }
    const match = ENVIRONMENT === "local" ? null : DSN_PATTERN.exec(SENTRY_DSN.trim());
    endpoint = match ? { url: `${match[1]}//${match[3]}/api/${match[4]}/envelope/`, key: match[2] } : null;
    return endpoint;
  }
  function newEventId() {
    let id = "";
    for (let index = 0; index < 32; index++) {
      id += Math.floor(Math.random() * 16).toString(16);
    }
    return id;
  }
  function captureError(error, context, extra) {
    const target = resolveEndpoint();
    if (!target) {
      return;
    }
    const isError = error instanceof Error;
    const eventId = newEventId();
    const frames = isError && error.stack ? parseStack(error.stack) : [];
    const event = {
      event_id: eventId,
      timestamp: Date.now() / 1e3,
      platform: "javascript",
      level: "error",
      environment: ENVIRONMENT,
      // Undefined drops out of JSON.stringify, so a build without the `define` simply
      // reports an unsymbolicated event rather than one Sentry rejects.
      release: RELEASE,
      tags: {
        // Keep in step with client/src/services/sentry.ts and server/src/sentry.ts: all
        // three surfaces can report into one project, and this tag is what keeps an
        // issue list triageable.
        surface: "plugin",
        flow: context
      },
      exception: {
        values: [
          {
            type: isError ? error.name : "Error",
            value: isError ? error.message : String(error),
            // Omitted rather than sent empty when the stack could not be parsed:
            // `stacktrace: { frames: [] }` makes Sentry group every such event
            // together, whereas no stacktrace at all groups on type and message.
            stacktrace: frames.length > 0 ? { frames } : void 0
          }
        ]
      },
      // The unedited stack is kept alongside the frames on purpose — it is the check on
      // the normalization FRAME_FILE performs, and the only thing left if the parser ever
      // meets a stack shape it does not know. A call site may override it, which is what
      // the `ui-error` case in code.ts does with the iframe's own stack.
      extra: { stack: isError ? error.stack : void 0, ...extra }
    };
    let body;
    try {
      body = [
        JSON.stringify({ event_id: eventId, sent_at: (/* @__PURE__ */ new Date()).toISOString(), dsn: SENTRY_DSN }),
        JSON.stringify({ type: "event" }),
        JSON.stringify(event)
      ].join("\n");
    } catch {
      return;
    }
    void fetch(`${target.url}?sentry_key=${target.key}&sentry_version=7`, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body
    }).catch(() => {
    });
  }

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
      captureError(error, "get-token");
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
      __publicField(this, "status", status);
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
    const token = await getToken();
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
          figma.notify("This Figma plugin was disconnected from your account.");
        } else {
          console.error(error);
          captureError(error, "load-typescales", { paired: true });
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
      captureError(error, "load-typescales", { paired: false });
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
      captureError(error, "pair");
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
      captureError(error, "import-typescale", {
        fontName: typescale.base.fontName,
        catalogueLoaded: fontCatalogue !== null
      });
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
      captureError(error, "load-fonts", { fonts: Array.from(fontsToLoad.values()) });
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
      captureError(error, "apply-tokens", {
        styleCount: Object.keys(jsonStyles).length,
        fontsUnableToBeLoaded: Array.from(fontsUnableToBeLoaded.values())
      });
    }
  }
  figma.ui.onmessage = async (msg) => {
    try {
      await handleMessage(msg);
    } catch (error) {
      console.error(error);
      captureError(error, msg && msg.type ? String(msg.type) : "unknown-message");
      figma.notify("Something went wrong — see the console.", { error: true });
    }
  };
  async function handleMessage(msg) {
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
      // Reported by ui.html's own error handlers. The iframe is a real browser context and
      // could reach Sentry directly, but routing it through here keeps every report going
      // out of one place under one manifest-allowed host — and keeps the DSN out of the
      // iframe, the same reasoning that keeps the bearer token out of it.
      case "ui-error":
        captureError(new Error(String(msg.message)), "ui", {
          stack: msg.stack,
          source: msg.source
        });
        break;
      case "cancel":
        figma.closePlugin();
        break;
    }
  }
})();
//# sourceMappingURL=code.js.map
