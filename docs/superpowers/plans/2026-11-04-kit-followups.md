# Хвосты кита после TreeList: план работ

> **Для агентов-исполнителей:** обязательный скил для выполнения: superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans, задача за задачей. Шаги отмечаются чекбоксами (`- [ ]`).

**Цель:** закрыть известные хвосты Grid и TreeList (ленивые группы на данных, «Развернуть все» в ленивом дереве, каскадный выбор, постраничность дерева, клавиатурная навигация treegrid, сверка макета и кода) и собрать в одном месте всё, что ждёт решения владельца.

**Архитектура:** всё строится на общем движке `GridBase` (`src/components/grid/`), `Grid` и `TreeList` остаются оболочками. Логика (что грузить, куда двигать курсор, что выбрано) живёт в чистых функциях над плоским списком `FlatItems` и наборами ключей; DOM используется только для вида (фокус, измерения). Общая часть пишется один раз в `grid/`, в `tree-list/` только то, что есть только у дерева.

**Стек:** Solid.js 1.9, TypeScript, CSS Modules с нативной вложенностью, `@tanstack/solid-virtual` через `createVirtualWindow`, Vitest и `@solidjs/testing-library`, playground на Vite, приёмка в Chrome.

**Спеки, на которые опирается план:**
- `docs/superpowers/specs/2026-11-03-tree-list-design.md` (разделы 4.3, 5, 6, 13, 14);
- `docs/superpowers/specs/2026-11-01-stage-4b-grouping-design.md` (`onGroupExpand`, `not-loaded`, раздел «Известные ограничения»);
- `docs/superpowers/specs/2026-10-31-stage-4a-grid-core-design.md` (решение 1: «грид это обычная таблица без курсора строки»);
- `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (не-цели: roving tabindex; раздел 6.1: навигация по плоскому списку, а не по DOM);
- план `docs/superpowers/plans/2026-11-03-tree-list.md` и текущая пакетная подгрузка дерева (делается параллельно, см. ниже).

**Статус документа.** Черновик на утро, написан без владельца. Где сказано «известно», это прочитано в коде или спеках на 2026-11-03 вечер. Где «догадка», это не проверено. Разделы «Решения владельца» не решены: в них варианты и рекомендация.

## Глобальные ограничения

- Один класс, тип, интерфейс или функция на файл; имя файла по имени в kebab-case (`~/.claude/CLAUDE.md`). Это касается и вспомогательных типов результатов (`LoadPlan`, `GridCursor` и т. п.).
- CSS: только нативная вложенность с явным `&`, состояния и варианты внутри правила блока; новый CSS только в `src/components/grid/grid.module.css` (в `tree-list/` стилей нет, это проверяет `src/components/tree-list/shared-with-grid.test.ts`).
- Данные, не DOM (память `data-not-dom.md`): решения о загрузке, раскрытии, выборе и курсоре принимаются по ключам и плоскому списку, а не по смонтированным строкам. Логика закрывается юнит-тестами на чистых функциях; автопроверки playground проверяют только вид.
- Общие части грида и дерева живут в одном экземпляре в `src/components/grid/`; копировать их в `tree-list/` нельзя.
- Любая правка вида или поведения переносится в макет в той же задаче (скил `solid-kit-design-sync`, читать перед любой правкой UI).
- Существующие тесты грида (`src/components/grid/grid.test.tsx`) и дерева правятся только там, где меняется задокументированное поведение, и это записывается в спеку.
- Проверка перед коммитом: `pnpm check` (lint, stylelint, typecheck, vitest) зелёный.
- Коммиты локальные. Пуш, теги этапов и `v1.0.0` только по слову владельца.
- Язык интерфейса, комментариев, сообщений коммитов и документов: русский.

## Параллельная работа, которую надо учесть

На 2026-11-03 вечер другой агент переводит ленивую подгрузку TreeList на планирование по данным. По незакоммиченному диффу видно (известно):
- `loadChildren` становится пакетным: `loadChildren?: (rows: readonly T[]) => void`, один вызов на набор видимых раскрытых узлов без детей; страница синхронно кладёт все ключи в `loadingKeys`;
- `GridTreeSource.loadNode` удалён, `GridBase.loadItem` для дерева больше ничего не делает;
- в `TreeList` два эффекта: чистка `requested` (ключ уходит при сворачивании узла и когда у узла появились дети) и планировщик `planNodeLoad(flat().items, requested(), loadingKeys)` → `{ fresh, joined }`; `fresh` уходят в `loadChildren`, оба списка добавляются в `requested`;
- файла `src/components/tree-list/plan-node-load.ts` на момент написания ещё нет на диске, его сигнатура известна только по вызову.

Поэтому задачи A и B начинаются с шага «прочитать, что в итоге закоммичено» и не опираются на точные имена внутри `tree-list/`, кроме названных выше.

---

## Карта файлов

| Файл | Задача | Что |
|---|---|---|
| `src/components/grid/plan-item-load.ts` (новый, или перенос `tree-list/plan-node-load.ts`) | A | общий планировщик догрузки над `GridItem[]` |
| `src/components/grid/load-plan.ts` (новый, если тип результата ещё не вынесен) | A | тип `{ fresh, joined }` |
| `src/components/grid/not-loaded-group-keys.ts` (новый) | A | ключи всех групп с `children.kind === 'not-loaded'` |
| `src/components/grid/keep-requested-group-keys.ts` (новый) | A | чистка набора запрошенных групп |
| `src/components/grid/grid-base.tsx` | A, E | эффект догрузки групп; курсор строки |
| `src/components/grid/grid-loading-group-row.tsx` | A | убрать вызов `loadItem` из `onMount` |
| `src/components/grid/grid-context.ts` | A, C, E | убрать `loadItem`; добавить состояние выбора строки и курсор |
| `src/components/grid/grid-props.ts` | A, E | `onGroupsExpand`; проп клавиатуры (если решит владелец) |
| `src/components/tree-list/tree-list.tsx`, `tree-list-props.ts` | B, C | режим «развернуть всё»; каскадный выбор |
| `src/components/tree-list/*.ts` (новые чистые функции) | B, C, D | см. задачи |
| `src/components/grid/grid-cursor.ts`, `move-cursor.ts`, `cursor-index.ts`, `cursor-command.ts`, `cursor-move.ts` (новые) | E | курсор строки и навигация |
| `src/utils/render-window.ts` | E | только если понадобится удержание строки в окне |
| `playground/src/demo-grid.tsx`, `grouping-checks.ts`, `demo-tree-list*.tsx`, `tree-list-checks.ts` | A–E | демо и автопроверки вида |
| спеки `stage-4b-grouping`, `tree-list`, `stage-4a-grid-core` | все | правки поведения и итоги |
| `~/.claude/skills/solid-kit-design-sync/SKILL.md` | F | список «не сверено» |

---

## A. Ленивые группы Grid на данных

**Размер:** M. **Зависимости:** закоммиченная пакетная подгрузка дерева (желательно, чтобы переиспользовать планировщик). **Блокирует:** ничего; E лучше делать после A, чтобы курсор не прыгал от лишних перезапросов.

### Цель и почему
Сейчас (известно, `grid-loading-group-row.tsx:23-30`) строка-заглушка «Загрузка…» при монтировании вызывает `grid.loadItem(key)` → `props.onGroupExpand(key)`. Следствия:
1. при виртуализации заглушки вне окна рендера не монтируются, и их группы не запрашиваются, пока до них не докрутят («развернуть уровень» на 100 ленивых группах запросит только видимые);
2. прокрутка туда-обратно и сдвиг индексов (раскрыли группу выше, строка заглушки пересоздалась) вызывают `onGroupExpand` повторно. Спека 4б это признаёт («страница отсекает повторы»), демо `playground/src/demo-grid.tsx:457` повторы не отсекает, а просто ставит ещё один таймер.

Ревью Opus на дереве воспроизвело оба эффекта опытом; механизм у групп тот же (вывод по коду, на группах опытом не проверяли).

### Что известно из кода
- `flattenGroups(groups, expanded)` (`flatten-groups.ts`) уже даёт элемент `{ kind: 'loading', key, level }` для каждой развёрнутой видимой группы с `not-loaded` (видимой: все предки развёрнуты, иначе обход до неё не доходит). Это и есть источник истины для планировщика, DOM не нужен.
- У групп нет аналога `loadingKeys`: «идёт загрузка» у группы выражается тем, что она всё ещё `not-loaded`. Значит набор `busy` для планировщика групп пуст, а дедупликация держится только на `requested`.
- Ключи групп `string`, `GridItem.loading.key` имеет тип `RowKey`; в режиме групп это всегда строка.
- Публичный контракт: `onGroupExpand?: (key: string) => void` (`grid-props.ts:35`), единственный потребитель в репозитории это playground. Есть ли потребители вне репозитория (BackOffice), неизвестно: вопрос владельцу.

### Решение: пакетный API у групп?
Нужен ли `onGroupExpand(keys[])`: «развернуть уровень» на N ленивых группах после перевода на данные даст N ключей за один проход эффекта. Варианты:

1. **Оставить `onGroupExpand(key)` и вызывать его N раз подряд в одном проходе эффекта.** Совместимо на 100 %, но странице, которой нужен один запрос, придётся склеивать вызовы сама (микрозадачей).
2. **Добавить `onGroupsExpand?: (keys: readonly string[]) => void`; если он передан, `onGroupExpand` не вызывается.** Совместимо, пакет из коробки, два пропса на одно действие (немного шумно).
3. **Сменить сигнатуру на массив.** Чище, но ломает потребителей; группы уже запушены (этап 4б входит в `origin/main`).

**Рекомендация: вариант 2** сейчас, `onGroupExpand` пометить в JSDoc как устаревший и убрать при `v1.0.0`, если владелец согласен. Порядок ключей как на экране, как у `loadChildren` дерева. Решение исполнителя до слова владельца: делать вариант 2 (он ничего не ломает и не мешает выбрать 3 позже).

### Поведение после перевода (правило для спеки 4б)
- Эффект над `flat()` в режиме групп: кандидаты это элементы `loading`, ключей которых нет в `requested`. Все кандидаты одного прохода уходят одним вызовом (`onGroupsExpand(keys)` или по одному `onGroupExpand(key)`), затем добавляются в `requested`.
- Ключ уходит из `requested`, когда группа свёрнута (ключа нет в `expandedGroupKeys`) или когда она больше не `not-loaded` (пришли строки или подгруппы). Следствие: после «Обновить», вернувшего группу снова `not-loaded`, она запросится заново (ключ уже был удалён при загрузке).
- Пока идёт загрузка всего грида (`loading === true`), догрузка групп не планируется: данные сейчас заменятся. Это решение исполнителя, записать в спеку.
- Ответа нет (страница не прислала строки): заглушка висит, повторного запроса нет до сворачивания и раскрытия группы. Как у дерева: автоповтора нет, петли нет.
- Сворачивание предка не забывает запрос (ключ потомка остался в `expandedGroupKeys`), повторное раскрытие предка дубль не шлёт.

### Задача A1. Общий планировщик догрузки в `grid/`

**Files:**
- Create или Move: `src/components/grid/plan-item-load.ts`, `src/components/grid/load-plan.ts`
- Test: `src/components/grid/plan-item-load.test.ts`
- Modify (если переносим): `src/components/tree-list/tree-list.tsx` (импорт), удалить `src/components/tree-list/plan-node-load.ts` и его тест

**Interfaces:**
- Produces: `planItemLoad<T>(items: readonly GridItem<T>[], requested: ReadonlySet<RowKey>, busy: ReadonlySet<RowKey>): LoadPlan`, где `interface LoadPlan { fresh: readonly RowKey[]; joined: readonly RowKey[] }`: `fresh` это ключи `loading`-элементов, которых нет ни в `requested`, ни в `busy` (их надо запросить), `joined` это ключи из `busy`, которых нет в `requested` (страница уже грузит, достаточно запомнить).

- [ ] **Шаг 1: прочитать, что закоммитил агент пакетной подгрузки.** `git log --oneline -10 -- src/components/tree-list`, затем прочитать `src/components/tree-list/plan-node-load.ts` и его тест. Если сигнатура совпадает с `Interfaces` выше и функция не зависит от дерева (работает только с `GridItem`), то шаги 2–4 это перенос: `git mv` в `grid/plan-item-load.ts`, переименование функции, тип результата отдельным файлом `load-plan.ts`, импорт в `tree-list.tsx`. Если зависит от индекса дерева, оставить её в `tree-list/` и написать групповую версию по шагам ниже.
- [ ] **Шаг 2: написать падающий тест** (если функции ещё нет в `grid/`):

```ts
import { describe, expect, it } from 'vitest';

import type { GridItem } from './grid-item';
import { planItemLoad } from './plan-item-load';

const loading = (key: string): GridItem<never> => ({ kind: 'loading', key, level: 1 });
const NONE: ReadonlySet<string> = new Set();

describe('planItemLoad', () => {
	it('берёт ключи заглушек в порядке плоского списка', () => {
		expect(planItemLoad([loading('a'), loading('b')], NONE, NONE)).toEqual({ fresh: ['a', 'b'], joined: [] });
	});

	it('не повторяет запрошенные', () => {
		expect(planItemLoad([loading('a'), loading('b')], new Set(['a']), NONE)).toEqual({ fresh: ['b'], joined: [] });
	});

	it('ключ, который страница уже грузит, только запоминается', () => {
		expect(planItemLoad([loading('a')], NONE, new Set(['a']))).toEqual({ fresh: [], joined: ['a'] });
	});

	it('строки, заголовки и подвалы не участвуют', () => {
		const items: GridItem<number>[] = [{ kind: 'row', row: 1, rowIndex: 0, level: 0 }];
		expect(planItemLoad(items, NONE, NONE)).toEqual({ fresh: [], joined: [] });
	});
});
```

- [ ] **Шаг 3: запустить, убедиться, что падает.** `pnpm vitest run src/components/grid/plan-item-load.test.ts` → FAIL (нет модуля).
- [ ] **Шаг 4: реализация.**

```ts
// src/components/grid/load-plan.ts
import type { RowKey } from './row-key';

/** Итог планирования догрузки: `fresh` запросить, `joined` уже грузит страница, только запомнить. */
export interface LoadPlan {
	fresh: readonly RowKey[];
	joined: readonly RowKey[];
}
```

```ts
// src/components/grid/plan-item-load.ts
import type { GridItem } from './grid-item';
import type { LoadPlan } from './load-plan';
import type { RowKey } from './row-key';

