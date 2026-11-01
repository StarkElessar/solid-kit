# Этап 4б, пейджер, часть 2: компонент Pager. План реализации

> **Для исполнителя:** шаги отмечены чекбоксами (`- [ ]`). Задачи выполняются по порядку, в каждой сначала тест (красный), потом код (зелёный), потом `pnpm check` и коммит. Код возврата `pnpm check` проверяется отдельной командой.

**Цель:** отдельный компонент `Pager` (подпуть `@stark/solid-kit/pager`): кнопки навигации, ряд номеров с пропусками, выбор размера страницы, сводка, «Обновить», состояние загрузки, управление фокусом.

**Архитектура:** `Pager` хранит только `page` и `pageSize` (пары controlled/uncontrolled через `createControllableSignal`), всё остальное выводит чистыми функциями части 1. Иконки это объект «имя → path» и один компонент `PagerIcon`. Ряд номеров вынесен в `PagerPageButtons` и ключуется по номеру страницы, чтобы нажатая кнопка не пересоздавалась (фокус и кольцо не пропадают). Фокус при блокировке ведёт `Pager`: запоминает последнюю сфокусированную кнопку, при `loading` держит фокус на корне `<nav tabindex="-1">`, после загрузки и на границах возвращает его на кнопку или на текущую страницу.

**Стек:** Solid 1.9, CSS Modules с нативной вложенностью, vitest 5 (jsdom), готовые `Button`, `IconButton`, `Select`.

**Спек:** `docs/superpowers/specs/2026-11-01-stage-4b-pager-design.md` (разделы 2.1, 4, 5, 6, 7). Часть 1: `2026-11-01-stage-4b-pager-pure-functions.md` (выполнена).

## Глобальные ограничения

- Репозиторий публичный: ни ключей, ни токенов, ни `.env`, ни корпоративной почты в коммитах.
- Один класс/функция/компонент — один файл (kebab-case).
- ESLint: табы, одинарные кавычки, длина строки ≤ 140 вместе с комментариями, без комментариев в конце строки; пропсы не деструктурируются; `exactOptionalPropertyTypes`: у необязательных свойств тип `| undefined`.
- CSS: нативная вложенность везде, где возможно (явный `&`, без `&-suffix`, состояния и `@media` внутри правила блока), без литералов цвета, без `outline: none/0`; после правки `pnpm exec stylelint --fix "src/**/*.css"` (порядок свойств).
- Тексты по умолчанию на русском. Без проверок jsdom в боевом коде.
- pnpm запускается как `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`.
- Тег не ставится и ничего не пушится без отдельного слова владельца.
- Коммит с трейлерами: `T=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "…" -m "$T"`.

## Решения

1. Корень `<nav>` всегда несёт `data-s-kit`, `data-s-kit-focus-inset`, `tabindex="-1"`. `size` (`sm`/`md`/`lg`) идёт в `data-s-kit-size` корня и в кнопки и `Select`.
2. Размер страницы `Select` получает элементы `mergePageSizes(pageSizes, pageSize)`; значение это число, `getKey` и `getLabel` строят ключ и подпись из числа.
3. Страница `page` показывается зажатой (`clampPage`), но колбэк при зажатии не вызывается. Клик по текущей странице колбэк не вызывает.
4. Смена размера: `setPageSize(size)`, затем `setPage(новая)`, если `pageForSizeChange` дал другую страницу.
5. Фокус (раздел 4.4 спека): `hadFocus` — фокус был внутри `<nav>` (кнопка, выбор); ставится по `focusin`, сбрасывается по `focusout`, кроме случая, когда уходящая кнопка уже `disabled` (браузер сбрасывает фокус с отключаемой кнопки, это не уход пользователя). Эффект на `[atStart, atEnd, loading]`: при `loading` фокус на корень; иначе, если активный элемент не годится (корень, отключён, вне `<nav>`), фокус на последнюю сфокусированную кнопку, если она доступна, иначе на кнопку текущей страницы.
6. Токены (публичный API): `--s-kit-pager-gap` (8px), `--s-kit-pager-padding` (`6px 10px`), `--s-kit-pager-bg` (прозрачный), `--s-kit-pager-select-width` (`6.5rem`, пишется в `--s-kit-select-width`).

---

### Task 1: Типы, подписи, иконки

**Files:**
- Create: `src/components/pager/pager-labels.ts`, `src/components/pager/default-pager-labels.ts`, `src/components/pager/pager-props.ts`
- Create: `src/components/pager/pager-icon-paths.ts`, `src/components/pager/pager-icon.tsx`
- Test: `src/components/pager/pager-icon.test.tsx`

