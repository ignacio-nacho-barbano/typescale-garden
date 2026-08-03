import { expect, test as base, type Locator, type Page } from "@playwright/test";
import fs from "fs";
import { BASE_URL } from "./env";
import { installFakeAuth0, newSession, type AuthSession } from "./fakeAuth0";
import { installFakeApi, newApiHandle, type ApiHandle } from "./fakeApi";
import type { GoldenInputs } from "./golden";
import {
	installGuard,
	installStaticFontsFallback,
	installThirdParty,
	type UnexpectedRequests
} from "./thirdParty";

/**
 * The page object. One method per thing a user does, named after the thing rather than
 * the selector, so a spec reads as a description of the behaviour and a markup change
 * costs one edit here instead of twenty in the specs.
 *
 * Everything is driven through real controls. Nothing reaches into a Svelte store — the
 * point of this suite is that the store graph in `client/src/stores/config.ts` is wired
 * to the UI correctly, and a spec that set stores directly would pass with the sidebar
 * completely disconnected.
 */
export class App {
	constructor(readonly page: Page, readonly api: ApiHandle) {}

	async open(): Promise<void> {
		await this.page.goto("/");

		// Waiting for a control to be *visible* is not enough, and getting this wrong is
		// what makes a suite like this flaky: the whole sidebar is server-rendered, so
		// every input is present and visible long before the client bundle takes over.
		// A `fill` in that window writes to the DOM and no Svelte store hears it.
		//
		// `.user-controls-skeleton` is the barrier because it is rendered by the SSR pass
		// unconditionally (auth is browser-only, so `isResolving` is always true there)
		// and can only disappear once hydration has run *and* the silent login has
		// settled. That is exactly the state every spec wants to start from.
		//
		// The timeout is generous because this is the one wait that can include vite
		// compiling modules on first request; everything after it works on a warm page.
		await expect(this.page.locator(".user-controls-skeleton")).toHaveCount(0, { timeout: 30_000 });
		await expect(this.page.locator("#base-font")).toBeVisible();
	}

	// ── the sidebar's Typescale panel ───────────────────────────────────────────────

	/**
	 * Opens the family menu, retrying until it stays open.
	 *
	 * A single click is not reliably enough. Two things fight it: before hydration the
	 * click has no handler at all, and afterwards `actions/clickOutside.ts` registers its
	 * document listener in the **capture** phase and calls `stopPropagation()` — so once
	 * the menu is mounted, the very next click anywhere outside it is swallowed *and*
	 * closes the menu, which includes a click on the input that owns it. Retrying
	 * converges on the open state instead of encoding either quirk as a click count.
	 *
	 * It doubles as the fonts-loaded barrier: the options are built from `$fontsApiData`,
	 * so none of them exists until `GET /api/fonts` has landed and been stored.
	 */
	async openFontMenu(): Promise<void> {
		const input = this.page.locator("#family");
		const list = this.page.locator(".tsg-autocomplete-list");

		await expect(async () => {
			await input.click();
			await expect(list).toBeVisible({ timeout: 1000 });
		}).toPass({ timeout: 15_000 });
	}

	/** Flips one of the four category pills above the family list. */
	async toggleFontCategory(category: string): Promise<void> {
		await this.page.locator(".buttons-group button", { hasText: category }).click();
	}

	/**
	 * Picks a family through the autocomplete, exactly as a user would.
	 *
	 * `setBase` calls this first and unconditionally — even when the family already matches
	 * the store default — because it is also where the fonts-loaded wait happens. Setting
	 * the heading weights before the catalogue lands would race: its arrival recomputes
	 * `availableWeights`, whose subscriber writes clamped weights over whatever was chosen.
	 */
	async selectFont(family: string): Promise<void> {
		const input = this.page.locator("#family");
		const list = this.page.locator(".tsg-autocomplete-list");

		await this.openFontMenu();
		await input.fill(family);

		// AutoComplete's own id scheme: `option.toLowerCase().replaceAll(" ", "-")`.
		const optionId = family.toLowerCase().replaceAll(" ", "-");
		await list.locator(`li#${optionId} button`).click();

		// The picker reports the selection by becoming the input's placeholder.
		await expect(input).toHaveAttribute("placeholder", family);
	}

