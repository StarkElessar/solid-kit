# solid-kit, этап 3, часть 1: окно рендера и чистые функции списка — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** без DOM-компонентов подготовить основание для ListBox, Select, Combobox, MultiSelect и грида: интерфейс «окна рендера» с двумя реализациями (виртуальная на TanStack и полная для `virtualized={false}`), тестовый адаптер геометрии для jsdom, чтение оценки высоты строки из токенов и семь чистых функций списка (разворот в плоские строки с группами, навигация без зацикливания, typeahead, начальная подсветка, фильтр, сохранение подсветки при смене данных).

**Архитектура:** `RenderWindow` это интерфейс (DIP, разделы 6 и 11.1 зонтичного): ListBox и грид зависят от него, а не от TanStack. `createVirtualWindow` оборачивает `createVirtualizer`, `createFullWindow` возвращает все строки и прокручивает через `scrollIntoView`. Чистые функции работают над плоским массивом `ListRow<T>` (`option` / `group` / `all`) и не знают ни о Solid, ни о DOM. Строка «Все» (`kind: 'all'`) получает ключ `allKey` (владелец, 2026-10-31: у «Все» принят ключ вроде `-1`).

**Стек:** как в этапах 1 и 2 (Solid 1.9.17, Vite 8, Vitest 5, jsdom 30), `@tanstack/solid-virtual` 3.13.50 (virtual-core 3.19.8).

**Спек:** `docs/superpowers/specs/2026-10-31-stage-3-lists-design.md` (разделы 3 и 4; раздел 1 для границ). Зонтичный: `2026-10-28-solid-kit-umbrella-design.md` (разделы 6, 6.1, 11, 11.1, 12).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги (тег `v0.4.0` ставится в конце этапа, часть 5), не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`).
- Один класс — один файл; kebab-case; именованные экспорты; один компонент на файл. Классов в этой части нет; функции и типы разложены по файлам, как указано в задачах.
- `exactOptionalPropertyTypes: true`: необязательные свойства в публичных типах пишутся `foo?: T | undefined`.
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140 с табами по 4, `solid/reactivity` как ошибка: передаваемые в хуки аксессоры оборачивать в стрелки), Stylelint здесь не нужен (CSS нет). Перед каждым коммитом `pnpm check` зелёный, код возврата проверяется отдельно, без цепочки `;`.
- Если `pnpm` зависает на прокси, запускать так: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm ...`.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Тест-хелперы (`*.test-helper.ts`) не импортируются из рабочего кода и не входят в `exports`.
- Начало плана: `git status` чистый, `pnpm check` зелёный (записать число тестов: на старте части 1 их 436).

---

### Task 1: Тип строки, `isRowAvailable`, `flattenRows`

**Files:**
- Create: `src/internal/list-box/list-row.ts`, `src/internal/list-box/is-row-available.ts`, `src/internal/list-box/is-row-available.test.ts`, `src/internal/list-box/flatten-rows.ts`, `src/internal/list-box/flatten-rows.test.ts`, `src/internal/list-box/rows.test-helper.ts`

**Interfaces:**
- Produces: `type ListKey = string | number`; `type ListRow<T> = ListOptionRow<T> | ListGroupRow | ListAllRow`; `isRowAvailable(row: ListRow<T> | undefined): boolean` (опция без `disabled` или строка «Все»); `flattenRows<T>(items: readonly T[], options: FlattenOptions<T>): readonly ListRow<T>[]`; `buildRows(spec: readonly string[]): ListRow<string>[]` (только для тестов).

- [ ] **Step 1: Типы и хелпер тестов**

`src/internal/list-box/list-row.ts`:

```ts
export type ListKey = string | number;

export interface ListOptionRow<T> {
	readonly kind: 'option';
	readonly key: ListKey;
	readonly item: T;
	readonly label: string;
	readonly disabled: boolean;
	/** Номер среди опций (заголовки и «Все» не считаются): основа `aria-posinset`. */
	readonly optionIndex: number;
	/** Номер группы, `-1` без `groupBy`. */
	readonly groupIndex: number;
}

export interface ListGroupRow {
	readonly kind: 'group';
	readonly key: string;
	readonly label: string;
	readonly groupIndex: number;
}

/** Строка «Все» MultiSelect: активируется как опция, в `optionIndex` не входит; подпись рисует разметка (`allLabel`). */
export interface ListAllRow {
	readonly kind: 'all';
	readonly key: ListKey;
}

export type ListRow<T> = ListOptionRow<T> | ListGroupRow | ListAllRow;
```

`src/internal/list-box/rows.test-helper.ts`:

```ts
import type { ListRow } from './list-row';

/** Только для тестов. `'#Имя'` заголовок группы, `'!Имя'` отключённая опция, `'=Имя'` строка «Все», иначе обычная опция; ключ равен подписи. */
export function buildRows(spec: readonly string[]): ListRow<string>[] {
	const rows: ListRow<string>[] = [];
	let optionIndex = 0;
	let groupIndex = -1;
	for (const entry of spec) {
		const marker = entry.slice(0, 1);
		if (marker === '#') {
			groupIndex++;
			rows.push({ kind: 'group', key: entry.slice(1), label: entry.slice(1), groupIndex });
		}
		else if (marker === '=') {
			rows.push({ kind: 'all', key: entry.slice(1) });
		}
		else {
			const disabled = marker === '!';
			const name = disabled ? entry.slice(1) : entry;
			rows.push({ kind: 'option', key: name, item: name, label: name, disabled, optionIndex: optionIndex++, groupIndex });
		}
	}
	return rows;
}
```

- [ ] **Step 2: Падающие тесты**

`src/internal/list-box/is-row-available.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { isRowAvailable } from './is-row-available';
import { buildRows } from './rows.test-helper';

describe('isRowAvailable', () => {
	const [group, option, disabled, all] = buildRows(['#Группа', 'A', '!B', '=Все']);

	it('опция и строка «Все» доступны', () => {
		expect(isRowAvailable(option)).toBe(true);
		expect(isRowAvailable(all)).toBe(true);
	});

	it('заголовок, отключённая опция и отсутствие строки недоступны', () => {
		expect(isRowAvailable(group)).toBe(false);
		expect(isRowAvailable(disabled)).toBe(false);
		expect(isRowAvailable(undefined)).toBe(false);
	});
});
```

