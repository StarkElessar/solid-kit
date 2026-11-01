# Автосуммы: реализация

> **Статус: заменён.** Первая версия плана (две строки итогов с подписью) отклонена владельцем 2026-11-01; итоговая версия описана в спеке `2026-11-01-stage-4b-totals-design.md` (один футер `totals` без подписей).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Строки «Итого на странице» и «Итого по выборке» в `<tfoot>` Grid по серверным `pageTotals` и `totals`, формат ячейки через `GridColumn.aggregate`.

**Architecture:** Чистые функции собирают строки итогов и содержимое ячейки; `GridTotals` рендерит `tfoot` внутри той же таблицы, ячейки прилипают к низу скроллера; Grid отдаёт строки через контекст и учитывает высоту итогов в `scroll-padding`.

**Tech Stack:** Solid 1.9, CSS Modules (нативная вложенность), vitest 5 + jsdom, Chrome-приёмка в playground.

**Spec:** `docs/superpowers/specs/2026-11-01-stage-4b-totals-design.md`

## Global Constraints

- Один класс, компонент, функция или тип на файл, имена kebab-case; тесты рядом.
- ESLint: табы, одинарные кавычки, до 140 символов (с комментариями), без висящих комментариев, `simple-import-sort`, скобки вокруг многострочного JSX в пропсах.
- CSS: нативная вложенность с явным `&`, на верхнем уровне только корневые селекторы блоков; собственные декларации раньше вложенных правил.
- Комментарии на русском, только неочевидное «почему».
- pnpm: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`; код возврата `pnpm check` проверять отдельно.
- Коммит: `T=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "…" -m "$T"`.
- Не пушить и не ставить теги без слова владельца.

---

### Task 1: Типы и чистые функции

**Files:**
- Create: `src/components/grid/grid-totals-labels.ts`, `default-totals-labels.ts`, `totals-row.ts`, `build-totals-rows.ts`, `build-totals-rows.test.ts`, `totals-cell-content.ts`, `totals-cell-content.test.ts` (все в `src/components/grid/`)
- Modify: `src/components/grid/grid-column.ts` (поле `aggregate`)

**Interfaces:**
- Produces: `GridTotalsLabels { page: string; all: string }`; `DEFAULT_TOTALS_LABELS: GridTotalsLabels`; `TotalsRow { kind: 'page' | 'all'; label: string; values: Readonly<Record<string, unknown>> }`; `buildTotalsRows(pageTotals, totals, labels): readonly TotalsRow[]`; `totalsCellContent(column: GridColumn<unknown>, values): JSX.Element`.

- [ ] **Step 1: Типы**

`grid-totals-labels.ts`:
```ts
/** Подписи строк итогов; переопределяются через `totalsLabels` грида. */
export interface GridTotalsLabels {
	page: string;
	all: string;
}
```
`default-totals-labels.ts`:
```ts
import type { GridTotalsLabels } from './grid-totals-labels';

export const DEFAULT_TOTALS_LABELS: GridTotalsLabels = {
	page: 'Итого на странице',
	all: 'Итого по выборке'
};
```
`totals-row.ts`:
```ts
/** Строка итогов: `page` это итог страницы, `all` итог по всей выборке. */
export interface TotalsRow {
	kind: 'page' | 'all';
	label: string;
	values: Readonly<Record<string, unknown>>;
}
```
В `grid-column.ts` в конец интерфейса:
```ts
	/** Формат итога колонки (страничного, глобального и группового); без него значение показывается как текст ячейки. */
	aggregate?: ((value: unknown) => JSX.Element) | undefined;
```

- [ ] **Step 2: Падающие тесты**

`build-totals-rows.test.ts`:
```ts
import { describe, expect, it } from 'vitest';

import { buildTotalsRows } from './build-totals-rows';
import { DEFAULT_TOTALS_LABELS } from './default-totals-labels';

