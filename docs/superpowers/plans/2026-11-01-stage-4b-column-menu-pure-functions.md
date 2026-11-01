# Меню колонки: чистые функции и типы — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Чистые функции состояния колонок (`toggleId`, `idsWithFlag`, `applyColumnState`, `visibleColumnIds`, `canHideColumn`) и типы подписей меню колонки.

**Architecture:** Каждая функция в своём файле в `src/components/grid/`, без DOM и Solid; проверяются таблицами. Типы подписей по образцу пейджера (`PagerLabels` + `DEFAULT_PAGER_LABELS`).

**Tech Stack:** TypeScript 5.9 strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), vitest 5.

**Spec:** `docs/superpowers/specs/2026-11-01-stage-4b-column-menu-design.md` (разделы 2.1, 3).

## Global Constraints

- Один класс, компонент или функция на файл, имена kebab-case; тесты рядом (`*.test.ts`).
- ESLint: табы, одинарные кавычки, длина строки до 140 (включая комментарии), без висящих комментариев в конце строки, `simple-import-sort`.
- Комментарии на русском, без лишнего: только неочевидное «почему».
- Исходные наборы и массивы не мутируются: функции возвращают новые значения; `applyColumnState` возвращает прежний объект колонки, если флаги не изменились (ссылочная стабильность нужна `For` и `sameItems` в Grid).
- Команды pnpm: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`; код возврата `pnpm check` проверять отдельно.
- Коммит с трейлерами:

```bash
T=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'
git commit -m "сообщение" -m "$T"
```

- Не пушить и не ставить теги без слова владельца.

---

### Task 1: toggleId, idsWithFlag, visibleColumnIds, canHideColumn

**Files:**
- Create: `src/components/grid/toggle-id.ts`, `toggle-id.test.ts`
- Create: `src/components/grid/ids-with-flag.ts`, `ids-with-flag.test.ts`
- Create: `src/components/grid/visible-column-ids.ts`, `visible-column-ids.test.ts`
- Create: `src/components/grid/can-hide-column.ts`, `can-hide-column.test.ts`

**Interfaces:**
- Produces: `toggleId(ids: ReadonlySet<string>, id: string): ReadonlySet<string>`; `idsWithFlag<T>(columns: readonly GridColumn<T>[], flag: 'hidden' | 'locked'): ReadonlySet<string>`; `visibleColumnIds<T>(columns: readonly GridColumn<T>[], hidden: ReadonlySet<string>): readonly string[]`; `canHideColumn<T>(columns: readonly GridColumn<T>[], hidden: ReadonlySet<string>, id: string): boolean`.

- [ ] **Step 1: Write the failing tests**

`src/components/grid/toggle-id.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { toggleId } from './toggle-id';

describe('toggleId', () => {
	it('добавляет отсутствующий id в новый набор и не трогает исходный', () => {
		const source: ReadonlySet<string> = new Set(['a']);
		const next = toggleId(source, 'b');
		expect([...next]).toEqual(['a', 'b']);
		expect(next).not.toBe(source);
		expect([...source]).toEqual(['a']);
	});

	it('убирает присутствующий id', () => {
		const source: ReadonlySet<string> = new Set(['a', 'b']);
		expect([...toggleId(source, 'a')]).toEqual(['b']);
		expect([...source]).toEqual(['a', 'b']);
	});

	it('работает с пустым набором', () => {
		expect([...toggleId(new Set(), 'x')]).toEqual(['x']);
	});
});
```

`src/components/grid/ids-with-flag.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { GridColumn } from './grid-column';
import { idsWithFlag } from './ids-with-flag';

function column(id: string, extra: Partial<GridColumn<unknown>> = {}): GridColumn<unknown> {
	return { id, title: id, value: () => null, ...extra };
}

describe('idsWithFlag', () => {
	const columns = [column('a', { hidden: true }), column('b', { locked: true }), column('c', { hidden: true, locked: true }), column('d')];

	it('hidden собирает id колонок с hidden: true', () => {
		expect([...idsWithFlag(columns, 'hidden')]).toEqual(['a', 'c']);
	});

	it('locked собирает id колонок с locked: true', () => {
		expect([...idsWithFlag(columns, 'locked')]).toEqual(['b', 'c']);
	});

	it('hidden: false и отсутствие поля не считаются', () => {
		expect(idsWithFlag([column('x', { hidden: false }), column('y')], 'hidden').size).toBe(0);
	});

	it('пустой список даёт пустой набор', () => {
		expect(idsWithFlag([], 'locked').size).toBe(0);
	});
});
```

`src/components/grid/visible-column-ids.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { GridColumn } from './grid-column';
import { visibleColumnIds } from './visible-column-ids';