`src/internal/list-box/flatten-rows.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { flattenRows } from './flatten-rows';

interface User {
	id: number;
	name: string;
	team: string;
	blocked?: boolean;
}

const users: User[] = [
	{ id: 1, name: 'Анна', team: 'Дизайн' },
	{ id: 2, name: 'Борис', team: 'Разработка' },
	{ id: 3, name: 'Вера', team: 'Дизайн', blocked: true },
	{ id: 4, name: 'Глеб', team: 'Разработка' }
];
const base = { getKey: (user: User) => user.id, getLabel: (user: User) => user.name };

describe('flattenRows', () => {
	it('без groupBy: только опции с последовательным optionIndex и groupIndex -1', () => {
		const rows = flattenRows(users, base);
		expect(rows.map((row) => row.kind)).toEqual(['option', 'option', 'option', 'option']);
		expect(rows.map((row) => (row.kind === 'option' ? row.optionIndex : null))).toEqual([0, 1, 2, 3]);
		expect(rows.map((row) => (row.kind === 'option' ? row.groupIndex : null))).toEqual([-1, -1, -1, -1]);
	});

	it('опция несёт ключ, подпись, элемент и признак отключения', () => {
		const rows = flattenRows(users, { ...base, isItemDisabled: (user) => user.blocked === true });
		expect(rows[2]).toEqual({ kind: 'option', key: 3, item: users[2], label: 'Вера', disabled: true, optionIndex: 2, groupIndex: -1 });
		expect(rows[0]).toMatchObject({ disabled: false });
	});

	it('groupBy: группы в порядке первого появления, внутри группы исходный порядок, заголовок перед опциями', () => {
		const rows = flattenRows(users, { ...base, groupBy: (user) => user.team });
		expect(rows.map((row) => (row.kind === 'group' ? `#${row.label}` : row.kind === 'option' ? row.label : '?'))).toEqual([
			'#Дизайн', 'Анна', 'Вера', '#Разработка', 'Борис', 'Глеб'
		]);
	});

	it('groupBy: optionIndex сквозной после перегруппировки, groupIndex равен номеру группы', () => {
		const rows = flattenRows(users, { ...base, groupBy: (user) => user.team });
		expect(rows.map((row) => (row.kind === 'option' ? row.optionIndex : -1))).toEqual([-1, 0, 1, -1, 2, 3]);
		expect(rows.map((row) => row.kind === 'all' ? -2 : row.groupIndex)).toEqual([0, 0, 0, 1, 1, 1]);
		expect(rows[0]).toEqual({ kind: 'group', key: 'Дизайн', label: 'Дизайн', groupIndex: 0 });
	});

	it('пустой список даёт пустой результат, пустая группа заголовка не получает', () => {
		expect(flattenRows([], { ...base, groupBy: (user: User) => user.team })).toEqual([]);
		const rows = flattenRows([users[0] as User], { ...base, groupBy: (user) => user.team });
		expect(rows.map((row) => row.kind)).toEqual(['group', 'option']);
	});

	it('allKey добавляет первой строку «Все» вне optionIndex; без опций её нет', () => {
		const rows = flattenRows(users, { ...base, allKey: -1 });
		expect(rows[0]).toEqual({ kind: 'all', key: -1 });
		expect(rows[1]).toMatchObject({ kind: 'option', optionIndex: 0 });
		expect(rows).toHaveLength(5);
		expect(flattenRows([], { ...base, allKey: -1 })).toEqual([]);
	});

	it('allKey с groupBy: «Все» стоит перед первым заголовком', () => {
		const rows = flattenRows(users, { ...base, allKey: -1, groupBy: (user) => user.team });
		expect(rows.map((row) => row.kind)).toEqual(['all', 'group', 'option', 'option', 'group', 'option', 'option']);
	});

	it('getLabel вызывается один раз на элемент', () => {
		const getLabel = vi.fn((user: User) => user.name);
		flattenRows(users, { getKey: base.getKey, getLabel, groupBy: (user) => user.team });
		expect(getLabel).toHaveBeenCalledTimes(users.length);
	});
});
```

- [ ] **Step 3: Прогнать, убедиться, что падают**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/internal/list-box`
Expected: FAIL (`Cannot find module './is-row-available'` / `'./flatten-rows'`).

- [ ] **Step 4: Реализация**

`src/internal/list-box/is-row-available.ts`:

```ts
import type { ListRow } from './list-row';

/** Строка, на которую можно поставить подсветку: опция без `disabled` или строка «Все». */
export function isRowAvailable<T>(row: ListRow<T> | undefined): boolean {
	return row !== undefined && (row.kind === 'all' || (row.kind === 'option' && !row.disabled));
}
```

`src/internal/list-box/flatten-rows.ts`:

```ts
import type { ListKey, ListRow } from './list-row';

export interface FlattenOptions<T> {
	getKey: (item: T) => ListKey;
	getLabel: (item: T) => string;
	groupBy?: ((item: T) => string) | undefined;
	isItemDisabled?: ((item: T) => boolean) | undefined;
	/** Ключ строки «Все»: если задан и есть хотя бы одна опция, она идёт первой. Не должен совпадать с ключом опции. */
	allKey?: ListKey | undefined;
}

/**
 * Разворачивает элементы в плоский список строк: заголовки групп и опции. Группы идут в порядке первого появления значения `groupBy`,
 * внутри группы порядок исходный; заголовок пустой группы не создаётся. `getLabel` вызывается один раз на элемент.
 */
export function flattenRows<T>(items: readonly T[], options: FlattenOptions<T>): readonly ListRow<T>[] {
	if (items.length === 0) {
		return [];
	}
	const rows: ListRow<T>[] = [];
	if (options.allKey !== undefined) {
		rows.push({ kind: 'all', key: options.allKey });
	}
	let optionIndex = 0;
	const toOption = (item: T, groupIndex: number): ListRow<T> => ({
		kind: 'option',
		key: options.getKey(item),
		item,
		label: options.getLabel(item),
		disabled: options.isItemDisabled?.(item) ?? false,
		optionIndex: optionIndex++,
		groupIndex
	});

	const groupBy = options.groupBy;
	if (groupBy === undefined) {
		for (const item of items) {
			rows.push(toOption(item, -1));
		}
		return rows;
	}

	const groups = new Map<string, T[]>();
	for (const item of items) {
		const name = groupBy(item);
		const members = groups.get(name);
		if (members === undefined) {
			groups.set(name, [item]);
		}
		else {
			members.push(item);
		}
	}
	let groupIndex = 0;
	for (const [label, members] of groups) {
		rows.push({ kind: 'group', key: label, label, groupIndex });
		for (const member of members) {
			rows.push(toOption(member, groupIndex));
		}
		groupIndex++;
	}
	return rows;
}
```

- [ ] **Step 5: Тесты проходят**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/internal/list-box`
Expected: PASS.

- [ ] **Step 6: Коммит** (после `pnpm check`, см. Task 8: промежуточные коммиты делаются после зелёного `pnpm check`)

```bash
git add src/internal/list-box
git commit -m "feat(list-box): тип строки списка, isRowAvailable и flattenRows" -m "$TRAILERS"
```

---

### Task 2: `nextActiveIndex`

**Files:**
- Create: `src/internal/list-box/next-active-index.ts`, `src/internal/list-box/next-active-index.test.ts`

**Interfaces:**
- Consumes: `ListRow`, `isRowAvailable`, `buildRows` (Task 1).
- Produces: `type ActiveCommand = 'next' | 'previous' | 'first' | 'last' | 'next-page' | 'previous-page'`; `nextActiveIndex<T>(rows: readonly ListRow<T>[], current: number, command: ActiveCommand, pageSize: number): number` (индекс строки или `-1`).

- [ ] **Step 1: Падающий тест**

`src/internal/list-box/next-active-index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { nextActiveIndex } from './next-active-index';
import { buildRows } from './rows.test-helper';

// индексы: 0 #G1, 1 A, 2 !B, 3 C, 4 #G2, 5 D, 6 E
const rows = buildRows(['#G1', 'A', '!B', 'C', '#G2', 'D', 'E']);

