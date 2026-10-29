import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';

// пути относительно корня репозитория: тесты запускаются оттуда
const COMPONENT_FILE = 'src/components/example/example.module.css';
const TOKENS_FILE = 'src/styles/tokens.css';
const CONFIG_FILE = 'stylelint.config.js';

async function lint(code: string, codeFilename: string): Promise<string[]> {
	const { results } = await stylelint.lint({ code, codeFilename, configFile: CONFIG_FILE });
	return (results[0]?.warnings ?? []).map((warning) => warning.rule);
}

describe('stylelint rules of the kit', () => {
	it('forbids a hex colour in component CSS', async () => {
		expect(await lint('.a {\n    color: #fff;\n}\n', COMPONENT_FILE)).toContain('color-no-hex');
	});

	it('forbids a named colour in component CSS', async () => {
		expect(await lint('.a {\n    color: red;\n}\n', COMPONENT_FILE)).toContain('color-named');
	});

	it('forbids colour functions with literal channels in component CSS', async () => {
		const rules = await lint('.a {\n    color: rgb(0 0 0);\n    background: oklch(50% 0.1 200);\n}\n', COMPONENT_FILE);
		expect(rules.filter((rule) => rule === 'function-disallowed-list')).toHaveLength(2);
	});

	it('allows transparent, currentColor, tokens and color-mix over tokens', async () => {
		const code = [
			'.a {',
			'    border-color: transparent;',
			'    color: currentcolor;',
			'    background: var(--s-kit-color-surface);',
			'    outline-color: color-mix(in oklch, var(--s-kit-color-primary) 55%, transparent);',
			'}',
			''
		].join('\n');
		expect(await lint(code, COMPONENT_FILE)).toEqual([]);
	});

	it('forbids outline: none and outline: 0 in component CSS', async () => {
		const rules = await lint('.a {\n    outline: none;\n}\n\n.b {\n    outline: 0;\n}\n', COMPONENT_FILE);
		expect(rules.filter((rule) => rule === 'declaration-property-value-disallowed-list')).toHaveLength(2);
	});

	it('forbids var(--s-kit-control-height) without a fallback in component CSS', async () => {
		const rules = await lint('.a {\n    block-size: var(--s-kit-control-height);\n}\n', COMPONENT_FILE);
		expect(rules).toContain('declaration-property-value-disallowed-list');
	});

	it('allows var(--s-kit-control-height, var(--s-kit-control-height-md))', async () => {
		const code = '.a {\n    block-size: var(--s-kit-control-height, var(--s-kit-control-height-md));\n}\n';
		expect(await lint(code, COMPONENT_FILE)).toEqual([]);
	});

	it('flags a var() that points at an undeclared token', async () => {
		expect(await lint('.a {\n    color: var(--s-kit-color-typo);\n}\n', COMPONENT_FILE)).toContain('no-unknown-custom-properties');
	});

	it('allows literals in the token layer', async () => {
		const rules = await lint(':root {\n    --s-kit-color-primary: light-dark(#0071e3, #4da3ff);\n}\n', TOKENS_FILE);
		expect(rules).not.toContain('color-no-hex');
	});
});