/**
 * Что догрузить по плоскому списку видимых элементов: заглушки `loading`, которых ещё не просили. Считается по данным, не по
 * смонтированным строкам: окно рендера и прокрутка на результат не влияют. Общая для групп грида и узлов дерева.
 */
export function planItemLoad<T>(items: readonly GridItem<T>[], requested: ReadonlySet<RowKey>, busy: ReadonlySet<RowKey>): LoadPlan {
	const fresh: RowKey[] = [];
	const joined: RowKey[] = [];
	for (const item of items) {
		if (item.kind !== 'loading' || requested.has(item.key)) {
			continue;
		}
		(busy.has(item.key) ? joined : fresh).push(item.key);
	}
	return { fresh, joined };
}
```

- [ ] **Шаг 5: тесты зелёные, дерево не сломано.** `pnpm vitest run src/components/grid/plan-item-load.test.ts src/components/tree-list` → PASS.
- [ ] **Шаг 6: коммит.** `git add src/components/grid/plan-item-load.ts src/components/grid/load-plan.ts src/components/grid/plan-item-load.test.ts src/components/tree-list` и `git commit -m "refactor(grid): общий планировщик догрузки по плоскому списку"`.

### Задача A2. Чистые функции набора запрошенных групп

**Files:**
- Create: `src/components/grid/not-loaded-group-keys.ts`, `src/components/grid/keep-requested-group-keys.ts`
- Test: `src/components/grid/not-loaded-group-keys.test.ts`, `src/components/grid/keep-requested-group-keys.test.ts`

**Interfaces:**
- Produces: `notLoadedGroupKeys<T>(groups: readonly GridGroup<T>[]): ReadonlySet<string>` (все группы дерева, включая свёрнутые и вложенные в свёрнутые); `keepRequestedGroupKeys(requested: ReadonlySet<string>, expanded: ReadonlySet<string>, notLoaded: ReadonlySet<string>): ReadonlySet<string>` (возвращает тот же объект `requested`, если ничего не убрано).

- [ ] **Шаг 1: падающие тесты.**

```ts
// keep-requested-group-keys.test.ts
import { describe, expect, it } from 'vitest';

import { keepRequestedGroupKeys } from './keep-requested-group-keys';

