/**
 * Uploads a build's source maps to Sentry, so stack traces name `code.ts` and
 * `config.ts` instead of `chunk-B1nQ.js:1:48210`.
 *
 *     node scripts/sentry-sourcemaps.mjs client   # after `vite build` (client's `postbuild`)
 *     node scripts/sentry-sourcemaps.mjs plugin   # after `npm run build` in plugin/
 *
 * ## Why this is hand-written rather than `@sentry/cli` or `sentryVitePlugin()`
 *
 * Both of the off-the-shelf options cost more here than they save:
 *
 * - **`@sentry/cli`** ships a platform binary fetched by a postinstall script. npm >= 11
 *   skips install scripts unless the package is listed in the root `allowScripts`, so it
 *   would be one more thing that silently does nothing until someone notices — and it
 *   would download that binary on every Cloudflare Pages build. Adding any dependency also
 *   re-resolves the tree, which this repo has a documented history of breaking (see the
 *   `package-lock.json` section of CLAUDE.md).
 * - **`sentryVitePlugin()` / `sentrySvelteKit()`** run inside the client's vite build, which
 *   is pinned to `@sveltejs/vite-plugin-svelte@3` on vite 8 and already carries two
 *   workarounds to stay working at all. Worse, `sentrySvelteKit()` auto-instruments `load`
 *   functions, which injects `@sentry/sveltekit` imports into the **SSR** graph — exactly
 *   what `client/src/services/sentryEnvelope.ts` exists to prevent, and the failure mode
 *   there is the site not booting.
 *
 * What is actually needed is three HTTP calls against Sentry's release-files API, which
 * node can do with no dependencies at all. This mirrors the choice made in
 * `sentryEnvelope.ts` and `plugin/sentry.ts`: a small amount of protocol code in exchange
 * for no dependency in a place where a dependency is expensive.
 *
 * ## How the join works
 *
 * Release-based, not debug-id-based (debug ids are what `sentry-cli sourcemaps inject`
 * adds, and reading them back out requires SDK-side support the plugin and the SSR half do
 * not have). So:
 *
 *  1. The event carries `release` — see scripts/sentryRelease.mjs for who inlines it where.
 *  2. Artifacts are uploaded under that release, named `~/<path>`. The `~` is Sentry's
 *     "any host" prefix: a frame at `https://typescalegarden.uy/_app/immutable/x.js`
 *     matches the artifact `~/_app/immutable/x.js`, and so does the plugin's
 *     `app:///code.js` (the conventional scheme for a bundle that was never served over
 *     HTTP — see FRAME_FILE in plugin/sentry.ts).
 *  3. Sentry reads the `.js` artifact's `sourceMappingURL` — or, for a build that emits no
 *     such comment, the `Sourcemap` header attached to it below — and resolves the map
 *     artifact next to it.
 *
 * Both members of each pair are uploaded for that reason: without the `.js`, there is
 * nothing to read step 3 off. Sentry can also fetch a public URL itself, but that only
 * works for the client (the plugin's bundle is not on the web) and only while the maps are
 * still deployed, which they are not — see the deletion step.
 *
 * ## This never fails a build
 *
 * The client runs it as an npm `postbuild` hook, so a non-zero exit would fail the
 * Cloudflare Pages deploy. A Sentry outage, an expired token or a revoked scope must not
 * take the site down, so every failure path here logs and exits 0. Read the build log:
 * `sentry: uploaded …` is the success line, anything starting `sentry: WARNING` is not.
 */
