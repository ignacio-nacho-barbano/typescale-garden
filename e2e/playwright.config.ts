import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { BASE_URL, E2E_PUB_ENV, PORT } from "./support/env";

export default defineConfig({
	testDir: "./tests",
	globalSetup: "./support/globalSetup.ts",
	// The specs assert exact strings; a retry that passes would only hide a real
	// non-determinism. Retry once on CI, where machine noise is likelier than a bug.
	retries: process.env.CI ? 1 : 0,
	forbidOnly: !!process.env.CI,
	// Capped rather than left to scale with the core count. Every worker drives the *same*
	// vite dev server, so past a couple of them the bottleneck is module transformation
	// and the only thing more parallelism buys is hydration timeouts. The suite is fast
	// enough that this costs very little.
	workers: 2,
	reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
	use: {
		// The device profile goes FIRST: it carries its own 1280x720 viewport, so spreading
		// it after the override below would silently undo it.
		...devices["Desktop Chrome"],
		baseURL: BASE_URL,
		// > 1200 (Breakpoints.XL) so `+layout.svelte` opens the sidebar, where every input
		// lives, and >= 1000 so `mobileView` is false — which is what makes the desktop
		// half of the generated media query the one that applies in the live preview.
		viewport: { width: 1440, height: 900 },
		trace: "retain-on-failure"
	},
	webServer: {
		// `--` forwards the port flags through npm to vite. Strict, because every fake
		// origin in support/env.ts hardcodes this port.
		command: `npm run dev --workspace client -- --port ${PORT} --strictPort`,
		cwd: path.resolve(__dirname, ".."),
		url: BASE_URL,
		// Never adopt a dev server someone else started: the PUB_* values below are
		// baked in at boot, and a server without them is a subtly broken app.
		reuseExistingServer: false,
		timeout: 120_000,
		// stdout dropped, stderr kept. Compiling the client's SCSS emits a `legacy-js-api`
		// deprecation notice per stylesheet — dozens of lines that would bury the test
		// output, and none of it actionable from here.
		stdout: "ignore",
		stderr: "pipe",
		env: E2E_PUB_ENV
	}
});
