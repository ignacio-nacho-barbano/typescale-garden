import { expect, hermeticOnly, IS_LIVE, test } from "../support/app";
import { catalogue, fixture } from "../support/golden";
import { loadSubjects } from "../support/subjects";

/**
 * The font picker and the weight range it feeds.
 *
 * `availableWeights → weightSteps → distributedWeights` is the part of the store graph with
 * the most branching, and all of it is driven by which family is selected. These specs pin
 * the behaviour at the control level; the numeric consequences are covered by the exported
 * bytes in scale.spec.ts.
 *
 * Nothing here asserts an absolute family count. Hermetically the catalogue holds six; live
 * it holds around two thousand and grows without asking. Every assertion is therefore
 * relative — "fewer than before", "every result matches" — which is what lets one spec file
 * serve both targets.
 */
const subjects = loadSubjects();

test("opens the picker with the whole catalogue listed", async ({ app }) => {
	await app.open();

	const options = app.page.locator(".tsg-autocomplete-list li");

	await app.openFontMenu();
	await expect(options.first()).toBeVisible();

	if (IS_LIVE) {
		// Any real catalogue dwarfs the fixture's six. The number is not the point — clearing
		// it proves the app is listing what `/api/fonts` returned rather than falling back to
		// `mockFontsApi`, which holds one family and would still render a plausible picker.
		expect(await options.count()).toBeGreaterThan(catalogue.length);
	} else {
		await expect(options).toHaveCount(catalogue.length);
	}
});

/**
 * Typed a character at a time rather than with `fill`, and not only for realism.
 * AutoComplete's `fresh` flag suppresses filtering for the *first* input event after the menu
 * opens (so clicking into a populated picker shows the whole list rather than an empty one),
 * and a single `fill` is exactly one event — it would never filter at all.
 */
test("filters the family list as you type", async ({ app }) => {
	await app.open();

	const input = app.page.locator("#family");
	const options = app.page.locator(".tsg-autocomplete-list li");

	await app.openFontMenu();
	const before = await options.count();

	await input.pressSequentially("serif");

	// Substring, case-insensitive, against the family name. Hermetically that is `Serif Face`
	// alone; live it is every family with "serif" in its name — either way strictly fewer
	// than the unfiltered list, and every survivor has to match.
	await expect.poll(() => options.count()).toBeLessThan(before);
	expect(await options.count()).toBeGreaterThan(0);

	for (const text of await options.allInnerTexts()) {
		expect(text.toLowerCase()).toContain("serif");
	}
});

test("says so when nothing matches", async ({ app }) => {
	await app.open();

	await app.openFontMenu();
	// Deliberately unlikely in any catalogue, real or fixture.
	await app.page.locator("#family").pressSequentially("Zzzqx");

	await expect(app.page.locator(".tsg-autocomplete-list")).toContainText("No matching fonts found");

	// And there is nothing to click, which is why `unknown-font-falls-back` is listed as
	// UI-unreachable in support/golden.ts: the store can only ever hold a family that was
	// picked from this list.
	await expect(app.page.locator(".tsg-autocomplete-list li")).toHaveCount(0);
});

test("the category pills narrow the list", async ({ app }) => {
	await app.open();

	const options = app.page.locator(".tsg-autocomplete-list li");

	await app.openFontMenu();
	const before = await options.count();
	await app.closeFontMenu();

	// Leave only serif on.
	for (const category of ["sans-serif", "display", "handwriting"]) {
		await app.toggleFontCategory(category);
	}

	await app.openFontMenu();
	await expect.poll(() => options.count()).toBeLessThan(before);
	expect(await options.count()).toBeGreaterThan(0);
});

test("the weight range offers exactly the weights the chosen family has", async ({ app }) => {
	await app.open();

	// Every resolved subject carries the weights its expectation was built from, so this
	// holds for a fixture family and for whatever the live catalogue supplied.
	for (const subject of subjects.cases) {
		await app.selectFont(subject.inputs.fontName);
		expect(
			await app.reportedAvailableWeights(),
			`weights offered for ${subject.inputs.fontName}`
		).toEqual(subject.availableWeights);
	}
});

test("a single-weight family clamps the range and disables it", async ({ app }) => {
	const single = subjects.cases.find((subject) => subject.availableWeights.length === 1);
	test.skip(
		!single,
		"no single-weight family among the resolved subjects, so there is nothing to clamp"
	);

	await app.open();

	// Start somewhere the clamp has to move both ends from.
	const multi = subjects.cases.find((subject) => subject.availableWeights.length >= 3);
	if (multi) {
		await app.selectFont(multi.inputs.fontName);
		await app.setHeadingWeights(
			multi.availableWeights[multi.availableWeights.length - 1],
			multi.availableWeights[0]
		);
	}

	await app.selectFont(single!.inputs.fontName);

	// core's `clampHeadingWeights` returns what the endpoints should be; `config.ts` is what
	// writes them back. This is the only place that pairing is observable.
	const only = String(single!.availableWeights[0]);
	await expect(app.page.locator("#headings-initial-weight")).toHaveValue(only);
	await expect(app.page.locator("#headings-final-weight")).toHaveValue(only);
	await expect(app.page.locator("#headings-initial-weight")).toBeDisabled();
	await expect(app.page.locator("#headings-final-weight")).toBeDisabled();
});

test.describe("a family that is missing from the catalogue", () => {
	hermeticOnly(
		"needs a family the catalogue does not contain, which cannot be arranged against the real one"
	);

	test("is covered by core's unit test, not from here", () => {
		// Documented rather than driven: AutoComplete's `outputValue` only fires when a listed
		// option is clicked, so there is no way to put an unknown family into the store. The
		// fallback-and-warn behaviour is asserted by core's `unknown-font-falls-back` fixture.
		expect(fixture("unknown-font-falls-back").inputs.fontName).toBe("Totally Not A Real Font");
	});
});
