/**
 * Bundles code.ts into code.js, the file Figma actually loads.
 *
 * tsc used to do this directly, which worked only while code.ts imported nothing.
 * Figma's sandbox has no module loader — it evaluates code.js as a single script —
 * so the moment the plugin imports `core`, transpiling stops being enough and the
 * dependency graph has to be flattened into one file. Hence esbuild.
 *
 * Flags worth knowing:
 * - `format: "iife"` — no `import`/`require` survives, and nothing leaks to global scope.
 * - `target: "es2020"` — what the sandbox already runs. The previous tsc output used
 *   `Promise.allSettled` and async arrows, so this is proven, not a guess.
 * - `platform: "browser"` — resolution defaults only (it picks the `module`/`browser`
 *   entry points). It emits no browser APIs; the sandbox has no DOM.
 * - No minification: code.js is committed, so its diff should stay reviewable.
 * - `sourcemap: true` — emits code.js.map (gitignored) *and* the
 *   `//# sourceMappingURL=code.js.map` comment at the end of code.js. Both matter: the
 *   comment is how Sentry finds the map for a frame in the uploaded `~/code.js` artifact.
 *   See scripts/sentry-sourcemaps.mjs, and `npm run sourcemaps:upload` in this package.
 */
import { build, context } from "esbuild";
import { pluginRelease } from "../scripts/sentryRelease.mjs";

const options = {
	entryPoints: ["code.ts"],
	outfile: "code.js",
	bundle: true,
	format: "iife",
	target: "es2020",
	platform: "browser",
	legalComments: "none",
	sourcemap: true,
	// A Figma plugin has no env system, so the release a crash report is filed under has to
	// be baked in. Injecting it from plugin/package.json rather than writing it in sentry.ts
	// is what keeps it equal to the release the map is uploaded under — the two are the same
	// function call. See scripts/sentryRelease.mjs.
	define: { __PLUGIN_RELEASE__: JSON.stringify(pluginRelease()) },
	// Keep the emoji in figma.notify() literal instead of \u-escaped. Cosmetic, but
	// code.js is committed and its diffs get read.
	charset: "utf8",
	logLevel: "info",
	banner: {
		js: "// Generated from code.ts by `npm run build` (plugin/build.mjs). Do not edit by hand."
	}
};

if (process.argv.includes("--watch")) {
	const ctx = await context(options);
	await ctx.watch();
} else {
	await build(options);
}