	/**
	 * Drives every control in the Typescale panel to the values of a golden fixture.
	 *
	 * Order is load-bearing: the family first (see `selectFont`), then the weight range,
	 * which only offers the weights the chosen family actually has.
	 */
	async setBase(inputs: GoldenInputs): Promise<void> {
		await this.selectFont(inputs.fontName);

		await this.fill("#base-font", inputs.baseSize);
		await this.fill("#visual-size", inputs.baseUnit);
		await this.fill("#desktop-ratio", inputs.desktopRatio);
		await this.fill("#mobile-ratio", inputs.mobileRatio);
		await this.fill("#breakpoint", inputs.breakpoint);
		await this.fill("#letterSpacing", inputs.letterSpacingRatio);

		await this.setHeadingWeights(inputs.headingsInitialWeight, inputs.headingsFinalWeight);

		await this.setSwitch("Uppercase for Titles", inputs.useUppercaseForTitles);
		await this.setSwitch("Italics for Titles", inputs.useItalicsForTitles);
	}

	/**
	 * `fill` rather than `type`: Input.svelte writes to its store on every `input` event
	 * (`changeOnBlur` is false), so typing "22" over "20" would publish the intermediate
	 * "2" and, worse, "220" before settling. One replacement is one store write.
	 */
	private async fill(selector: string, value: number): Promise<void> {
		await this.page.locator(selector).fill(String(value));
	}

	async setHeadingWeights(initial: number, final: number): Promise<void> {
		const from = this.page.locator("#headings-initial-weight");
		const to = this.page.locator("#headings-final-weight");

		// Both selects are disabled when the family offers fewer than two weights. That
		// is not an obstacle to work around: `clampHeadingWeights` has already pinned
		// both ends to the only weight there is, so assert that instead of driving it.
		if (await from.isDisabled()) {
			await expect(from).toHaveValue(String(initial));
			await expect(to).toHaveValue(String(final));
			return;
		}

		await from.selectOption(String(initial));
		await to.selectOption(String(final));
	}

	/** The switch is the `<button class="slider">`; the checkbox next to it is inert. */
	async setSwitch(label: string, on: boolean): Promise<void> {
		const wrapper = this.page.locator(`.switch:has(button[aria-label="${label}"])`);

		if ((await this.isSwitchOn(label)) !== on) {
			await wrapper.locator("button.slider").click();
		}

		await expect(wrapper).toHaveClass(on ? /\bactive\b/ : /^((?!\bactive\b).)*$/);
	}

	async isSwitchOn(label: string): Promise<boolean> {
		const wrapper = this.page.locator(`.switch:has(button[aria-label="${label}"])`);
		return (await wrapper.getAttribute("class"))?.includes("active") ?? false;
	}

	/** The top bar's Mobile View switch, which flips `$mobileView`. */
	async setMobileView(on: boolean): Promise<void> {
		await this.setSwitch("Mobile View", on);
	}

	weightOptions(which: "initial" | "final" = "initial"): Locator {
		return this.page.locator(`#headings-${which}-weight option`);
	}

	// ── the sidebar's accordions ────────────────────────────────────────────────────

	private accordion(title: string): Locator {
		return this.page.locator(`section.accordion:has(> button.title-bar:has-text("${title}"))`);
	}

	/** Idempotent: the accordion's own button toggles, so clicking blindly can close it. */
	async openPanel(title: string): Promise<Locator> {
		const section = this.accordion(title);

		if (!((await section.getAttribute("class"))?.includes("open") ?? false)) {
			await section.locator("button.title-bar").click();
		}

		await expect(section).toHaveClass(/\bopen\b/);
		return section;
	}

	// ── export ──────────────────────────────────────────────────────────────────────

