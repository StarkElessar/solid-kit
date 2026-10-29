/** Литералы цвета и подавление фокуса запрещены в CSS компонентов; значения живут только в src/styles/tokens.css. */
const componentRules = {
	'color-no-hex': [true, { message: 'Use a colour token from src/styles/tokens.css, not a hex literal.' }],
	'color-named': ['never', { message: 'Use a colour token from src/styles/tokens.css, not a named colour.' }],
	'function-disallowed-list': [
		['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],
		{ message: 'Use a colour token from src/styles/tokens.css, not a colour function with literal channels.' }
	],
	// outline: none без замены запрещён; кольцо задаётся токенами фокуса (спек, раздел 5.1).
	'declaration-property-value-disallowed-list': [
		{ outline: ['none', '0'], 'outline-style': ['none'] },
		{ message: 'Do not remove the focus indicator: use the --s-kit-focus-* tokens.' }
	]
};

/** @type {import('stylelint').Config} */
export default {
	extends: ['@stark/stylelint-config'],
	// var(--x) проверяется по токенам, объявленным в tokens.css
	referenceFiles: ['src/styles/tokens.css'],
	rules: {
		'no-unknown-custom-properties': true
	},
	overrides: [{ files: ['src/components/**/*.css'], rules: componentRules }]
};
