import { expect, test } from "../support/app";
import { E2E_USER } from "../support/fakeAuth0";
import { fixture } from "../support/golden";

/**
 * Saving, loading and deleting scales — the round trip through `stores/typescales.ts`.
 *
 * The fake API mirrors the real controller's quirks (a whole newest-first list back from
 * every mutation, community defaults mixed into a user's list, 401 for "too many"), so
 * these specs exercise the client's real handling of them rather than an idealised API.
 */
const OWNED = { authorId: E2E_USER.sub };

test("loads a saved scale back into every control", async ({ app }) => {
	// Distinctive on purpose: a different family, a different base unit and a base size
	// nothing else in the suite uses, so a control left unwired shows up as a mismatch
	// rather than coincidentally holding the right value.
	const golden = fixture("serif-category-large-base-unit");
	app.api.seed({ ...OWNED, name: "Serif System", base: golden.inputs });

	await app.open();

	const menu = await app.openLoadMenu();
	await menu.locator("button", { hasText: "Serif System" }).click();

	// The controls first — this is what the user sees.
	await expect(app.page.locator("#base-font")).toHaveValue(String(golden.inputs.baseSize));
	await expect(app.page.locator("#visual-size")).toHaveValue(String(golden.inputs.baseUnit));
	await expect(app.page.locator("#family")).toHaveAttribute("placeholder", golden.inputs.fontName);
	await expect(app.page.locator("#headings-initial-weight")).toHaveValue(
		String(golden.inputs.headingsInitialWeight)
	);

	// …and then the thing that proves the whole graph re-derived, not just the inputs.
	await expect.poll(() => app.copyCss()).toBe(golden.cssCode);
});

test("saving a new name POSTs and keeps the scale selected", async ({ app }) => {
	const golden = fixture("roboto-ascending-700-300");

	await app.open();
	await app.setBase(golden.inputs);
	await app.saveAs("My New Scale");

	await expect(app.notification(/saved successfully/)).toBeVisible();
	expect(app.api.calls).toContain("POST /api/typescales/saved");

	const saved = app.api.rows.find((row) => row.name === "My New Scale");
	expect(saved, "the scale reached the API").toBeTruthy();
	expect(saved?.authorId).toBe(E2E_USER.sub);

	// `Number(...)` deliberately: the sidebar's inputs have no `type="number"`, so every
	// numeric writable holds a *string* after a UI edit and that is what goes on the wire.
	// The real Worker coerces per column in `baseBindValues`, which is why this has never
	// been a problem — but asserting `toBe(22)` here would be asserting a fiction.
	expect(Number(saved?.base.baseSize)).toBe(golden.inputs.baseSize);
	expect(Number(saved?.base.desktopRatio)).toBe(golden.inputs.desktopRatio);
	expect(saved?.base.fontName).toBe(golden.inputs.fontName);
});

test("saving over an existing name PUTs instead of creating a duplicate", async ({ app }) => {
	const golden = fixture("roboto-descending-900-400");
	app.api.seed({ ...OWNED, name: "Reused Name", base: fixture("defaults-red-hat-text").inputs });

	await app.open();
	await app.setBase(golden.inputs);
	await app.saveAs("Reused Name");

	await expect(app.notification(/updated successfully/)).toBeVisible();

	expect(app.api.calls.some((call) => call.startsWith("PUT /api/typescales/saved/"))).toBe(true);
	expect(app.api.calls).not.toContain("POST /api/typescales/saved");
	expect(app.api.rows.filter((row) => row.name === "Reused Name")).toHaveLength(1);
});

test("deleting a saved scale removes it from the list", async ({ app }) => {
	const base = fixture("defaults-red-hat-text").inputs;
	app.api.seed({ ...OWNED, name: "Doomed Scale", base });
	app.api.seed({ ...OWNED, name: "Surviving Scale", base });

	await app.open();

	const menu = await app.openLoadMenu();
	const doomed = menu.locator("li", { hasText: "Doomed Scale" });

	// Hovered first because the delete control is `opacity: 0` until the row is hovered.
	await doomed.hover();
	await doomed.locator('button[aria-label="delete this typescale"]').click();

	await expect(app.notification("Typescale deleted successfully")).toBeVisible();
	await expect(menu.locator("li", { hasText: "Doomed Scale" })).toHaveCount(0);
	await expect(menu.locator("li", { hasText: "Surviving Scale" })).toHaveCount(1);
	expect(app.api.rows.map((row) => row.name)).toEqual(["Surviving Scale"]);
});

test("the community defaults are listed but not deletable", async ({ app }) => {
	const base = fixture("defaults-red-hat-text").inputs;
	// No authorId ⇒ seeded as "typescale-garden", which is what marks a scale as a
	// community default in the real schema.
	app.api.seed({ name: "Community Scale", base });
	app.api.seed({ ...OWNED, name: "Mine", base });

	await app.open();
	const menu = await app.openLoadMenu();

	const community = menu.locator("li", { hasText: "Community Scale" });
	await expect(community).toContainText("by Typescale Garden");
	await expect(community.locator('button[aria-label="delete this typescale"]')).toHaveCount(0);

	const mine = menu.locator("li", { hasText: "Mine" });
	await expect(mine).toContainText("by You");
	await expect(mine.locator('button[aria-label="delete this typescale"]')).toHaveCount(1);
});

test.describe("the free tier's cap", () => {
	const seedFive = (app: { api: { seed: Function } }) => {
		const base = fixture("defaults-red-hat-text").inputs;
		for (let index = 1; index <= 5; index++) {
			app.api.seed({ ...OWNED, name: `Scale ${index}`, base });
		}
	};

	test("refuses a sixth scale and says why", async ({ app }) => {
		seedFive(app);

		await app.open();
		await app.saveAs("One Too Many");

		// The API answers 401 for this, which `SaveControl` special-cases into a message
		// about the cap rather than the generic failure text. Getting that status wrong
		// would leave the user staring at "contact support".
		await expect(app.notification(/reached the maximum amount of stored typescales/)).toBeVisible();
		expect(app.api.rows.some((row) => row.name === "One Too Many")).toBe(false);
	});

	test.describe("with the premium permission", () => {
		test.use({ auth: { permissions: ["store:typescales-premium"] } });

		test("allows a sixth scale", async ({ app }) => {
			seedFive(app);

			await app.open();
			await app.saveAs("Sixth Scale");

			await expect(app.notification(/saved successfully/)).toBeVisible();
			expect(app.api.rows.some((row) => row.name === "Sixth Scale")).toBe(true);
		});
	});
});

test("a failed save reports it instead of pretending to have worked", async ({ app }) => {
	await app.open();

	app.api.failWith = 500;
	await app.saveAs("Never Lands");

	await expect(app.notification(/Could not save the typescale/)).toBeVisible();
	expect(app.api.rows).toHaveLength(0);
});