describe('keepRequestedGroupKeys', () => {
	it('ничего не убрано: тот же объект', () => {
		const requested = new Set(['a']);
		expect(keepRequestedGroupKeys(requested, new Set(['a']), new Set(['a']))).toBe(requested);
	});

	it('свёрнутая группа забывается', () => {
		expect([...keepRequestedGroupKeys(new Set(['a', 'b']), new Set(['b']), new Set(['a', 'b']))]).toEqual(['b']);
	});

	it('загруженная группа забывается', () => {
		expect([...keepRequestedGroupKeys(new Set(['a', 'b']), new Set(['a', 'b']), new Set(['b']))]).toEqual(['b']);
	});
});
```

```ts
// not-loaded-group-keys.test.ts
import { describe, expect, it } from 'vitest';

import type { GridGroup } from './grid-group';
import { notLoadedGroupKeys } from './not-loaded-group-keys';

const lazy = (key: string): GridGroup<never> => ({ key, field: 'f', value: key, count: 1, children: { kind: 'not-loaded' } });

describe('notLoadedGroupKeys', () => {
	it('собирает ленивые группы на любой глубине', () => {
		const groups: GridGroup<never>[] = [
			{ key: 'p', field: 'f', value: 'p', count: 2, children: { kind: 'groups', items: [lazy('p/a'), lazy('p/b')] } },
			{ key: 'r', field: 'f', value: 'r', count: 0, children: { kind: 'rows', items: [] } }
		];
		expect([...notLoadedGroupKeys(groups)]).toEqual(['p/a', 'p/b']);
	});
});
```

- [ ] **Шаг 2: запустить, FAIL.** `pnpm vitest run src/components/grid/keep-requested-group-keys.test.ts src/components/grid/not-loaded-group-keys.test.ts`.
- [ ] **Шаг 3: реализация.**

```ts
// keep-requested-group-keys.ts
/**
 * Запрошенные группы, которые ещё ждут строк: развёрнутые и по-прежнему `not-loaded`. Свёрнутая или загруженная группа забывается,
 * поэтому следующее раскрытие или «Обновить», вернувшее её незагруженной, запросит её заново. Без изменений возвращает тот же набор.
 */
export function keepRequestedGroupKeys(
	requested: ReadonlySet<string>,
	expanded: ReadonlySet<string>,
	notLoaded: ReadonlySet<string>
): ReadonlySet<string> {
	const keep = [...requested].filter((key) => expanded.has(key) && notLoaded.has(key));
	return keep.length === requested.size ? requested : new Set(keep);
}
```

```ts
// not-loaded-group-keys.ts
import type { GridGroup } from './grid-group';

/** Ключи всех групп без загруженного содержимого, на любой глубине; обход итеративный. */
export function notLoadedGroupKeys<T>(groups: readonly GridGroup<T>[]): ReadonlySet<string> {
	const keys = new Set<string>();
	const stack: (readonly GridGroup<T>[])[] = [groups];
	for (let list = stack.pop(); list !== undefined; list = stack.pop()) {
		for (const group of list) {
			if (group.children.kind === 'not-loaded') {
				keys.add(group.key);
			}
			else if (group.children.kind === 'groups') {
				stack.push(group.children.items);
			}
		}
	}
	return keys;
}
```

Порядок обхода через стек даёт порядок «по уровням с конца»; тест выше сравнивает две соседние группы одного списка, порядок внутри списка сохраняется. Если тест упадёт из-за порядка, сравнивать через `new Set(...)`, порядок набора не важен.

- [ ] **Шаг 4: PASS.** Та же команда.
- [ ] **Шаг 5: коммит.** `git commit -m "feat(grid): наборы ленивых и запрошенных групп"`.

### Задача A3. Перевести `GridBase` на планирование, убрать запрос из заглушки

**Files:**
- Modify: `src/components/grid/grid-base.tsx` (контекст `loadItem`, новый эффект рядом с `flat`), `src/components/grid/grid-loading-group-row.tsx:23-30`, `src/components/grid/grid-context.ts` (удалить `loadItem` и его JSDoc), `src/components/grid/grid-props.ts` (новый проп), `src/components/grid/grouping-prop-key.ts` (добавить `'onGroupsExpand'`, чтобы TreeList его не принимал)
- Test: `src/components/grid/grid.test.tsx` (описание «Grid: группировка», тесты около строки 1935)

**Interfaces:**
- Consumes: `planItemLoad`, `notLoadedGroupKeys`, `keepRequestedGroupKeys` (A1, A2).
- Produces: проп `onGroupsExpand?: ((keys: readonly string[]) => void) | undefined`; `GridContextValue` без `loadItem`.

- [ ] **Шаг 1: падающие компонентные тесты** в `grid.test.tsx`, описание «Grid: группировка», рядом с тестом «не загруженная развёрнутая группа даёт заглушку…». Использовать существующие `renderGrid` и `mockGeometry` из этого файла.

```tsx
it('ленивые группы вне окна рендера запрашиваются одним вызовом', () => {
	mockGeometry({ windowHeight: 100, rowHeight: 20 });
	const groups = Array.from({ length: 200 }, (_, n): GridGroup<Person> => ({
		key: `g${n}`, field: 'age', value: n, count: 30, children: { kind: 'not-loaded' }
	}));
	const onGroupsExpand = vi.fn();
	renderGrid({ groups, expandedGroupKeys: new Set(groups.map((group) => group.key)), onGroupsExpand, virtualized: true, rowHeight: 20, overscan: 2 });
	expect(onGroupsExpand).toHaveBeenCalledTimes(1);
	expect(onGroupsExpand.mock.calls[0]?.[0]).toHaveLength(200);
});

it('без onGroupsExpand вызывает onGroupExpand по разу на группу', () => {
	const onGroupExpand = vi.fn();
	renderGrid({ groups: [LAZY, { ...LAZY, key: 'g4' }], expandedGroupKeys: new Set(['g3', 'g4']), onGroupExpand });
	expect(onGroupExpand.mock.calls).toEqual([['g3'], ['g4']]);
});

it('прокрутка туда и обратно не повторяет запрос', async () => {
	// 200 ленивых групп, виртуализация; прокрутить скроллер в конец и обратно тем же способом, что тесты раздела «Grid: виртуализация»
	// (через mockGeometry и событие scroll); ожидать ровно один вызов onGroupsExpand
});

it('свернуть и развернуть во время загрузки: запрос повторяется один раз, развернуть предка: не повторяется', () => {
	// контролируемый expandedGroupKeys через createSignal: свернуть g3 → развернуть g3 → 2 вызова всего;
	// вложенная ленивая p/a под p: свернуть p → развернуть p → 1 вызов всего
});

it('группа пришла загруженной, затем «Обновить» вернул её незагруженной: запрос повторяется', () => {
	// groups через createSignal: [LAZY] → [{ ...LAZY, children: { kind: 'rows', items: [...] } }] → [LAZY]; 2 вызова
});