function column(id: string): GridColumn<unknown> {
	return { id, title: id, value: () => null };
}

describe('visibleColumnIds', () => {
	const columns = [column('a'), column('b'), column('c')];

	it('возвращает id в порядке columns без скрытых', () => {
		expect(visibleColumnIds(columns, new Set(['b']))).toEqual(['a', 'c']);
	});

	it('без скрытых возвращает все', () => {
		expect(visibleColumnIds(columns, new Set())).toEqual(['a', 'b', 'c']);
	});

	it('неизвестный id в наборе игнорируется', () => {
		expect(visibleColumnIds(columns, new Set(['zzz']))).toEqual(['a', 'b', 'c']);
	});

	it('все скрыты — пустой список', () => {
		expect(visibleColumnIds(columns, new Set(['a', 'b', 'c']))).toEqual([]);
	});
});
```

`src/components/grid/can-hide-column.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { canHideColumn } from './can-hide-column';
import type { GridColumn } from './grid-column';

function column(id: string): GridColumn<unknown> {
	return { id, title: id, value: () => null };
}

describe('canHideColumn', () => {
	const columns = [column('a'), column('b'), column('c')];

	it('можно скрыть, когда видимых больше одной', () => {
		expect(canHideColumn(columns, new Set(), 'a')).toBe(true);
		expect(canHideColumn(columns, new Set(['c']), 'a')).toBe(true);
	});

	it('нельзя скрыть последнюю видимую', () => {
		expect(canHideColumn(columns, new Set(['b', 'c']), 'a')).toBe(false);
	});

	it('уже скрытую колонку можно переключать (показать) даже если видимых нет', () => {
		expect(canHideColumn(columns, new Set(['a', 'b', 'c']), 'a')).toBe(true);
		expect(canHideColumn(columns, new Set(['b', 'c']), 'b')).toBe(true);
	});

	it('единственная колонка списка не скрывается', () => {
		expect(canHideColumn([column('a')], new Set(), 'a')).toBe(false);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/grid/toggle-id.test.ts src/components/grid/ids-with-flag.test.ts src/components/grid/visible-column-ids.test.ts src/components/grid/can-hide-column.test.ts`
Expected: FAIL, модули не найдены.

- [ ] **Step 3: Write minimal implementation**

`src/components/grid/toggle-id.ts`:

```ts
/** Новый набор с добавленным или убранным id; исходный не меняется. */
export function toggleId(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
	const next = new Set(ids);

	if (!next.delete(id)) {
		next.add(id);
	}

	return next;
}
```

`src/components/grid/ids-with-flag.ts`:

```ts
import type { GridColumn } from './grid-column';

/** Начальные наборы скрытых и закреплённых колонок берутся из полей `hidden` и `locked`. */
export function idsWithFlag<T>(columns: readonly GridColumn<T>[], flag: 'hidden' | 'locked'): ReadonlySet<string> {
	return new Set(columns.filter((column) => column[flag] === true).map((column) => column.id));
}
```

`src/components/grid/visible-column-ids.ts`:

```ts
import type { GridColumn } from './grid-column';

/** Id нескрытых колонок в порядке `columns`. */
export function visibleColumnIds<T>(columns: readonly GridColumn<T>[], hidden: ReadonlySet<string>): readonly string[] {
	return columns.filter((column) => !hidden.has(column.id)).map((column) => column.id);
}
```

`src/components/grid/can-hide-column.ts`:

```ts
import type { GridColumn } from './grid-column';
import { visibleColumnIds } from './visible-column-ids';

/** Можно ли переключить видимость колонки: скрыть последнюю видимую нельзя, показать скрытую можно всегда. */
export function canHideColumn<T>(columns: readonly GridColumn<T>[], hidden: ReadonlySet<string>, id: string): boolean {
	const visible = visibleColumnIds(columns, hidden);

	return !(visible.length === 1 && visible[0] === id);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: та же команда. Expected: PASS (15 тестов).

- [ ] **Step 5: Commit**

```bash
git add src/components/grid/toggle-id.ts src/components/grid/toggle-id.test.ts src/components/grid/ids-with-flag.ts src/components/grid/ids-with-flag.test.ts src/components/grid/visible-column-ids.ts src/components/grid/visible-column-ids.test.ts src/components/grid/can-hide-column.ts src/components/grid/can-hide-column.test.ts
# затем коммит с трейлерами: feat(grid): чистые функции видимости колонок
```

---

### Task 2: applyColumnState и подписи меню

**Files:**
- Create: `src/components/grid/apply-column-state.ts`, `apply-column-state.test.ts`
- Create: `src/components/grid/grid-column-menu-labels.ts`, `src/components/grid/default-column-menu-labels.ts`

**Interfaces:**
- Consumes: `GridColumn<T>` из `grid-column.ts`.
- Produces: `applyColumnState<T>(columns: readonly GridColumn<T>[], hidden: ReadonlySet<string>, locked: ReadonlySet<string>): readonly GridColumn<T>[]`; `GridColumnMenuLabels`; `DEFAULT_COLUMN_MENU_LABELS`.

- [ ] **Step 1: Write the failing test**

`src/components/grid/apply-column-state.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { applyColumnState } from './apply-column-state';
import type { GridColumn } from './grid-column';

function column(id: string, extra: Partial<GridColumn<unknown>> = {}): GridColumn<unknown> {
	return { id, title: id, value: () => null, ...extra };
}

describe('applyColumnState', () => {
	it('выставляет hidden и locked по наборам, остальные поля и порядок сохраняет', () => {
		const source = [column('a', { width: 100 }), column('b'), column('c')];
		const result = applyColumnState(source, new Set(['b']), new Set(['c']));
		expect(result.map((item) => item.id)).toEqual(['a', 'b', 'c']);
		expect(result[0]?.width).toBe(100);
		expect(result[1]?.hidden).toBe(true);
		expect(result[2]?.locked).toBe(true);
	});

	it('колонку без изменений возвращает тем же объектом', () => {
		const first = column('a');
		const second = column('b', { hidden: true });
		const result = applyColumnState([first, second], new Set(['b']), new Set());
		expect(result[0]).toBe(first);
		expect(result[1]).toBe(second);
	});

	it('наборы перекрывают поля колонок в обе стороны', () => {
		const source = [column('a', { hidden: true, locked: true })];
		const [item] = applyColumnState(source, new Set(), new Set());
		expect(item?.hidden).toBe(false);
		expect(item?.locked).toBe(false);
	});

	it('не мутирует исходные колонки и массив', () => {
		const first = column('a');
		const source = [first];
		applyColumnState(source, new Set(['a']), new Set(['a']));
		expect(first.hidden).toBeUndefined();
		expect(first.locked).toBeUndefined();
		expect(source).toEqual([first]);
	});

	it('неизвестные id в наборах игнорируются', () => {
		const first = column('a');
		const [item] = applyColumnState([first], new Set(['nope']), new Set(['nope']));
		expect(item).toBe(first);
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/grid/apply-column-state.test.ts`
Expected: FAIL, модуль не найден.

- [ ] **Step 3: Implement**

`src/components/grid/apply-column-state.ts`:

```ts
import type { GridColumn } from './grid-column';

/**
 * Колонки с `hidden` и `locked`, выставленными по наборам грида. Колонка, чьи флаги уже совпадают, возвращается тем же объектом:
 * шапка и ячейки, привязанные к ссылке, не пересоздаются от чужих переключений.
 */
export function applyColumnState<T>(
	columns: readonly GridColumn<T>[],
	hidden: ReadonlySet<string>,
	locked: ReadonlySet<string>
): readonly GridColumn<T>[] {
	return columns.map((column) => {
		const isHidden = hidden.has(column.id);
		const isLocked = locked.has(column.id);

		if ((column.hidden === true) === isHidden && (column.locked === true) === isLocked) {
			return column;
		}

		return { ...column, hidden: isHidden, locked: isLocked };
	});
}
```

`src/components/grid/grid-column-menu-labels.ts`:

```ts
/** Тексты меню колонки; все переопределяются через `columnMenuLabels` грида. */
export interface GridColumnMenuLabels {
	/** Подпись кнопки меню в ячейке шапки: получает название колонки. */
	button: (title: string) => string;
	lock: string;
	unlock: string;
	/** Подпись группы переключателей видимости. */
	columns: string;
}
```

`src/components/grid/default-column-menu-labels.ts`:

```ts
import type { GridColumnMenuLabels } from './grid-column-menu-labels';

export const DEFAULT_COLUMN_MENU_LABELS: GridColumnMenuLabels = {
	button: (title) => `Меню колонки «${title}»`,
	lock: 'Закрепить',
	unlock: 'Открепить',
	columns: 'Колонки'
};
```

- [ ] **Step 4: Run to verify it passes**

Run: та же команда. Expected: PASS (5 тестов).

- [ ] **Step 5: Check and commit**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo "exit=$?"` — ожидается `exit=0`.

```bash
git add src/components/grid/apply-column-state.ts src/components/grid/apply-column-state.test.ts src/components/grid/grid-column-menu-labels.ts src/components/grid/default-column-menu-labels.ts
# коммит: feat(grid): applyColumnState и подписи меню колонки
```
