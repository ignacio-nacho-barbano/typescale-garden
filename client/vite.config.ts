import { fileURLToPath } from "node:url";
import { sveltekit } from "@sveltejs/kit/vite";
import { defaultClientConditions, defaultServerConditions, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { imagetools } from "vite-imagetools";
import { clientRelease } from "../scripts/sentryRelease.mjs";

// SvelteKit >= 2.12 decides whether it is running under Svelte 4 or Svelte 5 at *runtime*, by
// stringifying `onMount` and looking for tell-tale legacy source text
// (`@sveltejs/kit/src/runtime/client/state.svelte.js` — its own comment calls this "a bootleg way").
// When the sniff says "Svelte 5" it builds `page`/`navigating`/`updated` out of `$state.raw(...)`,
// which under Svelte 4 nothing compiles away — so the identifier survives into the bundle and the
// app dies on `ReferenceError: $state is not defined`. `$app/stores` imports the kit client runtime,
// so any app touching `$page` drags this module in; it is not opt-in.
//
// Neither of the two things it greps for survives our bundlers:
//
//   build                                onMount.toString()          verdict
//   client bundle (minified)             `function R(){}`            no `$$`, no space → Svelte 5
//   adapter-cloudflare `_worker.js`      `function onMount() {\n}`   `{\n}` != `{}`    → Svelte 5
//
// The second row is why production answered `500` on `GET /` as well as breaking in the browser:
// the module throws while the Worker is still initialising. Note `vite preview` does *not* reproduce
// it — vite's own SSR output happens to emit `function onMount() {}` on one line, which does match.
//
// Under Svelte 4 the answer is always "legacy", so pin it instead of letting a regex guess. The
// pattern is asserted rather than best-effort: if a kit upgrade reshapes the declaration we want a
// loud build failure, not a silent return of a runtime crash. Delete this whole plugin when the app
// moves to Svelte 5 — at that point the runes branch is the correct one.
function pinKitToSvelte4(): Plugin {
	const declaration = /const is_legacy\s*=\s*onMount\.toString\(\)[^;]*;/;

	return {
		name: "pin-kit-to-svelte-4",
		enforce: "pre",
		transform(code, id) {
			const [file] = id.split("?");
			if (!file.includes("@sveltejs/kit") || !file.endsWith("state.svelte.js")) return;

			if (!declaration.test(code)) {
				throw new Error(
					`pin-kit-to-svelte-4: could not find the \`is_legacy\` declaration in ${file}. ` +
						"SvelteKit's Svelte 4/5 detection has changed shape — re-check the workaround in " +
						"client/vite.config.ts against the new source before removing this guard."
				);
			}

			return { code: code.replace(declaration, "const is_legacy = true;"), map: null };
		}
	};
}

// `vite dev` answered `500 TypeError: css is not a function` on every request without this.
//
// To avoid a flash of unstyled content, SvelteKit's dev server inlines component CSS into the SSR'd
// document. `kit/src/exports/vite/dev/index.js` does it by walking the SSR module graph for CSS deps
// and re-requesting each one with `?inline` bolted on:
//
//   dep.url.replace("?", "?inline&")   →  Foo.svelte?inline&svelte&type=style&lang.css
//   styles[dep.url] = (await vite.ssrLoadModule(inlineCssUrl)).default
//
// then `kit/src/runtime/server/page/render.js` treats each value as a string, or else calls it as a
// function. Under vite 8 the value is `undefined`, so it calls `undefined(...)` — hence the message,
// which names neither CSS nor the file it failed on.
//
// It is `undefined` because two upstream changes meet here:
//
//  1. Vite's css-post transform used to special-case SSR *ahead* of `?inline`, so any CSS module
//     loaded on the server got `export default "<css>"` whether or not it was asked for inline.
//     Vite 6 dropped that branch; a server-consumer environment now gets a bare `export {}` unless
//     the id itself carries `?inline`. (Plain `.css` files still work — `src/scss/global.scss` is
//     inlined fine — because their ids reach that transform untouched.)
//  2. `@sveltejs/vite-plugin-svelte@3` resolves every `type=style` request to a canonical id built
//     from scratch by `createVirtualImportId` — `${filename}?svelte&type=style&lang.css`. Every
//     other query param is discarded, `inline` included. So kit asks for the inline variant and
//     vite's transform never sees the flag.
//
// Neither half can be upgraded away here: vite 8 is required by vitest 4, and the first
// vite-plugin-svelte that accepts vite 8 needs Svelte 5 (see the peer-dependency note in CLAUDE.md).
// So re-attach the flag after the plugin has stripped it. `this.resolve` delegates to the plugin for
// the canonical id rather than reimplementing its root-prefixing, and `inline` is spliced in *before*
// `lang.css` because vite gates the whole CSS pipeline on `/\.(css|…)(?:$|\?)/` — appending it would
// leave the id ending in `&inline` and quietly drop the module out of the CSS plugins altogether.
//
// This only ever fires for ids that already asked for `inline`, which in practice is kit's dev
// inliner alone; the client-side `import "./Foo.svelte?svelte&type=style&lang.css"` that compiled
// components emit is untouched. Delete this plugin along with pinKitToSvelte4() when the app moves to
// Svelte 5 and vite-plugin-svelte can be upgraded.
function keepInlineQueryOnSvelteStyles(): Plugin {
	const CANONICAL_SUFFIX = "?svelte&type=style&lang.css";

	return {
		name: "keep-inline-query-on-svelte-styles",
		enforce: "pre",
		async resolveId(importee, importer, options) {
			const [file, query] = importee.split("?");
			if (!file.endsWith(".svelte") || !query) return;

			const params = query.split("&");
			if (!params.includes("inline") || !params.includes("type=style")) return;

			// Resolve the id the plugin already understands, then put `inline` back.
			const withoutInline = `${file}?${params.filter((p) => p !== "inline").join("&")}`;
			const resolved = await this.resolve(withoutInline, importer, { ...options, skipSelf: true });
			if (!resolved?.id.endsWith(CANONICAL_SUFFIX)) return resolved ?? undefined;

			return {
				...resolved,
				id: resolved.id.replace(CANONICAL_SUFFIX, "?svelte&type=style&inline&lang.css")
			};
		}
	};
}

// rollup-plugin-svelte-svg used to sit here, meant to turn `import Logo from "*.svg"`
// into a component. It cannot work under Vite: `.svg` is a built-in asset extension, so
// `vite:asset` loads the file as `export default "/logo.svg"` before any transform runs,
// and the plugin registers a `transform` hook only — it never sees the markup, and threw
// "svg file did not start with <svg> tag" on the one import that used it. `enforce: "pre"`
// orders transforms, not loads, so it made no difference. The logo is now a real component
// (src/components/Logo.svelte); SVGs referenced by URL are unaffected and still live in static/.
export default defineConfig({
	plugins: [pinKitToSvelte4(), keepInlineQueryOnSvelteStyles(), sveltekit(), imagetools()],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"]
	},
	// The release the browser SDK stamps on every event, and the one the source maps are
	// uploaded under — the same function call on both sides, which is the only thing making
	// them match (see scripts/sentryRelease.mjs). Read back in src/services/sentry.ts.
	//
	// Deliberately not a `PUB_*` env var: those come from the *dashboard* on Cloudflare
	// Pages, so keeping the release there would mean remembering to change a dashboard
	// setting on every deploy, and a stale one silently symbolicates against the wrong
	// bundle.
	define: { __SENTRY_RELEASE__: JSON.stringify(clientRelease()) },
	build: {
		// Needed for Sentry to un-minify a browser stack trace, and emitting them is only
		// half of it: `postbuild` (scripts/sentry-sourcemaps.mjs) uploads the maps and then
		// deletes them from `.svelte-kit/cloudflare`, which *is* the directory Pages
		// deploys. `SENTRY_KEEP_SOURCEMAPS=1` keeps them for local inspection.
		//
		// `true` rather than `"hidden"`: the `//# sourceMappingURL=` comment it leaves in
		// each chunk is what tells Sentry which artifact holds that chunk's map.
		sourcemap: true
	},
	// `@sveltejs/vite-plugin-svelte@3` sets `resolve.conditions = ["svelte"]`. Under vite 5 that was
	// *additive* — the docs called it "additional allowed conditions" and vite always applied its own
	// defaults too. Vite 6 made the option a **replacement** and moved the defaults into the exported
	// `defaultClientConditions` / `defaultServerConditions` that plugins are now expected to spread.
	// The plugin is pinned at 3 (see the peer-dependency note in CLAUDE.md), so on vite 8 it silently
	// wipes `["module", "browser", "development|production"]` out of the client build.
	//
	// Losing `browser` matters because `svelte`'s own export map is the one place it is load-bearing:
	//
	//   "." → { "browser": "./src/runtime/index.js", "default": "./src/runtime/ssr.js" }
	//
	// so without it the *client* bundle got `ssr.js`, whose lifecycle exports are empty stubs
	// (`export function onMount() {}`). Every `import { onMount } from "svelte"` in src/ — including
	// the one in `+layout.svelte` that fetches the fonts catalogue — became a silent no-op in the
	// browser. `svelte/internal`, which is what compiled components import, has no `browser` branch,
	// which is why components themselves kept working and hid this.
	//
	// Both environments are spelled out on purpose: the ssr environment inherits top-level `resolve`,
	// and leaking `browser` into it would hand the server Svelte's *client* runtime.
	resolve: {
		conditions: [...defaultClientConditions, "svelte"]
	},
	ssr: {
		resolve: {
			conditions: [...defaultServerConditions, "svelte"]
		}
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