it('пока грид в loading, догрузка групп не запрашивается', () => {
	const onGroupExpand = vi.fn();
	renderGrid({ groups: [LAZY], expandedGroupKeys: new Set(['g3']), onGroupExpand, loading: true });
	expect(onGroupExpand).not.toHaveBeenCalled();
});
```

Тесты с комментариями внутри дописать по образцу соседних тестов этого файла: способ прокрутки в jsdom уже есть в описании «Grid: виртуализация» (строки около 236–320), его и повторить. Это единственное место плана, где код теста не приведён целиком: он зависит от помощников файла, которые надо прочитать.

- [ ] **Шаг 2: FAIL.** `pnpm vitest run src/components/grid/grid.test.tsx -t "группировка"`: новые тесты падают (первый: вызовов меньше 1 или больше 1 в зависимости от окна).
- [ ] **Шаг 3: реализация в `grid-base.tsx`.** После объявления `flat`:

```ts
// группы, строки которых уже просили; ключ уходит при сворачивании группы и когда её содержимое пришло
const [requestedGroups, setRequestedGroups] = createSignal<ReadonlySet<string>>(NO_GROUP_KEYS);
// догрузка групп планируется по данным (развёрнутые видимые группы `not-loaded`), а не по монтированию заглушек: окно рендера
// и прокрутка на неё не влияют, клик и «развернуть уровень» дают один вызов на набор
createEffect(() => {
	const groups = props.groups;
	if (props.tree !== undefined || groups === undefined || loading()) {
		return;
	}
	const kept = keepRequestedGroupKeys(untrack(requestedGroups), expandedGroups(), notLoadedGroupKeys(groups));
	const keys = planItemLoad(flat()?.items ?? [], kept, NO_GROUP_KEYS).fresh as readonly string[];
	setRequestedGroups(keys.length === 0 ? kept : new Set([...kept, ...keys]));
	if (keys.length > 0) {
		untrack(() => {
			if (props.onGroupsExpand !== undefined) {
				props.onGroupsExpand(keys);
			}
			else {
				for (const key of keys) {
					props.onGroupExpand?.(key);
				}
			}
		});
	}
});
```

Удалить `loadItem` из объекта `context` и из `GridContextValue`; в `grid-loading-group-row.tsx` из `onMount` убрать вызов `grid.loadItem(key)` и сам `key` (остаётся только `grid.window.measure(element)`), JSDoc компонента: «Заглушка строк развёрнутой группы или узла, которые ещё не загружены: только показывает состояние, догрузку планирует движок по данным». Проверить, что `createSignal` и `untrack` уже импортированы (да, строка 3).

- [ ] **Шаг 4: PASS и регресс.** `pnpm vitest run src/components/grid src/components/tree-list` → всё зелёное, включая старые тесты `onGroupExpand` (их поведение «ровно один вызов» сохраняется).
- [ ] **Шаг 5: демо.** В `playground/src/demo-grid.tsx` перевести обработчик на `onGroupsExpand={(keys) => …}` с одним таймером на пакет и счётчиком вызовов на странице (`data-group-requests`), чтобы автопроверка могла его читать. В `playground/src/grouping-checks.ts` добавить проверку: «развернуть все» на демо с ленивыми группами даёт один вызов; прокрутка до конца и обратно счётчик не меняет.
- [ ] **Шаг 6: спека 4б.** В `docs/superpowers/specs/2026-11-01-stage-4b-grouping-design.md` заменить абзац про «ещё раз при монтировании строки-заглушки» (строка 49) правилами из раздела «Поведение после перевода» выше; в «Известные ограничения» (строка 176) убрать пункт про повторы; добавить `onGroupsExpand` в API (строка 40).
- [ ] **Шаг 7: `pnpm check`, коммит.** `git commit -m "feat(grid): догрузка групп по данным, onGroupsExpand"`. Макет не меняется (вид заглушки тот же), запись об этом в итог задачи.

### Риски A
- Страница-потребитель, которая полагалась на повтор `onGroupExpand` при монтировании как на автоповтор после ошибки, перестанет его получать. Смягчение: явная строка в спеке и в JSDoc пропса.
- Эффект зависит от `loading()`: если страница держит `loading` весь сеанс подгрузки групп, догрузка не пойдёт. В демо `loading` и подгрузка групп разделены (известно); у BackOffice неизвестно.
- `notLoadedGroupKeys` обходит все группы на каждое изменение `groups` и `expanded`: при тысячах групп это O(групп), приемлемо (догадка, замерить в playground на «Сервер» с группировкой по двум полям).

---

## B. «Развернуть все» в ленивом TreeList

**Размер:** M (вариант 1) или S (вариант 2). **Зависимости:** пакетная подгрузка дерева закоммичена. **Блокируется решением владельца** (включать ли и как).

### Цель и почему
Сейчас (известно) `canExpandAll: () => local.loadChildren === undefined`: в ленивом режиме кнопка отключена, потому что «раскрыть всё» означало бы рекурсию запросов (решение владельца, коммит `ac493f7`). С пакетным планировщиком рекурсия становится управляемой: один запрос на уровень, а не на узел.

### Решения владельца
1. **Включать ли вообще.** Варианты: (а) оставить отключённой навсегда; (б) включать по opt-in пропсу; (в) включать всегда. Рекомендация: (б), по умолчанию выключено, потому что цена кнопки (число запросов и объём данных) известна только странице.
2. **Механизм.**
   - **Вариант 1, «лестница» внутри TreeList.** Режим «раскрываем всё»: раскрыть все загруженные раскрываемые узлы, планировщик пакетом просит следующий уровень, после каждого ответа раскрываются пришедшие раскрываемые дети, и так до конца, лимита или прерывания. Один запрос на уровень глубины. Проп, например, `expandAllLazy?: { maxDepth: number; maxNodes: number } | undefined`.
   - **Вариант 2, «всё сразу» через страницу.** Кнопка вызывает `onExpandAll?: () => void`; страница одним запросом присылает всё поддерево в `rows` (у BackOffice плоский список Id/ParentId и так целиком, см. D), TreeList после прихода раскрывает всё обычным `allTreeKeys`. Один запрос, ноль протокола в ките, но нужен такой серверный метод.
   - Рекомендация: **вариант 2, если у сервера есть «всё поддерево» одним запросом** (вопрос владельцу про BackOffice); иначе вариант 1 с обязательными лимитами.
3. **Лимиты по умолчанию для варианта 1.** Рекомендация: без умолчаний, оба числа обязательны в пропсе (чтобы страница осознанно задала цену). Если владелец хочет умолчания: `maxDepth: 5`, `maxNodes: 5000` (5000 это порог, на котором меряли «развернуть все», 13–14 мс до кадра).
4. **Что сообщать странице по окончании.** Рекомендация: `onExpandAllEnd?: (reason: 'done' | 'limit' | 'cancelled') => void` и ничего не объявлять живой областью (спека TreeList, раздел 5: раскрытие не объявляется).

### Протокол варианта 1 (для спеки, если выберут его)
- Старт: кнопка «развернуть все» включает режим `run = { depthLimit, nodeBudget }` и в том же `batch` раскрывает все загруженные раскрываемые узлы (`allTreeKeys` плюс узлы с `hasChildren === true`). Планировщик из пакетной подгрузки сам отправит один `loadChildren` со всеми видимыми раскрытыми узлами без детей.
- Шаг: эффект над `index()` при активном режиме добавляет в `expanded` новые узлы, у которых `hasChildren === true` или есть дети, если их уровень меньше `depthLimit` и бюджет не исчерпан. Бюджет уменьшается на число раскрытых узлов.
- Конец: нет кандидатов у планировщика и `loadingKeys` пуст → `done`; бюджет или глубина исчерпаны → `limit` (уже раскрытое остаётся раскрытым, дальше не идём); любое ручное действие (шеврон, кнопки уровней, смена `expandedKeys` извне, смена `rows` не ответом, а заменой списка, `loading === true`) → `cancelled`, раскрытое остаётся.
- Признак «это ответ, а не замена»: догадка, что достаточно сравнить, остались ли в индексе все прежние ключи (ответ только добавляет). Проверить на демо с «Обновить».
- Пока режим активен, кнопка «развернуть все» отключена, «свернуть все» прерывает.

### Задачи (план для варианта 1; для варианта 2 оставить B1 и B3)

#### B1. Чистая функция следующего шага
**Files:** Create `src/components/tree-list/expand-all-step.ts`, `src/components/tree-list/expand-all-run.ts` (тип состояния режима), test `src/components/tree-list/expand-all-step.test.ts`.

**Interfaces:**
- Produces: `interface ExpandAllRun { depthLimit: number; budget: number }`; `expandAllStep<T>(index: TreeIndex<T>, expanded: ReadonlySet<RowKey>, run: ExpandAllRun, hasChildren: ((row: T) => boolean) | undefined): { expanded: ReadonlySet<RowKey>; run: ExpandAllRun; stopped: 'limit' | undefined }`. Возвращает тот же `expanded`, если раскрывать нечего.

- [ ] Шаг 1: тесты таблицей: (1) корни с `hasChildren` раскрываются, бюджет уменьшается на их число; (2) узел на глубине `depthLimit` не раскрывается; (3) бюджет 2 при 3 кандидатах: раскрыты 2 первых в порядке обхода, `stopped: 'limit'`; (4) нечего раскрывать: тот же объект `expanded`; (5) узел, родитель которого свёрнут, не раскрывается (раскрываем только видимые, иначе запросы уйдут под свёрнутые ветки).
- [ ] Шаг 2: FAIL. `pnpm vitest run src/components/tree-list/expand-all-step.test.ts`.
- [ ] Шаг 3: реализация обходом `index.roots` в глубину (итеративно, как `flattenTree`), спускаясь только в раскрытые узлы; кандидат: не раскрыт, `level < depthLimit`, раскрываем (`index.children.has(key) || hasChildren?.(row) === true`).
- [ ] Шаг 4: PASS. Шаг 5: коммит `feat(tree-list): шаг ленивого «развернуть все»`.

#### B2. Режим в `TreeList`
**Files:** Modify `src/components/tree-list/tree-list.tsx`, `tree-list-props.ts`; test `src/components/tree-list/tree-list.test.tsx` (новое описание «TreeList: развернуть все в ленивом режиме»).

- [ ] Шаг 1: компонентные тесты с `virtualized={true}` и `mockGeometry`, ленивый источник на трёх уровнях по 50 узлов: (1) клик «развернуть все» → один `loadChildren` с 50 корнями; ответ → один вызов с 2500 детьми; ответ → конец, `onExpandAllEnd('done')`; (2) `maxNodes` 60 → `limit`, вызовов два; (3) клик по шеврону во время режима → `cancelled`, новых вызовов нет; (4) без пропса кнопка отключена как сейчас.
- [ ] Шаг 2: FAIL. Шаг 3: реализация: сигнал `run`, эффект над `index()` и `loadingKeys` вызывает `expandAllStep`, ручные действия в `source` сбрасывают `run`. `canExpandAll` = `loadChildren === undefined || expandAllLazy !== undefined`, и `false`, пока режим активен.
- [ ] Шаг 4: PASS, `pnpm check`. Шаг 5: коммит `feat(tree-list): «развернуть все» в ленивом режиме по opt-in`.

#### B3. Демо, спека, макет
- [ ] Демо `playground/src/demo-tree-list-lazy.tsx`: переключатель «Развернуть все», поля лимитов, журнал вызовов `loadChildren` с размерами пакетов (`data-tree-batches`); автопроверка в `playground/src/tree-list-checks.ts`: число пакетов равно глубине.
- [ ] Спека TreeList, разделы 4.2 и 4.3: протокол выше; раздел 14: итоги.
- [ ] Макет: вид кнопки не меняется (та же кнопка, только включена), записать «макет не затронут».
- [ ] Коммит `docs(tree-list): ленивое «развернуть все»`.

### Риски B
- Ширина пакетов растёт геометрически: третий уровень BackOffice может дать десятки тысяч ключей одним вызовом. Лимит обязателен, нарезка на куски остаётся странице (контракт `loadingKeys` это уже допускает).
- Узлы с `hasChildren === true`, у которых детей не оказалось, оставляют ключ в `requested`, режим не должен ждать их вечно: условие конца «нет кандидатов и `loadingKeys` пуст», а не «все раскрытые имеют детей».

---

## C. Выбор в TreeList: каскад или нет

**Размер:** M (каскад без индетерминантных строк) или L (с индетерминантными строками и ленивыми детьми). **Зависимости:** нет. **Блокируется решением владельца.**

### Что известно из кода
- Выбор общий, в `GridBase`: набор ключей `selected`, `toggleKey`, `selectAllKeys`, `clearKeys`, `selectionOf` (`selection-state.ts`). Каскада нет: чекбокс узла выбирает только узел.
- **Находка:** главный чекбокс в TreeList работает только по видимым строкам. `rowIndex` строится из `leafRows()`, а в режиме дерева это `flat().rows`, то есть раскрытые и видимые узлы (`grid-base.tsx:156,170,177,384`). «Выбрать все» при свёрнутом дереве выбирает только корни, состояние «все» считается по корням. В спеке TreeList это не описано. Для групп грида то же самое по замыслу («только загруженные ключи»), для дерева это скорее неожиданность. Вопрос владельцу ниже.
- `Checkbox` уже умеет `indeterminate` (`src/components/checkbox/checkbox.tsx:18`), главный чекбокс им пользуется. Чекбокс строки (`grid-select-cell.tsx`) получает только `checked`.

### Решения владельца
1. **Нужен ли каскад вообще.** Спека TreeList (раздел 13): «если BackOffice-экраны ждут "выбрал родителя, выбраны дети", добавим пропс после первого использования». Рекомендация: **не делать, пока нет экрана BackOffice, которому он нужен**; если такой экран известен, делать по варианту ниже.
2. **Если делать, какой режим.** Проп `selectionMode?: 'independent' | 'cascade'` (по умолчанию `'independent'`, нынешнее поведение).
   - `cascade`: клик по узлу выбирает или снимает узел и всех загруженных потомков; родитель показывает `indeterminate`, если выбрана часть потомков, и `checked`, если выбраны все; в `selectedKeys` лежат ключи всех выбранных узлов (страница получает плоский набор, а не «корни поддеревьев»).
   - Альтернатива: «выбор поддерева» (в наборе только верхний выбранный узел, дети считаются выбранными неявно). Удобно для ленивых деревьев и сервера, но ломает общий контракт `selectedKeys` грида. Рекомендация: не делать.
3. **Ленивые незагруженные дети при `cascade`.** Варианты: (а) пришедшие дети выбранного родителя автоматически выбираются (эффект на появление детей); (б) не выбираются, родитель становится `indeterminate`. Рекомендация: **(а)**, иначе выбор родителя «протухает» на глазах; записать, что выбор детей до их загрузки страница видит только как ключ родителя.
4. **Главный чекбокс в дереве.** Варианты: (а) как сейчас, по видимым; (б) по всем загруженным узлам (`index.byKey`). Рекомендация: **(б)** для дерева: «выбрать все» в дереве ждут как «всё дерево», а не «то, что сейчас раскрыто». Для групп грида оставить как есть.

### Задачи (при выборе `cascade` + 3а + 4б)

#### C1. Чистые функции каскада
**Files:** Create `src/components/tree-list/descendant-keys.ts`, `toggle-cascade.ts`, `node-selection-state.ts`; tests рядом.

**Interfaces:**
- Produces: `descendantKeys<T>(index: TreeIndex<T>, key: RowKey): readonly RowKey[]` (итеративно, без самого узла); `toggleCascade<T>(index: TreeIndex<T>, selected: ReadonlySet<RowKey>, key: RowKey): ReadonlySet<RowKey>` (если узел и все потомки выбраны, снять всё поддерево, иначе выбрать всё поддерево); `nodeSelectionState<T>(index: TreeIndex<T>, selected: ReadonlySet<RowKey>, key: RowKey): SelectionState` (`'all'` если узел и все загруженные потомки выбраны, `'none'` если ни один, иначе `'some'`).

- [ ] Шаг 1: тесты таблицами: лист, узел с детьми, частичный выбор, глубокая цепочка 10 000 (без переполнения стека), неизвестный ключ (тот же набор).
- [ ] Шаг 2: FAIL. Шаг 3: реализация. Шаг 4: PASS. Шаг 5: коммит `feat(tree-list): чистые функции каскадного выбора`.

`nodeSelectionState` по каждому узлу на каждую отрисовку это O(поддерева); для 20 000 узлов посчитать один раз мемо `Map<RowKey, SelectionState>` обходом снизу вверх (функция `cascadeSelectionStates(index, selected)` в своём файле). Делать сразу её, а не поштучную функцию, если тест производительности (шаг ниже) покажет больше 16 мс.

#### C2. Движок: состояние выбора строки и источник выбора
**Files:** Modify `src/components/grid/grid-tree-source.ts` (необязательные `toggleSelection?`, `rowSelectionState?`, `allSelectableKeys?`), `grid-base.tsx` (`toggleRow`, `toggleAll`, `selectionState`, новый `rowSelectionState` в контексте), `grid-context.ts`, `grid-select-cell.tsx` (`indeterminate={grid.rowSelectionState(props.index) === 'some'}`).

- [ ] Шаг 1: тесты в `grid.test.tsx` на то, что без источника выбора поведение прежнее (существующие тесты выбора зелёные без правок), и в `tree-list.test.tsx`: клик по родителю выбирает потомков, `indeterminate` у родителя при частичном выборе (DOM-свойство `indeterminate` на `input`), «выбрать все» выбирает свёрнутые ветки.
- [ ] Шаг 2: FAIL. Шаг 3: реализация: `GridBase` спрашивает источник дерева, если тот дал функции, иначе нынешние `toggleKey`/`selectAllKeys`. Это держит каскад в `tree-list/`, а движок общим.
- [ ] Шаг 4: PASS. Шаг 5: коммит `feat(tree-list): каскадный выбор по selectionMode`.

#### C3. Ленивые дети выбранного родителя
- [ ] Эффект в `TreeList`: при `cascade` и появлении детей у узла, который выбран (`selected.has(parent)`), добавить их ключи в выбор одним `setSelected`. Тест: выбрать узел с `hasChildren`, раскрыть, ответить детьми → дети выбраны, родитель `all`.
- [ ] Коммит `feat(tree-list): каскад на догруженных детей`.

#### C4. Демо, спека, макет
- [ ] Переключатель «Каскад» на странице `#tree-list`, автопроверка `indeterminate` у родителя.
- [ ] Макет: состояние «родитель частично выбран» в артборде `States` TreeList (чекбокс с чертой, как главный в гриде). По скилу `solid-kit-design-sync` правится в той же задаче.
- [ ] Спека TreeList: раздел 5 (выбор), 13 (снять пункт), 14 (итоги). Коммит.

