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
 */
import { build, context } from "esbuild";

const options = {
	entryPoints: ["code.ts"],
	outfile: "code.js",
	bundle: true,
	format: "iife",
	target: "es2020",
	platform: "browser",
	legalComments: "none",
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