**Interfaces:**
- Consumes: `PagerRange` (`./pager-range`), `ButtonSize` из `../button`.
- Produces: `PagerLabels`, `DEFAULT_PAGER_LABELS`, `PagerProps`, `PAGER_ICON_PATHS`, `PagerIconName`, `PagerIcon(props: { name: PagerIconName; class?: string | undefined })`.

- [ ] **Step 1: Тест (красный)**

`src/components/pager/pager-icon.test.tsx`:

```tsx
import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';

import { PAGER_ICON_PATHS } from './pager-icon-paths';
import { PagerIcon } from './pager-icon';

afterEach(cleanup);

describe('PagerIcon', () => {
	it('рисует path из объекта по имени, скрыт от скринридера, цвет текущий', () => {
		const { container } = render(() => <PagerIcon name='next'/>);
		const svg = container.querySelector('svg');
		const path = container.querySelector('path');
		expect(svg?.getAttribute('aria-hidden')).toBe('true');
		expect(svg?.getAttribute('viewBox')).toBe('0 0 16 16');
		expect(path?.getAttribute('d')).toBe(PAGER_ICON_PATHS.next);
		expect(path?.getAttribute('stroke')).toBe('currentColor');
	});

	it('у каждого имени своя непустая геометрия', () => {
		const paths = Object.values(PAGER_ICON_PATHS);
		expect(paths).toHaveLength(5);
		expect(new Set(paths).size).toBe(5);
		expect(paths.every((path) => path.length > 0)).toBe(true);
	});

	it('передаёт класс', () => {
		const { container } = render(() => <PagerIcon name='refresh' class='x'/>);
		expect(container.querySelector('svg')?.getAttribute('class')).toBe('x');
	});
});
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager/pager-icon`
Expected: FAIL (модули не найдены).

- [ ] **Step 3: Реализация**

`src/components/pager/pager-labels.ts`:

```ts
/** Тексты пейджера; по умолчанию на русском (`DEFAULT_PAGER_LABELS`). */
export interface PagerLabels {
	/** Имя области навигации. */
	navigation: string;
	first: string;
	previous: string;
	next: string;
	last: string;
	/** Подпись кнопки номера страницы. */
	page: (page: number) => string;
	/** Подпись выбора размера страницы. */
	pageSize: string;
	refresh: string;
}
```

`src/components/pager/default-pager-labels.ts`:

```ts
import type { PagerLabels } from './pager-labels';

export const DEFAULT_PAGER_LABELS: PagerLabels = {
	navigation: 'Постраничная навигация',
	first: 'В начало',
	previous: 'Назад',
	next: 'Вперёд',
	last: 'В конец',
	page: (page) => `Страница ${page}`,
	pageSize: 'Размер страницы',
	refresh: 'Обновить'
};
```

`src/components/pager/pager-props.ts`:

```ts
import type { JSX } from 'solid-js';

import type { ButtonSize } from '../button';

import type { PagerLabels } from './pager-labels';
import type { PagerRange } from './pager-range';

export interface PagerProps {
	/** Всего записей. */
	total: number;
	/** Страница с 1. Страница за границами показывается зажатой, колбэк при этом не вызывается. */
	page?: number | undefined;
	defaultPage?: number | undefined;
	onPageChange?: ((page: number) => void) | undefined;
	pageSize?: number | undefined;
	/** По умолчанию первый из `pageSizes`. */
	defaultPageSize?: number | undefined;
	/** При смене вызывается `onPageSizeChange`, затем `onPageChange`, если первая запись страницы переехала на другую страницу. */
	onPageSizeChange?: ((size: number) => void) | undefined;
	/** Размеры страницы в выборе (10, 20, 50, 200, 500, 1000, 2000); текущий размер вне списка добавляется к нему. */
	pageSizes?: readonly number[] | undefined;
	/** Кнопка «Обновить» показывается только если колбэк передан. */
	onRefresh?: (() => void) | undefined;
	/** Идёт загрузка: всё недоступно, значок обновления вращается. */
	loading?: boolean | undefined;
	labels?: Partial<PagerLabels> | undefined;
	/** По умолчанию «Записей 21–40 из 1 250». */
	summaryText?: ((range: PagerRange) => string) | undefined;
	size?: ButtonSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}
```

`src/components/pager/pager-icon-paths.ts`:

```ts
/** Геометрия значков пейджера для `viewBox="0 0 16 16"`: штрих `currentColor`, ширина 1.6, скруглённые концы (как у стрелки сортировки). */
export const PAGER_ICON_PATHS = {
	first: 'M4 3v10M12 3L7 8l5 5',
	previous: 'M10 3L5 8l5 5',
	next: 'M6 3l5 5-5 5',
	last: 'M12 3v10M4 3l5 5-5 5',
	refresh: 'M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3'
} as const;

export type PagerIconName = keyof typeof PAGER_ICON_PATHS;
```

`src/components/pager/pager-icon.tsx`:

```tsx
import type { JSX } from 'solid-js';

import { PAGER_ICON_PATHS, type PagerIconName } from './pager-icon-paths';

export interface PagerIconProps {
	name: PagerIconName;
	class?: string | undefined;
}

/** Значок пейджера: один компонент на все значки, геометрия берётся из `PAGER_ICON_PATHS`. */
export function PagerIcon(props: PagerIconProps): JSX.Element {
	return (
		<svg class={props.class} viewBox='0 0 16 16' aria-hidden='true'>
			<path
				d={PAGER_ICON_PATHS[props.name]}
				fill='none'
				stroke='currentColor'
				stroke-width='1.6'
				stroke-linecap='round'
				stroke-linejoin='round'
			/>
		</svg>
	);
}
```

- [ ] **Step 4: Тесты зелёные**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager/pager-icon`
Expected: PASS.

- [ ] **Step 5: Проверка и коммит**

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo exit=$?
```
Expected: `exit=0`. Затем:

```bash
git add src/components/pager && git commit -m "feat(pager): типы, подписи и значки в виде объекта путей" -m "$T"
```

---

### Task 2: Ряд номеров `PagerPageButtons`

**Files:**
- Create: `src/components/pager/pager-page-buttons.tsx`
- Test: `src/components/pager/pager-page-buttons.test.tsx`

**Interfaces:**
- Consumes: `PagerItem`, `Button`, `ButtonSize`.
- Produces: `PagerPageButtons(props: { items: readonly PagerItem[]; current: number; pageLabel: (page: number) => string; disabled: boolean; size: ButtonSize | undefined; onSelect: (page: number) => void })`. Стили берёт из `pager.module.css` (создаётся в задаче 3): классы `pages`, `gap`.

- [ ] **Step 1: Тест (красный)**

`src/components/pager/pager-page-buttons.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPageItems } from './get-page-items';
import { PagerPageButtons } from './pager-page-buttons';

afterEach(cleanup);

function renderButtons(current: number, count: number, onSelect = vi.fn(), disabled = false) {
	return render(() => (
		<PagerPageButtons
			items={getPageItems(current, count)}
			current={current}
			pageLabel={(page) => `Страница ${page}`}
			disabled={disabled}
			size={undefined}
			onSelect={onSelect}
		/>
	));
}

describe('PagerPageButtons', () => {
	it('кнопки страниц, у текущей aria-current, многоточие не кнопка и скрыто', () => {
		const { container } = renderButtons(10, 20);
		const buttons = screen.getAllByRole('button');
		expect(buttons.map((button) => button.textContent)).toEqual(['1', '9', '10', '11', '20']);
		expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
			'Страница 1',
			'Страница 9',
			'Страница 10',
			'Страница 11',
			'Страница 20'
		]);
		expect(screen.getByRole('button', { name: 'Страница 10' }).getAttribute('aria-current')).toBe('page');
		expect(screen.getByRole('button', { name: 'Страница 9' }).hasAttribute('aria-current')).toBe(false);
		const gaps = container.querySelectorAll('[data-pager-gap]');
		expect(gaps).toHaveLength(2);
		expect([...gaps].every((gap) => gap.getAttribute('aria-hidden') === 'true')).toBe(true);
	});

	it('клик по странице зовёт onSelect, по текущей тоже (решает Pager)', () => {
		const onSelect = vi.fn();
		renderButtons(10, 20, onSelect);
		fireEvent.click(screen.getByRole('button', { name: 'Страница 11' }));
		expect(onSelect).toHaveBeenCalledWith(11);
	});

	it('disabled отключает все кнопки', () => {
		renderButtons(1, 3, vi.fn(), true);
		expect(screen.getAllByRole('button').every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
	});

	it('кнопка той же страницы не пересоздаётся при смене текущей: фокус сохраняется', () => {
		const [current, setCurrent] = createSignal(10);
		render(() => (
			<PagerPageButtons
				items={getPageItems(current(), 20)}
				current={current()}
				pageLabel={(page) => `Страница ${page}`}
				disabled={false}
				size={undefined}
				onSelect={vi.fn()}
			/>
		));
		const eleven = screen.getByRole('button', { name: 'Страница 11' });
		eleven.focus();
		setCurrent(11);
		expect(screen.getByRole('button', { name: 'Страница 11' })).toBe(eleven);
		expect(document.activeElement).toBe(eleven);
		expect(eleven.getAttribute('aria-current')).toBe('page');
	});
});
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager/pager-page-buttons`
Expected: FAIL (модуль не найден).

- [ ] **Step 3: Реализация**

Создать пока минимальный `src/components/pager/pager.module.css` (дополняется в задаче 3):