### Риски C
- Ключ, выбранный до загрузки детей, при `independent` → `cascade` смене режима на лету. Догадка: режим читается один раз (`untrack`), как `virtualized`.
- Сортировка и фильтрация страницей меняют `rows`; каскад считается по индексу, поэтому корректен, если индекс полный. В ленивом режиме «все потомки» означает «все загруженные», это должно быть в JSDoc.

---

## D. Постраничность в дереве

**Размер:** S (документ и, по решению, одна чистая функция). **Зависимости:** нет. **Блокируется решением владельца.**

### Что известно
- TreeList страницы не режет: при `total` показывает общий `GridFooter` (пейджер и «Обновить»), страница сама присылает `rows` и `total` (спека TreeList, раздел 6). Текст сводки можно заменить `pagerSummaryText` (`grid-pager-props.ts`).
- В демо (`playground/src/demo-tree-list.tsx:66-67`) `total = rows.length`, `pageSize = rows.length`: одна страница, пейджер работает как счётчик и кнопка «Обновить».
- У BackOffice (со слов этой сессии) плоский список Id/ParentId приходит целиком; Kendo TreeList лагал на 1000+ записях, отсюда виртуализация.
- `buildTreeIndex` делает сироту корнем: если страница отрежет родителя на другую страницу, его дети станут корнями. Это молча искажает дерево.

