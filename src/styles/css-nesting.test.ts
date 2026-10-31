import { describe, expect, it } from 'vitest';

/*
 * Правило кита: всё, что относится к блоку, лежит внутри правила блока (.root:hover, .root .item, .root[data-x]),
 * а не отдельным правилом верхнего уровня. Тест разбирает CSS файлов и падает, если селектор верхнего уровня
 * начинается с класса, у которого в этом же файле уже есть собственное правило верхнего уровня.
 *
 * Разбор ручной (скобки, комментарии и строки учитываются), поэтому тест не зависит от парсера CSS в зависимостях.
 * Вывод нарушений: "файл: селектор", по одному на строку.
 */

const CSS_FILES = import.meta.glob(['/src/**/*.css', '/playground/src/**/*.css'], {
	query: '?raw',
	import: 'default',
	eager: true
});

type Sheet = { file: string; css: string };

/** Класс, с которого начинается селектор: .root, .root:hover, .root > svg, .root[data-x]. */
const LEADING_CLASS = /^\.([\w-]+)/;

/** Корень с нулевой специфичностью: правила блока обёрнуты в :where(), вкладывать в него состояния нельзя. */
const ZERO_SPECIFICITY_ROOT = /^:where\(\s*\.([\w-]+)\s*\)$/;

/** Индекс после закрывающей кавычки строкового литерала CSS. */
function skipString(css: string, start: number): number {
	const quote = css.charAt(start);
	let index = start + 1;
	while (index < css.length) {
		if (css.charAt(index) === '\\') {
			index += 2;
			continue;
		}
		if (css.charAt(index) === quote) {
			return index + 1;
		}
		index++;
	}
	return css.length;
}

/** Индекс после закрывающей скобки блока; учитывает вложенные блоки, строки и комментарии. */
function skipBlock(css: string, start: number): number {
	let depth = 0;
	let index = start;
	while (index < css.length) {
		const char = css.charAt(index);
		if (char === '/' && css.charAt(index + 1) === '*') {
			index = css.indexOf('*/', index + 2) + 2;
			continue;
		}
		if (char === '"' || char === "'") {
			index = skipString(css, index);
			continue;
		}
		if (char === '{') {
			depth++;
		}
		if (char === '}') {
			depth--;
			if (depth === 0) {
				return index + 1;
			}
		}
		index++;
	}
	return css.length;
}

/** Селекторы правил верхнего уровня: правила внутри @media/@supports/@layer тоже верхний уровень (родитель не правило). */
function topLevelSelectors(css: string): string[] {
	const selectors: string[] = [];
	const containers: string[] = [];
	let prelude = '';
	let index = 0;
	while (index < css.length) {
		const char = css.charAt(index);
		if (char === '/' && css.charAt(index + 1) === '*') {
			index = css.indexOf('*/', index + 2) + 2;
			continue;
		}
		if (char === '"' || char === "'") {
			const end = skipString(css, index);
			prelude += css.slice(index, end);
			index = end;
			continue;
		}
		if (char === '{') {
			const statement = prelude.trim();
			prelude = '';
			if (statement.startsWith('@')) {
				containers.push('at');
				index++;
				continue;
			}
			containers.push('rule');
			const nested = containers.slice(0, -1).includes('rule');
			if (!nested) {
				selectors.push(statement);
			}
			index = skipBlock(css, index);
			containers.pop();
			continue;
		}
		if (char === '}') {
			containers.pop();
			prelude = '';
			index++;
			continue;
		}
		if (char === ';') {
			prelude = '';
			index++;
			continue;
		}
		prelude += char;
		index++;
	}
	return selectors;
}

/** Селекторы списка: запятая внутри :not(), :is() и атрибута разделителем не считается. */
function splitSelectorList(selector: string): string[] {
	const parts: string[] = [];
	let current = '';
	let depth = 0;
	let index = 0;
	while (index < selector.length) {
		const char = selector.charAt(index);
		if (char === '"' || char === "'") {
			const end = skipString(selector, index);
			current += selector.slice(index, end);
			index = end;
			continue;
		}
		if (char === '(' || char === '[') {
			depth++;
		}
		if (char === ')' || char === ']') {
			depth--;
		}
		if (char === ',' && depth === 0) {
			parts.push(current.trim());
			current = '';
			index++;
			continue;
		}
		current += char;
		index++;
	}
	parts.push(current.trim());
	return parts.filter((part) => part !== '');
}

