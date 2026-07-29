// Flat config. Replaced .eslintrc.cjs + .eslintignore, which eslint 10 dropped support for
// entirely — it no longer reads either file, so the old setup did not degrade, it failed to
// start ("couldn't find an eslint.config.(js|mjs|cjs) file").
//
// Two things here are not just a mechanical port of the old file:
//
// - The Figma plugin ships eslintrc-shaped configs only (`configs.recommended` is a
//   `{ plugins: [...], rules: {...} }` object, which flat config cannot `extends`), so its
//   plugin object is registered by hand and its rule map is spread in. Re-check that map
//   against the package when upgrading it — nothing here would notice a new rule.
// - Type-aware linting is required, not optional: the Figma rules that matter
//   (await-requires-async, the ban-deprecated-sync-* family) resolve types to decide
//   whether a call is a promise, and silently find nothing without a program.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import figmaPlugins from "@figma/eslint-plugin-figma-plugins";

export default tseslint.config(
	{
		// code.js is generated (and committed); the lockfiles and the plain-node test script
		// are not TypeScript and have no business in a type-aware program.
		ignores: ["code.js", "test/**", "*.mjs", "pnpm-lock.yaml", "package-lock.json"]
	},
	js.configs.recommended,
	// Turns off the core rules TypeScript already enforces (`no-undef` among them, which is
	// what would otherwise flag the `figma` and `__html__` globals the sandbox injects).
	...tseslint.configs.recommended,
	{
		files: ["code.ts"],
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname
			}
		},
		plugins: { "@figma/figma-plugins": figmaPlugins },
		rules: { ...figmaPlugins.configs.recommended.rules }
	}
);
