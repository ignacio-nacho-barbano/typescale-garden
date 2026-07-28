import {
	availableWeightsFor,
	buildTokens,
	computeTypescale,
	findFont,
	type ApiFont,
	type DesignTokenSet,
	type DesignTokenTextStyle,
	type Typescale
} from "core";

/**
 * The plugin sandbox, not the UI iframe. Everything that touches the network, client
 * storage or the Figma document happens here; ui.html is presentation only and talks
 * to this file over postMessage.
 *
 * Network calls run here rather than in the iframe on purpose: Figma's sandbox `fetch`
 * is not browser-CORS-governed (the manifest's `networkAccess.allowedDomains` is what
 * gates it), so no preflight and no origin allowlist is involved. It also keeps the
 * bearer token out of the iframe entirely — the UI never sees a credential.
 */

// No env system in a Figma plugin, so this is a constant. Point it at
// http://localhost:8787 (and add that to manifest.json's allowedDomains) to develop
// against a local Worker.
const API_BASE = "https://api.typescalegarden.uy";

// figma.clientStorage is per-user and per-plugin, and is the only place a Figma plugin
// can keep a secret. Bump the suffix if the token format ever changes.
const TOKEN_KEY = "tsg-plugin-token-v1";

figma.showUI(__html__, { themeColors: true, width: 460, height: 620 });

/** Slim projection of a Typescale — all the UI needs to draw the list. */
interface ListedTypescale {
	id: string;
	name: string;
	fontName: string;
	isDefault: boolean;
}

const DEFAULT_AUTHOR = "typescale-garden";

/**
 * The full scales, kept here so importing does not need a second round trip and the
 * UI never has to hold anything but display strings.
 */
let loadedTypescales: Typescale[] = [];

/**
 * The Google Fonts catalogue, ~1.9 MB. Fetched lazily on the first import (never just
 * to draw the list) and cached for the session.
 *
 * The plugin derives `availableWeights` from this itself rather than having the API
 * precompute it. Two reasons: the Worker deliberately never parses this payload — a
 * Cron Trigger gets 10 ms of CPU and the whole snapshot design depends on treating it
 * as opaque bytes (see server/src/fonts/snapshot.ts) — and doing it here means the
 * plugin runs the very same core function over the very same catalogue as the web app,
 * which is what makes the two produce identical tokens.
 */
let fontCatalogue: ApiFont[] | null = null;

async function getToken(): Promise<string | null> {
	try {
		return (await figma.clientStorage.getAsync(TOKEN_KEY)) ?? null;
	} catch (error) {
		console.error("Could not read the stored token", error);
		return null;
	}
}

async function apiGet<T>(path: string, token?: string | null): Promise<T> {
	const response = await fetch(API_BASE + path, {
		method: "GET",
		headers: token ? { Authorization: `Bearer ${token}` } : {}
	});

	if (!response.ok) {
		throw new ApiError(response.status, `GET ${path} failed with ${response.status}`);
	}

	return (await response.json()) as T;
}

class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
		this.name = "ApiError";
	}
}

/** Tell the UI everything it needs to render, in one message. */
function postState(patch: {
	signedIn: boolean;
	typescales: ListedTypescale[];
	busy?: boolean;
	error?: string | null;
}) {
	figma.ui.postMessage({ type: "state", busy: false, error: null, ...patch });
}

function toListed(typescale: Typescale): ListedTypescale {
	return {
		id: typescale.id,
		name: typescale.name,
		fontName: typescale.base.fontName,
		isDefault: typescale.authorId === DEFAULT_AUTHOR
	};
}

/**
 * Load whatever this install is entitled to see.
 *
 * Paired → the user's own scales. Unpaired → the community defaults, so the plugin is
 * useful before anyone signs in rather than being a dead-end login wall.
 *
 * A 401 from the paired path means the token was revoked from the website. That is a
 * normal outcome, not an error: drop the token and fall back to defaults.
 */
async function loadTypescales(): Promise<void> {
	postState({ signedIn: false, typescales: [], busy: true });

	let token = await getToken();

	if (token) {
		try {
			const { typescales } = await apiGet<{ typescales: Typescale[] }>(
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
		const { typescales } = await apiGet<{ typescales: Typescale[] }>("/api/typescales/default");
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

async function pair(rawCode: unknown): Promise<void> {
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
			// The API answers identically for unknown, expired and already-used codes, on
			// purpose — so this message must stay just as unspecific.
			postState({
				signedIn: false,
				typescales: [],
				error: "That code is not valid or has expired. Generate a new one on the website."
			});
			return;
		}

		const { token } = (await response.json()) as { token: string };

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

async function unpair(): Promise<void> {
	await figma.clientStorage.deleteAsync(TOKEN_KEY);
	loadedTypescales = [];
	figma.notify("Disconnected. Revoke the connection on the website too if you want it gone.");
	await loadTypescales();
}

async function getFontCatalogue(): Promise<ApiFont[]> {
	if (fontCatalogue) {
		return fontCatalogue;
	}

	const { items } = await apiGet<{ items: ApiFont[] }>("/api/fonts");
	fontCatalogue = items;

	return items;
}

/**
 * Saved scale → Figma text styles.
 *
 * Everything between `base` and the tokens is core's, so this produces the same styles
 * the website's Export modal would have emitted for the same scale.
 */
async function importTypescale(id: unknown): Promise<void> {
	const typescale = loadedTypescales.find((candidate) => candidate.id === id);

	if (!typescale) {
		figma.notify("That scale is no longer loaded, try refreshing.", { error: true });
		return;
	}

	figma.notify(`Importing “${typescale.name}”…`);

	let tokens: DesignTokenSet;

	try {
		const catalogue = await getFontCatalogue();
		const font = findFont(catalogue, typescale.base.fontName);

		if (!font) {
			figma.notify(`Could not find the font “${typescale.base.fontName}”.`, { error: true });
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

/**
 * Create or update the Figma text styles described by a token set.
 *
 * Shared by both entry points: a scale imported from the account, and a token JSON
 * pasted in by hand. Unchanged in behaviour from the original paste-only version.
 */
async function applyTokens(jsonStyles: DesignTokenSet): Promise<void> {
	const currentStyles = await figma.getLocalTextStylesAsync();

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
				// core's Pick is exactly the set of fields a token carries, so this can no
				// longer drift from what the generator emits.
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
			await applyTokens(msg.jsonStyles as DesignTokenSet);
			break;

		case "cancel":
			figma.closePlugin();
			break;
	}
};