describe('nextActiveIndex', () => {
	it('next пропускает отключённые и заголовки', () => {
		expect(nextActiveIndex(rows, 1, 'next', 5)).toBe(3);
		expect(nextActiveIndex(rows, 3, 'next', 5)).toBe(5);
	});

	it('previous пропускает отключённые и заголовки', () => {
		expect(nextActiveIndex(rows, 5, 'previous', 5)).toBe(3);
		expect(nextActiveIndex(rows, 3, 'previous', 5)).toBe(1);
	});

	it('без зацикливания: на краю остаётся на месте', () => {
		expect(nextActiveIndex(rows, 6, 'next', 5)).toBe(6);
		expect(nextActiveIndex(rows, 1, 'previous', 5)).toBe(1);
	});

	it('first и last берут крайние доступные строки', () => {
		expect(nextActiveIndex(rows, 3, 'first', 5)).toBe(1);
		expect(nextActiveIndex(rows, 3, 'last', 5)).toBe(6);
	});

	it('без текущей строки (-1): next и first дают первую доступную, previous и last последнюю', () => {
		expect(nextActiveIndex(rows, -1, 'next', 5)).toBe(1);
		expect(nextActiveIndex(rows, -1, 'first', 5)).toBe(1);
		expect(nextActiveIndex(rows, -1, 'previous', 5)).toBe(6);
		expect(nextActiveIndex(rows, -1, 'last', 5)).toBe(6);
		expect(nextActiveIndex(rows, -1, 'next-page', 5)).toBe(1);
		expect(nextActiveIndex(rows, -1, 'previous-page', 5)).toBe(6);
	});

	it('индекс за пределами списка считается отсутствием текущей строки', () => {
		expect(nextActiveIndex(rows, 99, 'next', 5)).toBe(1);
	});

	it('нет доступных строк: всегда -1', () => {
		const empty = buildRows(['#G', '!A']);
		for (const command of ['next', 'previous', 'first', 'last', 'next-page', 'previous-page'] as const) {
			expect(nextActiveIndex(empty, 0, command, 3)).toBe(-1);
		}
		expect(nextActiveIndex([], -1, 'next', 3)).toBe(-1);
	});

	it('next-page прыгает на pageSize строк вниз, на заголовке идёт к следующей доступной', () => {
		const long = buildRows(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
		expect(nextActiveIndex(long, 0, 'next-page', 3)).toBe(3);
		expect(nextActiveIndex(long, 3, 'next-page', 3)).toBe(6);
		expect(nextActiveIndex(rows, 1, 'next-page', 3)).toBe(5); // цель 4 это заголовок
	});

	it('next-page у конца идёт на последнюю доступную, на самой последней остаётся', () => {
		const long = buildRows(['A', 'B', 'C', 'D', 'E']);
		expect(nextActiveIndex(long, 3, 'next-page', 10)).toBe(4);
		expect(nextActiveIndex(long, 4, 'next-page', 10)).toBe(4);
	});

	it('previous-page прыгает на pageSize строк вверх, у начала идёт на первую доступную', () => {
		const long = buildRows(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
		expect(nextActiveIndex(long, 7, 'previous-page', 3)).toBe(4);
		expect(nextActiveIndex(long, 1, 'previous-page', 3)).toBe(0);
		expect(nextActiveIndex(long, 0, 'previous-page', 3)).toBe(0);
		expect(nextActiveIndex(rows, 5, 'previous-page', 1)).toBe(3); // цель 4 это заголовок, вверх до C
	});

	it('pageSize меньше 1 считается единицей', () => {
		const long = buildRows(['A', 'B', 'C']);
		expect(nextActiveIndex(long, 0, 'next-page', 0)).toBe(1);
	});

	it('строка «Все» доступна для навигации', () => {
		const withAll = buildRows(['=Все', 'A', 'B']);
		expect(nextActiveIndex(withAll, -1, 'first', 3)).toBe(0);
		expect(nextActiveIndex(withAll, 1, 'previous', 3)).toBe(0);
	});
});
```

- [ ] **Step 2: Прогнать, убедиться, что падает**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/internal/list-box/next-active-index.test.ts`
Expected: FAIL (`Cannot find module`).

- [ ] **Step 3: Реализация**

`src/internal/list-box/next-active-index.ts`:

```ts
import { isRowAvailable } from './is-row-available';
import type { ListRow } from './list-row';

export type ActiveCommand = 'next' | 'previous' | 'first' | 'last' | 'next-page' | 'previous-page';

/** Первая доступная строка с индексом не меньше `from`, иначе -1. */
function findForward<T>(rows: readonly ListRow<T>[], from: number): number {
	for (let index = Math.max(from, 0); index < rows.length; index++) {
		if (isRowAvailable(rows[index])) {
			return index;
		}
	}
	return -1;
}

/** Последняя доступная строка с индексом не больше `from`, иначе -1. */
function findBackward<T>(rows: readonly ListRow<T>[], from: number): number {
	for (let index = Math.min(from, rows.length - 1); index >= 0; index--) {
		if (isRowAvailable(rows[index])) {
			return index;
		}
	}
	return -1;
}

/**
 * Индекс строки, на которую ведёт команда, или -1, если доступных строк нет. Заголовки и отключённые опции пропускаются.
 * Без зацикливания: на краю остаётся `current`. Без текущей строки (`current` вне списка) `next`, `first` и `next-page`
 * дают первую доступную, остальные последнюю.
 */
export function nextActiveIndex<T>(rows: readonly ListRow<T>[], current: number, command: ActiveCommand, pageSize: number): number {
	const first = findForward(rows, 0);
	if (first === -1) {
		return -1;
	}
	const last = findBackward(rows, rows.length - 1);
	const hasCurrent = current >= 0 && current < rows.length;
	const page = Math.max(1, pageSize);

	switch (command) {
		case 'first':
			return first;
		case 'last':
			return last;
		case 'next': {
			if (!hasCurrent) {
				return first;
			}
			const found = findForward(rows, current + 1);
			return found === -1 ? current : found;
		}
		case 'previous': {
			if (!hasCurrent) {
				return last;
			}
			const found = findBackward(rows, current - 1);
			return found === -1 ? current : found;
		}
		case 'next-page': {
			if (!hasCurrent) {
				return first;
			}
			const target = Math.min(current + page, rows.length - 1);
			const ahead = findForward(rows, target);
			if (ahead > current) {
				return ahead;
			}
			const behind = findBackward(rows, target);
			return behind > current ? behind : current;
		}
		case 'previous-page': {
			if (!hasCurrent) {
				return last;
			}
			const target = Math.max(current - page, 0);
			const behind = findBackward(rows, target);
			if (behind !== -1 && behind < current) {
				return behind;
			}
			const ahead = findForward(rows, target);
			return ahead !== -1 && ahead < current ? ahead : current;
		}
	}
}
```

- [ ] **Step 4: Тесты проходят**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/internal/list-box/next-active-index.test.ts`
Expected: PASS. Если падает проверка `nextActiveIndex(rows, 5, 'previous-page', 1)`: цель 4 это заголовок, `findBackward(4)` даёт 3, это и ожидается.

- [ ] **Step 5: Коммит** (после `pnpm check`)

```bash
git add src/internal/list-box/next-active-index.ts src/internal/list-box/next-active-index.test.ts
git commit -m "feat(list-box): nextActiveIndex, навигация по строкам без зацикливания" -m "$TRAILERS"
```

---

### Task 3: `matchTypeahead`, `initialActiveIndex`, `resolveActiveKey`

**Files:**
- Create: `src/internal/list-box/match-typeahead.ts`, `src/internal/list-box/match-typeahead.test.ts`, `src/internal/list-box/initial-active-index.ts`, `src/internal/list-box/initial-active-index.test.ts`, `src/internal/list-box/resolve-active-key.ts`, `src/internal/list-box/resolve-active-key.test.ts`

**Interfaces:**
- Consumes: `ListRow`, `ListKey`, `isRowAvailable`, `buildRows`.
- Produces: `matchTypeahead<T>(rows, current: number, buffer: string): number` (-1 без совпадения); `initialActiveIndex<T>(rows, selectedKeys: readonly ListKey[]): number`; `resolveActiveKey<T>(rows, activeKey: ListKey | undefined): ListKey | undefined`.

- [ ] **Step 1: Падающие тесты**

`src/internal/list-box/match-typeahead.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { matchTypeahead } from './match-typeahead';
import { buildRows } from './rows.test-helper';

const rows = buildRows(['#Фрукты', 'Абрикос', 'Апельсин', '!Арбуз', 'Банан', 'Ананас', '=Все']);

describe('matchTypeahead', () => {
	it('первая доступная опция, подпись которой начинается с буфера, регистр не важен', () => {
		expect(matchTypeahead(rows, -1, 'б')).toBe(4);
		expect(matchTypeahead(rows, -1, 'БАН')).toBe(4);
	});

	it('поиск идёт от текущей строки включительно и по кругу', () => {
		expect(matchTypeahead(rows, 2, 'ап')).toBe(2);
		expect(matchTypeahead(rows, 3, 'аб')).toBe(1);
	});

	it('отключённые опции, заголовки и «Все» не находятся', () => {
		expect(matchTypeahead(rows, -1, 'арб')).toBe(-1);
		expect(matchTypeahead(rows, -1, 'фру')).toBe(-1);
		expect(matchTypeahead(rows, -1, 'вс')).toBe(-1);
	});

	it('пустой буфер и отсутствие совпадения дают -1', () => {
		expect(matchTypeahead(rows, 1, '')).toBe(-1);
		expect(matchTypeahead(rows, 1, 'я')).toBe(-1);
		expect(matchTypeahead([], -1, 'а')).toBe(-1);
	});

	it('повтор одной буквы идёт к следующей опции на эту букву, по кругу', () => {
		expect(matchTypeahead(rows, 1, 'аа')).toBe(2);
		expect(matchTypeahead(rows, 2, 'ааа')).toBe(5);
		expect(matchTypeahead(rows, 5, 'аа')).toBe(1);
	});

	it('повтор буквы при единственной подходящей опции остаётся на ней', () => {
		expect(matchTypeahead(rows, 4, 'бб')).toBe(4);
	});

	it('индекс вне списка начинает поиск с начала', () => {
		expect(matchTypeahead(rows, 99, 'а')).toBe(1);
	});
});
```

`src/internal/list-box/initial-active-index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { initialActiveIndex } from './initial-active-index';
import { buildRows } from './rows.test-helper';

const rows = buildRows(['#G', '!A', 'B', 'C', '=Все']);

describe('initialActiveIndex', () => {
	it('индекс первой выбранной доступной опции', () => {
		expect(initialActiveIndex(rows, ['C'])).toBe(3);
		expect(initialActiveIndex(rows, ['C', 'B'])).toBe(2);
	});

	it('без выбранного (или выбранное отсутствует) первая доступная', () => {
		expect(initialActiveIndex(rows, [])).toBe(2);
		expect(initialActiveIndex(rows, ['нет'])).toBe(2);
	});

	it('выбранная отключённая опция пропускается', () => {
		expect(initialActiveIndex(rows, ['A'])).toBe(2);
	});

	it('строка «Все» подсвечивается, если её ключ выбран', () => {
		expect(initialActiveIndex(rows, ['Все'])).toBe(4);
	});

	it('нет доступных строк: -1', () => {
		expect(initialActiveIndex(buildRows(['#G', '!A']), ['A'])).toBe(-1);
		expect(initialActiveIndex([], [])).toBe(-1);
	});
});
```

`src/internal/list-box/resolve-active-key.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { resolveActiveKey } from './resolve-active-key';
import { buildRows } from './rows.test-helper';

const rows = buildRows(['#G', '!A', 'B', 'C']);

describe('resolveActiveKey', () => {
	it('ключ остался среди доступных опций: подсветка сохраняется', () => {
		expect(resolveActiveKey(rows, 'C')).toBe('C');
	});

	it('ключ пропал, отключён или это заголовок: ключ первой доступной опции', () => {
		expect(resolveActiveKey(rows, 'X')).toBe('B');
		expect(resolveActiveKey(rows, 'A')).toBe('B');
		expect(resolveActiveKey(rows, 'G')).toBe('B');
	});

	it('без ключа: первая доступная', () => {
		expect(resolveActiveKey(rows, undefined)).toBe('B');
	});

	it('нет доступных строк: undefined', () => {
		expect(resolveActiveKey(buildRows(['#G', '!A']), 'A')).toBeUndefined();
		expect(resolveActiveKey([], 'A')).toBeUndefined();
	});

	it('числовой ключ не равен строковому', () => {
		const numeric = buildRows(['x']);
		expect(resolveActiveKey(numeric, 1)).toBe('x');
	});
});
```

- [ ] **Step 2: Прогнать, убедиться, что падают**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/internal/list-box`
Expected: FAIL (нет модулей).

- [ ] **Step 3: Реализация**

`src/internal/list-box/match-typeahead.ts`:

```ts
import type { ListRow } from './list-row';

/**
 * Индекс первой доступной опции, чья подпись начинается с накопленной строки `buffer` (регистр не учитывается), или -1.
 * Поиск идёт от `current` включительно и по кругу. Буфер из одной повторяющейся буквы («аа») ищет следующую опцию
 * на эту букву после `current`. «Все» и заголовки не участвуют. Накопление и сброс буфера делает вызывающий.
 */
export function matchTypeahead<T>(rows: readonly ListRow<T>[], current: number, buffer: string): number {
	if (buffer === '') {
		return -1;
	}
	const chars = [...buffer.toLocaleLowerCase()];
	const firstChar = chars[0] ?? '';
	const repeated = chars.length > 1 && chars.every((char) => char === firstChar);
	const prefix = repeated ? firstChar : chars.join('');
	const count = rows.length;
	const hasCurrent = current >= 0 && current < count;
	const start = hasCurrent ? current + (repeated ? 1 : 0) : 0;

	for (let offset = 0; offset < count; offset++) {
		const index = (start + offset) % count;
		const row = rows[index];
		if (row?.kind === 'option' && !row.disabled && row.label.toLocaleLowerCase().startsWith(prefix)) {
			return index;
		}
	}
	return -1;
}
```

`src/internal/list-box/initial-active-index.ts`:

```ts
import { isRowAvailable } from './is-row-available';
import type { ListKey, ListRow } from './list-row';

/** Индекс первой выбранной доступной строки, иначе первой доступной, иначе -1 (при открытии список прокручивается к выбранному). */
export function initialActiveIndex<T>(rows: readonly ListRow<T>[], selectedKeys: readonly ListKey[]): number {
	if (selectedKeys.length > 0) {
		const selected = new Set<ListKey>(selectedKeys);
		const index = rows.findIndex((row) => row.kind !== 'group' && isRowAvailable(row) && selected.has(row.key));
		if (index !== -1) {
			return index;
		}
	}
	return rows.findIndex((row) => isRowAvailable(row));
}
```

`src/internal/list-box/resolve-active-key.ts`:

```ts
import { isRowAvailable } from './is-row-available';
import type { ListKey, ListRow } from './list-row';

/**
 * После смены данных или запроса: ключ подсветки остаётся, если он среди доступных строк, иначе берётся ключ первой доступной.
 * `undefined`, если доступных строк нет.
 */
export function resolveActiveKey<T>(rows: readonly ListRow<T>[], activeKey: ListKey | undefined): ListKey | undefined {
	let firstKey: ListKey | undefined;
	for (const row of rows) {
		if (row.kind === 'group' || !isRowAvailable(row)) {
			continue;
		}
		if (row.key === activeKey) {
			return activeKey;
		}
		firstKey ??= row.key;
	}
	return firstKey;
}
```

- [ ] **Step 4: Тесты проходят**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/internal/list-box`
Expected: PASS.

- [ ] **Step 5: Коммит** (после `pnpm check`)

```bash
git add src/internal/list-box
git commit -m "feat(list-box): matchTypeahead, initialActiveIndex, resolveActiveKey" -m "$TRAILERS"
```

---

### Task 4: `filterItems`

**Files:**
- Create: `src/internal/list-box/filter-items.ts`, `src/internal/list-box/filter-items.test.ts`

**Interfaces:**
- Produces: `type ItemFilter<T> = (item: T, query: string) => boolean`; `filterItems<T>(items: readonly T[], query: string, filter: ItemFilter<T> | false | undefined, getLabel: (item: T) => string): readonly T[]`.

- [ ] **Step 1: Падающий тест**

`src/internal/list-box/filter-items.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { filterItems } from './filter-items';

const names = ['Анна', 'Борис', 'Вера', 'Аркадий'];
const label = (name: string) => name;

describe('filterItems', () => {
	it('по умолчанию: подпись содержит запрос без учёта регистра', () => {
		expect(filterItems(names, 'АР', undefined, label)).toEqual(['Аркадий']);
		expect(filterItems(names, 'а', undefined, label)).toEqual(['Анна', 'Вера', 'Аркадий']);
	});

	it('пустой запрос возвращает тот же массив', () => {
		expect(filterItems(names, '', undefined, label)).toBe(names);
	});

	it('filter === false отключает клиентский фильтр (внешний поиск)', () => {
		expect(filterItems(names, 'zzz', false, label)).toBe(names);
	});

	it('свой фильтр получает элемент и запрос; пустой запрос его не вызывает', () => {
		const custom = vi.fn((name: string, query: string) => name.startsWith(query));
		expect(filterItems(names, 'А', custom, label)).toEqual(['Анна', 'Аркадий']);
		expect(custom).toHaveBeenCalledWith('Анна', 'А');
		custom.mockClear();
		expect(filterItems(names, '', custom, label)).toBe(names);
		expect(custom).not.toHaveBeenCalled();
	});

	it('ничего не найдено: пустой массив', () => {
		expect(filterItems(names, 'щ', undefined, label)).toEqual([]);
	});
});
```

- [ ] **Step 2: Падает** — Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/internal/list-box/filter-items.test.ts` → FAIL.

- [ ] **Step 3: Реализация**

`src/internal/list-box/filter-items.ts`:

```ts
export type ItemFilter<T> = (item: T, query: string) => boolean;

/**
 * Strategy клиентского фильтра. Пустой запрос и `filter === false` (внешний поиск: список уже отфильтрован снаружи)
 * возвращают `items` как есть. По умолчанию подпись содержит запрос без учёта регистра.
 */
export function filterItems<T>(
	items: readonly T[],
	query: string,
	filter: ItemFilter<T> | false | undefined,
	getLabel: (item: T) => string
): readonly T[] {
	if (filter === false || query === '') {
		return items;
	}
	if (filter !== undefined) {
		return items.filter((item) => filter(item, query));
	}
	const needle = query.toLocaleLowerCase();
	return items.filter((item) => getLabel(item).toLocaleLowerCase().includes(needle));
}
```

- [ ] **Step 4: Проходит** — тот же запуск, Expected: PASS.

- [ ] **Step 5: Коммит** (после `pnpm check`)

```bash
git add src/internal/list-box/filter-items.ts src/internal/list-box/filter-items.test.ts
git commit -m "feat(list-box): filterItems со Strategy фильтра" -m "$TRAILERS"
```

---

### Task 5: Интерфейс `RenderWindow`, тестовый адаптер, `createFullWindow`

**Files:**
- Create: `src/utils/render-window.ts`, `src/utils/render-window.test-helper.ts`, `src/utils/render-window.test-helper.test.ts`, `src/utils/create-full-window.ts`, `src/utils/create-full-window.test.ts`

**Interfaces:**
- Produces:
  - `RenderWindowItem { index; start; size }`, `RenderWindow { items; totalSize; measure; scrollToIndex }`, `RenderWindowOptions { count; scroller; estimateSize; overscan; scrollPaddingStart?; initialHeight? }`, `ScrollAlign = 'auto' | 'start' | 'center' | 'end'` (все из `render-window.ts`).
  - `createFullWindow(options: RenderWindowOptions): RenderWindow`.
  - `createTestWindow(options: TestWindowOptions): TestWindow` (только для тестов): `TestWindow extends RenderWindow { scrollTo(offset: number): void; offset: Accessor<number>; calls: { index: number; align: ScrollAlign | undefined }[] }`.

- [ ] **Step 1: Интерфейс**

`src/utils/render-window.ts`:

```ts
import type { Accessor } from 'solid-js';

export type ScrollAlign = 'auto' | 'start' | 'center' | 'end';

export interface RenderWindowItem {
	/** Индекс строки в плоском списке. */
	readonly index: number;
	/** Смещение сверху, px (для отступов-spacer). */
	readonly start: number;
	readonly size: number;
}

/** Окно рендера: какие строки сейчас нужно показать. ListBox и грид зависят от этого интерфейса, а не от TanStack. */
export interface RenderWindow {
	items: Accessor<readonly RenderWindowItem[]>;
	totalSize: Accessor<number>;
	/** Ref строки; строке нужен атрибут `data-index`. */
	measure: (element: HTMLElement) => void;
	scrollToIndex: (index: number, options?: { align?: ScrollAlign }) => void;
}

export interface RenderWindowOptions {
	count: Accessor<number>;
	scroller: Accessor<HTMLElement | undefined>;
	/** Стартовая оценка высоты строки (раздел 6 зонтичного). */
	estimateSize: (index: number) => number;
	/** Сколько строк рендерить за пределами видимой области; по умолчанию у списков 6. */
	overscan: number;
	/** Высота липкого заголовка группы: учитывается при прокрутке к строке. */
	scrollPaddingStart?: Accessor<number> | undefined;
	/** Высота окна до первого измерения скроллера, px: первый кадр не рендерит пустой список. Полное окно игнорирует. */
	initialHeight?: Accessor<number> | undefined;
}
```

- [ ] **Step 2: Тест тестового адаптера**

`src/utils/render-window.test-helper.test.ts`:

```ts
import { createRoot, createSignal } from 'solid-js';
import { describe, expect, it } from 'vitest';

import { createTestWindow } from './render-window.test-helper';

function setup(count: number, extra: { size?: number; windowHeight?: number; overscan?: number } = {}) {
	return createRoot((dispose) => {
		const [get, set] = createSignal(count);
		const window = createTestWindow({ count: get, size: 20, windowHeight: 100, overscan: 0, ...extra });
		return { window, setCount: set, dispose };
	});
}

describe('createTestWindow', () => {
	it('показывает строки, попадающие в окно, и общую высоту', () => {
		const { window, dispose } = setup(1000);
		expect(window.items().map((item) => item.index)).toEqual([0, 1, 2, 3, 4]);
		expect(window.items()[2]).toEqual({ index: 2, start: 40, size: 20 });
		expect(window.totalSize()).toBe(20000);
		dispose();
	});

	it('overscan добавляет строки по краям, не выходя за пределы списка', () => {
		const { window, dispose } = setup(1000, { overscan: 2 });
		expect(window.items().map((item) => item.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
		window.scrollTo(200);
		expect(window.items()[0]?.index).toBe(8);
		dispose();
	});

	it('scrollTo сдвигает окно, смещение ограничено высотой списка', () => {
		const { window, dispose } = setup(10);
		window.scrollTo(60);
		expect(window.items().map((item) => item.index)).toEqual([3, 4, 5, 6, 7]);
		window.scrollTo(99999);
		expect(window.offset()).toBe(100);
		window.scrollTo(-5);
		expect(window.offset()).toBe(0);
		dispose();
	});

	it('scrollToIndex: auto не двигает видимую строку, выводит невидимую к ближнему краю', () => {
		const { window, dispose } = setup(100);
		window.scrollToIndex(2);
		expect(window.offset()).toBe(0);
		window.scrollToIndex(10);
		expect(window.offset()).toBe(120); // нижний край строки 10 = 220, окно 100
		window.scrollToIndex(1);
		expect(window.offset()).toBe(20);
		dispose();
	});

	it('scrollToIndex: start, center, end и журнал вызовов', () => {
		const { window, dispose } = setup(100);
		window.scrollToIndex(10, { align: 'start' });
		expect(window.offset()).toBe(200);
		window.scrollToIndex(10, { align: 'center' });
		expect(window.offset()).toBe(160);
		window.scrollToIndex(10, { align: 'end' });
		expect(window.offset()).toBe(120);
		expect(window.calls).toEqual([
			{ index: 10, align: 'start' },
			{ index: 10, align: 'center' },
			{ index: 10, align: 'end' }
		]);
		dispose();
	});

	it('реагирует на смену count; measure ничего не делает', () => {
		const { window, setCount, dispose } = setup(1000);
		setCount(3);
		expect(window.items().map((item) => item.index)).toEqual([0, 1, 2]);
		expect(window.totalSize()).toBe(60);
		expect(() => window.measure(document.createElement('div'))).not.toThrow();
		dispose();
	});
});
```

- [ ] **Step 3: Реализация тестового адаптера**

`src/utils/render-window.test-helper.ts`:

```ts
import { type Accessor, createMemo, createSignal } from 'solid-js';

import type { RenderWindow, RenderWindowItem, ScrollAlign } from './render-window';

export interface TestWindowOptions {
	count: Accessor<number>;
	/** Высота каждой строки, px; по умолчанию 20. */
	size?: number;
	/** Высота окна, px. */
	windowHeight: number;
	overscan?: number;
}

export interface TestWindow extends RenderWindow {
	offset: Accessor<number>;
	/** Ручная прокрутка: смещение ограничено высотой списка. */
	scrollTo: (offset: number) => void;
	/** Журнал вызовов `scrollToIndex`. */
	calls: { index: number; align: ScrollAlign | undefined }[];
}

/**
 * Только для тестов: окно рендера с известной геометрией. В jsdom нет раскладки, поэтому виртуализатор там ничего не покажет:
 * ListBox проверяется на этом адаптере. Реальную геометрию (переменные высоты, sticky) проверяет только браузер.
 */
export function createTestWindow(options: TestWindowOptions): TestWindow {
	const size = options.size ?? 20;
	const overscan = options.overscan ?? 0;
	const [offset, setOffset] = createSignal(0);
	const totalSize = createMemo(() => options.count() * size);
	const clamp = (value: number) => Math.min(Math.max(value, 0), Math.max(totalSize() - options.windowHeight, 0));
	const calls: TestWindow['calls'] = [];

	const items = createMemo<readonly RenderWindowItem[]>(() => {
		const count = options.count();
		if (count === 0) {
			return [];
		}
		const first = Math.max(Math.floor(offset() / size) - overscan, 0);
		const last = Math.min(Math.ceil((offset() + options.windowHeight) / size) - 1 + overscan, count - 1);
		const result: RenderWindowItem[] = [];
		for (let index = first; index <= last; index++) {
			result.push({ index, start: index * size, size });
		}
		return result;
	});

	return {
		items,
		totalSize,
		offset,
		calls,
		measure: () => undefined,
		scrollTo: (value) => setOffset(clamp(value)),
		scrollToIndex: (index, scrollOptions) => {
			const align = scrollOptions?.align;
			calls.push({ index, align });
			const start = index * size;
			const end = start + size;
			if (align === 'start') {
				setOffset(clamp(start));
			}
			else if (align === 'center') {
				setOffset(clamp(start - (options.windowHeight - size) / 2));
			}
			else if (align === 'end') {
				setOffset(clamp(end - options.windowHeight));
			}
			else if (start < offset()) {
				setOffset(clamp(start));
			}
			else if (end > offset() + options.windowHeight) {
				setOffset(clamp(end - options.windowHeight));
			}
		}
	};
}
```

Проверка в тесте: `scrollToIndex(10, center)`: start 200, `200 - (100-20)/2 = 160` — совпадает с ожиданием; `end`: 220-100 = 120.

- [ ] **Step 4: Тест полного окна**

`src/utils/create-full-window.test.ts`:

```ts
import { createRoot, createSignal } from 'solid-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFullWindow } from './create-full-window';

function setup(count: number, scrollPaddingStart?: number) {
	return createRoot((dispose) => {
		const scroller = document.createElement('div');
		for (let index = 0; index < 5; index++) {
			const row = document.createElement('div');
			row.dataset['index'] = String(index);
			scroller.append(row);
		}
		const [get, set] = createSignal(count);
		const window = createFullWindow({
			count: get,
			scroller: () => scroller,
			estimateSize: () => 30,
			overscan: 6,
			...(scrollPaddingStart === undefined ? {} : { scrollPaddingStart: () => scrollPaddingStart })
		});
		return { window, scroller, setCount: set, dispose };
	});
}

describe('createFullWindow', () => {
	let scrollIntoView: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		scrollIntoView = vi.fn();
		Element.prototype.scrollIntoView = scrollIntoView as unknown as Element['scrollIntoView'];
	});

	it('items содержит все строки с накопленным смещением, totalSize это их сумма', () => {
		const { window, dispose } = setup(4);
		expect(window.items()).toEqual([
			{ index: 0, start: 0, size: 30 },
			{ index: 1, start: 30, size: 30 },
			{ index: 2, start: 60, size: 30 },
			{ index: 3, start: 90, size: 30 }
		]);
		expect(window.totalSize()).toBe(120);
		dispose();
	});

	it('реагирует на смену count', () => {
		const { window, setCount, dispose } = setup(4);
		setCount(2);
		expect(window.items()).toHaveLength(2);
		expect(window.totalSize()).toBe(60);
		dispose();
	});

	it('measure ничего не делает', () => {
		const { window, dispose } = setup(1);
		expect(() => window.measure(document.createElement('div'))).not.toThrow();
		dispose();
	});

	it('scrollToIndex ближайшим краем (auto) через scrollIntoView строки с data-index', () => {
		const { window, scroller, dispose } = setup(5);
		window.scrollToIndex(3);
		expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'nearest' });
		expect(scrollIntoView.mock.contexts[0]).toBe(scroller.querySelector('[data-index="3"]'));
		dispose();
	});

	it('align start, center, end переводятся в block', () => {
		const { window, dispose } = setup(5);
		window.scrollToIndex(1, { align: 'start' });
		window.scrollToIndex(1, { align: 'center' });
		window.scrollToIndex(1, { align: 'end' });
		expect(scrollIntoView.mock.calls.map(([arg]) => arg)).toEqual([{ block: 'start' }, { block: 'center' }, { block: 'end' }]);
		dispose();
	});

	it('scrollPaddingStart записывается в scroll-padding-top скроллера перед прокруткой', () => {
		const { window, scroller, dispose } = setup(5, 28);
		window.scrollToIndex(2);
		expect(scroller.style.scrollPaddingTop).toBe('28px');
		dispose();
	});

	it('нет строки или скроллера: ничего не происходит', () => {
		const { window, dispose } = setup(5);
		window.scrollToIndex(99);
		expect(scrollIntoView).not.toHaveBeenCalled();
		dispose();
	});
});
```

- [ ] **Step 5: Реализация**

`src/utils/create-full-window.ts`:

```ts
import { createMemo } from 'solid-js';

import type { RenderWindow, RenderWindowItem, RenderWindowOptions, ScrollAlign } from './render-window';

const BLOCK: Record<ScrollAlign, ScrollLogicalPosition> = {
	auto: 'nearest',
	start: 'start',
	center: 'center',
	end: 'end'
};

/**
 * Окно рендера без виртуализации (`virtualized={false}`): `items()` это все строки, измерять нечего. Прокрутка идёт через
 * `scrollIntoView` строки с `data-index`; высота липкого заголовка попадает в `scroll-padding-top` скроллера.
 */
export function createFullWindow(options: RenderWindowOptions): RenderWindow {
	const items = createMemo<readonly RenderWindowItem[]>(() => {
		const result: RenderWindowItem[] = [];
		let start = 0;
		for (let index = 0; index < options.count(); index++) {
			const size = options.estimateSize(index);
			result.push({ index, start, size });
			start += size;
		}
		return result;
	});
	const totalSize = createMemo(() => {
		const all = items();
		const last = all[all.length - 1];
		return last === undefined ? 0 : last.start + last.size;
	});

	return {
		items,
		totalSize,
		measure: () => undefined,
		scrollToIndex: (index, scrollOptions) => {
			const scroller = options.scroller();
			const row = scroller?.querySelector<HTMLElement>(`[data-index="${index}"]`);
			if (scroller === undefined || row === null || row === undefined) {
				return;
			}
			scroller.style.scrollPaddingTop = `${options.scrollPaddingStart?.() ?? 0}px`;
			row.scrollIntoView({ block: BLOCK[scrollOptions?.align ?? 'auto'] });
		}
	};
}
```

- [ ] **Step 6: Тесты проходят** — Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/utils/render-window.test-helper.test.ts src/utils/create-full-window.test.ts` → PASS.

- [ ] **Step 7: Коммит** (после `pnpm check`)

```bash
git add src/utils
git commit -m "feat(utils): интерфейс RenderWindow, тестовый адаптер и createFullWindow" -m "$TRAILERS"
```

---

### Task 6: `createVirtualWindow`

**Files:**
- Create: `src/utils/create-virtual-window.ts`, `src/utils/create-virtual-window.test.tsx`

**Interfaces:**
- Consumes: `RenderWindow`, `RenderWindowOptions` (Task 5), `createVirtualizer` из `@tanstack/solid-virtual`.
- Produces: `createVirtualWindow(options: RenderWindowOptions): RenderWindow`.

- [ ] **Step 1: Падающий тест**

В jsdom нет раскладки: виртуализатору высоту окна даёт `clientHeight` скроллера, его подменяем через `Object.defineProperty`. Проверяется то, что от раскладки не зависит: число строк в окне, смена `count` и скроллера, `initialHeight`, `scrollPaddingStart`, прокрутка.

`src/utils/create-virtual-window.test.tsx`:

```tsx
import { createRoot, createSignal } from 'solid-js';
import { describe, expect, it } from 'vitest';

import { createVirtualWindow } from './create-virtual-window';

function makeScroller(height: number): HTMLElement {
	const scroller = document.createElement('div');
	Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: height });
	Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 200 });
	document.body.append(scroller);
	return scroller;
}

