import { fileURLToPath } from "node:url";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import { imagetools } from "vite-imagetools";

// rollup-plugin-svelte-svg used to sit here, meant to turn `import Logo from "*.svg"`
// into a component. It cannot work under Vite: `.svg` is a built-in asset extension, so
// `vite:asset` loads the file as `export default "/logo.svg"` before any transform runs,
// and the plugin registers a `transform` hook only — it never sees the markup, and threw
// "svg file did not start with <svg> tag" on the one import that used it. `enforce: "pre"`
// orders transforms, not loads, so it made no difference. The logo is now a real component
// (src/components/Logo.svelte); SVGs referenced by URL are unaffected and still live in static/.
export default defineConfig({
	plugins: [sveltekit(), imagetools()],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"]
	},
	css: {
		preprocessorOptions: {
			scss: {
				// design-system.scss is injected into every component's styles so its variables and
				// mixins need no import. The path is **absolute** on purpose. Vite 8 compiles SCSS
				// through sass's modern compiler API, where a relative `@use` resolves against the
				// stylesheet doing the importing, not the project root — so the `./src/scss/…` this
				// used to carry resolved only for a stylesheet sitting at client/, and broke the
				// build under vite 8 for src/scss/global.scss and for every component under
				// src/routes. A bare specifier plus `loadPaths` does not work either: vite installs
				// its own importer as sass's entrypoint importer, so the specifier is canonicalized
				// by vite's resolver and never reaches sass's load paths.
				additionalData: `@use "sass:map" as *;\n@use "${fileURLToPath(
					new URL("./src/scss/design-system.scss", import.meta.url)
				)}" as *;\n`
			}
		}
	}
});
