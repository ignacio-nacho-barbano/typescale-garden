import { sveltekit } from '@sveltejs/kit/vite';
import { svelteSVG } from 'rollup-plugin-svelte-svg';
import { defineConfig } from 'vitest/config';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
	plugins: [
		sveltekit(),
		imagetools(),
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		svelteSVG({
			// optional SVGO options
			// pass empty object to enable defaults
			svgo: {
				plugins: [
					{
						name: 'addAttributesToSVGElement',
						params: { attributes: ['preserveAspectRatio="xMidYMid meet"'] }
					},
					{ name: 'removeViewBox', active: false },
					{ name: 'removeAttrs', active: false }
				]
			},
			// vite-specific
			// https://vitejs.dev/guide/api-plugin.html#plugin-ordering
			// enforce: 'pre' | 'post'
			enforce: 'pre'
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
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
