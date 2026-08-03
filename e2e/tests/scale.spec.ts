import { expect, test } from "../support/app";
import { fixture, uiReachableFixtures } from "../support/golden";

/**
 * The reason this suite exists.
 *
 * `core/src/__tests__/golden.test.ts` proves the pure functions turn a `TypescaleBase`
 * into these exact bytes. It cannot prove that the app's sidebar is wired to those
 * functions — every input could be bound to the wrong store, the export modal could be
 * reading a stale derived, and every unit test would still pass. These specs close that
 * gap by driving the real controls and reading the real export.
 */
for (const golden of uiReachableFixtures) {
	test(`exports the golden CSS and tokens for ${golden.label}`, async ({ app }) => {
		await app.open();
		await app.setBase(golden.inputs);

		// Polled, not asserted once: the last control `setBase` touches settles its store
		// in a microtask, and the clipboard read is a separate round trip to the page.
		await expect
			.poll(() => app.copyCss(), { message: `cssCode for ${golden.label}` })
			.toBe(golden.cssCode);

		await expect
			.poll(() => app.copyTokens(), { message: `designTokens for ${golden.label}` })
			.toBe(golden.designTokens);
	});
}

test("the code modal shows the same CSS that Copy CSS yields", async ({ app }) => {
	const golden = fixture("roboto-ascending-700-300");

	await app.open();
	await app.setBase(golden.inputs);

	const copied = await app.copyCss();
	await app.openCodeModal();

	// Trimmed, not exact: Svelte collapses the whitespace around `{$cssCode}` in the
	// template. The bytes are asserted through the clipboard above; what matters here is
	// that the modal is not showing something *else* — a stale derived, or the tokens.
	expect(await app.codeModalText()).toBe(copied.trim());
});

test("the code modal's second tab shows the design tokens", async ({ app }) => {
	const golden = fixture("roboto-ascending-700-300");

	await app.open();
	await app.setBase(golden.inputs);
	await app.openCodeModal();
	await app.selectCodeTab("typography-tokens.json");

	expect(await app.codeModalText()).toBe(golden.designTokens.trim());
});