### Варианты для BackOffice
1. **Без постраничности.** Весь список в `rows`, виртуализация держит 20 000 узлов (замерено: 21 строка в DOM, «развернуть все» на 5000 узлов 13–14 мс). Пейджер не показывать или показывать как счётчик с «Обновить» (как в демо). Плюс: дерево целое, поиск и «развернуть все» честные. Минус: объём ответа сервера.
2. **Страница = N корней со всеми потомками.** `total` это число корней, страница отдаёт корни своей страницы и их поддеревья. Сводку переименовать через `pagerSummaryText` («Корней 1–50 из 320»). Дерево целое внутри страницы. Кит может дать чистую функцию `pageTreeRoots(rows, getRowKey, getParentKey, page, pageSize)` для клиентской нарезки, если сервер отдаёт весь список.
3. **Страница = N строк плоского списка в порядке обхода.** Поддерево режется между страницами, родитель может уйти на прошлую страницу, дети станут корнями. Не рекомендуется.

**Рекомендация:** вариант 1 по умолчанию (BackOffice и так получает весь список, ради этого делалась виртуализация); вариант 2, если есть экран, где список не помещается в один ответ. Вариант 3 не поддерживать и записать это в спеку.

### Задачи (если владелец выберет вариант 2 с клиентской нарезкой)
- [ ] D1. `src/components/tree-list/page-tree-roots.ts` + тест: корни по порядку `rows`, страница N, все потомки выбранных корней в исходном порядке, `total` корней отдельной функцией `countTreeRoots.ts`. Сирота считается корнем (как в `buildTreeIndex`). Экспорт из `src/components/tree-list/index.ts`. Коммит.
- [ ] D2. Демо: переключатель «По корням» на `#tree-list`, сводка «Корней N–M из K», автопроверка, что у первой строки каждой страницы `aria-level="1"`.
- [ ] D3. Спека TreeList, раздел 6: выбранный вариант и запрет варианта 3. Коммит.

Если выбран вариант 1: только D3 (одна строка в спеке и пример в демо уже есть).

---

## E. Клавиатурная навигация treegrid (Grid и TreeList вместе)

**Размер:** L. **Зависимости:** A (иначе курсор будет дёргаться от перезапросов, догадка), желательно C решён (Space на строке). **Блокируется решением владельца:** это меняет задокументированное решение 1 спеки 4а («грид это обычная таблица без курсора строки») и не-цель зонтичной спеки (roving tabindex).

### Что известно
- Строки сейчас не фокусируются. Tab ходит по реальным элементам: кнопки шапки, чекбоксы строк, шевроны (`GridExpander` это `<button>`), контролы в ячейках. На дереве в 20 000 узлов каждый видимый шеврон это остановка Tab.
- Корень грида `tabindex='-1'`, туда `rescueFocus` уводит фокус из исчезающей строки.
- Таблица дерева уже `role='treegrid'` (`grid-table.tsx:21`), строки с `aria-level`, `aria-expanded`, `aria-setsize`, `aria-posinset`. У обычного грида роли нет (просто `table`).
- Контекстное меню строки открывается Shift+F10 и ContextMenu по `closestRow(event.target)` на `tbody` (`grid-body.tsx:45-55`): если фокус будет на самой строке, механизм работает без правок (догадка, проверить тестом).
- Готовый образец навигации по данным: `src/internal/list-box/create-list-box-controller.ts` (`activeKey` по ключу, `nextActiveIndex`, прокрутка через `window.scrollToIndex`, контракт раздела 6.1 зонтичной спеки). Там фокус остаётся на владельце (`aria-activedescendant`), здесь будет roving tabindex на строках.
- `RenderWindow.scrollToIndex(index, { align })` есть у виртуального и полного окна.

### Решения владельца
1. **Делать ли сейчас и по умолчанию ли.** Варианты: (а) включено всегда в обоих компонентах; (б) opt-in проп `keyboardNavigation`; (в) не делать до `v1.0.0`. Рекомендация: **(а)**, одно поведение для Grid и TreeList (как требует принцип единства), с правкой решения 1 спеки 4а и не-цели зонтичной спеки. Цена: меняется порядок Tab, правятся автопроверки 4а (Tab-порядок) и тесты, которые проверяют, что строка не фокусируется.
2. **Строки или ячейки.** (а) курсор только по строкам (стрелки вверх и вниз, Right и Left только для раскрытия и перехода к ребёнку и родителю), контролы в ячейках доступны обычным Tab изнутри строки; (б) полная навигация по ячейкам (как Excel). Рекомендация: **(а)**; (б) это отдельный большой этап с редактированием.
3. **Клавиши действий.** Рекомендация: Space переключает выбор строки (если `selectable`), Enter вызывает `onRowDoubleClick` (сейчас «двойного клика» с клавиатуры нет совсем), Shift+стрелки без диапазонного выбора (не делаем). PageUp и PageDown на высоту окна. Нужен ли Enter как «активировать», решает владелец.
4. **Роль обычного грида.** Для стрелочной навигации по строкам нужен `role='grid'` у плоского и сгруппированного грида (`treegrid` у дерева уже есть). Рекомендация: да, вместе с (1а).
5. **Шевроны и чекбоксы строк выходят из Tab-порядка** (`tabindex='-1'`, мышью работают). Рекомендация: да, иначе roving tabindex не даёт выигрыша.

### Модель (данные, не DOM)
- Курсор хранится как ключ: `interface GridCursor { kind: 'row' | 'group'; key: RowKey }` (строка данных по `getRowKey`, заголовок группы по `group.key`; вид нужен, потому что ключ группы и ключ строки могут совпасть). Индекс курсора в плоском списке выводится мемо из `flat().items`.
- Заглушки `loading` и подвалы групп курсор пропускает.
- Перемещение: чистая функция возвращает команду, движок её исполняет: `{ kind: 'move'; index } | { kind: 'expand'; index } | { kind: 'collapse'; index } | { kind: 'none' }`.
  - Down и Up: ближайший следующий или предыдущий элемент вида `row` или `group`.
  - Right: свёрнутый раскрываемый узел или группа → `expand`; раскрытый → `move` на следующий элемент, если его уровень больше (первый ребёнок; если следующий это заглушка `loading`, `none`); лист → `none`.
  - Left: раскрытый → `collapse`; иначе `move` к ближайшему предыдущему элементу с меньшим уровнем (родитель или заголовок группы); корень → `none`.
  - Home и End: первый и последний доступный элемент. PageDown и PageUp: на число строк окна (как `pageSize` в контроллере ListBox).