	async openExportPanel(): Promise<Locator> {
		return this.openPanel("Export");
	}

	/**
	 * Scoped by title, not just `dialog.modal`: a signed-in user also has the Figma
	 * pairing `<dialog>` in the DOM (mounted, closed), so the bare selector is a strict
	 * mode violation for exactly the sessions the save/load specs use.
	 */
	private codeModal(): Locator {
		return this.page.locator('dialog.modal:has(h1:text-is("Generated typescale CSS"))');
	}

	/** Opens the "See Code" modal and returns the dialog. */
	async openCodeModal(): Promise<Locator> {
		const panel = await this.openExportPanel();
		await panel.locator("button", { hasText: "See Code" }).click();

		const dialog = this.codeModal();
		await expect(dialog).toBeVisible();
		return dialog;
	}

	async selectCodeTab(fileName: "typography.css" | "typography-tokens.json"): Promise<void> {
		await this.codeModal().locator(".tab button", { hasText: fileName }).click();
	}

	/** What the modal is showing, as rendered text. */
	async codeModalText(): Promise<string> {
		return (await this.codeModal().locator(".code-block code").innerText()).trim();
	}

	async closeCodeModal(): Promise<void> {
		await this.codeModal().locator('button[aria-label*="Close"]').click();
		await expect(this.codeModal()).toBeHidden();
	}

	/**
	 * The byte-exact oracle for the generated output.
	 *
	 * `copyToClipboard` hands `$cssCode` / `$designTokens` straight to
	 * `navigator.clipboard.writeText`, so what lands on the clipboard is the store value
	 * with nothing in between. The modal's `<code>` block cannot serve the same purpose:
	 * Svelte trims the whitespace around `{$cssCode}` in the template and the browser
	 * reports `innerText` through the element's own white-space handling, so it is only
	 * good for "the modal shows the same thing", not for an exact comparison.
	 */
	async copyCss(): Promise<string> {
		const panel = await this.openExportPanel();
		await panel.locator("button", { hasText: "Copy CSS" }).click();
		return this.readClipboard();
	}

	async copyTokens(): Promise<string> {
		const panel = await this.openExportPanel();
		await panel.locator("button", { hasText: "Copy" }).filter({ hasText: "Tokens" }).click();
		return this.readClipboard();
	}

	async readClipboard(): Promise<string> {
		return this.page.evaluate(() => navigator.clipboard.readText());
	}

	/**
	 * Clicks the modal's Download button on the given tab and returns the download.
	 *
	 * The button's label follows the active tab (`Download .{activeTab}`), so which file
	 * you get is decided by the tab, not by the button — selecting the tab first is the
	 * whole interaction.
	 */
	async downloadFromModal(
		fileName: "typography.css" | "typography-tokens.json"
	): Promise<{ filename: string; text: string }> {
		await this.openCodeModal();
		await this.selectCodeTab(fileName);

		const [download] = await Promise.all([
			this.page.waitForEvent("download"),
			this.codeModal().locator("button", { hasText: "Download ." }).click()
		]);

		// Read off disk rather than with a helper on `Download`: `downloadFile` builds a
		// `data:` URL and clicks a synthetic anchor, and the saved file is the only place
		// the decoded bytes exist afterwards.
		const path = await download.path();

		return {
			filename: download.suggestedFilename(),
			text: await fs.promises.readFile(path, "utf8")
		};
	}

	// ── the live preview ────────────────────────────────────────────────────────────

	/**
	 * Reads back the styles the generated CSS actually applied.
	 *
	 * `+page.svelte` injects `$cssCode` into a `<style>` tag inside the page and rewrites
	 * the `@media (min-width: N)` floor to 1 (desktop) or 100000 (mobile) so the chosen
	 * half applies regardless of the real viewport. So this measures the generated CSS
	 * end to end: computed, serialised, injected, and resolved by the browser.
	 */
	async computedStyle(selector: string): Promise<Record<string, string>> {
		return this.page
			.locator(`.how-it-works-page ${selector}`)
			.first()
			.evaluate((element) => {
				const style = getComputedStyle(element);
				return {
					fontSize: style.fontSize,
					lineHeight: style.lineHeight,
					fontWeight: style.fontWeight,
					letterSpacing: style.letterSpacing,
					fontStyle: style.fontStyle,
					textTransform: style.textTransform,
					fontFamily: style.fontFamily
				};
			});
	}

