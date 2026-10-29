# solid-kit, этап 1: ButtonGroup — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** пятый компонент этапа 1. ButtonGroup: оболочка для двух-пяти `Button` с общим размером, заливкой `tint` под кнопками, кнопками на 4 px ниже оболочки и внутренним кольцом фокуса. В ряду «Контролы в ряд» оболочка стоит на одной линии с остальными контролами, высоты сегментов и кольцо внутри оболочки проверяются на странице, компонент входит в матрицу формы пакета.

**Архитектура:** плоский контейнер `div role="group"` без контекста; оболочка всегда ставит `data-s-kit-focus-inset` (работают токены кольца из `tokens.css`), размер раздаёт вложенным кнопкам как обёртка (`data-s-kit-size`); геометрию сегментов и состояния `plain` задаёт CSS группы селекторами `.root > [data-s-kit]` повышенной специфичности, поэтому порядок CSS Button и ButtonGroup в бандле не важен.

**Стек:** как в этапе 0 и предыдущих планах этапа 1.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (основной; раздел 3.4 описывает ButtonGroup, разделы 2 и 4 общие соглашения и страницу), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 4.1, 5, 5.1, 7, 11.1, 12).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане, не добавлять `LICENSE`, не менять git-идентичность. Тег `v0.2.0` ставится в конце всего этапа 1, не здесь.
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл (демо-компоненты playground тоже).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком `var(--s-kit-control-height, var(--s-kit-control-height-md))`).
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, `solid/reactivity` как ошибка), Stylelint (4 пробела, двойные кавычки, логические свойства; `pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome; окно должно быть в фокусе (клик по странице), иначе кольца фокуса дают ложные FAIL; Firefox и Safari не проверяются (записывается в отчёте).
- Начало плана: `git status` чистый, `pnpm check` зелёный (166 тестов).

---

### Task 1: Компонент ButtonGroup

**Files:**
- Create: `src/components/button-group/button-group.tsx`
- Create: `src/components/button-group/button-group.module.css`
- Create: `src/components/button-group/index.ts`
- Test: `src/components/button-group/button-group.test.tsx`

**Interfaces:**
- Consumes: ничего из кода кита (Button — только дети, подставляемые вызывающим); токены `tokens.css`.
- Produces: `ButtonGroup(props: ButtonGroupProps): JSX.Element`; типы `ButtonGroupProps`, `ButtonGroupSize`; публичный путь `@stark/solid-kit/button-group`; компонентные токены `--s-kit-button-group-padding`, `--s-kit-button-group-gap`, `--s-kit-button-group-radius`.

- [ ] **Step 1: Написать падающие тесты**

Создать `src/components/button-group/button-group.test.tsx` (в тестах Button берётся из соседней папки: это обычный ребёнок, а не зависимость компонента):

```tsx
import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from '../button';

import { ButtonGroup } from './button-group';

afterEach(cleanup);

describe('ButtonGroup', () => {
	it('renders a group with the kit root attributes and the inset focus ring marker', () => {
		render(() => (
			<ButtonGroup aria-label='Период'>
				<Button variant='plain'>День</Button>
				<Button variant='plain'>Неделя</Button>
			</ButtonGroup>
		));
		const group = screen.getByRole('group', { name: 'Период' });
		expect(group.tagName).toBe('DIV');
		expect(group.hasAttribute('data-s-kit')).toBe(true);
		expect(group.hasAttribute('data-s-kit-focus-inset')).toBe(true);
	});

	it('renders the buttons in order and keeps them clickable controls', () => {
		render(() => (
			<ButtonGroup aria-label='Период'>
				<Button variant='plain'>День</Button>
				<Button variant='plain'>Неделя</Button>
				<Button variant='plain'>Месяц</Button>
			</ButtonGroup>
		));
		const names = screen.getAllByRole('button').map((button) => button.textContent);
		expect(names).toEqual(['День', 'Неделя', 'Месяц']);
	});

	it('sets data-s-kit-size only when size is passed', () => {
		render(() => (
			<>
				<ButtonGroup aria-label='Без размера'><Button variant='plain'>А</Button></ButtonGroup>
				<ButtonGroup aria-label='Малая' size='sm'><Button variant='plain'>Б</Button></ButtonGroup>
			</>
		));
		expect(screen.getByRole('group', { name: 'Без размера' }).hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('group', { name: 'Малая' }).getAttribute('data-s-kit-size')).toBe('sm');
	});

	it('forwards class, style and native attributes', () => {
		render(() => (
			<ButtonGroup aria-label='Период' class='extra' style={{ 'margin-inline-start': '4px' }} data-testid='group'>
				<Button variant='plain'>День</Button>
			</ButtonGroup>
		));
		const group = screen.getByTestId('group');
		expect(group.classList.contains('extra')).toBe(true);
		expect(group.style.marginInlineStart).toBe('4px');
	});

	it('lets the role be overridden', () => {
		render(() => (
			<ButtonGroup role='toolbar' aria-label='Инструменты'>
				<Button variant='plain'>Один</Button>
			</ButtonGroup>
		));
		expect(screen.getByRole('toolbar', { name: 'Инструменты' })).toBeTruthy();
		expect(screen.queryByRole('group')).toBeNull();
	});
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm exec vitest run src/components/button-group`
Expected: FAIL, не найден модуль `./button-group`.

- [ ] **Step 3: Реализовать компонент**

Создать `src/components/button-group/button-group.tsx`:

```tsx
import styles from './button-group.module.css';

import { type JSX, splitProps } from 'solid-js';

export type ButtonGroupSize = 'sm' | 'md' | 'lg';

export interface ButtonGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
	size?: ButtonGroupSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
	const [local, rest] = splitProps(props, ['size', 'class', 'style']);

	return (
		<div
			role='group'
			{...rest}
			data-s-kit
			data-s-kit-size={local.size}
			data-s-kit-focus-inset
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		/>
	);
}
```

Создать `src/components/button-group/index.ts`:

```ts
export type { ButtonGroupProps, ButtonGroupSize } from './button-group';
export { ButtonGroup } from './button-group';
```

Создать `src/components/button-group/button-group.module.css`:

```css
/*
 * Компонентные токены ButtonGroup (публичный API кастомизации, читаются с фолбэком на глобальные):
 *   --s-kit-button-group-padding, --s-kit-button-group-gap, --s-kit-button-group-radius
 * Кнопки внутри обычные Button; группа владеет их высотой и радиусом. Правила для детей написаны как
 * .root > [data-s-kit]: специфичность выше, чем у правил Button, порядок CSS в бандле не важен.
 */

.root {
    display: inline-flex;
    flex: none;
    gap: var(--s-kit-button-group-gap, 2px);
    align-items: center;

    box-sizing: border-box;
    block-size: var(--s-kit-control-height, var(--s-kit-control-height-md));
    padding: var(--s-kit-button-group-padding, 2px);
    border-radius: var(--s-kit-button-group-radius, var(--s-kit-radius));

    background: var(--s-kit-color-tint);
}

.root > [data-s-kit] {
    block-size: calc(var(--s-kit-control-height, var(--s-kit-control-height-md)) - 2 * var(--s-kit-button-group-padding, 2px));
    border-radius: calc(var(--s-kit-button-group-radius, var(--s-kit-radius)) - var(--s-kit-button-group-padding, 2px));
}

.root > [data-s-kit][data-variant="plain"]:hover:not(:disabled) {
    background: var(--s-kit-button-bg-hover, var(--s-kit-color-tint-hover));
}

.root > [data-s-kit][data-variant="plain"]:active:not(:disabled) {
    background: var(--s-kit-button-bg-active, var(--s-kit-color-tint-active));
}
```

- [ ] **Step 4: Тесты проходят**

Run: `pnpm exec vitest run src/components/button-group`
Expected: PASS, 5 тестов. Если «lets the role be overridden» падает, убедиться, что `role='group'` стоит ДО `{...rest}`. Если `getByRole('group', { name })` не находит группу, проверить, что `aria-label` попал в `rest`.

- [ ] **Step 5: Полная проверка**

Run: `pnpm exec stylelint --fix src/components/button-group/button-group.module.css && pnpm exec eslint --fix src/components/button-group && pnpm check`
Expected: зелёный, 171 тест (было 166). Stylelint может разрешить или запретить длинную строку `calc(...)`; если ругается на формат, оставить вариант `--fix`. Правило «голое `var(--s-kit-control-height)`» должно пройти: везде есть фолбэк.

- [ ] **Step 6: Закоммитить**

```bash
git add src/components/button-group
git commit -m "feat: ButtonGroup, оболочка для кнопок с внутренним кольцом фокуса" -m "$TRAILERS"
```

---

### Task 2: Playground: ButtonGroup в рядах и проверки сегментов и кольца

**Files:**
- Modify: `playground/src/demo-controls.tsx`
- Modify: `playground/src/row-checks.ts`
- Modify: `playground/src/button-checks.ts`
- Modify: `playground/src/controls-row-page.tsx`

**Interfaces:**
- Consumes: `ButtonGroup` из `@stark/solid-kit/button-group`, `Button`; `DEMO_CONTROLS`, `renderFocusControls`.
- Produces: контрол `button-group` в `DEMO_CONTROLS` с атрибутами `data-row-control='button-group'` и `data-row-group`; проверка сегментов в `runRowChecks`; кольцо внутри оболочки у двух кнопок в обоих блоках фокуса; в `runButtonChecks` режим кольца определяется ближайшим `[data-s-kit-focus-inset]`, а фон под кольцом ищется вверх по предкам.

- [ ] **Step 1: Группа в реестре**

В `playground/src/demo-controls.tsx` добавить импорт `ButtonGroup` (после `Button`, по алфавиту путей) и запись в конец `DEMO_CONTROLS`:

```tsx
	{
		id: 'button-group',
		render: (size) => (
			<ButtonGroup data-row-control='button-group' data-row-group aria-label='Период' size={size}>
				<Button variant='plain'>День</Button>
				<Button variant='plain'>Неделя</Button>
				<Button variant='plain'>Месяц</Button>
			</ButtonGroup>
		)
	}
```

- [ ] **Step 2: Проверка сегментов в рядах**

В `playground/src/row-checks.ts` в цикле по контролам, сразу после блока `data-row-square`, добавить (4 px это удвоенный внутренний отступ 2 px по умолчанию, 2 px это сам отступ):

```ts
			if (control.hasAttribute('data-row-group')) {
				const offsets = [...control.children].map((child) => {
					const childRect = child.getBoundingClientRect();
					return { height: childRect.height, inset: childRect.top - rect.top };
				});
				results.push({
					name: `${rowId}: ${control.dataset['rowControl'] ?? '?'} (${size}) сегменты на 4 px ниже оболочки и на 2 px от края`,
					ok: offsets.every((item) => Math.abs(item.height - (rect.height - 4)) <= 0.01 && Math.abs(item.inset - 2) <= 0.01),
					detail: offsets.map((item) => `${item.height}px, отступ ${item.inset}px`).join('; ')
				});
			}
```

- [ ] **Step 3: Кольцо у сегментов и фон под ним**

В `playground/src/button-checks.ts`:
1. функцию `underlying` заменить на версию, которая поднимается по предкам до первой непрозрачной заливки (сегмент `plain` прозрачный, а под ним заливка оболочки):

```ts
/** Цвет под элементом: ближайшая непрозрачная заливка самого элемента или его предков, иначе поверхность страницы. */
function underlying(element: Element, surface: Rgba): Rgba {
	for (let current: Element | null = element; current; current = current.parentElement) {
		const fill = resolveColor(getComputedStyle(current).backgroundColor);
		if (fill[3] !== 0) {
			return fill;
		}
	}
	return surface;
}
```

2. в цикле по контролам блока фокуса заменить `const inset = mode === 'inset';` (перед циклом по контролам) на вычисление для каждого контрола: удалить строку перед внутренним циклом и первой строкой внутреннего цикла поставить

```ts
			const inset = control.closest('[data-s-kit-focus-inset]') !== null;
```

(в именах проверок `${mode}/${label}` остаётся прежним). Если после этого переменная `mode` используется только в именах, оставить как есть.

- [ ] **Step 4: Группа в блоках фокуса**

В `playground/src/controls-row-page.tsx`: добавить импорт `ButtonGroup` и в конец массива `renderFocusControls` добавить:

```tsx
		<ButtonGroup aria-label='Группа'>
			<Button variant='plain' data-focus-name='group-first'>Один</Button>
			<Button variant='plain' data-focus-name='group-second'>Два</Button>
		</ButtonGroup>
```

В заголовке раздела кольца фокуса дописать «, сегменты группы всегда внутри»: `<h2>Кольцо фокуса: снаружи и внутри контейнера с data-s-kit-focus-inset, сегменты группы всегда внутри</h2>`.

- [ ] **Step 5: Статическая проверка**

Run: `pnpm exec eslint --fix playground/src && pnpm check`
Expected: зелёный, 171 тест.

- [ ] **Step 6: Проверка в браузере (Chrome)**

`pnpm dev` в фоне (порт из вывода Vite, PID сохранить), открыть `<адрес>/#controls-row`, кликнуть по странице, нажать «Запустить проверки», проверить темы system, light, dark (после смены темы ждать 700 мс; в system вернуться через другую тему).
Expected в каждой теме:
- в каждом из пяти рядов группа из трёх кнопок стоит на одной линии с остальными контролами, верх и низ оболочки совпадают с соседями; под кнопками серая заливка оболочки со скруглением, сегменты на 4 px ниже и концентрично скруглены;
- **184 проверки, все OK** (было 162: +5 высот оболочки, +5 проверок сегментов, +12 колец у двух кнопок группы в двух блоках). Если число или результат другие, выяснить причину до коммита; если после замены `underlying` упали старые проверки колец, разобраться (возможно, фон блока фокуса теперь считается как фон под кольцом) и записать причину;
- глазами: наведение на сегмент заметно темнит его на оболочке; Tab на сегменте даёт кольцо внутри сегмента (не обрезано, не сдвигает соседей), в обоих блоках одинаково; консоль без ошибок.

Остановить dev-сервер по PID (после проверки cwd).

- [ ] **Step 7: Закоммитить**

```bash
git add playground
git commit -m "feat(playground): ButtonGroup в рядах, проверки сегментов и внутреннего кольца" -m "$TRAILERS"
```

---

### Task 3: ButtonGroup в матрице формы пакета

**Files:**
- Modify: `scripts/consumer/src/main.tsx`
- Modify: `scripts/verify-package-form.sh`

**Interfaces:**
- Consumes: путь `@stark/solid-kit/button-group`; токен `--s-kit-button-group-gap` как маркер стилей в собранном CSS.
- Produces: один новый пункт матрицы: стили ButtonGroup в CSS (порядок с Button не проверяется: специфичность правил группы выше, чем у Button).

- [ ] **Step 1: Потребитель импортирует ButtonGroup**

В `scripts/consumer/src/main.tsx` добавить `import { ButtonGroup } from '@stark/solid-kit/button-group';` (по порядку импортов, после `button`) и рядом с остальными элементами:

```tsx
			<ButtonGroup aria-label="Период">
				<Button variant="plain">День</Button>
				<Button variant="plain">Неделя</Button>
			</ButtonGroup>
```

- [ ] **Step 2: Проверка сборки**

В `scripts/verify-package-form.sh` после пункта про Field добавить:

```bash
grep -lq -- '--s-kit-button-group-gap' dist/assets/*.css && ok "ButtonGroup styles are in the built CSS" || fail "ButtonGroup styles are missing from the built CSS"
```

- [ ] **Step 3: Коммит и прогон матрицы**

Матрица ставит пакет по коммиту, поэтому сначала закоммитить:

```bash
git add scripts
git commit -m "test: ButtonGroup в матрице формы пакета" -m "$TRAILERS"
scripts/verify-package-form.sh "$(git rev-parse HEAD)"
```

Expected: все пункты OK, включая новый; `tsc` потребителя проходит на TypeScript 5.9.3 и 7.0.2.

- [ ] **Step 4: Удалить временный проект-потребитель**

Скрипт печатает `consumer project kept at: ...`; проверить, что каталог лежит вне репозитория, и удалить его (`git status` чистый).

---

### Task 4: Спеки и закрытие плана

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md`
- Modify: `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md`

- [ ] **Step 1: Перенести ButtonGroup из compound в плоские**

В `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md`, раздел 2 («Раскладка папки»): список плоских компонентов дополнить ButtonGroup, из списка compound убрать (остаются ToggleGroup, RadioGroup, Tabs). В `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md`, раздел 11.1 («Когда что»): то же (плоские: …, Field, ButtonGroup; compound: …, Tabs, ContextMenu, ToggleGroup, RadioGroup, …) с пометкой «(решение 2026-10-29, спек этапа 1, раздел 3.4)». Строку про ButtonGroup в таблице L1 зонтичного спека не менять.

- [ ] **Step 2: Итоги в спеке этапа**

В таблице порядка (раздел 1) у строки ButtonGroup добавить **Готов** и коммиты (`git log --oneline -4`). Добавить раздел «12. Итоги ButtonGroup (2026-10-29)» по образцу разделов 8–11: число проверок страницы (из Task 2 Step 6), что оболочка совпадает по верху и низу с соседями, сегменты на 4 px ниже и на 2 px от края во всех размерах, кольцо у сегментов внутри оболочки (и в блоке без `data-s-kit-focus-inset`), что замена `underlying` не изменила результаты старых проверок (или что изменила и почему), и список непроверенного (Firefox 125, Safari 17.5, hover мышью, `forced-colors`, группа из пяти кнопок и перенос при нехватке места: ширина группы не ограничивается). Если по ходу принималось решение, отличающееся от раздела 3.4, исправить раздел 3.4 тем же коммитом.

- [ ] **Step 3: Итоговая проверка и коммит**

Run: `pnpm check` и `git status` (чисто). Затем:

```bash
git add docs
git commit -m "docs: ButtonGroup готов, ButtonGroup переведён в плоские компоненты" -m "$TRAILERS"
```

Тег не ставится. Следующий компонент по порядку: ToggleGroup (compound поверх ButtonGroup).

---

## Самопроверка плана

- **Покрытие спека (раздел 3.4):** плоский контейнер без контекста и `role="group"` с переопределением (Task 1), `data-s-kit-focus-inset` всегда (Task 1, проверка кольца в Task 2), размер как обёртка (Task 1, высоты в Task 2), геометрия оболочки и сегментов 2 px/2 px/−4 px и концентрический радиус (Task 1 CSS, проверка сегментов Task 2), состояния `plain` поверх `tint` (Task 1 CSS, глазами в Task 2 Step 6), повышенная специфичность вместо зависимости от порядка CSS (Task 1 CSS, матрица Task 3 без проверки порядка), токены (Task 1, маркер в Task 3), перенос из compound в плоские (Task 4).
- **Типы:** `ButtonGroupSize` совпадает по значениям с `ButtonSize`; `data-row-group` читается в `row-checks.ts` через `hasAttribute`; `data-focus-name` у кнопок группы читается как `dataset['focusName']`; число проверок 184 выведено расчётом (5 + 5 + 12).
- **Известные риски:** замена `underlying` может изменить числа в старых проверках колец (Task 2 Step 3 и 6); `calc` с `2 *` в stylelint; `data-focus-name` у кнопок внутри группы должны быть уникальными в блоке; сегменты `plain` внутри группы получают hover `tint-hover`, различимость 9 уровней как у варианта `tinted` (принята владельцем для Button); ширина группы из 5 кнопок не ограничивается.
- **Не покрыто сознательно:** `disabled` на всей группе, вертикальная ориентация, скругление сегментов «вплотную» без зазора (зазор 2 px по спеку), автоматическое `variant='plain'` у вложенных кнопок.