describe('buildTotalsRows', () => {
	it('без источников строк нет', () => {
		expect(buildTotalsRows(undefined, undefined, DEFAULT_TOTALS_LABELS)).toEqual([]);
	});

	it('только страница: одна строка с подписью страницы', () => {
		expect(buildTotalsRows({ a: 1 }, undefined, DEFAULT_TOTALS_LABELS)).toEqual([
			{ kind: 'page', label: 'Итого на странице', values: { a: 1 } }
		]);
	});

	it('только выборка: одна строка с подписью выборки, из страницы ничего не подставляется', () => {
		expect(buildTotalsRows(undefined, { a: 2 }, DEFAULT_TOTALS_LABELS)).toEqual([
			{ kind: 'all', label: 'Итого по выборке', values: { a: 2 } }
		]);
	});

	it('оба источника: порядок «страница, выборка»', () => {
		const rows = buildTotalsRows({ a: 1 }, { a: 2 }, DEFAULT_TOTALS_LABELS);
		expect(rows.map((row) => row.kind)).toEqual(['page', 'all']);
	});

	it('пустой объект это переданный источник', () => {
		expect(buildTotalsRows({}, undefined, DEFAULT_TOTALS_LABELS)).toHaveLength(1);
	});

	it('подписи берутся из переданных', () => {
		const rows = buildTotalsRows({}, {}, { page: 'Страница', all: 'Все' });
		expect(rows.map((row) => row.label)).toEqual(['Страница', 'Все']);
	});
});
```
`totals-cell-content.test.ts`:
```ts
import { describe, expect, it } from 'vitest';

import type { GridColumn } from './grid-column';
import { totalsCellContent } from './totals-cell-content';

const plain: GridColumn<unknown> = { id: 'sum', title: 'Сумма', value: () => 0 };

describe('totalsCellContent', () => {
	it('нет ключа: пусто', () => {
		expect(totalsCellContent(plain, {})).toBe('');
	});

	it('значение undefined равно отсутствию ключа и aggregate не вызывает', () => {
		let calls = 0;
		const column: GridColumn<unknown> = {
			...plain,
			aggregate: () => {
				calls += 1;
				return 'x';
			}
		};
		expect(totalsCellContent(column, { sum: undefined })).toBe('');
		expect(calls).toBe(0);
	});

	it('без aggregate значение форматируется как текст ячейки', () => {
		expect(totalsCellContent(plain, { sum: 1250 })).toBe('1250');
		expect(totalsCellContent(plain, { sum: { a: 1 } })).toBe('');
	});

	it('с aggregate значение отдаётся функции', () => {
		const column: GridColumn<unknown> = { ...plain, aggregate: (value) => `${String(value)} ₽` };
		expect(totalsCellContent(column, { sum: 5 })).toBe('5 ₽');
	});

	it('унаследованные ключи объекта не считаются значениями', () => {
		const column: GridColumn<unknown> = { ...plain, id: 'constructor' };
		expect(totalsCellContent(column, {})).toBe('');
	});
});
```

- [ ] **Step 3: Прогнать, убедиться что падает**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/grid/build-totals-rows.test.ts src/components/grid/totals-cell-content.test.ts`
Expected: FAIL (модули не найдены).

- [ ] **Step 4: Реализация**

`build-totals-rows.ts`:
```ts
import type { GridTotalsLabels } from './grid-totals-labels';
import type { TotalsRow } from './totals-row';

type Totals = Readonly<Record<string, unknown>> | undefined;

/** Строки итогов в порядке «страница, выборка»; строка есть, только если передан её источник, недостающее не подставляется. */
export function buildTotalsRows(pageTotals: Totals, totals: Totals, labels: GridTotalsLabels): readonly TotalsRow[] {
	const rows: TotalsRow[] = [];
	if (pageTotals !== undefined) {
		rows.push({ kind: 'page', label: labels.page, values: pageTotals });
	}
	if (totals !== undefined) {
		rows.push({ kind: 'all', label: labels.all, values: totals });
	}
	return rows;
}
```
`totals-cell-content.ts`:
```ts
import type { JSX } from 'solid-js';

import { formatCellValue } from './format-cell-value';
import type { GridColumn } from './grid-column';

/** Содержимое ячейки итога: пусто без значения, иначе `aggregate` колонки или текст ячейки по умолчанию. */
export function totalsCellContent(column: GridColumn<unknown>, values: Readonly<Record<string, unknown>>): JSX.Element {
	// hasOwn: колонка с id вроде `constructor` не должна читать унаследованные ключи
	if (!Object.hasOwn(values, column.id)) {
		return '';
	}
	const value = values[column.id];
	if (value === undefined) {
		return '';
	}
	return column.aggregate === undefined ? formatCellValue(value) : column.aggregate(value);
}
```

