import { chromium } from "@playwright/test";
import { BASE_URL } from "./env";

/**
 * Warms the dev server's *client* module graph before any spec runs.
 *
 * Playwright's `webServer.url` check only proves the server answers `/`, which warms the
 * SSR graph. The browser then asks for several hundred separate ESM modules, and vite
 * transforms each one on first request. With workers running in parallel that cold start
 * happens N times at once on one dev server, and the app takes long enough to hydrate that
 * the silent-login placeholder outlives the assertion waiting for it — a flake that looks
 * like an auth bug and is really a compile queue.
 *
 * One page load ahead of time makes every worker's load a warm one.
 */
export default async function globalSetup(): Promise<void> {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Nothing outside the dev server: the point is to compile modules, and a real request
	// to Google Fonts or an auth tenant would make the warmup depend on the network.
	await page.route(/.*/, (route) =>
		route.request().url().startsWith(BASE_URL) ? route.continue() : route.abort()
	);

	try {
		await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 120_000 });
	} finally {
		await browser.close();
	}
}
