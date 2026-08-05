import { expect, hermeticOnly, IS_LIVE, test } from "../support/app";
import { fixture } from "../support/golden";
import { catalogueDisagreement, loadSubjects } from "../support/subjects";

/**
 * The reason this suite exists.
 *
 * `core/src/__tests__/golden.test.ts` proves the pure functions turn a `TypescaleBase` into
 * exact bytes. It cannot prove that the app's sidebar is wired to those functions — every
 * input could be bound to the wrong store, the export modal could be reading a stale
 * derived, and every unit test would still pass. These specs close that gap by driving the
 * real controls and reading the real export.
 *
 * The cases come from `subjects()`, which is where the two targets differ: hermetically they
 * are the 11 committed golden fixtures, and live they are one family per shape picked out of
 * the real catalogue with the expectation computed at runtime. Everything below is identical
 * either way — see support/subjects.ts for why the live oracle has to be different at all.
 */
const { cases, missing } = loadSubjects();

for (const shape of missing) {
	test(`exports the golden CSS and tokens for ${shape.label}`, () => {
		test.skip(true, shape.reason);
	});
}

for (const subject of cases) {
	test(`exports the golden CSS and tokens for ${subject.label}`, async ({ app }) => {
		await app.open();
		await app.setBase(subject.inputs);

		// Live only: prove the app is holding the same catalogue this expectation was built
		// from before comparing bytes against it. The two were fetched by different clients
		// and the Worker rewrites its KV snapshot daily, so an hourly run can straddle the
		// rewrite — and that has to read as "the snapshot rotated", not as a byte diff.
		if (IS_LIVE) {
			const reported = await app.reportedAvailableWeights();
			const disagreement = catalogueDisagreement(subject.availableWeights, reported);
			expect(disagreement, disagreement ?? undefined).toBeNull();
		}

		// Polled, not asserted once: the last control `setBase` touches settles its store in
		// a microtask, and the clipboard read is a separate round trip to the page.
		await expect
			.poll(() => app.copyCss(), { message: `cssCode for ${subject.label}` })
			.toBe(subject.expected.cssCode);

		await expect
			.poll(() => app.copyTokens(), { message: `designTokens for ${subject.label}` })
			.toBe(subject.expected.designTokens);
	});
}

test("the code modal shows the same CSS that Copy CSS yields", async ({ app }) => {
	const subject = cases[0];

	await app.open();
	await app.setBase(subject.inputs);

	const copied = await app.copyCss();
	await app.openCodeModal();

	// Trimmed, not exact: Svelte collapses the whitespace around `{$cssCode}` in the
	// template. The bytes are asserted through the clipboard above; what matters here is
	// that the modal is not showing something *else* — a stale derived, or the tokens.
	expect(await app.codeModalText()).toBe(copied.trim());
});

test("the code modal's second tab shows the design tokens", async ({ app }) => {
	const subject = cases[0];

	await app.open();
	await app.setBase(subject.inputs);
	await app.openCodeModal();
	await app.selectCodeTab("typography-tokens.json");

	expect(await app.codeModalText()).toBe(subject.expected.designTokens.trim());
});

/**
 * The synthetic-family cases, which only a controlled catalogue can produce. Google Fonts
 * has no family with a single weight *and* no regular, none with only italic variants, and
 * none that is absent from its own catalogue — so these shapes are unreachable live even
 * though the code paths they cover are real.
 */
test.describe("edge-shaped catalogues", () => {
	hermeticOnly(
		"needs the fixture catalogue's synthetic families — Google Fonts has no equivalent of `Italics Only`"
	);

	test("a family whose only variants are italic still yields a scale", async ({ app }) => {
		const golden = fixture("italics-only-variants");

		await app.open();
		await app.setBase(golden.inputs);

		await expect.poll(() => app.copyCss()).toBe(golden.cssCode);
	});
});
