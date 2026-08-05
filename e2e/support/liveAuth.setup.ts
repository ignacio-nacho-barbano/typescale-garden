import { expect, test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";
import { LIVE_STORAGE_STATE, TARGET, liveCredentials } from "./target";

/**
 * Signs in once, through the real Auth0 tenant, and parks the session on disk for the rest
 * of the run.
 *
 * Runs as its own Playwright project that every other live project depends on, rather than
 * as a `beforeAll`, for one reason: **it is the only login the run performs.** Every
 * subsequent test starts from this `storageState`, so the Auth0 session cookie is already
 * present and the app resolves through silent auth without touching the login form.
 *
 * That is a correctness measure, not just a speed one. Automated logins from datacenter IPs
 * are what trip Auth0's attack protection — suspicious-IP throttling and bot detection — and
 * the symptom is a CAPTCHA in front of the form that no amount of retrying can clear. One
 * login per run keeps well clear of that; one login per test would not.
 *
 * The app itself stores no credential: `+layout.ts` passes no `cacheLocation`, so the token
 * cache is in memory and there is nothing in localStorage to seed. What makes this work is
 * purely the tenant's own cookie, which `storageState` carries.
 */
setup("sign in to the live environment", async ({ page }) => {
	const credentials = liveCredentials();

	if (!credentials) {
		throw new Error(
			"E2E_AUTH0_USERNAME and E2E_AUTH0_PASSWORD must both be set for a live run that signs in"
		);
	}

	await page.goto(TARGET.baseUrl);
	await expect(page.locator(".user-controls-skeleton")).toHaveCount(0, { timeout: 30_000 });

	// Already signed in from a previous run's cookies? Nothing to do.
	if (
		await page
			.locator("#user-name")
			.isVisible()
			.catch(() => false)
	) {
		await saveState(page);
		return;
	}

	// The top bar's Log In goes through `logIn()` → `loginWithRedirect`, which navigates to
	// the tenant. Clicking the real control rather than constructing the URL means the
	// client's own `authorizationParams` (audience, redirect_uri) are the ones exercised.
	await page.locator("button", { hasText: "Log In" }).first().click();

	// Two Universal Login layouts are possible and the tenant's is not knowable from here:
	// the New ULP names its fields `username`/`password`, the classic Lock widget uses
	// `email`/`password`. Accept either, so this does not need editing to find out which.
	const username = page.locator('input[name="username"], input[name="email"], input[type="email"]');
	await expect(username, "Auth0's login form did not appear").toBeVisible({ timeout: 30_000 });
	await username.fill(credentials.username);

	const password = page.locator('input[name="password"], input[type="password"]');

	// Identifier-first flows ask for the email, submit, then ask for the password. Advance
	// once if the password field is not on this screen yet.
	if (!(await password.isVisible().catch(() => false))) {
		await submit(page);
		await expect(password).toBeVisible({ timeout: 30_000 });
	}

	await password.fill(credentials.password);
	await submit(page);

	// Auth0 shows a consent screen the first time a user authorises an audience, unless the
	// tenant skips it for first-party clients. Accept it if it appears; it will not on any
	// run after the first.
	const consent = page.locator('button[value="accept"], button[name="action"][value="accept"]');
	if (await consent.isVisible({ timeout: 5_000 }).catch(() => false)) {
		await consent.click();
	}

	// Back on our own origin, with a resolved user. If this times out, the most likely
	// causes in order are: a CAPTCHA on the form (check the trace screenshot), the tenant's
	// Allowed Callback URLs not containing this origin, or wrong credentials.
	await page.waitForURL((url) => url.origin === new URL(TARGET.baseUrl).origin, {
		timeout: 60_000
	});
	await expect(page.locator("#user-name"), "did not end up signed in").toBeVisible({
		timeout: 30_000
	});

	await saveState(page);
});

const submit = async (page: import("@playwright/test").Page): Promise<void> => {
	await page
		.locator(
			'button[type="submit"], button[data-action-button-primary="true"], [name="action"][value="default"]'
		)
		.first()
		.click();
};

const saveState = async (page: import("@playwright/test").Page): Promise<void> => {
	await fs.promises.mkdir(path.dirname(LIVE_STORAGE_STATE), { recursive: true });
	await page.context().storageState({ path: LIVE_STORAGE_STATE });
};