- [ ] **Step 5: Тесты зелёные**

Run та же команда. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/grid
git commit -m "feat(grid): типы и чистые функции автосумм" -m "$T"
```

---

### Task 2: tfoot, интеграция в Grid, стили

**Files:**
- Create: `src/components/grid/grid-totals.tsx`, `grid-totals-row.tsx`
- Modify: `grid-props.ts`, `grid-context.ts`, `grid.tsx`, `grid-table.tsx`, `grid.module.css`, `index.ts`, `grid.test.tsx`

**Interfaces:**
- Consumes: `buildTotalsRows`, `totalsCellContent`, `DEFAULT_TOTALS_LABELS`, `TotalsRow`.
- Produces: пропсы `pageTotals`, `totals`, `totalsLabels`; контекст `totalsRows: Accessor<readonly TotalsRow[]>`.

- [ ] **Step 1: Падающие тесты** — в конец `grid.test.tsx` describe «Grid: автосуммы» (код в Step 1 реализации: тесты пишутся по списку критериев а)–е) спека, раздел 7: нет `tfoot` без пропсов; одна и две строки и их порядок; `totalsLabels`; `aggregate` и формат по умолчанию; пустая ячейка; первая колонка несёт подпись и игнорирует свой итог; скрытая колонка; `{}`; `loading` с заглушками; `aria-rowcount` и `aria-rowindex`; клик по итогам не выбирает строки; реактивность при смене `pageTotals`; пустая закреплённая ячейка колонки чекбоксов).

- [ ] **Step 2: Прогнать — падает**

Run: `… pnpm exec vitest run src/components/grid/grid.test.tsx -t "автосуммы"`

- [ ] **Step 3: Пропсы, контекст, Grid, таблица**

`grid-props.ts` (после `columnMenuLabels`):
```ts
	/** Итоги страницы от сервера по id колонки; строка «Итого на странице» есть, только если проп передан. */
	pageTotals?: Readonly<Record<string, unknown>> | undefined;
	/** Итоги по всей выборке от сервера по id колонки; строка «Итого по выборке» есть, только если проп передан. */
	totals?: Readonly<Record<string, unknown>> | undefined;
	totalsLabels?: Partial<GridTotalsLabels> | undefined;
```
`grid-context.ts`: `totalsRows: Accessor<readonly TotalsRow[]>;` с комментарием.
`grid.tsx`: мемо `totalsRows`, высота итогов `totalsHeight = createMemo(() => totalsRows().length * (scroller() === undefined ? 0 : readControlHeight(scroller())))`, `scrollPaddingEnd: totalsHeight` в `windowOptions`, стиль скроллера `'scroll-padding-block-end': `${totalsHeight()}px``, в контекст `totalsRows`.
`grid-table.tsx`: `aria-rowcount={grid.rows().length + 1 + grid.totalsRows().length}`, `<GridTotals/>` после `<GridBody/>`.

- [ ] **Step 4: Компоненты**

`grid-totals.tsx`:
```tsx
import { For, type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridTotalsRow } from './grid-totals-row';

