import eslint from "@eslint/js";
import stylisticPlugin from "@stylistic/eslint-plugin";
import { importX } from "eslint-plugin-import-x";
import unicornPlugin from "eslint-plugin-unicorn";
import { defineConfig, type ConfigObject } from "eslint/config";
import { configs as tsConfigs, parser as tsParser } from "typescript-eslint";

const config: Array<ConfigObject> = defineConfig([
	{ ignores: ["**/dist/**"] },
	eslint.configs.recommended,
	tsConfigs.recommendedTypeChecked,
	tsConfigs.stylisticTypeChecked,
	tsConfigs.strictTypeChecked,
	importX.flatConfigs.recommended,
	importX.flatConfigs.typescript,
	{
		languageOptions: {
			parser: tsParser,
			ecmaVersion: "latest",
			sourceType: "module",
			parserOptions: {
				project: true,
			},
		},
		plugins: {
			"unicorn": unicornPlugin,
			"@stylistic": stylisticPlugin,
		},
		rules: {
			// js
			"no-console": "error",

			// node
			"unicorn/prefer-node-protocol": "error",

			// style
			"@stylistic/spaced-comment": "error",

			// import
			"import-x/no-dynamic-require": "warn",
			"import-x/no-nodejs-modules": "warn",

			"import-x/consistent-type-specifier-style": ["error", "prefer-inline"],
			"import-x/first": "error",
			"import-x/newline-after-import": "error",
			"import-x/no-commonjs": "error",
			"import-x/no-duplicates": "error",
			"import-x/extensions": ["error", "always", { ignorePackages: true }],
			// "import/order": "off",

			// typescript
			"@typescript-eslint/consistent-type-definitions": "off",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/switch-exhaustiveness-check": "error",
			"@typescript-eslint/require-await": "error",
			"@typescript-eslint/array-type": ["error", { default: "generic", readonly: "generic" }],
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "explicit" }],
			"@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
			"@typescript-eslint/strict-boolean-expressions": [
				"error",
				{
					allowString: true,
					allowNullableObject: true,
					allowNullableBoolean: true,
					allowNullableString: true,
					allowAny: true,
					allowNumber: false,
					allowNullableNumber: false,
				},
			],
		},
	},
]);

export default config;
