/* eslint-env node */
module.exports = {
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@figma/figma-plugins/recommended"
	],
	ignorePatterns: ["*.js", "*.cjs"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "./tsconfig.json"
	},
	root: true
};
