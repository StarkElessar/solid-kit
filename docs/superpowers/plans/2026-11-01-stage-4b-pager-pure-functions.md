# Этап 4б, пейджер, часть 1: чистые функции, типы, данные. План реализации

> **Для исполнителя:** шаги отмечены чекбоксами (`- [ ]`). Задачи выполняются по порядку, в каждой сначала тест (красный), потом код (зелёный), потом `pnpm check` и коммит. Код возврата `pnpm check` проверяется отдельной командой.

**Цель:** без DOM и без компонентов построить всё, что нужно пейджеру (часть 2): число страниц, зажатие страницы, диапазон записей, пересчёт страницы при смене размера, ряд номеров с пропусками, текст сводки, объединение размеров страницы.

**Архитектура:** каждая функция чистая и лежит в своём файле (один класс/функция — один файл), тест рядом. Каталог `src/components/pager/` пока без `index.ts`: публичный экспорт появляется в части 2 вместе с компонентом.

**Стек:** TypeScript 5.9 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), vitest 5 (jsdom).

**Спек:** `docs/superpowers/specs/2026-11-01-stage-4b-pager-design.md` (раздел 3).

## Глобальные ограничения

- Репозиторий публичный: ни ключей, ни токенов, ни `.env`, ни корпоративной почты в коммитах.
- Один класс/функция — один файл (kebab-case); тип-объединение живёт в своём файле.
- ESLint: табы, одинарные кавычки, длина строки ≤ 140 вместе с комментариями, без комментариев в конце строки.
- pnpm запускается как `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`.
- Тег не ставится и ничего не пушится без отдельного слова владельца.
- Коммит с трейлерами: `T=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "…" -m "$T"`.

## Решения

1. Страницы нумеруются с 1. `pageCount` не бывает меньше 1 (пустая выборка это одна пустая страница).
2. `getPageItems` при `count > 7` всегда возвращает ровно 7 элементов (ширина полосы не прыгает); многоточие это `{ kind: 'gap' }`, не кнопка.
3. `defaultSummaryText` форматирует числа `Intl.NumberFormat('ru')`; разделитель тысяч в разных версиях ICU бывает обычным неразрывным или узким неразрывным пробелом, поэтому тест нормализует пробелы.

---

### Task 1: Типы, `pageCount`, `clampPage`, `pageRange`

**Files:**
- Create: `src/components/pager/pager-range.ts`, `src/components/pager/pager-item.ts`
- Create: `src/components/pager/page-count.ts`, `src/components/pager/clamp-page.ts`, `src/components/pager/page-range.ts`
- Test: `src/components/pager/page-count.test.ts`, `src/components/pager/clamp-page.test.ts`, `src/components/pager/page-range.test.ts`

**Interfaces:**
- Produces: `PagerRange { from: number; to: number; total: number }`; `PagerItem = { kind: 'page'; page: number } | { kind: 'gap' }`; `pageCount(total: number, pageSize: number): number`; `clampPage(page: number, count: number): number`; `pageRange(page: number, pageSize: number, total: number): PagerRange`.

- [ ] **Step 1: Тесты (красные)**

`src/components/pager/page-count.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { pageCount } from './page-count';

describe('pageCount', () => {
	it.each([
		[0, 10, 1],
		[1, 10, 1],
		[10, 10, 1],
		[11, 10, 2],
		[100_000, 50, 2000],
		[100_001, 50, 2001],
		[-5, 10, 1],
		[25, 0, 1],
		[25, -3, 1],
		[Number.NaN, 10, 1],
		[25, Number.NaN, 1],
		[Number.POSITIVE_INFINITY, 10, 1]
	])('total %f, размер %f → %i', (total, size, expected) => {
		expect(pageCount(total, size)).toBe(expected);
	});
});
```

`src/components/pager/clamp-page.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { clampPage } from './clamp-page';

describe('clampPage', () => {
	it.each([
		[1, 5, 1],
		[3, 5, 3],
		[5, 5, 5],
		[6, 5, 5],
		[0, 5, 1],
		[-4, 5, 1],
		[2.7, 5, 2],
		[Number.NaN, 5, 1],
		[Number.POSITIVE_INFINITY, 5, 1],
		[3, 0, 1]
	])('страница %f из %i → %i', (page, count, expected) => {
		expect(clampPage(page, count)).toBe(expected);
	});
});
```