- Фокус: строка с курсором получает `tabindex='0'`, остальные `-1`. После `move` движок ставит курсор, вызывает `window.scrollToIndex(index, { align: 'auto' })` и поднимает флаг `focusPending`; строка, у которой совпал курсор, в своём эффекте фокусирует себя (`focus({ preventScroll: true })`) и снимает флаг. DOM используется только для `focus()`, логика целиком в данных.
- Курсор вне окна рендера (пользователь прокрутил колесом): строки с `tabindex='0'` в DOM нет, в тело не попасть Tab. Решение: если строка курсора не смонтирована, `tabindex='0'` получает первая смонтированная строка как «вход»; её `focus` перенаправляет: `scrollToIndex(курсор)` и `focusPending`. Альтернатива (удерживать строку курсора в окне через `rangeExtractor` TanStack) ломает непрерывность окна в `GridBody` (верхний и нижний spacer считаются по первой и последней строке), поэтому не рекомендуется.
- Исчез ключ курсора из плоского списка (свернули предка, пришла новая страница): курсор переходит на ближайшего видимого предка (для дерева: идти по `getParentKey`, для групп: заголовок группы по префиксу ключа не вычислять, а брать ближайший предыдущий элемент меньшего уровня по старому индексу), иначе на элемент с тем же индексом, ограниченным длиной списка. Если фокус был в строке, он переносится туда же (вместо нынешнего `rescueFocus` на корень).
- Клик мышью по строке ставит курсор (без фокуса на строке, если клик был по контролу).
- Контекстное меню: по закрытии меню фокус возвращается на строку курсора (проверить, что делает `GridRowMenu` сейчас; догадка, что возвращает на корень или на исходный элемент).

### Задачи

#### E1. Чистые функции курсора
**Files:** Create `src/components/grid/grid-cursor.ts` (тип), `cursor-command.ts` (тип `'next' | 'previous' | 'first' | 'last' | 'expand-or-child' | 'collapse-or-parent' | 'page-next' | 'page-previous'`), `cursor-move.ts` (тип результата), `move-cursor.ts`, `cursor-index.ts`, `cursor-after-change.ts`; tests `move-cursor.test.ts`, `cursor-index.test.ts`, `cursor-after-change.test.ts`.

**Interfaces:**
- Produces: `moveCursor<T>(items: readonly GridItem<T>[], index: number, command: CursorCommand, pageSize: number): CursorMove`; `cursorIndex<T>(items: readonly GridItem<T>[], cursor: GridCursor, getRowKey: (row: T) => RowKey): number` (-1 если нет); `cursorAt<T>(items, index, getRowKey): GridCursor | undefined`; `cursorAfterChange<T>(items, previousIndex: number, getRowKey): GridCursor | undefined`.

- [ ] Шаг 1: тесты таблицами на плоском списке из `flattenTree` (три уровня, заглушка `loading`, лист) и из `flattenGroups` (две группы, подвал): каждое правило из раздела «Модель», края списка (`none`), пропуск подвала и заглушки, Right на раскрытом узле, у которого первым идёт `loading`, → `none`.
- [ ] Шаг 2: FAIL (`pnpm vitest run src/components/grid/move-cursor.test.ts`). Шаг 3: реализация. Шаг 4: PASS. Шаг 5: коммит `feat(grid): чистые функции курсора строки`.

`cursorIndex` линейный по `items`. Для 20 000 элементов на каждое нажатие это дёшево (догадка: доли миллисекунды), но мемо `Map` ключ → индекс пересчитывается только при смене `flat`, сделать сразу его, если замер в E4 покажет больше 2 мс.

#### E2. Курсор в движке
**Files:** Modify `grid-base.tsx` (сигналы `cursor`, `focusPending`; мемо `cursorIdx`; обработчик `keydown` на `tbody` и на корне), `grid-context.ts` (`isCursor(index)`, `focusPending`, `takeFocus()`, `setCursorAt(index)`), `grid-body.tsx` (клавиши; клик ставит курсор), `grid-row.tsx`, `grid-group-row.tsx` (`tabindex`, эффект фокуса, `rescueFocus` → перенос на курсор), `grid-expander.tsx` и `grid-select-cell.tsx` (`tabindex='-1'`), `grid-table.tsx` (`role='grid'` для не-дерева).

- [ ] Шаг 1: тесты в `grid.test.tsx` (новое описание «Grid: клавиатура») и `tree-list.test.tsx`: Tab попадает на первую строку; стрелки двигают фокус; End при 1000 строках и виртуализации фокусирует последнюю строку (она смонтирована после `scrollToIndex`; в jsdom через `mockGeometry`); Right раскрывает, второй Right уходит к ребёнку; Left на ребёнке уходит к родителю; Space выбирает; Shift+F10 на строке открывает меню строки; свернуть предка фокусной строки → фокус на предке; Tab после прокрутки колесом возвращает к курсору.
- [ ] Шаг 2: FAIL. Шаг 3: реализация по разделу «Модель». Шаг 4: PASS; прежние тесты, которые проверяют порядок Tab и `tabindex` чекбоксов, обновить и записать это в спеку 4а. Шаг 5: коммит `feat(grid): курсор строки и навигация стрелками в Grid и TreeList`.

#### E3. Вид фокуса строки и макет
- [ ] CSS в `grid.module.css` внутри правила `.row` (и `.group-row`): `&:focus-visible { … }` кольцо внутри строки тем же токеном, что у остальных фокусов (`data-s-kit-focus-inset` у корня это уже делает для детей; проверить на строке). Нативная вложенность, без новых правил верхнего уровня.
- [ ] Критерий 7 зонтичной спеки (Focus Not Obscured): строка с фокусом не уходит под липкую шапку и футер автосумм (`scroll-padding` уже задан у скроллера).
- [ ] Макет: состояние «строка в фокусе» в артбордах грида и `States` TreeList (по скилу синхронизации, в той же задаче).

#### E4. Playground и приёмка
- [ ] Автопроверки в `playground/src/grid-checks.ts`, `grouping-checks.ts`, `tree-list-checks.ts`: курсор по данным (атрибут `data-cursor` на строке, если владелец не против служебного атрибута; иначе через `document.activeElement`), End на 20 000 узлах до кадра меньше 50 мс (порог зафиксировать после первого замера), правка старой проверки порядка Tab (4а).
- [ ] Приёмка в Chrome настоящими клавишами (светлая и тёмная).
- [ ] Спеки: 4а решение 1 и раздел 6.1-подобный контракт для грида; зонтичная не-цель; TreeList раздел 1 (снять «стрелочная навигация не входит») и раздел 14.

### Риски E
- `focus()` на строке, которую окно смонтирует только после измерения: при переменной высоте строк `scrollToIndex` может промахнуться, нужен повтор в следующем кадре (как в `resetActive` ListBox: «сразу и в следующем кадре»).
- Липкие ячейки (`position: sticky`) и фокус на `tr`: кольцо фокуса на строке таблицы рисуется не во всех браузерах одинаково (догадка; в Safari `outline` на `tr` исторически капризен). Возможно, кольцо придётся рисовать псевдоэлементом первой ячейки.
- Читалки: `treegrid` с фокусом на строке читается по-разному в NVDA и VoiceOver; не проверяли ни один компонент кита в читалках.

---

## F. Сверка макета и кода (скил `solid-kit-design-sync`)

**Размер:** M. **Зависимости:** решения владельца по подписи «Итого» в группах (см. G) для пункта 1; иначе пункт придётся сверять дважды.

### Что не сверено (из скила, известно)
1. Строки автосумм (`GridTotals`, футер) и итогов группы (`GridGroupFooterRow`, подпись в заголовке группы).
2. Скелетон (`GridSkeleton`) и пустое состояние (`GridEmpty`, `emptyHint`, кнопка сброса).
3. Панели меню (`ContextMenu`): меню строки и меню колонки (пункты-переключатели).
4. Панель группировки с чипами (`GridGroupingPanel`, `GridGroupingChip`, призрак перетаскивания `GridDragGhost`).
5. Поля и выпадающие списки в ячейках (Input, Select, NumericInput внутри `td`, высота 32 против высоты контрола).
6. TreeList, артборд `States`: строка «Загрузка…» (`GridLoadingGroupRow`), скелетон с отступами по уровням, фокус на шевроне.

