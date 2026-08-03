import { chromium } from "@playwright/test";
import { resolveSubjects, writeSubjects } from "./subjects";
import { IS_LIVE, TARGET } from "./target";

/**
 * Two jobs, both of which have to happen exactly once per run.
 *
 * **Resolve the test subjects.** Hermetically that is just reading the committed fixtures,
 * but live it means fetching the catalogue and choosing a family per shape. Doing it here
 * rather than per worker is what guarantees every worker asserts against the same catalogue
 * snapshot — see support/subjects.ts.
 *
 * **Warm the dev server** (hermetic only). Playwright's `webServer.url` check only proves the
 * server answers `/`, which warms the SSR graph. The browser then asks for several hundred
 * separate ESM modules, and vite transforms each on first request. With workers in parallel
 * that cold start happens N times at once on one dev server, and the app takes long enough
 * to hydrate that the silent-login placeholder outlives the assertion waiting for it — a
 * flake that looks like an auth bug and is really a compile queue.
 */
export default async function globalSetup(): Promise<void> {
	const resolved = await resolveSubjects();
	await writeSubjects(resolved);

	if (IS_LIVE) {
		// eslint-disable-next-line no-console
		console.log(
			[
				`e2e: live target ${TARGET.baseUrl} (api ${TARGET.apiUrl})`,
				`     catalogue: ${resolved.catalogueSize} families`,
				...resolved.cases.map((subject) => `     subject: ${subject.label}`),
				...resolved.missing.map((shape) => `     no subject for shape: ${shape.label}`)
			].join("\n")
		);
		return;
	}

	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Nothing outside the dev server: the point is to compile modules, and a real request to
	// Google Fonts or an auth tenant would make the warmup depend on the network.
	await page.route(/.*/, (route) =>
		route.request().url().startsWith(TARGET.baseUrl) ? route.continue() : route.abort()
	);

	try {
		await page.goto(TARGET.baseUrl, { waitUntil: "networkidle", timeout: 120_000 });
	} finally {
		await browser.close();
	}
}