import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { basename, join, posix, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { clientRelease, pluginRelease } from "./sentryRelease.mjs";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

// Not secrets. The org slug and project are already inferable from the DSN, which ships in
// the client bundle and in the published plugin; the region is the `de` in the DSN's host.
// `SENTRY_URL` has to name the region: an org lives in one, and the plain sentry.io API host
// does not route release-file writes for a `de` org.
const ORG = process.env.SENTRY_ORG || "nacho-barbano";
const PROJECT = process.env.SENTRY_PROJECT || "typescale-garden-app";
const BASE_URL = (process.env.SENTRY_URL || "https://de.sentry.io").replace(/\/$/, "");

// An **org auth token** with `project:releases` scope (Settings → Auth Tokens), not the DSN
// public key that `PUB_SENTRY_DSN` holds. Absent = skip, which is the normal state on a
// developer's machine.
const TOKEN = process.env.SENTRY_AUTH_TOKEN || "";

/** Sentry rejects a single release file above 40 MB; nothing here should come close. */
const MAX_FILE_BYTES = 30 * 1024 * 1024;

const TARGETS = {
	client: {
		// What the adapter hands to Pages, i.e. the paths the browser actually requests.
		// Maps are emitted here by `build.sourcemap` in client/vite.config.ts.
		dir: "client/.svelte-kit/cloudflare",
		release: clientRelease,
		// `_worker.js` is the SSR bundle, and it is skipped deliberately: the SSR half
		// reports through a hand-built envelope that sends an unparsed stack string rather
		// than frames (see client/src/services/sentryEnvelope.ts), so there is nothing for
		// a map to resolve. Its map is still deleted below — adapter-cloudflare emits one
		// whether or not vite does, and it would otherwise be served from the site.
		skip: (relativePath) => relativePath === "_worker.js",
		// The maps must not reach production: `.svelte-kit/cloudflare` *is* the deploy
		// artifact, and Pages serves everything in it.
		deleteMapsAfterUpload: true
	},
	plugin: {
		// No build directory — `code.js` is committed at the package root, because that is
		// what Figma loads.
		dir: "plugin",
		release: pluginRelease,
		skip: (relativePath) => relativePath !== "code.js",
		// code.js.map is gitignored and never leaves the machine that built it. Keeping it
		// means a failed upload can simply be re-run.
		deleteMapsAfterUpload: false
	}
};

const target = process.argv[2];
const config = TARGETS[target];

if (!config) {
	console.error(
		`sentry-sourcemaps: expected one of ${Object.keys(TARGETS).join(", ")}, got ${
			target ? `"${target}"` : "nothing"
		}`
	);
	// The one loud failure: a typo in a package.json script is a bug in this repo, not a
	// transient upload problem, and nothing has been built or deleted yet.
	process.exit(1);
}

/**
 * Every `*.js.map` under `dir`: `pairs` are the ones to upload, each with the `.js` it
 * belongs to, and `maps` is all of them — including the ones `skip` rejected, since
 * deletion is about what must not be deployed, not about what was uploaded.
 */
function collectMaps(dir) {
	const pairs = [];
	const maps = [];

	const walk = (current) => {
		for (const entry of readdirSync(current, { withFileTypes: true })) {
			const path = join(current, entry.name);

			if (entry.isDirectory()) {
				// `dir` is a package root for the plugin target (code.js is committed at the
				// top level, because that is what Figma loads), so an unpruned walk would
				// descend into node_modules and turn a two-file upload into a directory scan
				// of every dependency that ships a map.
				if (entry.name !== "node_modules" && !entry.name.startsWith(".")) {
					walk(path);
				}

				continue;
			}

			if (!entry.name.endsWith(".js.map")) continue;

			maps.push(path);

			const script = path.slice(0, -".map".length);
			const relativeScript = relative(dir, script).split(sep).join(posix.sep);

			if (config.skip(relativeScript)) continue;

			try {
				statSync(script);
			} catch {
				// A map with no script beside it cannot be joined to a frame. Not an error:
				// it is exactly what an orphan from an earlier build looks like.
				continue;
			}

			pairs.push({ script, map: path, relativeScript });
		}
	};

	walk(dir);

	return { pairs, maps };
}

async function api(path, init = {}) {
	return fetch(`${BASE_URL}/api/0${path}`, {
		...init,
		headers: { Authorization: `Bearer ${TOKEN}`, ...init.headers }
	});
}

/** Idempotent: an existing release answers 208/400-already-exists rather than 201. */
async function ensureRelease(version) {
	const response = await api(`/organizations/${ORG}/releases/`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ version, projects: [PROJECT] })
	});

	if (response.ok || response.status === 208) return;

	const body = await response.text();

	if (response.status === 400 && /already exists/i.test(body)) return;

	throw new Error(`creating release ${version} failed: ${response.status} ${body.slice(0, 300)}`);
}

/**
 * Removes whatever a previous run of this release uploaded.
 *
 * Uploading a name that already exists answers 409, which would leave the *old* file in
 * place — and the names are stable (`~/_worker.js`, `~/code.js`, and every hashed chunk
 * whose content did not change), so a re-upload without this would silently symbolicate
 * against a stale map. Cheaper to make the upload authoritative than to reason about which
 * artifacts are still current.
 */