/** Итоги внутри той же таблицы: колонки совпадают с телом и едут вместе с ним при горизонтальной прокрутке. */
export function GridTotals(): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.totalsRows().length > 0}>
			<tfoot>
				<For each={grid.totalsRows()}>
					{(row, index) => <GridTotalsRow row={row} index={index()} count={grid.totalsRows().length}/>}
				</For>
			</tfoot>
		</Show>
	);
}
```
`grid-totals-row.tsx`: `tr` с `aria-rowindex={grid.rows().length + 2 + props.index}`; пустая закреплённая ячейка колонки чекбоксов (если `selectable`); для каждой колонки: индекс 0 → `th scope='row'` с подписью и `title`, остальные → `td` с `totalsCellContent` или (при `loading`) `<span class=skeleton-bar aria-hidden/>`. Атрибуты ячеек: `data-sticky` (`column.locked === true`), `data-sticky-last`, `data-align`, `data-stacked` (строка не последняя: смещение `inset-block-end` на строку), `data-first` (верхняя строка: сильная граница), `inset-inline-start` из `leftVar(index)`.

- [ ] **Step 5: Стили**

В `grid.module.css` после `.spacer`:
```css
/* ячейки итогов прилипают к низу скроллера: последняя строка у края, строка выше неё на высоту одной строки */
.totals-cell {
    position: sticky;
    z-index: var(--s-kit-grid-z-head);
    inset-block-end: 0;

    overflow: hidden;

    box-sizing: border-box;
    block-size: var(--s-kit-control-height, var(--s-kit-control-height-md));
    padding-block: 0;
    padding-inline: 10px;
    border-block-start: 1px solid var(--s-kit-color-hairline);
    border-inline-end: 1px solid var(--s-kit-color-hairline);

    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;

    background: var(--s-kit-grid-footer-bg, var(--s-kit-color-surface-2));

    &[data-first] {
        border-block-start-color: var(--s-kit-color-border-strong);
    }

    &[data-stacked] {
        inset-block-end: var(--s-kit-control-height, var(--s-kit-control-height-md));
    }

    &[data-sticky] {
        z-index: var(--s-kit-grid-z-corner);
    }

    &[data-sticky-last] {
        border-inline-end-color: var(--s-kit-color-border-strong);
    }

    &[data-align="end"] {
        text-align: end;
    }

    &[data-align="center"] {
        text-align: center;
    }
}

.totals-label {
    color: var(--s-kit-color-muted);
}
```
Колонка чекбоксов в итогах: класс `totals-cell select-cell` (`.select-cell` обнуляет padding и выравнивает по центру).

- [ ] **Step 6: Экспорт** — в `index.ts`: `export type { GridTotalsLabels } from './grid-totals-labels';`.

- [ ] **Step 7: Тесты зелёные, полная проверка**

Run: `… pnpm check` (код возврата отдельно). Expected: PASS, число тестов выросло.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat(grid): строки итогов pageTotals и totals в tfoot" -m "$T"
```

---

### Task 3: Playground и автопроверки

**Files:**
- Modify: `playground/src/demo-grid.tsx`, `playground/src/grid-page.tsx`
- Create: `playground/src/totals-checks.ts`

- [ ] **Step 1:** В демо чекбоксы `data-grid-page-totals` («Итоги страницы») и `data-grid-all-totals` («Итоги по выборке»); сервер-заглушка считает суммы `amount` и `score` и число строк: итог выборки по `sorted()` (все строки до фильтра), итог страницы по `rows()`; колонка `amount` получает `aggregate` (формат с разделителями тысяч и «₽»), колонка `score` без `aggregate`. Первая колонка демо `Номер`: подпись.
- [ ] **Step 2:** `totals-checks.ts`: `runTotalsChecks(page)` проверяет критерии а), б), в), е), д) (заглушки при `loading`), переключая чекбоксы демо и возвращая их состояние.
- [ ] **Step 3:** `grid-page.tsx` запускает `runTotalsChecks`.
- [ ] **Step 4:** `pnpm check` зелёный, коммит `feat(playground): итоги в демо грида и автопроверки`.

---

### Task 4: Приёмка в Chrome и итоги

- [ ] **Step 1:** `pnpm --filter playground build`, временный сервер `python3 -m http.server 5188 --bind 127.0.0.1` из `playground/dist`.
- [ ] **Step 2:** Автопроверки зелёные; вручную: прилипание к низу при вертикальной прокрутке, закреп при горизонтальной, слои, `loading`, тёмная тема, прокрутка до последней строки (критерий ж).
- [ ] **Step 3:** Сервер убить по PID после проверки cwd, вкладки закрыть.
- [ ] **Step 4:** В спек добавить раздел «Итоги приёмки», `pnpm check` + `scripts/verify-package-form.sh HEAD`, коммит `docs(spec): итоги приёмки автосумм`.
