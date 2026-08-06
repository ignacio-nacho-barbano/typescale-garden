/**
 * The release string a Sentry source-map upload has to agree on with the build that
 * produced the bundle.
 *
 * Symbolication here is **release-based**, not debug-id-based: an event carries a
 * `release`, the uploaded artifacts are attached to that same release, and Sentry joins
 * the two by name. So the value is computed in exactly one place — this module — and read
 * by both sides:
 *
 *   client  vite.config.ts inlines it as `__SENTRY_RELEASE__` (→ `Sentry.init({ release })`)
 *           scripts/sentry-sourcemaps.mjs uploads `.svelte-kit/cloudflare` under it
 *   plugin  plugin/build.mjs inlines it as `__PLUGIN_RELEASE__` (→ the event's `release`)
 *           scripts/sentry-sourcemaps.mjs uploads code.js + code.js.map under it
 *
 * Both sides call these functions within the same build, so they cannot disagree — which
 * is the whole reason this is a module and not two copies of a five-line snippet. A
 * mismatch does not fail anything loudly; it just silently leaves every stack trace
 * unsymbolicated, which is the failure mode worth designing against.
 *
 * This file is plain `.mjs` because `plugin/build.mjs` and the upload script are run
 * directly by node, and node cannot import TypeScript. It is nevertheless type-checked:
 * `client/tsconfig.json` sets `checkJs`, and vite.config.ts imports it.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repoRoot = new URL("../", import.meta.url);

/** @param {string} relativePath */
function packageVersion(relativePath) {
	const contents = readFileSync(fileURLToPath(new URL(relativePath, repoRoot)), "utf8");

	return JSON.parse(contents).version;
}

/**
 * The short commit sha, or `""` where there is no git — which is not hypothetical: the
 * documented way to verify a lockfile change is an rsync of the repo without `.git`, and
 * that copy still has to build.
 */
function gitSha() {
	try {
		return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
			cwd: fileURLToPath(repoRoot),
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"]
		}).trim();
	} catch {
		return "";
	}
}

/**
 * `client@<sha>`. Cloudflare Pages exposes the commit as `CF_PAGES_COMMIT_SHA`, which is
 * preferred over asking git: the Pages build environment is a checkout, but relying on its
 * `.git` being present is relying on an implementation detail of the build image.
 *
 * The no-sha fallback is versioned rather than random so a rebuild of the same source
 * lands on the same release. Re-uploading a release replaces its artifacts (see
 * sentry-sourcemaps.mjs), so a repeated `-local` release stays correct rather than
 * accumulating stale files.
 */
export function clientRelease() {
	const sha = process.env.CF_PAGES_COMMIT_SHA?.slice(0, 12) || gitSha();

	return sha ? `client@${sha}` : `client@${packageVersion("client/package.json")}-local`;
}

/**
 * `plugin@<version>`, from plugin/package.json — deliberately not a commit sha. What Figma
 * runs is the `code.js` of whichever version was published to the plugin store, so the
 * version is the only identifier a crash report can be correlated against; a sha would name
 * a commit no user ever ran. Bump plugin/package.json's `version` when publishing, or two
 * different bundles share one release and the second upload replaces the first one's maps.
 */
export function pluginRelease() {
	return `plugin@${packageVersion("plugin/package.json")}`;
}
