import { expect, test } from "../support/app";
import { fixture, variantByName } from "../support/golden";

/**
 * The live preview, which is the only assertion in this suite that goes all the way
 * through the browser's CSS engine.
 *
 * `+page.svelte` injects `$cssCode` into a `<style>` tag and rewrites the
 * `@media (min-width: N)` floor to 1 or 100000 so the desktop or mobile half applies
 * regardless of the real viewport. Reading back `getComputedStyle` therefore proves the
 * generated stylesheet is not merely the right *text* but that it parses and cascades the
 * way the numbers in the fixture claim — a missing unit or a broken selector would still
 * match the golden string and still be a broken export.
 *
 * The section only contains h1–h5, `p` and a `figcaption.tooltip`, so `title-6` and
 * `body-2` have no element to measure here; they are covered by the golden strings.
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
 * `normal` is how Chromium serialises a resolved `letter-spacing` of zero — which
 * `title-5` has in most fixtures — so it has to read back as 0 rather than NaN.
 */
const px = (value: string): number => (value === "normal" ? 0 : Number.parseFloat(value));

test("applies the desktop half of the scale to the preview", async ({ app }) => {
	const golden = fixture("defaults-red-hat-text");

	await app.open();
	await app.setBase(golden.inputs);

	for (const [step, selector] of Object.entries(SELECTORS)) {
		const variant = variantByName(golden, step);
		const style = await app.computedStyle(selector);

		expect(px(style.fontSize), `${step} font-size`).toBeCloseTo(variant.desktopSize, 1);
		expect(px(style.lineHeight), `${step} line-height`).toBeCloseTo(variant.desktopLine, 1);
		expect(style.fontWeight, `${step} font-weight`).toBe(String(variant.weight));

		// The generated `letter-spacing` is in `em` and only the base rule carries it, so
		// the resolved pixel value is the em value times whichever font-size won.
		expect(px(style.letterSpacing), `${step} letter-spacing`).toBeCloseTo(
			variant.letterSpacing * variant.desktopSize,
			1
		);
	}

	// The `@import` that fetches the family is stubbed to an empty stylesheet, so the
	// family never actually loads — but the declaration is what the export has to get
	// right, and that is what `font-family` reports.
	const heading = await app.computedStyle("h1");
	expect(heading.fontFamily).toContain(golden.inputs.fontName);
});

test("switches the preview to the mobile half when Mobile View is on", async ({ app }) => {
	const golden = fixture("defaults-red-hat-text");

	await app.open();
	await app.setBase(golden.inputs);
	await app.setMobileView(true);

	for (const [step, selector] of Object.entries(SELECTORS)) {
		const variant = variantByName(golden, step);
		const style = await app.computedStyle(selector);

		expect(px(style.fontSize), `${step} font-size`).toBeCloseTo(variant.mobileSize, 1);
		expect(px(style.lineHeight), `${step} line-height`).toBeCloseTo(variant.mobileLine, 1);
	}
});

test("applies uppercase and italics to headings but not to body copy", async ({ app }) => {
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

test("re-renders the preview when a single input changes", async ({ app }) => {
	const golden = fixture("defaults-red-hat-text");

	await app.open();
	await app.setBase(golden.inputs);

	const before = await app.computedStyle("h1");

	// Half the base size. Nothing else about the fixture changes, so this isolates the
	// input → store → derived → injected CSS → cascade path to one control.
	await app.page.locator("#base-font").fill(String(golden.inputs.baseSize / 2));

	await expect
		.poll(async () => px((await app.computedStyle("h1")).fontSize))
		.toBeLessThan(px(before.fontSize));
});
