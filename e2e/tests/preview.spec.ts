import { expect, hermeticOnly, test } from "../support/app";
import { fixture } from "../support/golden";
import { loadSubjects } from "../support/subjects";

/**
 * The live preview, which is the only assertion in this suite that goes all the way through
 * the browser's CSS engine.
 *
 * `+page.svelte` injects `$cssCode` into a `<style>` tag and rewrites the
 * `@media (min-width: N)` floor to 1 or 100000 so the desktop or mobile half applies
 * regardless of the real viewport. Reading back `getComputedStyle` therefore proves the
 * generated stylesheet is not merely the right *text* but that it parses and cascades the way
 * the numbers claim — a missing unit or a broken selector would still match the expected
 * string and still be a broken export.
 *
 * The section only contains h1–h5, `p` and a `figcaption.tooltip`, so `title-6` and `body-2`
 * have no element to measure here; they are covered by the exported bytes.
 */
const SELECTORS: Record<string, string> = {
	"title-1": "h1",
	"title-2": "h2",
	"title-3": "h3",
	"title-4": "h4",
	"title-5": "h5",
	"body-1": "p",
	tooltip: "figcaption"
};

/**
 * `normal` is how Chromium serialises a resolved `letter-spacing` of zero — which `title-5`
 * has in most scales — so it has to read back as 0 rather than NaN. Line heights are always
 * emitted explicitly, so this never hides one.
 */
const px = (value: string): number => (value === "normal" ? 0 : Number.parseFloat(value));

/**
 * The first resolved subject: the ordinary multi-weight case in either mode. One scale is
 * enough to prove the injected stylesheet cascades — which families exist is
 * scale.spec.ts's concern, not this file's.
 */
const subject = loadSubjects().cases[0];

const step = (name: string) => {
	const found = subject.typescale.find((entry) => entry.name === name);
	if (!found) throw new Error(`subject ${subject.label} has no "${name}" step`);
	return found;
};

test("applies the desktop half of the scale to the preview", async ({ app }) => {
	await app.open();
	await app.setBase(subject.inputs);

	for (const [name, selector] of Object.entries(SELECTORS)) {
		const expected = step(name);

		// Retried as a block, because `global.scss` puts `transition: font-weight 200ms` on
		// `*`. Reading the computed style straight after changing the scale therefore catches
		// the weight mid-interpolation — a real read returned "720.75" on its way to 700 —
		// and the resolved value is only correct once the transition has finished.
		await expect(async () => {
			const style = await app.computedStyle(selector);

			expect(px(style.fontSize), `${name} font-size`).toBeCloseTo(expected.desktopSize, 1);
			expect(px(style.lineHeight), `${name} line-height`).toBeCloseTo(expected.desktopLine, 1);
			expect(style.fontWeight, `${name} font-weight`).toBe(String(expected.weight));

			// The generated `letter-spacing` is in `em` and only the base rule carries it, so
			// the resolved pixel value is the em value times whichever font-size won.
			expect(px(style.letterSpacing), `${name} letter-spacing`).toBeCloseTo(
				expected.letterSpacing * expected.desktopSize,
				1
			);
		}).toPass({ timeout: 5_000 });
	}

	// Hermetically the `@import` is stubbed to an empty stylesheet so the family never loads;
	// live it really does. Either way the *declaration* is what the export has to get right,
	// and that is what `font-family` reports.
	const heading = await app.computedStyle("h1");
	expect(heading.fontFamily).toContain(subject.inputs.fontName);
});

test("switches the preview to the mobile half when Mobile View is on", async ({ app }) => {
	await app.open();
	await app.setBase(subject.inputs);
	await app.setMobileView(true);

	for (const [name, selector] of Object.entries(SELECTORS)) {
		const expected = step(name);
		const style = await app.computedStyle(selector);

		expect(px(style.fontSize), `${name} font-size`).toBeCloseTo(expected.mobileSize, 1);
		expect(px(style.lineHeight), `${name} line-height`).toBeCloseTo(expected.mobileLine, 1);
	}
});

test("re-renders the preview when a single input changes", async ({ app }) => {
	await app.open();
	await app.setBase(subject.inputs);

	const before = await app.computedStyle("h1");

	// Half the base size. Nothing else changes, so this isolates the
	// input → store → derived → injected CSS → cascade path to one control.
	await app.page.locator("#base-font").fill(String(subject.inputs.baseSize / 2));

	await expect
		.poll(async () => px((await app.computedStyle("h1")).fontSize))
		.toBeLessThan(px(before.fontSize));
});

test.describe("uppercase and italics", () => {
	// The shapes the live target selects deliberately leave both switches off, so that the
	// weight-range behaviour is what varies between subjects and nothing else. The toggles
	// are asserted here against a fixture that has them on.
	hermeticOnly("drives the uppercase/italics fixture, which the live shapes do not cover");

	test("applies to headings but not to body copy", async ({ app }) => {
		const golden = fixture("uppercase-and-italics-on");

		await app.open();
		await app.setBase(golden.inputs);

		const heading = await app.computedStyle("h1");
		expect(heading.textTransform).toBe("uppercase");
		expect(heading.fontStyle).toBe("italic");

		// The generated rule lists only h1–h6/.title-*, so paragraphs must be untouched.
		const body = await app.computedStyle("p");
		expect(body.textTransform).toBe("none");
		expect(body.fontStyle).toBe("normal");
	});
});
