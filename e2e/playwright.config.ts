import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";
import path from "path";
import { E2E_PUB_ENV } from "./support/env";
import { IS_LIVE, LIVE_STORAGE_STATE, LOCAL_PORT, TARGET, liveCredentials } from "./support/target";

/**
 * One suite, two targets — see support/target.ts. `E2E_TARGET` decides which, and almost
 * everything below is a consequence of that one value.
 */
const hasLiveAuth = IS_LIVE && liveCredentials() !== null;

const viewport = {
	// > 1200 (Breakpoints.XL) so `+layout.svelte` opens the sidebar, where every input
	// lives, and >= 1000 so `mobileView` is false — which is what makes the desktop half
	// of the generated media query the one that applies in the live preview.
	width: 1440,
	height: 900
};

const use = {
	// The device profile goes FIRST: it carries its own 1280x720 viewport, so spreading it
	// after the override would silently undo it.
	...devices["Desktop Chrome"],
	baseURL: TARGET.baseUrl,
	viewport,
	trace: "retain-on-failure" as const
};

/**
 * The dev server exists only for the hermetic target. `webServer` is top-level rather than
 * per-project, which is why the two targets are an env var and not two Playwright projects.
 *
 * `globalSetup` runs for both — it also resolves the test subjects, which every spec file
 * reads synchronously at collection time.
 */
const hermeticServer: Pick<PlaywrightTestConfig, "webServer"> = {
	webServer: {
		// `--` forwards the port flags through npm to vite. Strict, because every fake
		// origin in support/env.ts hardcodes this port.
		command: `npm run dev --workspace client -- --port ${LOCAL_PORT} --strictPort`,
		cwd: path.resolve(__dirname, ".."),
		url: TARGET.baseUrl,
		// Never adopt a dev server someone else started: the PUB_* values below are baked
		// in at boot, and a server without them is a subtly broken app.
		reuseExistingServer: false,
		timeout: 120_000,
		// stdout dropped, stderr kept. Compiling the client's SCSS emits a `legacy-js-api`
		// deprecation notice per stylesheet — dozens of lines that would bury the test
		// output, and none of it actionable from here.
		stdout: "ignore",
		stderr: "pipe",
		env: E2E_PUB_ENV
	}
};

export default defineConfig({
	testDir: "./tests",
	globalSetup: "./support/globalSetup.ts",
	...(IS_LIVE ? {} : hermeticServer),

	// Hermetic assertions are exact and deterministic, so a retry that passes would only
	// hide a real non-determinism — one on CI, where machine noise is likelier than a bug.
	// Live runs cross the public internet and depend on an Auth0 tenant, so a transient
	// failure there really is transient.
	retries: IS_LIVE ? 2 : process.env.CI ? 1 : 0,
	forbidOnly: !!process.env.CI,
	// Capped rather than left to scale with the core count. Hermetically every worker drives
	// the *same* vite dev server, so past a couple the bottleneck is module transformation
	// and the only thing more parallelism buys is hydration timeouts. Live, each page load
	// pulls the real ~1.9 MB catalogue, so there is no reason to widen it there either.
	workers: 2,
	reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
	use,

	projects: [
		// Signs in once through the real Auth0 tenant and parks the session on disk; every
		// other live test reuses it and resolves through silent auth. One login per run, not
		// per test — datacenter IPs are what trip Auth0's attack protection, and each login
		// avoided is one less chance of a CAPTCHA nobody can clear.
		...(hasLiveAuth
			? [
					{
						name: "live-auth",
						testDir: "./support",
						testMatch: /liveAuth\.setup\.ts$/,
						use
					}
			  ]
			: []),
		{
			name: "chromium",
			use: {
				...use,
				// Only when the setup project ran — pointing `storageState` at a file that
				// does not exist is an error, and a live run without credentials is still
				// useful: everything except the signed-in specs works anonymously.
				...(hasLiveAuth ? { storageState: LIVE_STORAGE_STATE } : {})
			},
			dependencies: hasLiveAuth ? ["live-auth"] : []
		}
	]
});
