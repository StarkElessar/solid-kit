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
		{
			outline: ['none', '0'],
			'outline-style': ['none'],
			// единое правило разрешения размера (раздел 5): без фолбэка контрол вне обёртки остаётся без высоты
			'/.+/': [/var\(--s-kit-control-height\)/]
		},
		{ message: 'Do not remove the focus indicator (use --s-kit-focus-* tokens) and always give --s-kit-control-height a fallback.' }
	]
};

/** @type {import('stylelint').Config} */
export default {
	extends: ['@stark/stylelint-config'],
	// var(--x) проверяется по токенам, объявленным в tokens.css
	referenceFiles: ['src/styles/tokens.css'],
	rules: {
		'no-unknown-custom-properties': true,
		// composes это ключевое слово CSS Modules, а не свойство CSS
		'property-no-unknown': [true, { ignoreProperties: ['composes'] }],
		// Safari 17.5 (минимум кита) знает только -webkit-backdrop-filter; без него материал панелей не размывается (раздел 4.3)
		'property-no-vendor-prefix': [true, { ignoreProperties: ['-webkit-backdrop-filter'] }],
		// пара -webkit-backdrop-filter + backdrop-filter с одним значением это не дубликат, а фолбэк для Safari
		'declaration-block-no-duplicate-properties': [
			true,
			{ ignore: ['consecutive-duplicates', 'consecutive-duplicates-with-different-syntaxes'] }
		]
	},
	overrides: [{ files: ['src/components/**/*.css', 'src/styles/**/*.module.css'], rules: componentRules }]
};
