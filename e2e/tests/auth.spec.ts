import { expect, test } from "../support/app";
import { E2E_USER } from "../support/fakeAuth0";

/**
 * The three-state auth UI in `TopBar.svelte`, and the pieces of the app that key off it.
 *
 * `authState` is deliberately not a boolean: `user` is `undefined` until the silent login
 * answers and `null` once it has answered "nobody", and the top bar has to branch on all
 * three or a signed-in user sees a flash of the logged-out state on every load. That is a
 * timing bug, so a spec that only ever sees an instant fake tenant cannot catch it — the
 * `authorizeDelayMs` case below is the one that actually pins the behaviour.
 */
test.describe("signed in", () => {
	test("shows the user's name, not the log-in buttons", async ({ app }) => {
		await app.open();

		await expect(app.userName()).toHaveText("E2E User");
		await expect(app.page.locator("button", { hasText: "Register" })).toHaveCount(0);
	});

	test("attaches the access token to API calls", async ({ app }) => {
		await app.open();

		// `stores/fetch.ts` rebuilds its axios instance when the token lands; if that
		// derived stopped firing, the app would silently fall back to anonymous reads.
		await expect.poll(() => app.api.calls).toContain("GET /api/typescales/saved");
		expect(app.api.seenSubs).toContain(E2E_USER.sub);
	});

	test("logging out returns the app to the anonymous state", async ({ app }) => {
		await app.open();
		await expect(app.userName()).toHaveText("E2E User");

		await app.logOut();

		await expect(app.userName()).toHaveCount(0);
		await expect(app.page.locator("button", { hasText: "Register" }).first()).toBeVisible();
	});
});

test.describe("signed out", () => {
	test.use({ auth: { loggedIn: false } });

	test("offers Log In and Register", async ({ app }) => {
		await app.open();

		await expect(app.page.locator("button", { hasText: "Register" }).first()).toBeVisible();
		await expect(app.userName()).toHaveCount(0);
	});

	test("reads the community defaults rather than a user's saved scales", async ({ app }) => {
		await app.open();

		await expect.poll(() => app.api.calls).toContain("GET /api/typescales/default");
		expect(app.api.calls).not.toContain("GET /api/typescales/saved");
	});

	test("the save menu asks you to sign in instead of offering a name field", async ({ app }) => {
		await app.open();

		const menu = await app.openSaveMenu();

		await expect(menu.locator("#typescale-name")).toHaveCount(0);
		await expect(menu).toContainText("Log In or Sign Up to save");
	});
});

test.describe("while the silent login is still resolving", () => {
	// Long enough to observe, comfortably under AUTH_PLACEHOLDER_GRACE_MS (3000), so the
	// timeout backstop does not fire and settle `user` to anonymous behind our back.
	test.use({ auth: { authorizeDelayMs: 1500 } });

	test("shows a placeholder rather than the logged-out state", async ({ app }) => {
		// Not `app.open()`: that waits for the skeleton to *disappear*, which is exactly
		// the window under test here.
		await app.page.goto("/");

		const skeleton = app.page.locator(".user-controls-skeleton");
		await expect(skeleton).toBeVisible();

		// The point of the placeholder: a user who is signed in must never be shown the
		// buttons that say they are not.
		await expect(app.page.locator("button", { hasText: "Register" })).toHaveCount(0);

		// …and it resolves to the real thing once the tenant answers.
		await expect(app.userName()).toHaveText("E2E User");
		await expect(skeleton).toHaveCount(0);
	});
});
