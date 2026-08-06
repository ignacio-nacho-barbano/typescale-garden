/**
 * Runs the built code.js inside a stubbed Figma sandbox.
 *
 * The assertion that matters is the last one: the text styles the plugin creates must
 * match core's golden `designTokens` fixtures exactly. Those fixtures were captured
 * from the web app's store graph before any of this existed, so this is what pins
 * "the plugin and the website produce the same styles" — the entire reason the scale
 * math was extracted into core.
 *
 * Everything is stubbed, including the API, so this needs no Worker and no database.
 * Deliberately dependency-free (plain node, no vitest): the plugin package has no test
 * runner and does not need one for a single file.
 *
 * Run with `npm test` from plugin/ — it depends on `npm run build` having produced
 * code.js, which plugin/turbo.json wires up.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(
	readFileSync(resolve(here, "../../core/src/__tests__/fixtures/golden.json"), "utf8")
);
const source = readFileSync(resolve(here, "../code.js"), "utf8");

const VALID_CODE = "ABCD1234";
const TOKEN = "tsg_test_token";

// One saved typescale per golden fixture, so every case gets imported and compared.
const saved = golden.fixtures.map((fixture, index) => ({
	id: `fixture-${index}`,
	authorId: "auth0|tester",
	name: fixture.label,
	base: fixture.inputs,
	overrides: null,
	createdAt: "2026-01-01",
	lastModifiedAt: "2026-01-01"
}));

const communityDefaults = [
	{
		id: "community-1",
		authorId: "typescale-garden",
		name: "Community",
		base: golden.fixtures[0].inputs,
		overrides: null,
		createdAt: "2026-01-01",
		lastModifiedAt: "2026-01-01"
	}
];

let tokenRevoked = false;

/** Raw envelope bodies the plugin POSTed to Sentry, in order. */
const sentryEnvelopes = [];

/** Stands in for the API. Mirrors the real status codes, not just the happy path. */
const figmaFetch = async (url, init = {}) => {
	const ok = (body) => ({ ok: true, status: 200, json: async () => body });
	const fail = (status) => ({ ok: false, status, json: async () => ({}) });
	const path = url.replace(/^https?:\/\/[^/]+/, "");
	const authorized = !tokenRevoked && (init.headers?.Authorization ?? "") === `Bearer ${TOKEN}`;

	// Sentry ingest. Captured rather than merely tolerated: what the plugin sends is asserted
	// at the end of this file.
	if (path.includes("/envelope/")) {
		sentryEnvelopes.push(init.body);
		return ok({ id: "0".repeat(32) });
	}

	if (path === "/api/fonts") {
		return ok({ kind: "webfonts#webfontList", items: golden.catalogue });
	}
	if (path === "/api/typescales/default") {
		return ok({ typescales: communityDefaults });
	}
	if (path === "/api/plugin/typescales") {
		return authorized ? ok({ typescales: saved }) : fail(401);
	}
	if (path === "/api/plugin/tokens") {
		const { code } = JSON.parse(init.body);
		// The real server normalizes case, dashes and look-alikes before comparing.
		const normalized = code.toUpperCase().replace(/[^0-9A-Z]/g, "");
		return normalized === VALID_CODE ? ok({ token: TOKEN }) : fail(400);
	}
	throw new Error(`unexpected request: ${path}`);
};

const createdStyles = [];
let uiHandler = null;
const uiMessages = [];
const storage = new Map();

const figma = {
	showUI: () => {},
	notify: () => {},
	closePlugin: () => {},
	clientStorage: {
		getAsync: async (key) => storage.get(key),
		setAsync: async (key, value) => void storage.set(key, value),
		deleteAsync: async (key) => void storage.delete(key)
	},
	ui: {
		set onmessage(handler) {
			uiHandler = handler;
		},
		postMessage: (message) => uiMessages.push(message)
	},
	getLocalTextStylesAsync: async () => [],
	createTextStyle: () => {
		const style = {};
		createdStyles.push(style);
		return style;
	},
	loadFontAsync: async () => {}
};

vm.runInContext(
	source,
	vm.createContext({
		figma,
		fetch: figmaFetch,
		__html__: "",
		console,
		setTimeout,
		clearTimeout,
		JSON,
		Object,
		Array,
		Set,
		Map,
		Promise,
		Error,
		String,
		Number,
		Boolean,
		Math,
		Date
	})
);

const send = async (message) => {
	await uiHandler(message);
	// The handler kicks off promises the sandbox does not await for us.
	await new Promise((resolve) => setTimeout(resolve, 0));
};
const state = () => uiMessages.filter((message) => message.type === "state").at(-1);