`src/components/pager/page-range.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { pageRange } from './page-range';

describe('pageRange', () => {
	it.each([
		[1, 20, 1250, { from: 1, to: 20, total: 1250 }],
		[2, 20, 1250, { from: 21, to: 40, total: 1250 }],
		[63, 20, 1250, { from: 1241, to: 1250, total: 1250 }],
		[1, 10, 7, { from: 1, to: 7, total: 7 }],
		[1, 10, 0, { from: 0, to: 0, total: 0 }],
		[1, 10, -3, { from: 0, to: 0, total: 0 }]
	])('страница %i, размер %i, всего %i', (page, size, total, expected) => {
		expect(pageRange(page, size, total)).toEqual(expected);
	});
});
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager`
Expected: FAIL (модули не найдены).

- [ ] **Step 3: Реализация**

`src/components/pager/pager-range.ts`:

```ts
/** Диапазон записей текущей страницы для сводки: номера с 1, при пустой выборке `from` и `to` равны 0. */
export interface PagerRange {
	from: number;
	to: number;
	total: number;
}
```

`src/components/pager/pager-item.ts`:

```ts
/** Элемент ряда страниц: кнопка страницы или многоточие (не интерактивно). */
export type PagerItem = { kind: 'page'; page: number } | { kind: 'gap' };
```

`src/components/pager/page-count.ts`:

```ts
/** Число страниц: не меньше 1, мусорные `total` и `pageSize` дают одну страницу. */
export function pageCount(total: number, pageSize: number): number {
	if (!Number.isFinite(total) || !Number.isFinite(pageSize) || total <= 0 || pageSize < 1) {
		return 1;
	}
	return Math.max(1, Math.ceil(total / pageSize));
}
```

`src/components/pager/clamp-page.ts`:

```ts
/** Целая страница в `[1, count]`; нечисло даёт 1. */
export function clampPage(page: number, count: number): number {
	if (!Number.isFinite(page)) {
		return 1;
	}
	return Math.min(Math.max(Math.trunc(page), 1), Math.max(1, count));
}
```

`src/components/pager/page-range.ts`:

```ts
import type { PagerRange } from './pager-range';

/** Диапазон записей страницы; `page` должна быть уже зажата в границы (см. `clampPage`). */
export function pageRange(page: number, pageSize: number, total: number): PagerRange {
	if (total <= 0) {
		return { from: 0, to: 0, total: 0 };
	}
	return { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total), total };
}
```

- [ ] **Step 4: Тесты зелёные**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager`
Expected: PASS.

- [ ] **Step 5: Проверка и коммит**

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo exit=$?
```
Expected: `exit=0`. Затем:

```bash
git add src/components/pager && git commit -m "feat(pager): число страниц, зажатие и диапазон записей" -m "$T"
```

---

### Task 2: `pageForSizeChange` и `getPageItems`

**Files:**
- Create: `src/components/pager/page-for-size-change.ts`, `src/components/pager/get-page-items.ts`
- Test: `src/components/pager/page-for-size-change.test.ts`, `src/components/pager/get-page-items.test.ts`

**Interfaces:**
- Consumes: `PagerItem` из `./pager-item`.
- Produces: `pageForSizeChange(page: number, oldSize: number, newSize: number): number`; `getPageItems(page: number, count: number): PagerItem[]`.

- [ ] **Step 1: Тесты (красные)**

`src/components/pager/page-for-size-change.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { pageForSizeChange } from './page-for-size-change';

describe('pageForSizeChange', () => {
	it.each([
		[3, 10, 50, 1],
		[3, 50, 10, 11],
		[1, 10, 2000, 1],
		[1, 2000, 10, 1],
		[7, 20, 20, 7],
		[6, 10, 20, 3],
		[5, 10, 20, 3],
		[2, 20, 10, 3]
	])('страница %i: %i → %i даёт страницу %i', (page, oldSize, newSize, expected) => {
		expect(pageForSizeChange(page, oldSize, newSize)).toBe(expected);
	});

	it('первая запись прежней страницы остаётся на новой', () => {
		for (const [oldSize, newSize] of [[10, 50], [50, 10], [20, 200], [200, 20], [1000, 500]] as const) {
			for (const page of [1, 2, 3, 7, 40]) {
				const first = (page - 1) * oldSize + 1;
				const next = pageForSizeChange(page, oldSize, newSize);
				expect(first).toBeGreaterThanOrEqual((next - 1) * newSize + 1);
				expect(first).toBeLessThanOrEqual(next * newSize);
			}
		}
	});
});
```

