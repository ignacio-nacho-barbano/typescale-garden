import { vitePreprocess } from "@sveltejs/kit/vite";
import adapter from "@sveltejs/adapter-netlify";
import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess(), preprocess()],
	onwarn: (warning, handler) => {
		if (warning.code === "css-unused-selector") {
			return;
		}
		handler(warning);
	},

	kit: {
		env: {
			dir: "../",
			publicPrefix: "PUB_"
		},
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter()
	}
};

export default config;