async function clearReleaseFiles(version) {
	const encoded = encodeURIComponent(version);
	const existing = [];
	let cursor = "";

	// Sentry pages this endpoint and describes the next page in a `Link` header rather than
	// in the body; the cursor format is opaque, so it is read back rather than constructed.
	// The page cap is a runaway guard, not a real limit — a release here holds tens of files.
	for (let page = 0; page < 20; page++) {
		const query = cursor ? `?per_page=100&cursor=${encodeURIComponent(cursor)}` : "?per_page=100";
		const response = await api(`/organizations/${ORG}/releases/${encoded}/files/${query}`);

		if (!response.ok) {
			throw new Error(`listing files of ${version} failed: ${response.status}`);
		}

		existing.push(...(await response.json()));

		const next = /<[^>]+>;\s*rel="next";\s*results="true";\s*cursor="([^"]+)"/.exec(
			response.headers.get("link") || ""
		);

		if (!next) break;

		cursor = next[1];
	}

	for (const file of existing) {
		const response = await api(`/organizations/${ORG}/releases/${encoded}/files/${file.id}/`, {
			method: "DELETE"
		});

		if (!response.ok && response.status !== 404) {
			throw new Error(`deleting ${file.name} failed: ${response.status}`);
		}
	}

	return existing.length;
}

async function uploadFile(version, path, name, headers = []) {
	const contents = readFileSync(path);

	if (contents.byteLength > MAX_FILE_BYTES) {
		console.warn(`sentry: WARNING skipping ${name} — ${contents.byteLength} bytes is too large`);
		return false;
	}

	const form = new FormData();
	form.set("file", new Blob([contents]), basename(path));
	form.set("name", name);

	for (const header of headers) {
		form.append("header", header);
	}

	const response = await api(
		`/organizations/${ORG}/releases/${encodeURIComponent(version)}/files/`,
		{
			method: "POST",
			body: form
		}
	);

	if (response.ok) return true;

	throw new Error(
		`uploading ${name} failed: ${response.status} ${(await response.text()).slice(0, 300)}`
	);
}

const dir = join(repoRoot, config.dir);
let found = { pairs: [], maps: [] };

try {
	found = collectMaps(dir);
} catch (error) {
	console.warn(
		`sentry: WARNING nothing to upload — could not read ${config.dir} (${error.message})`
	);
	process.exit(0);
}

const { pairs, maps } = found;

if (pairs.length === 0) {
	console.warn(
		`sentry: WARNING no source maps found in ${config.dir} — was the build run with sourcemaps on?`
	);
	process.exit(0);
}

const version = config.release();
let uploaded = 0;

// `SENTRY_DRY_RUN=1` prints the artifact names and touches neither Sentry nor the disk. It
// is the only way to check the naming without a token, since a wrong name does not fail —
// it just leaves everything unsymbolicated.
if (process.env.SENTRY_DRY_RUN) {
	console.log(`sentry: dry run for ${target}, release ${version}`);

	for (const { relativeScript } of pairs) {
		console.log(`sentry:   ~/${relativeScript} + ~/${relativeScript}.map`);
	}

	const deletions = config.deleteMapsAfterUpload ? maps.length : 0;

	console.log(`sentry: would upload ${pairs.length * 2} artifact(s), delete ${deletions} map(s)`);
	process.exit(0);
}

if (TOKEN) {
	try {
		await ensureRelease(version);

		const cleared = await clearReleaseFiles(version);

		if (cleared > 0) {
			console.log(`sentry: replaced ${cleared} artifact(s) already on release ${version}`);
		}

		for (const { script, map, relativeScript } of pairs) {
			const name = `~/${relativeScript}`;
			const mapName = `${name}.map`;

			// The header is belt and braces: every bundler here emits a
			// `//# sourceMappingURL=` comment, and this covers the case where one stops.
			if (await uploadFile(version, script, name, [`Sourcemap:${basename(map)}`])) uploaded++;
			if (await uploadFile(version, map, mapName)) uploaded++;
		}

		console.log(`sentry: uploaded ${uploaded} artifact(s) for ${target} as release ${version}`);
	} catch (error) {
		console.warn(`sentry: WARNING source-map upload failed — ${error.message}`);
		console.warn("sentry: WARNING stack traces for this build will not be symbolicated");
		// Deliberately still exit 0 — see the header. The maps stay on disk so the upload
		// can be retried, which for the client also means this build deploys them.
		process.exit(0);
	}
} else {
	console.log(
		`sentry: no SENTRY_AUTH_TOKEN — skipping source-map upload for ${target} (${version})`
	);
}

// Every map in the directory, not just the uploaded ones: this is about what gets deployed.
// `SENTRY_KEEP_SOURCEMAPS=1` keeps them, for debugging a production build locally.
if (config.deleteMapsAfterUpload && !process.env.SENTRY_KEEP_SOURCEMAPS) {
	for (const map of maps) {
		rmSync(map, { force: true });
	}

	console.log(`sentry: removed ${maps.length} map file(s) from ${config.dir}`);
}
