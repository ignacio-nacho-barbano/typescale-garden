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
				additionalData: `
				@use 'sass:map' as *;
                @use './src/scss/design-system' as *;

                `
			}
		}
	}
});
