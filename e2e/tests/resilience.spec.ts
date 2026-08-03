import { expect, test } from "../support/app";
import { fixture } from "../support/golden";

/**
 * What happens when the app is loaded normally, and when the font catalogue is not there.
 */
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
	await app.setBase(fixture("roboto-ascending-700-300").inputs);
	await app.openCodeModal();
	await app.closeCodeModal();

	// `logError` writes "🚨 Error Logger:" to the console in dev rather than posting to
	// Rollbar, so anything the app considers an error lands here — including a failed
	// catalogue fetch, which would otherwise pass silently on the wrong font data.
	expect(errors).toEqual([]);
});

test.describe("when the fonts API is unreachable", () => {
	test.use({ fontsApiDown: true });

	test("falls back to the committed snapshot and still generates the scale", async ({ app }) => {
		const logged: string[] = [];
		app.page.on("console", (message) => {
			if (message.type() === "error") logged.push(message.text());
		});

		const golden = fixture("roboto-ascending-700-300");

		await app.open();
		await app.setBase(golden.inputs);

		// The documented degradation: `/api/fonts` 503s, `+layout.svelte` catches it and
		// reads `/fonts-data.json` instead. The user should not be able to tell.
		await expect.poll(() => app.copyCss()).toBe(golden.cssCode);

		// But it must not be silent — this is the log line that would tell someone the
		// daily snapshot cron has been failing.
		expect(logged.join("\n")).toContain("falling back to static");
	});
});

test("server-renders the page, including the auth placeholder", async ({ app }) => {
	// Fetched outside the browser on purpose: this is the HTML a crawler, a preview
	// unfurler, or a user with a slow connection sees before any JS runs.
	const response = await app.page.request.get("/");
	expect(response.status()).toBe(200);

	const html = await response.text();

	expect(html).toContain("A Typescale");
	// `authState.isResolving` is always true during SSR, so the served markup must carry
	// the placeholder and never the logged-out buttons. This is the bit that stops a
	// signed-in user seeing a flash of "Log In" on first paint.
	expect(html).toContain("user-controls-skeleton");
});
