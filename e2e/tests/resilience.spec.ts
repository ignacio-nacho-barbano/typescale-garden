import { expect, hermeticOnly, IS_LIVE, TARGET, test } from "../support/app";
import { loadSubjects } from "../support/subjects";

/**
 * What happens when the app is loaded normally, and when the font catalogue is not there.
 */
const subject = loadSubjects().cases[0];

test.describe("console hygiene", () => {
	// A deployed build loads Google's webfont CSS, and whatever else prod ships; the console
	// is not ours to keep clean there. Hermetically every byte on the wire is accounted for,
	// which is what makes "no errors at all" a meaningful assertion.
	hermeticOnly("a deployed page's console includes third-party output we do not control");

	test("loads and drives a full scale without logging an error", async ({ app }) => {
		const errors: string[] = [];

		// `console.error` and uncaught exceptions only. Warnings are deliberately excluded:
		// SvelteKit's dev server emits `<Layout> was created with unknown prop 'params'` on
		// every load, and Button.svelte warns about icon-only buttons with no `alt`. Both are
		// pre-existing and neither is something this suite should fail on.
		app.page.on("console", (message) => {
			if (message.type() === "error") errors.push(message.text());
		});
		app.page.on("pageerror", (error) => errors.push(`uncaught: ${error.message}`));

		await app.open();
		await app.setBase(subject.inputs);
		await app.openCodeModal();
		await app.closeCodeModal();

		// `logError` writes "🚨 Error Logger:" to the console in dev rather than posting to
		// Sentry, so anything the app considers an error lands here — including a failed
		// catalogue fetch, which would otherwise pass silently on the wrong font data.
		expect(errors).toEqual([]);
	});
});

test("does not throw an uncaught exception on load", async ({ app }) => {
	// The half of the above that survives a real deployment: third parties may log whatever
	// they like, but an uncaught exception in the page is ours either way.
	const crashes: string[] = [];
	app.page.on("pageerror", (error) => crashes.push(error.message));

	await app.open();
	await app.setBase(subject.inputs);

	expect(crashes).toEqual([]);
});

test.describe("when the fonts API is unreachable", () => {
	hermeticOnly("breaking /api/fonts requires intercepting it, which a live run does not do");
	test.use({ fontsApiDown: true });

	test("falls back to the committed snapshot and still generates the scale", async ({ app }) => {
		const logged: string[] = [];
		app.page.on("console", (message) => {
			if (message.type() === "error") logged.push(message.text());
		});

		await app.open();
		await app.setBase(subject.inputs);

		// The documented degradation: `/api/fonts` 503s, `+layout.svelte` catches it and reads
		// `/fonts-data.json` instead. The user should not be able to tell.
		await expect.poll(() => app.copyCss()).toBe(subject.expected.cssCode);

		// But it must not be silent — this is the log line that would tell someone the daily
		// snapshot cron has been failing.
		expect(logged.join("\n")).toContain("falling back to static");
	});
});

test("server-renders the page, including the auth placeholder", async ({ app }) => {
	// Fetched outside the browser on purpose: this is the HTML a crawler, a preview unfurler,
	// or a user with a slow connection sees before any JS runs.
	const response = await app.page.request.get("/");
	expect(response.status()).toBe(200);

	const html = await response.text();

	expect(html).toContain("A Typescale");
	// `authState.isResolving` is always true during SSR, so the served markup must carry the
	// placeholder and never the logged-out buttons. This is the bit that stops a signed-in
	// user seeing a flash of "Log In" on first paint.
	expect(html).toContain("user-controls-skeleton");
});

test("serves the font catalogue the app can actually use", async ({ app }) => {
	test.skip(!IS_LIVE, "live-only: hermetically the catalogue is a fixture, not a service");

	// Straight at the API, no browser. The client reads this with a plain `fetch` precisely so
	// the response's static `Access-Control-Allow-Origin: *` applies, and the two properties
	// below are the ones `server/src/fonts/snapshot.ts` validates before it will overwrite KV.
	const response = await app.page.request.get(`${TARGET.apiUrl}/api/fonts`);

	expect(response.status()).toBe(200);
	expect(response.headers()["access-control-allow-origin"]).toBe("*");

	const body = (await response.json()) as { kind?: string; items?: unknown[] };
	expect(body.kind).toBe("webfonts#webfontList");
	expect(body.items?.length ?? 0).toBeGreaterThan(100);
});