```css
.pages {
    display: contents;
}

.gap {
    user-select: none;
    min-inline-size: 1.5em;
    color: var(--s-kit-color-text-muted);
    text-align: center;
}
```

Если токена `--s-kit-color-text-muted` нет в `src/styles/tokens.css`, взять существующий приглушённый токен текста (`grep -n "text-" src/styles/tokens.css`).

`src/components/pager/pager-page-buttons.tsx`:

```tsx
import styles from './pager.module.css';

import { createMemo, For, type JSX } from 'solid-js';

import { Button, type ButtonSize } from '../button';

import type { PagerItem } from './pager-item';

export interface PagerPageButtonsProps {
	items: readonly PagerItem[];
	current: number;
	pageLabel: (page: number) => string;
	disabled: boolean;
	size: ButtonSize | undefined;
	onSelect: (page: number) => void;
}

/**
 * Ряд номеров страниц. Ключ элемента это сам номер (у многоточия отрицательный по позиции): `For` ключуется по значению, поэтому кнопка
 * страницы, которая осталась в ряду, не пересоздаётся при смене текущей и не теряет фокус.
 */
export function PagerPageButtons(props: PagerPageButtonsProps): JSX.Element {
	const keys = createMemo(() => props.items.map((item, index) => (item.kind === 'page' ? item.page : -(index + 1))));

	return (
		<span class={styles['pages']}>
			<For each={keys()}>
				{(key) =>
					key > 0
						? (
							<Button
								variant={key === props.current ? 'tinted' : 'plain'}
								size={props.size}
								disabled={props.disabled}
								aria-label={props.pageLabel(key)}
								aria-current={key === props.current ? 'page' : undefined}
								onClick={() => {
									props.onSelect(key);
								}}
							>{key}</Button>
						)
						: <span class={styles['gap']} data-pager-gap aria-hidden='true'>…</span>}
			</For>
		</span>
	);
}
```

- [ ] **Step 4: Тесты зелёные**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager/pager-page-buttons`
Expected: PASS.

- [ ] **Step 5: Проверка и коммит**

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec stylelint --fix "src/**/*.css"
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo exit=$?
```
Expected: `exit=0`. Затем:

```bash
git add src/components/pager && git commit -m "feat(pager): ряд номеров страниц с устойчивыми кнопками" -m "$T"
```

---

### Task 3: Компонент `Pager`: поведение

**Files:**
- Create: `src/components/pager/pager.tsx`, `src/components/pager/index.ts`
- Modify: `src/components/pager/pager.module.css` (полная раскладка)
- Test: `src/components/pager/pager.test.tsx`

**Interfaces:**
- Consumes: всё из части 1 и задач 1–2.
- Produces: `Pager(props: PagerProps): JSX.Element`; `index.ts` экспортирует `Pager`, типы `PagerProps`, `PagerLabels`, `PagerRange`.

- [ ] **Step 1: Тесты (красные)**

