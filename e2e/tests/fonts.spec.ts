import { expect, test } from "../support/app";
import { catalogue, fixture } from "../support/golden";

/**
 * The font picker and the weight range it feeds.
 *
 * `availableWeights → weightSteps → distributedWeights` is the part of the store graph
 * with the most branching, and all of it is driven by which family is selected. These
 * specs pin the behaviour at the control level; the numeric consequences are covered by
 * the golden exports in scale.spec.ts.
 */
/**
 * Typed a character at a time rather than with `fill`, and not only for realism.
 * AutoComplete's `fresh` flag suppresses filtering for the *first* input event after the
 * menu opens (so clicking into a populated picker shows the whole list rather than an
 * empty one), and a single `fill` is exactly one event — it would never filter at all.
 */
test("filters the family list as you type", async ({ app }) => {
	await app.open();

	const input = app.page.locator("#family");
	const options = app.page.locator(".tsg-autocomplete-list li");

	await app.openFontMenu();
	await expect(options).toHaveCount(catalogue.length);

	await input.pressSequentially("serif");
	// Substring, case-insensitive — so "Serif Face" only, not the sans-serif families
	// (the filter matches family names, and none of the others contain "serif").
	await expect(options).toHaveCount(1);
	await expect(options.first()).toContainText("Serif Face");
});

test("says so when nothing matches", async ({ app }) => {
	await app.open();

	await app.openFontMenu();
	await app.page.locator("#family").pressSequentially("Zzz");

	await expect(app.page.locator(".tsg-autocomplete-list")).toContainText("No matching fonts found");

	// And there is nothing to click, which is why `unknown-font-falls-back` is listed as
	// UI-unreachable in support/golden.ts: the store can only ever hold a family that was
	// picked from this list.
	await expect(app.page.locator(".tsg-autocomplete-list li")).toHaveCount(0);
});

test("the category pills narrow the list", async ({ app }) => {
	await app.open();

	const options = app.page.locator(".tsg-autocomplete-list li");

	// Leave only serif on. Every other fixture family is sans-serif.
	for (const category of ["sans-serif", "display", "handwriting"]) {
		await app.toggleFontCategory(category);
	}

	await app.openFontMenu();
	await expect(options).toHaveCount(1);
	await expect(options.first()).toContainText("Serif Face");
});

test("the weight range offers exactly the weights the family has", async ({ app }) => {
	await app.open();

	await app.selectFont("Roboto");
	await expect(app.weightOptions()).toHaveText(
		fixture("roboto-ascending-700-300").availableWeights.map(String)
	);

	await app.selectFont("Serif Face");
	await expect(app.weightOptions()).toHaveText(
		fixture("serif-category-large-base-unit").availableWeights.map(String)
	);
});

test("a single-weight family clamps the range and disables it", async ({ app }) => {
	await app.open();

	// Start somewhere the clamp has to move both ends from.
	await app.selectFont("Roboto");
	await app.setHeadingWeights(900, 400);

	await app.selectFont("Solo Weight");

	// core's `clampHeadingWeights` returns what the endpoints should be; `config.ts` is
	// what writes them back. This is the only place that pairing is observable.
	await expect(app.page.locator("#headings-initial-weight")).toHaveValue("400");
	await expect(app.page.locator("#headings-final-weight")).toHaveValue("400");
	await expect(app.page.locator("#headings-initial-weight")).toBeDisabled();
	await expect(app.page.locator("#headings-final-weight")).toBeDisabled();
});
