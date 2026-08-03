import { expect, test } from "../support/app";
import { loadSubjects } from "../support/subjects";

/**
 * The four ways a scale leaves the app: two clipboard buttons and two downloads. All of them
 * read the same derived stores, but each picks which one on its own — exactly the kind of
 * wiring that silently rots. (It had: the JSON download used to write the stylesheet.)
 */
const subject = loadSubjects().cases[0];

test("Copy CSS and Copy Tokens put different things on the clipboard", async ({ app }) => {
	await app.open();
	await app.setBase(subject.inputs);

	expect(await app.copyCss()).toBe(subject.expected.cssCode);
	expect(await app.copyTokens()).toBe(subject.expected.designTokens);

	// Not a tautology: the two buttons sit next to each other and take the same argument
	// shape, so a copy-paste slip between them produces a passing-looking app that hands
	// Figma a stylesheet.
	expect(subject.expected.cssCode).not.toBe(subject.expected.designTokens);
});

test("each copy button confirms what it copied", async ({ app }) => {
	await app.open();
	await app.setBase(subject.inputs);

	await app.copyCss();
	await expect(app.notification("CSS Code copied to clipboard!")).toBeVisible();

	await app.copyTokens();
	await expect(app.notification("Design Tokens copied to clipboard!")).toBeVisible();
});

test("downloads the CSS as typography.css", async ({ app }) => {
	await app.open();
	await app.setBase(subject.inputs);

	const { filename, text } = await app.downloadFromModal("typography.css");

	expect(filename).toBe("typography.css");
	expect(text).toBe(subject.expected.cssCode);
});

test("downloads the tokens as typography-tokens.json", async ({ app }) => {
	await app.open();
	await app.setBase(subject.inputs);

	const { filename, text } = await app.downloadFromModal("typography-tokens.json");

	expect(filename).toBe("typography-tokens.json");

	// The file has to be the tokens, and it has to parse — the plugin does `JSON.parse` on
	// whatever the user pastes in, so a stylesheet under a .json name is a dead end for them
	// with no useful error.
	expect(() => JSON.parse(text)).not.toThrow();
	expect(text).toBe(subject.expected.designTokens);
});
