import {
	expect,
	hermeticOnly,
	IS_LIVE,
	LIVE_WRITES,
	needsLiveCredentials,
	test
} from "../support/app";
import { E2E_USER } from "../support/fakeAuth0";
import { fixture } from "../support/golden";
import {
	bearerFromPage,
	deleteByName,
	headroom,
	liveScaleName,
	sweepLeftovers
} from "../support/liveApi";
import { loadSubjects } from "../support/subjects";

/**
 * Saving, loading and deleting scales — the round trip through `stores/typescales.ts`.
 *
 * Hermetically the fake API mirrors the real controller's quirks (a whole newest-first list
 * back from every mutation, community defaults mixed into a user's list, 401 for "too many"),
 * so the client's real handling of them is exercised without a database.
 *
 * Live, the same specs write to production D1 under the configured user. Three things keep
 * that safe and are not optional: every name carries the `e2e-` prefix, leftovers from a
 * killed run are swept before writing, and a full account skips rather than failing. See
 * support/liveApi.ts.
 */
const OWNED = { authorId: E2E_USER.sub };
const subject = loadSubjects().cases[0];

test.describe("hermetic round trip", () => {
	hermeticOnly("seeds rows directly, which is only possible against the fake Worker");

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
		await expect(app.page.locator("#family")).toHaveAttribute(
			"placeholder",
			golden.inputs.fontName
		);
		await expect(app.page.locator("#headings-initial-weight")).toHaveValue(
			String(golden.inputs.headingsInitialWeight)
		);

		// …and then the thing that proves the whole graph re-derived, not just the inputs.
		await expect.poll(() => app.copyCss()).toBe(golden.cssCode);
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
			await expect(
				app.notification(/reached the maximum amount of stored typescales/)
			).toBeVisible();
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
});

/**
 * The same round trip, against the real thing. Fewer assertions and no seeding — what this
 * adds over the hermetic version is that the request really is authorised, CORS really does
 * permit it, and D1 really does persist and return the row.
 */
test.describe("live round trip", () => {
	test.skip(!IS_LIVE, "live-only: exercises the real API");
	needsLiveCredentials();
	test.skip(
		IS_LIVE && !LIVE_WRITES,
		"live-only: writes are disabled (E2E_LIVE_WRITES=0), so the save path is not exercised here"
	);

	// Serial, because they share one account and one cap. Parallel saves against a cap of 5
	// would race each other into a 401.
	test.describe.configure({ mode: "serial" });

	test("saves a scale, reads it back, and deletes it", async ({ app }) => {
		await app.open();

		const authorization = await bearerFromPage(app.page);

		// Before anything: reclaim rows a killed run left behind, or the cap fills up over
		// time and every subsequent hourly run fails on a 401 unrelated to the code.
		const swept = await sweepLeftovers(authorization);
		if (swept > 0) {
			// eslint-disable-next-line no-console
			console.log(`live: swept ${swept} leftover e2e- scale(s) before starting`);
		}

		const room = await headroom(authorization);
		test.skip(!room.ok, room.reason);

		const name = liveScaleName("round-trip");

		try {
			await app.setBase(subject.inputs);
			await app.saveAs(name);
			await expect(app.notification(/saved successfully/)).toBeVisible();

			// Reload, so the scale has to come back from D1 rather than from the store it was
			// just written from.
			await app.open();
			const menu = await app.openLoadMenu();
			await expect(menu.locator("li", { hasText: name })).toHaveCount(1);
			await menu.locator("button", { hasText: name }).click();

			// The whole graph re-derived from what the server returned — which, unlike the
			// hermetic fake, has been through `baseBindValues`' per-column coercion and back.
			await expect.poll(() => app.copyCss()).toBe(subject.expected.cssCode);
		} finally {
			// Always, so a failed assertion above does not leave a row behind.
			await deleteByName(authorization, name);
		}
	});

	test("lists the community defaults for the signed-in user too", async ({ app }) => {
		await app.open();

		const menu = await app.openLoadMenu();

		// `findByAuthors([authorId, "typescale-garden"])` — the defaults are always in a
		// user's list, and are the one thing in it they cannot delete.
		const community = menu.locator("li", { hasText: "by Typescale Garden" });
		await expect(community.first()).toBeVisible();
		await expect(
			community.first().locator('button[aria-label="delete this typescale"]')
		).toHaveCount(0);
	});
});