`src/components/pager/get-page-items.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { getPageItems } from './get-page-items';
import type { PagerItem } from './pager-item';

function show(items: readonly PagerItem[]): string {
	return items.map((item) => (item.kind === 'gap' ? '…' : String(item.page))).join(' ');
}

describe('getPageItems', () => {
	it.each([
		[1, 1, '1'],
		[1, 3, '1 2 3'],
		[4, 7, '1 2 3 4 5 6 7'],
		[1, 8, '1 2 3 4 5 … 8'],
		[4, 8, '1 2 3 4 5 … 8'],
		[5, 8, '1 … 4 5 6 7 8'],
		[8, 8, '1 … 4 5 6 7 8'],
		[1, 20, '1 2 3 4 5 … 20'],
		[4, 20, '1 2 3 4 5 … 20'],
		[5, 20, '1 … 4 5 6 … 20'],
		[10, 20, '1 … 9 10 11 … 20'],
		[16, 20, '1 … 15 16 17 … 20'],
		[17, 20, '1 … 16 17 18 19 20'],
		[20, 20, '1 … 16 17 18 19 20'],
		[1000, 2000, '1 … 999 1000 1001 … 2000']
	])('страница %i из %i → %s', (page, count, expected) => {
		expect(show(getPageItems(page, count))).toBe(expected);
	});

	it('при количестве страниц больше семи всегда ровно семь элементов', () => {
		for (const count of [8, 9, 20, 2000]) {
			for (let page = 1; page <= count; page += 1) {
				expect(getPageItems(page, count)).toHaveLength(7);
			}
		}
	});

	it('многоточие всегда стоит между страницами, а не на краю', () => {
		for (let page = 1; page <= 30; page += 1) {
			const items = getPageItems(page, 30);
			expect(items[0]).toEqual({ kind: 'page', page: 1 });
			expect(items.at(-1)).toEqual({ kind: 'page', page: 30 });
		}
	});
});
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager`
Expected: FAIL для двух новых файлов.

- [ ] **Step 3: Реализация**

`src/components/pager/page-for-size-change.ts`:

```ts
/** Страница нового размера, на которой остаётся первая запись прежней страницы. */
export function pageForSizeChange(page: number, oldSize: number, newSize: number): number {
	return Math.floor(((page - 1) * oldSize) / newSize) + 1;
}
```

`src/components/pager/get-page-items.ts`:

```ts
import type { PagerItem } from './pager-item';

const SLOTS = 7;
const GAP: PagerItem = { kind: 'gap' };

function pageItem(page: number): PagerItem {
	return { kind: 'page', page };
}

/**
 * Ряд страниц: до семи страниц показываются все, иначе ровно семь элементов (ширина полосы не прыгает):
 * `1 2 3 4 5 … N` у начала, `1 … N-4 N-3 N-2 N-1 N` у конца, `1 … p-1 p p+1 … N` посередине.
 */
export function getPageItems(page: number, count: number): PagerItem[] {
	if (count <= SLOTS) {
		return Array.from({ length: count }, (_, index) => pageItem(index + 1));
	}
	if (page <= 4) {
		return [pageItem(1), pageItem(2), pageItem(3), pageItem(4), pageItem(5), GAP, pageItem(count)];
	}
	if (page >= count - 3) {
		return [pageItem(1), GAP, pageItem(count - 4), pageItem(count - 3), pageItem(count - 2), pageItem(count - 1), pageItem(count)];
	}
	return [pageItem(1), GAP, pageItem(page - 1), pageItem(page), pageItem(page + 1), GAP, pageItem(count)];
}
```

- [ ] **Step 4: Тесты зелёные**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager`
Expected: PASS.

- [ ] **Step 5: Проверка и коммит**

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo exit=$?
```
Expected: `exit=0`. Затем:

```bash
git add src/components/pager && git commit -m "feat(pager): пересчёт страницы при смене размера и ряд номеров" -m "$T"
```

---

### Task 3: `defaultSummaryText`, `mergePageSizes`, `DEFAULT_PAGE_SIZES`

**Files:**
- Create: `src/components/pager/default-summary-text.ts`, `src/components/pager/merge-page-sizes.ts`, `src/components/pager/default-page-sizes.ts`
- Test: `src/components/pager/default-summary-text.test.ts`, `src/components/pager/merge-page-sizes.test.ts`

