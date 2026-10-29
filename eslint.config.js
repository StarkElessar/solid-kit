import stark, { typeChecked } from '@stark/eslint-config';
import solid from 'eslint-plugin-solid/configs/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
	globalIgnores(['**/dist/**', '**/node_modules/**', '**/.vite/**', 'scripts/consumer/**']),
	...stark,
	{
		files: ['**/*.{js,ts,tsx}'],
		languageOptions: { globals: { ...globals.browser } }
	},
	{
		files: ['*.config.{js,ts}', 'playground/*.config.ts'],
		languageOptions: { globals: { ...globals.node } }
	},
	...typeChecked,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }
		}
	},
	{ ...solid, files: ['**/*.{ts,tsx}'] }
]);
