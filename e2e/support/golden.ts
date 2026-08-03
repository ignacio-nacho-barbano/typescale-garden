import fs from "fs";
import path from "path";

/**
 * core's golden fixtures, read straight off disk.
 *
 * The same file backs `core/src/__tests__/golden.test.ts`, which asserts the pure
 * functions produce these bytes. These specs assert the *app* produces them, driven
 * through its real UI — so a divergence between the two layers cannot hide.
 *
 * Read with `fs` rather than imported: this package is transpiled to CommonJS by
 * Playwright but type-checked on its own, and a `resolveJsonModule` import of a
 * 2000-line fixture outside the project root is more trouble than one readFileSync.
 */
export interface GoldenInputs {
	breakpoint: number;
	fontName: string;
	baseUnit: number;
	baseSize: number;
	desktopRatio: number;
	mobileRatio: number;
	letterSpacingRatio: number;
	useUppercaseForTitles: boolean;
	useItalicsForTitles: boolean;
	headingsInitialWeight: number;
	headingsFinalWeight: number;
}

export interface GoldenVariant {
	name: string;
	isHeading: boolean;
	desktopSize: number;
	desktopLine: number;
	mobileSize: number;
	mobileLine: number;
	letterSpacing: number;
	mapsTo?: string;
	weight: number;
	uppercase: boolean;
	italics: boolean;
}

export interface GoldenFixture {
	label: string;
	inputs: GoldenInputs;
	availableWeights: number[];
	weightSteps: number[];
	distributedWeights: number[];
	typescale: GoldenVariant[];
	cssCode: string;
	designTokens: string;
	typescaleObject: { name: string; base: GoldenInputs };
}

export interface ApiFont {
	family: string;
	variants: string[];
	subsets: string[];
	version: string;
	lastModified: string;
	files: Record<string, string>;
	category: string;
	kind: string;
	menu?: string;
}

interface GoldenFile {
	catalogue: ApiFont[];
	fixtures: GoldenFixture[];
}

const GOLDEN_PATH = path.resolve(__dirname, "../../core/src/__tests__/fixtures/golden.json");

const golden = JSON.parse(fs.readFileSync(GOLDEN_PATH, "utf8")) as GoldenFile;

export const catalogue = golden.catalogue;
export const fixtures = golden.fixtures;

export const fixture = (label: string): GoldenFixture => {
	const found = fixtures.find((f) => f.label === label);
	if (!found) {
		throw new Error(
			`No golden fixture labelled "${label}". Available: ${fixtures.map((f) => f.label).join(", ")}`
		);
	}
	return found;
};

/**
 * `unknown-font-falls-back` is not reachable through the UI: the font picker only
 * emits a value when one of its listed options is clicked (AutoComplete.svelte's
 * `outputValue`), so there is no way to put an unknown family into the store. It stays
 * covered by core's unit test. Every other fixture is driven in the browser.
 */
export const UI_UNREACHABLE = ["unknown-font-falls-back"];

export const uiReachableFixtures = fixtures.filter((f) => !UI_UNREACHABLE.includes(f.label));

/**
 * What `GET /api/fonts` answers: Google's `WebfontList` verbatim, no wrapper. The Worker
 * stores the upstream body unparsed (server/src/fonts/snapshot.ts), so this *is* the
 * shape that lands in the `fontsApiData` store.
 */
export const fontsApiPayload = {
	kind: "webfonts#webfontList",
	items: catalogue
};

/**
 * The older, wrapped shape still served by the committed `client/static/fonts-data.json`,
 * which `+layout.svelte` falls back to when the API is unreachable and unwraps with
 * `data.fonts ?? data`. Only the fallback spec needs it.
 */
export const fontsStaticPayload = {
	fontNames: catalogue.map((font) => font.family),
	fonts: fontsApiPayload
};

export const variantByName = (f: GoldenFixture, name: string): GoldenVariant => {
	const found = f.typescale.find((v) => v.name === name);
	if (!found) throw new Error(`Fixture ${f.label} has no "${name}" step`);
	return found;
};