/** Нарушения в одном файле: селектор верхнего уровня, который начинается с класса уже объявленного правила блока. */
export function findFlatBlockSelectors(sheet: Sheet): string[] {
	const selectors = topLevelSelectors(sheet.css);
	const zeroRoots = new Set<string>();
	for (const selector of selectors) {
		const parts = splitSelectorList(selector);
		if (parts.length !== 1) {
			continue;
		}
		const match = ZERO_SPECIFICITY_ROOT.exec(parts[0] ?? '');
		const name = match?.[1];
		if (name !== undefined) {
			zeroRoots.add(name);
		}
	}

	const declared = new Set<string>();
	const violations: string[] = [];
	for (const selector of selectors) {
		const parts = splitSelectorList(selector);
		// общее базовое правило-список (.cell, .head-cell) вложить некуда: блоком считается правило с одним селектором
		const single = parts.length === 1;
		for (const part of parts) {
			const name = LEADING_CLASS.exec(part)?.[1];
			if (name === undefined) {
				continue;
			}
			// :where(.control) держит специфичность 0; вложенное состояние подняло бы её и изменило каскад
			if (zeroRoots.has(name)) {
				continue;
			}
			if (single && declared.has(name)) {
				violations.push(`${sheet.file}: ${part}`);
			}
			if (single) {
				declared.add(name);
			}
		}
	}
	return violations;
}

const SHEETS: Sheet[] = Object.entries(CSS_FILES).map(([path, css]) => ({ file: path.replace(/^\//, ''), css }));

function violationsOf(sheets: Sheet[]): string[] {
	return sheets.flatMap(findFlatBlockSelectors);
}

describe('CSS nesting of the kit', () => {
	it('reads every CSS file of src and playground', () => {
		const files = SHEETS.map((sheet) => sheet.file);
		expect(files.length).toBeGreaterThan(20);
		expect(files).toContain('src/styles/tokens.css');
		expect(files).toContain('src/components/button/button.module.css');
		expect(files.some((file) => file.startsWith('playground/src/'))).toBe(true);
	});

	it('keeps every selector of a declared block inside the block rule', () => {
		expect(violationsOf(SHEETS)).toEqual([]);
	});

	it('flags a pseudo-class of a declared block', () => {
		const sheet = { file: 'example.css', css: '.root {\n    color: red;\n}\n\n.root:hover {\n    color: blue;\n}\n' };
		expect(findFlatBlockSelectors(sheet)).toEqual(['example.css: .root:hover']);
	});

	it('flags a descendant and an attribute variant of a declared block', () => {
		const sheet = {
			file: 'example.css',
			css: '.root {\n}\n\n.root > svg {\n}\n\n.root[data-open] {\n}\n'
		};
		expect(findFlatBlockSelectors(sheet)).toEqual(['example.css: .root > svg', 'example.css: .root[data-open]']);
	});

	it('accepts nested states, nested descendants and shared base rules', () => {
		const css = [
			'.cell,',
			'.head-cell {',
			'    padding: 0;',
			'}',
			'',
			'.cell {',
			'    &[data-sticky] {',
			'        position: sticky;',
			'    }',
			'',
			'    @media (hover: hover) {',
			'        &:hover > .mark {',
			'            display: block;',
			'        }',
			'    }',
			'}',
			'',
			'.head-cell {',
			'    &[aria-disabled="true"] {',
			'        opacity: 0.5;',
			'    }',
			'}',
			'',
			':where(.control) {',
			'    transition: none;',
			'}',
			'',
			'.control:focus-visible {',
			'    outline-width: 2px;',
			'}',
			'.control:disabled {',
			'    cursor: not-allowed;',
			'}',
			''
		].join('\n');
		expect(findFlatBlockSelectors({ file: 'example.css', css })).toEqual([]);
	});
});