	// ── account and saved scales ────────────────────────────────────────────────────

	async openSaveMenu(): Promise<Locator> {
		const panel = await this.openPanel("File");
		await panel.locator("button", { hasText: "Save" }).first().click();
		return panel.locator(".floating-menu-wrapper");
	}

	async openLoadMenu(): Promise<Locator> {
		const panel = await this.openPanel("File");
		await panel.locator("button", { hasText: "Load" }).first().click();
		return panel.locator(".floating-menu-wrapper");
	}

	async saveAs(name: string): Promise<void> {
		const menu = await this.openSaveMenu();
		await menu.locator("#typescale-name").fill(name);
		await menu.locator("button", { hasText: "Save" }).click();
	}

	/** Opens the avatar menu and logs out. `logout()` navigates, so this waits for that. */
	async logOut(): Promise<void> {
		await this.page.locator('button[aria-label="open user options menu"]').click();
		await this.page.locator(".user-profile-button-wrapper button", { hasText: "Log Out" }).click();
		await this.page.waitForURL((url) => url.pathname === "/");
		await expect(this.page.locator(".user-controls-skeleton")).toHaveCount(0);
	}

	notification(text: string | RegExp): Locator {
		return this.page.locator(".notification").filter({ hasText: text });
	}

	userName(): Locator {
		return this.page.locator("#user-name");
	}
}

interface Options {
	/**
	 * Overrides for the fake Auth0 session. `test.use({ auth: { loggedIn: false } })` for
	 * an anonymous visitor, `{ permissions: ["store:typescales-premium"] }` for the
	 * premium tier. A partial rather than a whole session so a spec states only what it
	 * cares about.
	 */
	auth: Partial<AuthSession>;
	/** Makes `GET /api/fonts` fail, exercising the static-snapshot fallback. */
	fontsApiDown: boolean;
}

interface Fixtures {
	unexpected: UnexpectedRequests;
	api: ApiHandle;
	session: AuthSession;
	app: App;
}

/**
 * The suite's `test`. Every spec imports this rather than Playwright's, so no spec can
 * accidentally run without the guard installed — which would mean silently talking to
 * the real API, the real Auth0 tenant and the real Google Fonts.
 */
export const test = base.extend<Options & Fixtures>({
	auth: [{}, { option: true }],
	fontsApiDown: [false, { option: true }],

	unexpected: async ({}, use) => {
		await use([]);
	},

	session: async ({ auth }, use) => {
		await use(newSession(auth));
	},

	api: async ({ fontsApiDown }, use) => {
		const handle = newApiHandle();
		handle.failFonts = fontsApiDown;
		await use(handle);
	},

	app: async ({ context, page, unexpected, api, session, fontsApiDown }, use) => {
		// Guard first — it is the fallback handler, and Playwright consults handlers in
		// reverse registration order.
		await installGuard(context, unexpected);
		await installThirdParty(context);
		await installFakeAuth0(context, session);
		await installFakeApi(context, api);

		if (fontsApiDown) {
			await installStaticFontsFallback(context);
		}

		// The generated CSS and tokens are read back off the clipboard, which is the only
		// path that yields them byte for byte. See `copyCss`.
		await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE_URL });

		await use(new App(page, api));

		// A request nothing expected is a bug in the app or a hole in this harness, and
		// either way the spec that provoked it is the one that should report it. Aborted
		// requests are otherwise easy to miss: `GetTypescales` retries for 30s before
		// giving up, so the symptom would be a timeout somewhere unrelated.
		expect(unexpected, "unexpected outbound requests").toEqual([]);
	}
});

export { expect } from "@playwright/test";
