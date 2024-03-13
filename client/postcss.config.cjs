const autoprefixer = require("autoprefixer");
const postcssPresetEnv = require("postcss-preset-env");
const csso = require("postcss-csso");
const postcssGlobalData = require("@csstools/postcss-global-data");

const config = {
	plugins: [
		postcssGlobalData({}),
		postcssPresetEnv({
			stage: 3,
			features: {
				"nesting-rules": true,
				"media-query-ranges": true
			}
		}),
		autoprefixer(),
		csso()
	]
};

module.exports = config;