let failures = 0;
const check = (label, pass, detail = "") => {
	if (!pass) failures++;
	console.log(`${pass ? "  ok" : "NOT OK"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

await send({ type: "init" });
check("unpaired install lists community defaults", state().signedIn === false);
check(
	"…and marks them as community",
	state().typescales.every((t) => t.isDefault)
);

await send({ type: "pair", code: "NOPE0000" });
check("an invalid code is refused", state().signedIn === false && !!state().error);
check("…and stores no token", storage.size === 0);

await send({ type: "pair", code: "abcd-1234" });
check("a valid code pairs, however it was typed", state().signedIn === true);
check("…and persists the token", storage.size === 1);
check(`…and lists all ${saved.length} saved scales`, state().typescales.length === saved.length);

const pickFields = (object, keys) => Object.fromEntries(keys.map((key) => [key, object?.[key]]));

const catalogueFamilies = new Set(golden.catalogue.map(({ family }) => family.toLowerCase()));

for (const [index, fixture] of golden.fixtures.entries()) {
	createdStyles.length = 0;
	await send({ type: "import-typescale", id: `fixture-${index}` });

	// The one deliberate divergence from the web app. When the font is missing, the
	// website substitutes its fallback family and carries on — fine for a live editor
	// with a toast next to it. The plugin instead refuses, because the equivalent here
	// is writing 22 text styles in the wrong font into someone's document. core allows
	// both: findFont returns undefined precisely so each caller decides what absence
	// means. So this fixture's golden tokens (which record the substitution) are the
	// wrong expectation for the plugin, and "created nothing" is the right one.
	if (!catalogueFamilies.has(fixture.inputs.fontName.toLowerCase())) {
		check(
			`"${fixture.label}" is refused rather than imported in the wrong font`,
			createdStyles.length === 0,
			`created ${createdStyles.length}`
		);
		continue;
	}

	const expected = JSON.parse(fixture.designTokens);
	const actual = Object.fromEntries(createdStyles.map((style) => [style.name, style]));

	// `type` is never assigned onto a Figma style — it is readonly on TextStyle, and
	// the importer skips it on purpose.
	const matches = Object.entries(expected).every(([name, token]) => {
		const { type, ...fields } = token;
		return JSON.stringify(fields) === JSON.stringify(pickFields(actual[name], Object.keys(fields)));
	});

	check(
		`"${fixture.label}" imports as ${Object.keys(expected).length} styles matching golden tokens`,
		matches && Object.keys(actual).length === Object.keys(expected).length,
		`created ${Object.keys(actual).length}`
	);
}

tokenRevoked = true;
await send({ type: "refresh" });
check("a revoked connection degrades to defaults", state().signedIn === false);
check("…and forgets the dead token", storage.size === 0);

// Error reporting. `ui-error` is the one capture path that needs nothing to fail — ui.html
// forwards its own window errors through it — and the Error it reports is constructed inside
// code.js, so its stack is a real stack from this sandbox. That is the part worth asserting:
// a source map is resolved per frame, so unless the frames are there and are shaped the way
// Sentry expects, uploading code.js.map achieves nothing. See plugin/sentry.ts.
const envelopesBefore = sentryEnvelopes.length;

await send({ type: "ui-error", message: "boom from the iframe" });

check("a ui error is reported to Sentry", sentryEnvelopes.length === envelopesBefore + 1);

const [header, itemHeader, payload] = (sentryEnvelopes.at(-1) ?? "").split("\n");
const event = payload ? JSON.parse(payload) : {};
const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];

check(
	"…as one event envelope carrying the DSN",
	(() => {
		const dsn = JSON.parse(header ?? "{}").dsn;
		if (typeof dsn !== "string") return false;
		try {
			const { hostname } = new URL(dsn);
			return (
				(hostname === "sentry.io" || hostname.endsWith(".sentry.io")) &&
				JSON.parse(itemHeader ?? "{}").type === "event"
			);
		} catch {
			return false;
		}
	})()
);
check(
	"…tagged with the plugin surface",
	event.tags?.surface === "plugin" && event.tags?.flow === "ui"
);
check("…with parsed stack frames, not a string", frames.length > 0, `${frames.length} frames`);
check(
	"…every frame naming the uploaded bundle, with a line number",
	frames.every(
		(frame) =>
			frame.filename === "app:///code.js" &&
			frame.abs_path === "app:///code.js" &&
			Number.isInteger(frame.lineno) &&
			frame.in_app === true
	)
);
check(
	"…and a release the source map can be uploaded under",
	/^plugin@\d+\.\d+\.\d+$/.test(event.release ?? ""),
	String(event.release)
);

console.log(failures === 0 ? "\nplugin: all checks passed" : `\nplugin: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