`src/components/pager/pager.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { installListGeometry } from '../../internal/testing/list-geometry';

import { Pager, type PagerProps } from './index';

const showPopover = vi.fn(function (this: HTMLElement) {
	this.removeAttribute('popover');
});

beforeEach(() => {
	// jsdom не реализует Popover API: «показ» снимает атрибут, чтобы содержимое списка было доступно
	HTMLElement.prototype.showPopover = showPopover;
	HTMLElement.prototype.hidePopover = vi.fn();
	installListGeometry({ rowHeight: 20, viewportHeight: 100 });
	vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);
});

afterEach(cleanup);

function plain(text: string | null): string {
	return (text ?? '').replace(/\s/g, ' ');
}

function button(name: string): HTMLButtonElement {
	return screen.getByRole('button', { name }) as HTMLButtonElement;
}

function current(): string {
	return document.querySelector('[aria-current="page"]')?.textContent ?? '';
}

function renderPager(props: Partial<PagerProps> = {}) {
	return render(() => <Pager total={1250} defaultPageSize={20} {...props}/>);
}

describe('Pager: разметка', () => {
	it('nav с подписью, кнопки с русскими подписями, сводка и размер страницы', () => {
		renderPager({ onRefresh: vi.fn() });
		expect(screen.getByRole('navigation', { name: 'Постраничная навигация' })).toBeTruthy();
		for (const name of ['В начало', 'Назад', 'Вперёд', 'В конец', 'Обновить', 'Страница 1']) {
			expect(button(name)).toBeTruthy();
		}
		expect(plain(screen.getByRole('navigation').querySelector('[data-pager-summary]')?.textContent ?? '')).toBe('Записей 1–20 из 1 250');
		expect(screen.getByRole('combobox', { name: 'Размер страницы' }).textContent).toBe('20');
		expect(screen.getByRole('navigation').hasAttribute('data-s-kit-focus-inset')).toBe(true);
	});

	it('«Обновить» только при onRefresh', () => {
		renderPager();
		expect(screen.queryByRole('button', { name: 'Обновить' })).toBeNull();
	});

	it('labels и summaryText переопределяют тексты', () => {
		renderPager({
			labels: { navigation: 'Pages', next: 'Next', page: (page) => `P${page}` },
			summaryText: (range) => `${range.from}-${range.to}/${range.total}`
		});
		expect(screen.getByRole('navigation', { name: 'Pages' })).toBeTruthy();
		expect(button('Next')).toBeTruthy();
		expect(button('P1')).toBeTruthy();
		expect(screen.getByRole('navigation').querySelector('[data-pager-summary]')?.textContent).toBe('1-20/1250');
	});

	it('размер вне списка остаётся выбираемым значением', () => {
		renderPager({ defaultPageSize: 25 });
		expect(screen.getByRole('combobox').textContent).toBe('25');
	});
});

describe('Pager: навигация', () => {
	it('на первой странице «В начало» и «Назад» недоступны, на последней «Вперёд» и «В конец»', () => {
		renderPager({ defaultPage: 1 });
		expect(button('В начало').disabled).toBe(true);
		expect(button('Назад').disabled).toBe(true);
		expect(button('Вперёд').disabled).toBe(false);
		cleanup();
		renderPager({ defaultPage: 63 });
		expect(button('Вперёд').disabled).toBe(true);
		expect(button('В конец').disabled).toBe(true);
		expect(button('Назад').disabled).toBe(false);
	});

	it('кнопки двигают страницу и зовут onPageChange', () => {
		const onPageChange = vi.fn();
		renderPager({ onPageChange });
		fireEvent.click(button('Вперёд'));
		expect(current()).toBe('2');
		fireEvent.click(button('Страница 3'));
		expect(current()).toBe('3');
		fireEvent.click(button('Назад'));
		expect(current()).toBe('2');
		fireEvent.click(button('В конец'));
		expect(current()).toBe('63');
		fireEvent.click(button('В начало'));
		expect(current()).toBe('1');
		expect(onPageChange.mock.calls.map((call) => call[0])).toEqual([2, 3, 2, 63, 1]);
	});

	it('клик по текущей странице колбэк не зовёт', () => {
		const onPageChange = vi.fn();
		renderPager({ onPageChange });
		fireEvent.click(button('Страница 1'));
		expect(onPageChange).not.toHaveBeenCalled();
	});

	it('контролируемая страница меняется только вместе с пропом', () => {
		const onPageChange = vi.fn();
		const [page, setPage] = createSignal(1);
		renderPager({ page: page(), onPageChange });
		render(() => <Pager total={1250} page={page()} defaultPageSize={20} onPageChange={onPageChange}/>);
		fireEvent.click(screen.getAllByRole('button', { name: 'Вперёд' })[1] as HTMLElement);
		expect(onPageChange).toHaveBeenCalledWith(2);
		expect(document.querySelectorAll('[aria-current="page"]')[1]?.textContent).toBe('1');
		setPage(2);
		expect(document.querySelectorAll('[aria-current="page"]')[1]?.textContent).toBe('2');
	});

	it('страница за границами показывается зажатой без вызова колбэка', () => {
		const onPageChange = vi.fn();
		const [total, setTotal] = createSignal(1000);
		render(() => <Pager total={total()} page={50} defaultPageSize={10} onPageChange={onPageChange}/>);
		expect(current()).toBe('50');
		setTotal(25);
		expect(current()).toBe('3');
		expect(plain(document.querySelector('[data-pager-summary]')?.textContent ?? '')).toBe('Записей 21–25 из 25');
		expect(onPageChange).not.toHaveBeenCalled();
	});

	it('пустая выборка: одна страница, навигация недоступна, сводка «Записей 0»', () => {
		renderPager({ total: 0 });
		for (const name of ['В начало', 'Назад', 'Вперёд', 'В конец']) {
			expect(button(name).disabled).toBe(true);
		}
		expect(document.querySelector('[data-pager-summary]')?.textContent).toBe('Записей 0');
		expect(current()).toBe('1');
	});
});

describe('Pager: размер страницы', () => {
	function chooseNext(): void {
		const trigger = screen.getByRole('combobox');
		trigger.focus();
		fireEvent.keyDown(trigger, { key: 'ArrowDown' });
		fireEvent.keyDown(trigger, { key: 'ArrowDown' });
		fireEvent.keyDown(trigger, { key: 'Enter' });
	}

	it('смена размера зовёт onPageSizeChange, затем onPageChange с сохранением первой записи', () => {
		const order: string[] = [];
		renderPager({
			total: 1000,
			defaultPage: 3,
			defaultPageSize: 10,
			pageSizes: [10, 20, 50],
			onPageSizeChange: (size) => order.push(`size ${size}`),
			onPageChange: (page) => order.push(`page ${page}`)
		});
		chooseNext();
		expect(screen.getByRole('combobox').textContent).toBe('20');
		expect(current()).toBe('2');
		expect(order).toEqual(['size 20', 'page 2']);
	});

	it('если страница не меняется, onPageChange не зовётся', () => {
		const onPageChange = vi.fn();
		renderPager({ total: 1000, defaultPage: 1, defaultPageSize: 10, pageSizes: [10, 20, 50], onPageChange });
		chooseNext();
		expect(screen.getByRole('combobox').textContent).toBe('20');
		expect(onPageChange).not.toHaveBeenCalled();
	});
});

describe('Pager: загрузка и фокус', () => {
	it('loading отключает всё, включая размер и «Обновить», и вращает значок', () => {
		const { container } = renderPager({ loading: true, onRefresh: vi.fn(), defaultPage: 3 });
		for (const element of screen.getAllByRole('button')) {
			expect((element as HTMLButtonElement).disabled).toBe(true);
		}
		expect((screen.getByRole('combobox') as HTMLButtonElement).disabled).toBe(true);
		expect(container.querySelector('[data-pager-refresh] svg')?.getAttribute('class')).toBeTruthy();
	});

	it('«Вперёд» на предпоследней странице: фокус уходит на кнопку текущей страницы', () => {
		renderPager({ total: 30, defaultPageSize: 10, defaultPage: 2 });
		const next = button('Вперёд');
		next.focus();
		fireEvent.click(next);
		expect(next.disabled).toBe(true);
		expect(document.activeElement).toBe(button('Страница 3'));
	});

	it('фокус не уходит со своего места, если пользователь был вне пейджера', () => {
		const outside = document.createElement('input');
		document.body.append(outside);
		renderPager({ total: 30, defaultPageSize: 10, defaultPage: 2 });
		fireEvent.click(button('Вперёд'));
		outside.focus();
		expect(document.activeElement).toBe(outside);
		outside.remove();
	});

	it('на время загрузки фокус держит корень, после загрузки возвращается на ту же кнопку', () => {
		const [loading, setLoading] = createSignal(false);
		render(() => <Pager total={100} defaultPageSize={10} defaultPage={5} loading={loading()}/>);
		const next = button('Вперёд');
		next.focus();
		setLoading(true);
		expect(document.activeElement).toBe(screen.getByRole('navigation'));
		setLoading(false);
		expect(document.activeElement).toBe(next);
	});

	it('загрузка, закончившаяся на границе: фокус на текущей странице', () => {
		const [loading, setLoading] = createSignal(false);
		const [page, setPage] = createSignal(9);
		render(() => <Pager total={100} defaultPageSize={10} page={page()} loading={loading()}/>);
		const next = button('Вперёд');
		next.focus();
		setLoading(true);
		setPage(10);
		setLoading(false);
		expect(next.disabled).toBe(true);
		expect(document.activeElement).toBe(button('Страница 10'));
	});
});
```