### Как сверять (порядок одного пункта)
- [ ] **Шаг 1. Макет.** `Artifact read` с `url` и `path`: для грида `https://claude.ai/artifact/AFrvb5qXSH82Bh7uV19nzz`, файлы `project/kit.css` и `project/Main.dc.html`; для TreeList `https://claude.ai/artifact/NhSBg1VyUhZrGd4qjKnLm8`, файлы `project/kit.css`, разметка артбордов `Main`, `Dark`, `States` (точные пути взять из `Artifact list` со `scope: "files"`). Файлы ложатся в scratchpad. Найти в разметке нужный фрагмент и классы, выписать значения из `kit.css`.
- [ ] **Шаг 2. Код.** Прочитать соответствующие правила `src/components/grid/grid.module.css` (и `context-menu/*.module.css`, `checkbox`, `input` для пунктов 3 и 5), выписать значения и токены из `src/styles/tokens.css`.
- [ ] **Шаг 3. Живой вид.** Playground в Chrome (`pnpm dev`, страницы «Грид», `#tree-list`, «Панели»): нужное состояние включить переключателем демо; снять вычисленные стили через `javascript_tool` (`getComputedStyle` у элемента: высота, отступы, цвет фона и текста, шрифт, радиус, тень, толщина линий) и скриншот в светлой и тёмной теме. Макет открыть в соседней вкладке и снять те же значения.
- [ ] **Шаг 4. Таблица расхождений.** Для пункта: «свойство | код | макет | кто прав | действие». Числа и токены прав код, замысел (чего нет в коде) прав макет; неясно, кто прав, → вопрос владельцу, а не молчаливый выбор.
- [ ] **Шаг 5. Правка.** Код: правка CSS по правилам вложенности, тест вида при необходимости, `pnpm check`, коммит. Макет: правка `kit.css` грида и разметки; **перед публикацией перечитать `project/canvas.json`** и не затирать размеры артбордов; `kit.css` TreeList это копия из артефакта грида (`files: {"project/kit.css": {"from": …}}`). Публикация `Artifact publish` с `url` и `root`.
- [ ] **Шаг 6. Отметка.** В скиле `~/.claude/skills/solid-kit-design-sync/SKILL.md` перенести пункт из «Не сверено» в «Синхронизировано <дата>: …»; в спеке компонента (раздел итогов) строка о сверке.

### Последовательность пунктов
1. Скелетон и пустое состояние (2): общие для грида и дерева, без открытых вопросов.
2. TreeList `States` (6): опирается на скелетон из пункта 1.
3. Панель группировки с чипами (4).
4. Панели `ContextMenu` (3): меню строки и колонки; общий вид панелей (`--s-kit-color-panel`, размытие) уже принят на этапе 2, сверять только содержимое.
5. Поля и списки в ячейках (5).
6. Автосуммы и итоги группы (1): после ответа владельца про подпись «Итого» в подвале группы.

Если в макете нужного состояния нет (догадка: панели меню и поля в ячейках в макете грида могут отсутствовать), оно дорисовывается в макете по коду (правило «дизайн это наш грид»: нового вида не выдумывать), в тех же классах `kit.css`.

### Критерий закрытия F
Для каждого из 6 пунктов есть таблица расхождений, все строки которой либо исправлены в обеих сторонах, либо вынесены вопросом владельцу; скриншоты светлой и тёмной темы сделаны; в скиле список «Не сверено» пуст или содержит только пункты с вопросом владельцу.

---

## G. Ждёт слова владельца (подробно не планируем)

- **Пуш 25 локальных коммитов** (`main` впереди `origin/main` на 25 на 2026-11-03 вечер: маска ввода пикеров и TreeList после `2efc8ed`, плюс пакетная подгрузка, когда её закоммитят). Нужно слово «пушь».
- **Теги.** Последний тег `v0.5.0` (этап 4а). Нет тегов этапа 4б, этапа 5 и `v1.0.0`. Нужно решить номера и момент (до или после хвостов этого плана).
- **Решения исполнителя этапа 4б** (`groupable` по умолчанию `false`, хранятся развёрнутые группы, все свёрнуты по умолчанию, пейджер по группам верхнего уровня, `GridColumn.groupValue`): код уже в `origin/main` (проверено: `e977df4` предок `origin/main`), но владелец их явно не подтверждал. Память `stage-4b-executor-decisions.md` устарела в части «не запушено». Нужно: подтвердить или назвать, что переделать.
- **Подпись «Итого» у групп.** У глобальных автосумм подписи убраны по слову владельца; у подвала группы осталась подпись «Итого: Колонка: значение» и `totalsLabelSpan` в заголовке. Нужно: убрать так же или оставить. Блокирует пункт 1 задачи F.
- **Анализ объединения `ContextMenu` и `ListBox`** (`unify-components-after-all-built.md`): отдельная задача «после всех компонентов». Нужно: сейчас (до `v1.0.0`) или позже. Попутно поправить зонтичную спеку (строки около 296, 306, 330, 454, 584 про «общий внутренний ListBox»).
- **Firefox и Safari, касание, IME, экранные читалки**: не проверено ни для одного этапа. Нужно: делать ли до `v1.0.0` и в каком объёме (рекомендация: Firefox и Safari хотя бы для Grid, TreeList и пикеров).
- **Невоспроизведённый сбой DatePicker** (диалог на странице открылся сам, раздел 14 спеки DatePicker): ждать повтора или искать целенаправленно (`onOpenChange` у закрытого `Dialog`).
- **`panelTab='move'` для DatePicker**: если владелец хочет, чтобы Tab и в DatePicker ходил по панели, это одна строка и правка спеки.

---

## Рекомендуемый порядок

1. **A (группы на данных)** первым: решений владельца не требует (рекомендованный вариант 2 ничего не ломает), закрывает тот же дефект, что пакетная подгрузка дерева, и переиспользует её планировщик. Начинать после того, как пакетная подгрузка дерева закоммичена.
2. **F (сверка)** параллельно с A: другие файлы (CSS и артефакты против логики), пункты 1–5 последовательности не ждут владельца; пункт 6 (автосуммы) после ответа про «Итого».
3. **D (постраничность)**: 10 минут после ответа владельца; при варианте 1 только строка в спеке.
4. **C (каскад)** и **B («развернуть все»)**: только после решений владельца; друг от друга не зависят, но оба правят `tree-list.tsx`, поэтому последовательно, не параллельно. Если владелец выберет вариант 2 для B, он маленький и идёт первым.
5. **E (клавиатура)** последним: самый большой, трогает почти все строки движка и Tab-порядок, лучше на стабильном коде после A и C. Блокирован решением про изменение решения 1 спеки 4а.
6. **G** по ходу: пуш и теги в любой момент по слову владельца; не смешивать пуш с незаконченными задачами.

Нельзя параллелить: A и E (оба правят `grid-base.tsx` и строки тела), B и C (оба `tree-list.tsx`), и ничего из A–E с работой агента пакетной подгрузки, пока она не закоммичена.

## Вопросы владельцу

1. Группы: делаю `onGroupsExpand(keys[])` рядом со старым `onGroupExpand` (рекомендую), или сразу меняю сигнатуру на массив? Есть ли уже потребители групп вне репозитория (BackOffice)?
2. «Развернуть все» в ленивом дереве: оставить выключенной / opt-in «лестницей» по уровням с лимитами / opt-in через страницу (`onExpandAll`, сервер отдаёт всё поддерево одним запросом)? Есть ли у BackOffice такой серверный метод?
3. Каскадный выбор в TreeList нужен сейчас (есть экран) или ждём первого экрана? Если нужен: дети, пришедшие после выбора родителя, выбираются автоматически (рекомендую)?
4. Главный чекбокс в TreeList сейчас выбирает только видимые (раскрытые) узлы. Оставить или выбирать всё загруженное дерево (рекомендую второе)?
5. Постраничность дерева в BackOffice: без страниц, весь список с виртуализацией (рекомендую) или по корням со всеми потомками?
6. Клавиатура: включаем курсор строки и стрелки в Grid и TreeList по умолчанию, меняя решение 1 спеки 4а (рекомендую), или opt-in, или после `v1.0.0`? Только строки, без навигации по ячейкам (рекомендую)? Enter на строке = `onRowDoubleClick`?
7. Подвал группы: убрать подпись «Итого» так же, как у глобальных автосумм?
8. Пушить 25 локальных коммитов сейчас? Какие теги ставить (этап 4б, этап 5, `v1.0.0`) и когда?
9. Решения исполнителя этапа 4б (уже в `origin/main`): подтверждаете?
10. Firefox/Safari и анализ объединения `ContextMenu`/`ListBox`: до `v1.0.0` или после?