describe('createVirtualWindow', () => {
	it('рендерит строки видимой области плюс overscan и считает общую высоту', () => {
		createRoot((dispose) => {
			const scroller = makeScroller(100);
			const window = createVirtualWindow({ count: () => 1000, scroller: () => scroller, estimateSize: () => 20, overscan: 2 });
			expect(window.items().map((item) => item.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
			expect(window.items()[1]).toMatchObject({ index: 1, start: 20, size: 20 });
			expect(window.totalSize()).toBe(20000);
			dispose();
		});
		document.body.replaceChildren();
	});

	it('реагирует на смену count', () => {
		createRoot((dispose) => {
			const scroller = makeScroller(100);
			const [count, setCount] = createSignal(1000);
			const window = createVirtualWindow({ count, scroller: () => scroller, estimateSize: () => 20, overscan: 2 });
			setCount(3);
			expect(window.items().map((item) => item.index)).toEqual([0, 1, 2]);
			expect(window.totalSize()).toBe(60);
			dispose();
		});
		document.body.replaceChildren();
	});

	it('пока скроллера нет, окно строится по initialHeight; со скроллером переходит на его высоту', () => {
		createRoot((dispose) => {
			const [scroller, setScroller] = createSignal<HTMLElement | undefined>(undefined);
			const window = createVirtualWindow({
				count: () => 1000,
				scroller,
				estimateSize: () => 20,
				overscan: 0,
				initialHeight: () => 60
			});
			expect(window.items().map((item) => item.index)).toEqual([0, 1, 2]);
			setScroller(makeScroller(100));
			expect(window.items()).toHaveLength(5);
			dispose();
		});
		document.body.replaceChildren();
	});

	it('scrollToIndex передаёт выравнивание виртуализатору', () => {
		createRoot((dispose) => {
			const scroller = makeScroller(100);
			const window = createVirtualWindow({ count: () => 1000, scroller: () => scroller, estimateSize: () => 20, overscan: 0 });
			window.scrollToIndex(50, { align: 'start' });
			expect(scroller.scrollTop).toBe(1000);
			dispose();
		});
		document.body.replaceChildren();
	});

	it('scrollPaddingStart сдвигает выравнивание start на высоту липкого заголовка', () => {
		createRoot((dispose) => {
			const scroller = makeScroller(100);
			const window = createVirtualWindow({
				count: () => 1000,
				scroller: () => scroller,
				estimateSize: () => 20,
				overscan: 0,
				scrollPaddingStart: () => 28
			});
			window.scrollToIndex(50, { align: 'start' });
			expect(scroller.scrollTop).toBe(972);
			dispose();
		});
		document.body.replaceChildren();
	});
});
```

- [ ] **Step 2: Падает** — Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/utils/create-virtual-window.test.tsx` → FAIL (нет модуля).

- [ ] **Step 3: Реализация**

`src/utils/create-virtual-window.ts`:

```ts
import { createVirtualizer } from '@tanstack/solid-virtual';

import type { RenderWindow, RenderWindowOptions } from './render-window';

/**
 * Окно рендера на TanStack Virtual. Опции передаются геттерами, поэтому смена `count`, скроллера, `scrollPaddingStart`
 * и `initialHeight` подхватывается реактивно. Пункты рендерятся в обычном потоке между двумя spacer-элементами
 * (раздел 6 зонтичного); строкам нужен `data-index` и `ref={window.measure}` для точных высот.
 */
export function createVirtualWindow(options: RenderWindowOptions): RenderWindow {
	const virtualizer = createVirtualizer<HTMLElement, HTMLElement>({
		get count() {
			return options.count();
		},
		getScrollElement: () => options.scroller() ?? null,
		estimateSize: (index) => options.estimateSize(index),
		get overscan() {
			return options.overscan;
		},
		get scrollPaddingStart() {
			return options.scrollPaddingStart?.() ?? 0;
		},
		get initialRect() {
			return { width: 0, height: options.initialHeight?.() ?? 0 };
		}
	});

	return {
		items: () => virtualizer.getVirtualItems(),
		totalSize: () => virtualizer.getTotalSize(),
		measure: (element) => virtualizer.measureElement(element),
		scrollToIndex: (index, scrollOptions) => {
			virtualizer.scrollToIndex(index, scrollOptions?.align === undefined ? undefined : { align: scrollOptions.align });
		}
	};
}
```

- [ ] **Step 4: Прогнать, разобрать расхождения**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/utils/create-virtual-window.test.tsx`
Expected: PASS. Если расхождение (например, `initialRect` не действует без скроллера, или `scrollTop` в jsdom не меняется, потому что `scrollTo` в jsdom заглушён), не подгонять тест вслепую: выяснить по исходнику `virtual-core` причину, зафиксировать в комментарии теста, а проверку, зависящую от настоящей раскладки, перенести в список «проверяет только браузер» (спек, раздел 13). `scrollTo` элемента в jsdom не реализован: при необходимости подменить `scroller.scrollTo = ({ top }) => { scroller.scrollTop = top; }` в `makeScroller`.

- [ ] **Step 5: Коммит** (после `pnpm check`)

```bash
git add src/utils/create-virtual-window.ts src/utils/create-virtual-window.test.tsx
git commit -m "feat(utils): createVirtualWindow на TanStack Virtual" -m "$TRAILERS"
```

---

### Task 7: `readControlHeight`

**Files:**
- Create: `src/utils/read-control-height.ts`, `src/utils/read-control-height.test.ts`

**Interfaces:**
- Produces: `readControlHeight(element: Element): number`: вычисленное `--s-kit-control-height` на элементе, иначе `--s-kit-control-height-md`, иначе 32 (раздел 5 зонтичного). Токены заданы в px. Читается один раз при открытии списка, не на каждую строку.

- [ ] **Step 1: Падающий тест**

`src/utils/read-control-height.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { readControlHeight } from './read-control-height';

function makeElement(properties: Record<string, string>): HTMLElement {
	const element = document.createElement('div');
	for (const [name, value] of Object.entries(properties)) {
		element.style.setProperty(name, value);
	}
	document.body.append(element);
	return element;
}

describe('readControlHeight', () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it('берёт --s-kit-control-height', () => {
		expect(readControlHeight(makeElement({ '--s-kit-control-height': '40px' }))).toBe(40);
	});

	it('без него берёт --s-kit-control-height-md', () => {
		expect(readControlHeight(makeElement({ '--s-kit-control-height-md': '36px' }))).toBe(36);
	});

	it('--s-kit-control-height важнее -md', () => {
		expect(readControlHeight(makeElement({ '--s-kit-control-height': '28px', '--s-kit-control-height-md': '36px' }))).toBe(28);
	});

	it('без токенов или с мусором в значении: 32', () => {
		expect(readControlHeight(makeElement({}))).toBe(32);
		expect(readControlHeight(makeElement({ '--s-kit-control-height': 'auto' }))).toBe(32);
	});

	it('наследует значение от предка', () => {
		const parent = makeElement({ '--s-kit-control-height': '40px' });
		const child = document.createElement('div');
		parent.append(child);
		expect(readControlHeight(child)).toBe(40);
	});
});
```

- [ ] **Step 2: Падает, затем реализация**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/utils/read-control-height.test.ts` → FAIL.

`src/utils/read-control-height.ts`:

```ts
const FALLBACK_HEIGHT = 32;
const TOKENS = ['--s-kit-control-height', '--s-kit-control-height-md'] as const;

/**
 * Оценка высоты строки списка: вычисленный `--s-kit-control-height` на элементе (размер контрола), иначе
 * `--s-kit-control-height-md`, иначе 32. Токены заданы в px. Читается один раз при открытии, а не на каждую строку.
 */
export function readControlHeight(element: Element): number {
	const style = getComputedStyle(element);
	for (const token of TOKENS) {
		const value = Number.parseFloat(style.getPropertyValue(token));
		if (Number.isFinite(value) && value > 0) {
			return value;
		}
	}
	return FALLBACK_HEIGHT;
}
```

- [ ] **Step 3: Проходит** — Expected: PASS. Если jsdom не отдаёт унаследованные или inline-пользовательские свойства через `getComputedStyle`, заменить способ задания в тесте на `<style>` в `document.head` (с очисткой в `afterEach`); код функции остаётся.

- [ ] **Step 4: Коммит** (после `pnpm check`)

```bash
git add src/utils/read-control-height.ts src/utils/read-control-height.test.ts
git commit -m "feat(utils): readControlHeight для оценки высоты строки списка" -m "$TRAILERS"
```

---

### Task 8: Правки спека, итоговая проверка, коммит

**Files:**
- Modify: `docs/superpowers/specs/2026-10-31-stage-3-lists-design.md` (разделы 1, 4, 8, 12, 13)

- [ ] **Step 1: Зафиксировать решения владельца (2026-10-31) в спеке.**
  - Статус и раздел 1: спек согласован владельцем, ответы на вопросы раздела 12 внесены; в таблице частей у части 1 указать план `docs/superpowers/plans/2026-10-31-stage-3-render-window-and-list-functions.md`.
  - Раздел 4: `ListRow` для `all` это `{ kind: 'all'; key: ListKey }` (подпись рисует разметка, `allLabel`); в `FlattenOptions` добавлено `allKey?`; добавлено `isRowAvailable`; `RenderWindowOptions` в разделе 3 дополнен `initialHeight?`, добавлены `ScrollAlign` и `readControlHeight`.
  - Раздел 8: у «Все» принят ключ `allKey` (например `-1`); пропы `allKey` и `allLabel`; семантика значения (массив элементов с перечислением или специальный ключ в `value`) уточняется в плане части 4.
  - Раздел 12: ответы владельца: 1 (группы по условию через `groupBy` с заголовком и опциями и виртуализация нужны; компонентов `Select.Option`/`Select.Group` нет, группы задаются данными), 2 (MultiSelect отдельным компонентом), 3 (пустой текст сбрасывает значение), 4 (без зацикливания, принято), 7 (ключ «Все» вида `-1`).
  - Раздел 13: «`scrollToIndex` учитывает `scrollPaddingStart`» теперь проверено по исходнику `virtual-core` 3.19.8 (`getOffsetForIndex`); в браузере остаётся проверить липкий заголовок на реальной раскладке.

- [ ] **Step 2: Полная проверка**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo "exit=$?"`
Expected: `exit=0`, lint без предупреждений, typecheck чистый, число тестов выросло относительно 436. Записать итоговое число.

- [ ] **Step 3: Коммит документации** (только после `exit=0` предыдущего шага)

```bash
git add docs/superpowers
git commit -m "docs: решения владельца по спеку этапа 3 и план части 1" -m "$TRAILERS"
```

- [ ] **Step 4: Итог части 1.** Добавить в конец спека короткий раздел «Итоги части 1» (число тестов, расхождения с планом, что осталось проверить в браузере) и закоммитить отдельным docs-коммитом. Не пушить, не ставить тег.