В тесте «контролируемая страница…» лишний первый `renderPager({ page: page() ...})` убрать при реализации: оставить один рендер контролируемого `Pager` и обращаться к его элементам без индексов.

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager/pager.test`
Expected: FAIL (`./index` не найден).

- [ ] **Step 3: Реализация**

`src/components/pager/pager.tsx`:

```tsx
import styles from './pager.module.css';

import { createEffect, createMemo, type JSX, on, Show } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { Select } from '../select';

import { clampPage } from './clamp-page';
import { DEFAULT_PAGE_SIZES } from './default-page-sizes';
import { DEFAULT_PAGER_LABELS } from './default-pager-labels';
import { defaultSummaryText } from './default-summary-text';
import { getPageItems } from './get-page-items';
import { mergePageSizes } from './merge-page-sizes';
import { pageCount } from './page-count';
import { pageForSizeChange } from './page-for-size-change';
import { pageRange } from './page-range';
import { PagerIcon } from './pager-icon';
import { PagerPageButtons } from './pager-page-buttons';
import type { PagerProps } from './pager-props';

const FALLBACK_PAGE_SIZE = 10;

function isDisabled(element: Element): boolean {
	return element instanceof HTMLButtonElement && element.disabled;
}

/**
 * Пейджер: навигация по страницам, размер страницы, сводка и «Обновить». Хранит только страницу и размер; строки не режет
 * (спек этапа 4б, пейджер). Страница с номером за границами показывается зажатой без вызова колбэка.
 */
