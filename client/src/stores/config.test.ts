/**
 * These cover the *wiring* only: that the writables feed the derived chain, and
 * that the clamp side effect writes back. The scale math itself is core's, and is
 * pinned there by golden fixtures (core/src/__tests__/golden.test.ts) against a
 * real multi-font catalogue.
 *
 * The assertions that used to live here tested the math through this file while
 * setting fontName to "Roboto" / "Noto Sans Glagolitic" — neither of which exists
 * in the bundled mockFontsApi, so every case silently fell back to Red Hat Text
 * and the "single weight font" test was really exercising a five-weight font.
 * That is why three of them failed. Don't reintroduce math assertions here.
 */
import { get } from "svelte/store";
import { describe, expect, test } from "vitest";
import {
	availableWeights,
	distributedWeights,
	fontName,
	fontsApiData,
	headingsFinalWeight,
	headingsInitialWeight,
	typescale
} from "./config";

describe("typescale config store graph", () => {
	test("the derived chain produces one entry per variant", () => {
		expect(get(typescale)).toHaveLength(9);
		expect(get(typescale).map(({ name }) => name)).toEqual([
			"title-1",
			"title-2",
			"title-3",
			"title-4",
			"title-5",
			"title-6",
			"body-1",
			"body-2",
			"tooltip"
		]);
	});

	test("headings take their weights from the distribution, one per heading", () => {
		const headings = get(typescale).filter(({ isHeading }) => isHeading);

		expect(headings).toHaveLength(6);
		expect(headings.map(({ weight }) => weight)).toEqual(get(distributedWeights));
	});

	test("every distributed weight is one the font actually offers", () => {
		const offered = get(availableWeights);

		expect(offered.length).toBeGreaterThan(0);
		get(distributedWeights).forEach((weight) => expect(offered).toContain(weight));
	});

	test("changing an input flows through to the scale", () => {
		const before = get(typescale)[0].weight;

		headingsInitialWeight.set(get(availableWeights)[0]);
		headingsFinalWeight.set(get(availableWeights).at(-1)!);

		expect(get(typescale)[0].weight).not.toBe(before);
	});

	// Last, because it swaps the font catalogue out from under the module-level
	// stores and nothing resets it.
	test("the clamp snaps heading weights onto ones the chosen font actually offers", () => {
		headingsInitialWeight.set(700);
		headingsFinalWeight.set(300);

		// Switching to a font that has neither 700 nor 300 is what must re-run the
		// clamp. Note the clamp is driven by availableWeights *changing*, so setting
		// fontName to the value it already holds would not fire it.
		fontsApiData.set({
			items: [
				{
					family: "Solo Weight",
					category: "sans-serif",
					variants: ["regular"],
					subsets: ["latin"],
					version: "v1",
					lastModified: "2026-01-01",
					files: { regular: "http://example.test/solo.ttf" }
				}
			]
		} as never);
		fontName.set("Solo Weight");

		expect(get(availableWeights)).toEqual([400]);
		expect(get(headingsInitialWeight)).toBe(400);
		expect(get(headingsFinalWeight)).toBe(400);
	});
});
