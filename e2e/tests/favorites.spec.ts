import type { Page } from "@playwright/test";
import { expect, hermeticOnly, test } from "../support/app";
import { E2E_USER } from "../support/fakeAuth0";
import { catalogue } from "../support/golden";

/**
 * Favorite fonts: the star on each row of the family picker, the favorites section pinned
 * above the rest, the "favorites" pill, and their persistence — localStorage for everyone,
 * plus `/api/favorites` for a signed-in user (`client/src/stores/favorites.ts`).
 *
 * Hermetic-only: live, these would write to the real test account's favorites, and every
 * assertion here is about ordering and persistence the fakes make deterministic.
 */
const STORAGE_KEY = "tsg-favorite-fonts";

const list = (page: Page) => page.locator(".tsg-autocomplete-list");
const optionNames = (page: Page) => list(page).locator("li button.option").allInnerTexts();
const star = (page: Page, family: string) =>
	list(page)
		.locator("li", { has: page.locator(`button.option:text-is("${family}")`) })
		.locator("button.favorite-toggle");

const seedLocalFavorites = (page: Page, families: string[]) =>
	page.addInitScript(
		([key, value]) => {
			// Only on the first document: a reload must see what the app wrote, not the seed.
			if (!sessionStorage.getItem("e2e-seeded")) {
				localStorage.setItem(key, value);
				sessionStorage.setItem("e2e-seeded", "1");
			}
		},
		[STORAGE_KEY, JSON.stringify(families)] as const
	);

test.beforeEach(() => {
	hermeticOnly("would write to the shared live account's favorites");
});

test.describe("signed out", () => {
	test.use({ auth: { loggedIn: false } });

	test("starring a family pins it to the top and survives a reload", async ({ app, apiCalls }) => {
		await app.open();
		await app.openFontMenu();

		// Alphabetically last in the fixture catalogue, so pinning visibly moves it.
		const family = "Solo Weight";
		expect((await optionNames(app.page))[0]).not.toBe(family);

		await star(app.page, family).click();

		await expect(star(app.page, family)).toHaveAttribute("aria-pressed", "true");
		expect((await optionNames(app.page))[0]).toBe(family);
		// Pinned, not duplicated: the row leaves the "All fonts" list.
		expect(await optionNames(app.page)).toHaveLength(catalogue.length);
		// Starring must not select the family.
		await expect(app.page.locator("#family")).not.toHaveAttribute("placeholder", family);

		await app.page.reload();
		await app.open();
		await app.openFontMenu();
		expect((await optionNames(app.page))[0]).toBe(family);

		// Signed out, nothing goes to the Worker.
		expect(apiCalls.filter((call) => call.includes("/api/favorites"))).toEqual([]);
	});

	test("the favorites pill lists favorites alone", async ({ app }) => {
		await seedLocalFavorites(app.page, ["Serif Face", "Roboto"]);
		await app.open();

		await app.page.locator(".favorites-pill").click();
		await expect(app.page.locator(".favorites-pill")).toHaveAttribute("aria-pressed", "true");

		await app.openFontMenu();
		await expect.poll(() => optionNames(app.page)).toEqual(["Roboto", "Serif Face"]);
	});
});

test.describe("signed in", () => {
	test("merges the local list into the account on sign-in", async ({ app }) => {
		app.api.favorites.set(E2E_USER.sub, ["Roboto"]);
		await seedLocalFavorites(app.page, ["Serif Face"]);

		await app.open();

		await expect.poll(() => app.api.favorites.get(E2E_USER.sub)).toEqual(["Roboto", "Serif Face"]);

		await app.openFontMenu();
		await expect
			.poll(async () => (await optionNames(app.page)).slice(0, 2))
			.toEqual(["Roboto", "Serif Face"]);
	});

	test("mirrors toggles to the account", async ({ app }) => {
		app.api.favorites.set(E2E_USER.sub, ["Roboto"]);
		await app.open();
		await expect.poll(() => app.api.calls).toContain("GET /api/favorites");

		await app.openFontMenu();
		await expect.poll(async () => (await optionNames(app.page))[0]).toBe("Roboto");

		await star(app.page, "Serif Face").click();
		await expect.poll(() => app.api.favorites.get(E2E_USER.sub)).toEqual(["Roboto", "Serif Face"]);

		await star(app.page, "Roboto").click();
		await expect.poll(() => app.api.favorites.get(E2E_USER.sub)).toEqual(["Serif Face"]);
		expect(app.api.calls).toContain("DELETE /api/favorites/Roboto");
	});
});