export function Pager(props: PagerProps): JSX.Element {
	const sizes = (): readonly number[] => props.pageSizes ?? DEFAULT_PAGE_SIZES;
	const labels = createMemo(() => ({ ...DEFAULT_PAGER_LABELS, ...props.labels }));

	const [page, setPage] = createControllableSignal<number>({
		name: 'Pager',
		value: () => props.page,
		defaultValue: () => props.defaultPage ?? 1,
		onChange: (next) => props.onPageChange?.(next)
	});
	const [pageSize, setPageSize] = createControllableSignal<number>({
		name: 'Pager',
		value: () => props.pageSize,
		defaultValue: () => props.defaultPageSize ?? sizes()[0] ?? FALLBACK_PAGE_SIZE,
		onChange: (next) => props.onPageSizeChange?.(next)
	});

	const count = createMemo(() => pageCount(props.total, pageSize()));
	const shown = createMemo(() => clampPage(page(), count()));
	const items = createMemo(() => getPageItems(shown(), count()));
	const summary = createMemo(() => (props.summaryText ?? defaultSummaryText)(pageRange(shown(), pageSize(), props.total)));
	const sizeItems = createMemo(() => mergePageSizes(sizes(), pageSize()));
	const loading = (): boolean => props.loading === true;
	const atStart = (): boolean => shown() <= 1;
	const atEnd = (): boolean => shown() >= count();

	const goTo = (target: number): void => {
		const next = clampPage(target, count());
		if (next !== shown()) {
			setPage(next);
		}
	};
	const changeSize = (size: number): void => {
		if (size === pageSize()) {
			return;
		}
		const next = pageForSizeChange(shown(), pageSize(), size);
		setPageSize(size);
		if (next !== shown()) {
			setPage(next);
		}
	};

	// фокус: см. решение 5 плана; `hadFocus` переживает отключение сфокусированной кнопки, но не уход пользователя
	let nav: HTMLElement | undefined;
	let lastFocused: HTMLElement | undefined;
	let hadFocus = false;

	const restoreFocus = (): void => {
		if (nav === undefined || !hadFocus) {
			return;
		}
		if (loading()) {
			nav.focus();
			return;
		}
		const active = document.activeElement;
		if (active instanceof HTMLElement && active !== nav && nav.contains(active) && !isDisabled(active)) {
			return;
		}
		const keep = lastFocused !== undefined && nav.contains(lastFocused) && !isDisabled(lastFocused);
		const target = keep ? lastFocused : nav.querySelector<HTMLElement>('[aria-current="page"]');
		target?.focus();
	};

	createEffect(on([atStart, atEnd, loading], restoreFocus, { defer: true }));

	return (
		<nav
			ref={nav}
			data-s-kit
			data-s-kit-focus-inset
			data-s-kit-size={props.size}
			tabindex='-1'
			aria-label={labels().navigation}
			class={props.class ? `${styles['root']} ${props.class}` : styles['root']}
			style={props.style}
			onFocusIn={(event) => {
				if (event.target !== nav) {
					lastFocused = event.target as HTMLElement;
				}
				hadFocus = true;
			}}
			onFocusOut={(event) => {
				if (!isDisabled(event.target as Element)) {
					hadFocus = false;
				}
			}}
		>
			<div class={styles['start']}>
				<span class={styles['buttons']}>
					<IconButton
						variant='plain'
						size={props.size}
						aria-label={labels().first}
						disabled={loading() || atStart()}
						onClick={() => {
							goTo(1);
						}}
					><PagerIcon name='first'/></IconButton>
					<IconButton
						variant='plain'
						size={props.size}
						aria-label={labels().previous}
						disabled={loading() || atStart()}
						onClick={() => {
							goTo(shown() - 1);
						}}
					><PagerIcon name='previous'/></IconButton>
					<PagerPageButtons
						items={items()}
						current={shown()}
						pageLabel={labels().page}
						disabled={loading()}
						size={props.size}
						onSelect={goTo}
					/>
					<IconButton
						variant='plain'
						size={props.size}
						aria-label={labels().next}
						disabled={loading() || atEnd()}
						onClick={() => {
							goTo(shown() + 1);
						}}
					><PagerIcon name='next'/></IconButton>
					<IconButton
						variant='plain'
						size={props.size}
						aria-label={labels().last}
						disabled={loading() || atEnd()}
						onClick={() => {
							goTo(count());
						}}
					><PagerIcon name='last'/></IconButton>
				</span>
				<Select<number>
					items={sizeItems()}
					getKey={(size) => size}
					getLabel={(size) => String(size)}
					value={pageSize()}
					onValueChange={(size) => {
						if (size !== null) {
							changeSize(size);
						}
					}}
					disabled={loading()}
					size={props.size}
					aria-label={labels().pageSize}
				/>
			</div>
			<div class={styles['end']}>
				<span class={styles['summary']} data-pager-summary>{summary()}</span>
				<Show when={props.onRefresh !== undefined}>
					<IconButton
						variant='plain'
						size={props.size}
						data-pager-refresh
						aria-label={labels().refresh}
						disabled={loading()}
						onClick={() => {
							props.onRefresh?.();
						}}
					><PagerIcon name='refresh' class={loading() ? styles['spin'] : undefined}/></IconButton>
				</Show>
			</div>
		</nav>
	);
}
```

Если `Button` не используется в `pager.tsx` (он нужен только в `pager-page-buttons.tsx`), импорт `Button` из `pager.tsx` убрать.

`src/components/pager/index.ts`:

```ts
export { Pager } from './pager';
export type { PagerLabels } from './pager-labels';
export type { PagerProps } from './pager-props';
export type { PagerRange } from './pager-range';
```

`src/components/pager/pager.module.css` (целиком, заменяя временный):

```css
/*
 * Токены Pager (публичный API кастомизации, читаются с фолбэком на глобальные):
 *   --s-kit-pager-gap (8px), --s-kit-pager-padding (6px 10px), --s-kit-pager-bg (прозрачный), --s-kit-pager-select-width (6.5rem).
 * Корень это <nav>: слева группа кнопок и размер страницы, справа сводка и «Обновить»; при нехватке ширины полоса переносится.
 */