**Interfaces:**
- Consumes: `PagerRange` из `./pager-range`.
- Produces: `defaultSummaryText(range: PagerRange): string`; `mergePageSizes(sizes: readonly number[], current: number): number[]`; `DEFAULT_PAGE_SIZES: readonly number[]`.

- [ ] **Step 1: Тесты (красные)**

`src/components/pager/default-summary-text.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { defaultSummaryText } from './default-summary-text';

// разделитель тысяч в ICU бывает неразрывным и узким неразрывным пробелом: сравниваем с обычным
function plain(text: string): string {
	return text.replace(/\s/g, ' ');
}

describe('defaultSummaryText', () => {
	it.each([
		[{ from: 21, to: 40, total: 1250 }, 'Записей 21–40 из 1 250'],
		[{ from: 1241, to: 1250, total: 1250 }, 'Записей 1 241–1 250 из 1 250'],
		[{ from: 1, to: 7, total: 7 }, 'Записей 1–7 из 7'],
		[{ from: 0, to: 0, total: 0 }, 'Записей 0']
	])('%j → «%s»', (range, expected) => {
		expect(plain(defaultSummaryText(range))).toBe(expected);
	});
});
```

`src/components/pager/merge-page-sizes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { DEFAULT_PAGE_SIZES } from './default-page-sizes';
import { mergePageSizes } from './merge-page-sizes';

describe('mergePageSizes', () => {
	it('размер из списка не дублируется', () => {
		expect(mergePageSizes([10, 20, 50], 20)).toEqual([10, 20, 50]);
	});

	it('размер вне списка добавляется по порядку', () => {
		expect(mergePageSizes([10, 20, 50], 25)).toEqual([10, 20, 25, 50]);
		expect(mergePageSizes([10, 20, 50], 5)).toEqual([5, 10, 20, 50]);
	});

	it('сортирует по возрастанию и не мутирует вход', () => {
		const sizes = [50, 10, 20];
		expect(mergePageSizes(sizes, 10)).toEqual([10, 20, 50]);
		expect(sizes).toEqual([50, 10, 20]);
	});
});

describe('DEFAULT_PAGE_SIZES', () => {
	it('набор владельца', () => {
		expect(DEFAULT_PAGE_SIZES).toEqual([10, 20, 50, 200, 500, 1000, 2000]);
	});
});
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager`
Expected: FAIL для двух новых файлов.

- [ ] **Step 3: Реализация**

`src/components/pager/default-page-sizes.ts`:

```ts
/** Размеры страницы по умолчанию; первый это размер страницы по умолчанию. */
export const DEFAULT_PAGE_SIZES: readonly number[] = [10, 20, 50, 200, 500, 1000, 2000];
```

`src/components/pager/merge-page-sizes.ts`:

```ts
/** Список выбора размера: `sizes` плюс текущий размер (чтобы переданный страницей размер вне списка не пропадал), по возрастанию. */
export function mergePageSizes(sizes: readonly number[], current: number): number[] {
	return [...new Set([...sizes, current])].sort((first, second) => first - second);
}
```

`src/components/pager/default-summary-text.ts`:

```ts
import type { PagerRange } from './pager-range';

const NUMBER = new Intl.NumberFormat('ru');

/** «Записей 21–40 из 1 250»; при пустой выборке «Записей 0». */
export function defaultSummaryText(range: PagerRange): string {
	if (range.total === 0) {
		return 'Записей 0';
	}
	return `Записей ${NUMBER.format(range.from)}–${NUMBER.format(range.to)} из ${NUMBER.format(range.total)}`;
}
```

- [ ] **Step 4: Тесты зелёные**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager`
Expected: PASS.

- [ ] **Step 5: Проверка и коммит**

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo exit=$?
```
Expected: `exit=0`. Затем:

```bash
git add src/components/pager && git commit -m "feat(pager): текст сводки, объединение размеров, набор размеров по умолчанию" -m "$T"
```

---

## Самопроверка плана

- Покрытие спека (раздел 3): `pageCount`, `clampPage`, `pageRange`, `pageForSizeChange`, `getPageItems`, `defaultSummaryText` и `mergePageSizes` (раздел 2.1) есть; размеры по умолчанию (раздел 1, решение 3) есть.
- Типы согласованы: `PagerRange` и `PagerItem` определены в задаче 1 и используются в задачах 2 и 3.
- Что дальше: часть 2 (`2026-11-01-stage-4b-pager-component.md`) использует все эти функции.
