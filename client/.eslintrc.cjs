import eslintPluginSvelte from "eslint-plugin-svelte";
export default [
	// add more generic rule sets here, such as:
	// js.configs.recommended,
	...eslintPluginSvelte.configs["flat/recommended"],
	{
		rules: {
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-non-null-assertion": "off"
		}
	}
];