.root {
    --s-kit-select-width: var(--s-kit-pager-select-width, 6.5rem);

    display: flex;
    flex-wrap: wrap;
    gap: var(--s-kit-pager-gap, 8px);
    align-items: center;
    justify-content: space-between;

    box-sizing: border-box;
    padding: var(--s-kit-pager-padding, 6px 10px);

    font-family: var(--s-kit-font);
    font-size: var(--s-kit-control-font-size, var(--s-kit-control-font-size-md));
    color: var(--s-kit-color-text);

    background: var(--s-kit-pager-bg, transparent);

    &:focus-visible {
        outline: 1px solid transparent;
    }
}

.start,
.end {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-kit-pager-gap, 8px);
    align-items: center;
}

.buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    align-items: center;
}

.pages {
    display: contents;
}

.gap {
    user-select: none;
    min-inline-size: 1.5em;
    color: var(--s-kit-color-text-muted);
    text-align: center;
}

.summary {
    font-variant-numeric: tabular-nums;
    color: var(--s-kit-color-text-muted);
    white-space: nowrap;
}

.spin {
    animation: pager-spin 0.9s linear infinite;

    @media (prefers-reduced-motion: reduce) {
        opacity: 0.5;
        animation: none;
    }
}

@keyframes pager-spin {
    to {
        transform: rotate(360deg);
    }
}
```

Токен приглушённого текста взять существующий (`grep -n "muted\|secondary" src/styles/tokens.css`), если `--s-kit-color-text-muted` не определён.

- [ ] **Step 4: Тесты зелёные**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/pager`
Expected: PASS. Если тест выбора размера не находит опцию, проверить по `select.test.tsx`, как открывается список клавиатурой (подсветка стартует на выбранном значении), и поправить число `ArrowDown` в `chooseNext`, не меняя поведение компонента.

- [ ] **Step 5: Проверка и коммит**

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec stylelint --fix "src/**/*.css"
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo exit=$?
```
Expected: `exit=0`. Затем:

```bash
git add src/components/pager && git commit -m "feat(pager): компонент Pager, навигация, размер страницы, загрузка и фокус" -m "$T"
```

---

### Task 4: Форма пакета

**Files:**
- Modify: ничего, только проверка.

- [ ] **Step 1: Проверить, что подпуть собирается шаблоном `./*`**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec tsc --noEmit; echo exit=$?`
Expected: `exit=0`.

- [ ] **Step 2: Форма пакета на текущем коммите**

Run: `scripts/verify-package-form.sh HEAD; echo exit=$?`
Expected: все строки `OK:`, `exit=0`. Если скрипт требует фиксированный список подпутей, добавить `pager` по образцу `grid`.

---

## Самопроверка плана

- Покрытие спека: API (2.1) — задачи 1, 3; поведение (раздел 4: кнопки, клик по текущей, порядок колбэков при смене размера, зажатие, `loading`, фокус, `total = 0`) — задача 3; иконки (раздел 5) — задача 1; вид (раздел 6) — задача 3 (CSS); файлы (раздел 7) — задачи 1–3. Не здесь: нижняя полоса Grid и `foundText(total)` (часть 3), визуальная приёмка в Chrome (часть 3).
- Типы согласованы: `PagerItem`, `PagerRange` из части 1; `PagerProps.size` это `ButtonSize`; `PagerPageButtonsProps` совпадает с использованием в `pager.tsx`.
- Известный риск: поведение фокуса в Chrome (браузер сам снимает фокус с отключаемой кнопки) проверяется в части 3; тесты jsdom закрывают логику, но не само поведение браузера.
