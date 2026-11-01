# Меню колонки: интеграция в Grid, playground и приёмка — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Кнопка меню колонки в каждой ячейке шапки Grid и меню (закрепить/открепить, переключатели видимости) на ContextMenu; состояние `hiddenColumns` / `lockedColumns` как controlled-тройки; `onColumnMenuClose`; демо, автопроверки и приёмка в Chrome.

**Architecture:** В `grid.tsx` два `createControllableSignal` по id колонок, из них `applyColumnState` даёт колонки для раскладки (ссылочная стабильность сохраняется). Одно меню на грид (`GridColumnMenu`) рисуется рядом с `GridRowMenu`, цель открытия (`ColumnMenuTarget`) хранит id колонки, кнопку-якорь и источник открытия. Закрытие и `onColumnMenuClose` сосредоточены в `closeColumnMenu`.

**Tech Stack:** Solid 1.9, ContextMenu (план `2026-11-01-stage-4b-column-menu-context-menu.md`), vitest + @solidjs/testing-library, Vite playground, Chrome.

**Spec:** `docs/superpowers/specs/2026-11-01-stage-4b-column-menu-design.md` (разделы 2, 4–9).

## Global Constraints

- Предыдущие планы (`…-pure-functions.md`, `…-context-menu.md`) выполнены: функции состояния, `GridColumnMenuLabels`, `DEFAULT_COLUMN_MENU_LABELS`, `ContextMenu.CheckboxItem`, `ContextMenu.Group`, `Root.anchorElement`, `Content.placement` существуют.
- Один компонент на файл, kebab-case; тесты рядом. Пропсы не деструктурируются. Тексты по умолчанию русские. Без jsdom-проверок в боевом коде.
- ESLint: табы, одинарные кавычки, длина строки до 140, без висящих комментариев в конце строки, `simple-import-sort`, `jsx-first-prop-new-line` / `jsx-max-props-per-line`, `no-confusing-void-expression` (тела стрелок с вызовом, возвращающим void, в фигурных скобках).
- CSS: нативная вложенность с `&`, собственные декларации перед вложенными правилами, токены без литеральных цветов, порядок свойств чинится `pnpm exec stylelint --fix "src/**/*.css" "playground/src/**/*.css"`.
- Команды pnpm: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`; код возврата `pnpm check` проверять отдельно.
- Коммит с трейлерами:

```bash
T=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'
git commit -m "сообщение" -m "$T"
```

- Не пушить и не ставить теги без слова владельца. Dev-сервер владельца на порту 5173 не трогать; временные серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никакого `pkill`.

---

### Task 1: состояние колонок в Grid (пропсы, контекст, раскладка)

**Files:**
- Modify: `src/components/grid/grid-props.ts`, `src/components/grid/grid-column.ts` (комментарии), `src/components/grid/grid-context.ts`, `src/components/grid/grid.tsx`, `src/components/grid/index.ts`
- Create: `src/components/grid/column-menu-target.ts`
- Test: `src/components/grid/grid.test.tsx` (новый `describe('Grid: состояние колонок')`)

**Interfaces:**
- Consumes: `idsWithFlag`, `applyColumnState`, `visibleColumnIds`, `toggleId`, `canHideColumn`, `sameItems`, `DEFAULT_COLUMN_MENU_LABELS`.
- Produces в `GridProps`: `hiddenColumns`, `defaultHiddenColumns`, `onHiddenColumnsChange`, `lockedColumns`, `defaultLockedColumns`, `onLockedColumnsChange`, `onColumnMenuClose`, `columnMenu`, `columnMenuLabels`. В `GridContextValue<T>`: `hasColumnMenu`, `columnMenu`, `toggleColumnMenu(columnId, anchor, source)`, `closeColumnMenu()`, `menuColumns`, `hiddenColumns`, `lockedColumns`, `toggleHidden(id)`, `toggleLocked(id)`, `canHide(id)`, `columnMenuLabels`. `ColumnMenuTarget { columnId: string; anchor: HTMLElement; source: MenuOpenSource }`.

- [ ] **Step 1: Write the failing tests**

В `grid.test.tsx` добавить `describe`, использующий существующие `renderGrid`, `table`, `COLUMNS` (видимые по умолчанию: Имя и Номер закреплены, потом Возраст и Заметка; Секрет скрыт):

```tsx
describe('Grid: состояние колонок', () => {
	function titles(): (string | null)[] {
		return [...table().querySelectorAll('thead th')].map((th) => th.textContent);
	}

	it('hiddenColumns перекрывает поля hidden: скрыта Заметка, Секрет показан', () => {
		renderGrid({ hiddenColumns: new Set(['note']) });
		expect(titles()).toEqual(['Имя', 'Номер', 'Возраст', 'Секрет']);
	});

	it('lockedColumns перекрывает поля locked: закреплена только Возраст и идёт первой', () => {
		renderGrid({ lockedColumns: new Set(['age']) });
		expect(titles()).toEqual(['Возраст', 'Имя', 'Номер', 'Заметка']);
		const sticky = [...table().querySelectorAll('thead th')].map((th) => th.hasAttribute('data-sticky'));
		expect(sticky).toEqual([true, false, false, false]);
	});

	it('defaultHiddenColumns и defaultLockedColumns задают начальное состояние без пропсов', () => {
		renderGrid({ defaultHiddenColumns: new Set(['age']), defaultLockedColumns: new Set(['note']) });
		expect(titles()).toEqual(['Заметка', 'Имя', 'Номер']);
	});

	it('controlled: смена hiddenColumns родителем скрывает и показывает колонку', () => {
		const [hidden, setHidden] = createSignal<ReadonlySet<string>>(new Set(['secret']));
		render(() => <Grid rows={ROWS} getRowKey={(row) => row.id} columns={COLUMNS} virtualized={false} hiddenColumns={hidden()} aria-label='Люди'/>);
		expect(titles()).toEqual(['Имя', 'Номер', 'Возраст', 'Заметка']);
		setHidden(new Set(['secret', 'age']));
		expect(titles()).toEqual(['Имя', 'Номер', 'Заметка']);
		setHidden(new Set());
		expect(titles()).toEqual(['Имя', 'Номер', 'Возраст', 'Секрет', 'Заметка']);
	});

	it('скрытие другой колонки не пересоздаёт шапку остальных', () => {
		const [hidden, setHidden] = createSignal<ReadonlySet<string>>(new Set(['secret']));
		render(() => <Grid rows={ROWS} getRowKey={(row) => row.id} columns={COLUMNS} virtualized={false} hiddenColumns={hidden()} aria-label='Люди'/>);
		const before = [...table().querySelectorAll('thead th')].slice(0, 3);
		setHidden(new Set(['secret', 'note']));
		const after = [...table().querySelectorAll('thead th')].slice(0, 3);
		expect(after).toEqual(before);
		expect(after.every((cell) => cell.isConnected)).toBe(true);
	});

	it('ширины хранятся по id и переживают скрытие', () => {
		const [hidden, setHidden] = createSignal<ReadonlySet<string>>(new Set(['secret']));
		render(() => (
			<Grid
				rows={ROWS}
				getRowKey={(row) => row.id}
				columns={COLUMNS}
				virtualized={false}
				hiddenColumns={hidden()}
				defaultColumnWidths={{ note: 300 }}
				aria-label='Люди'
			/>
		));
		expect(table().style.getPropertyValue('--s-kit-grid-w-3')).toBe('300px');
		setHidden(new Set(['secret', 'note']));
		setHidden(new Set(['secret']));
		expect(table().style.getPropertyValue('--s-kit-grid-w-3')).toBe('300px');
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/grid/grid.test.tsx -t "состояние колонок"`
Expected: FAIL (пропсов нет, TS-ошибки игнорируются vitest, но заголовки не меняются).

- [ ] **Step 3: Implement**

`column-menu-target.ts`:

```ts
import type { MenuOpenSource } from '../context-menu/context-menu-context';

/** Открытое меню колонки: колонка и кнопка-якорь запоминаются в момент открытия. */
export interface ColumnMenuTarget {
	columnId: string;
	anchor: HTMLElement;
	source: MenuOpenSource;
}
```

`grid-props.ts`: импорт `GridColumnMenuLabels` и добавить поля (перед `loading`):

```ts
	/** Скрытые колонки по id. Без пропса состояние стартует из `GridColumn.hidden` и дальше живёт в гриде. */
	hiddenColumns?: ReadonlySet<string> | undefined;
	defaultHiddenColumns?: ReadonlySet<string> | undefined;
	/** На каждое изменение из меню колонки; новый `Set`, прежний не мутируется. */
	onHiddenColumnsChange?: ((hidden: ReadonlySet<string>) => void) | undefined;
	/** Закреплённые колонки по id. Без пропса состояние стартует из `GridColumn.locked`. */
	lockedColumns?: ReadonlySet<string> | undefined;
	defaultLockedColumns?: ReadonlySet<string> | undefined;
	onLockedColumnsChange?: ((locked: ReadonlySet<string>) => void) | undefined;
	/** Один раз при закрытии меню колонки, если набор видимых колонок изменился; id в порядке `columns`. */
	onColumnMenuClose?: ((visibleIds: readonly string[]) => void) | undefined;
	/** Кнопки меню колонки в шапке (по умолчанию `true`). */
	columnMenu?: boolean | undefined;
	columnMenuLabels?: Partial<GridColumnMenuLabels> | undefined;
```

`grid-column.ts`: комментарии `locked` и `hidden` → `/** Закреплена слева. Начальное значение: текущее состояние это `lockedColumns` грида. */` и `/** Скрыта. Начальное значение: текущее состояние это `hiddenColumns` грида. */`.

`grid-context.ts`: импорты `ColumnMenuTarget`, `GridColumnMenuLabels`; в интерфейс (после блока меню строки):

```ts
	hasColumnMenu: Accessor<boolean>;
	/** Открытое меню колонки; `undefined`, пока закрыто. */
	columnMenu: Accessor<ColumnMenuTarget | undefined>;
	/** Клик по кнопке колонки: закрывает меню этой колонки, если оно открыто, иначе открывает. */
	toggleColumnMenu: (columnId: string, anchor: HTMLElement, source: MenuOpenSource) => void;
	closeColumnMenu: () => void;
	/** Все колонки в порядке `columns`, включая скрытые: пункты видимости меню. */
	menuColumns: Accessor<readonly GridColumn<T>[]>;
	hiddenColumns: Accessor<ReadonlySet<string>>;
	lockedColumns: Accessor<ReadonlySet<string>>;
	toggleHidden: (columnId: string) => void;
	toggleLocked: (columnId: string) => void;
	/** `false` у последней видимой колонки. */
	canHide: (columnId: string) => boolean;
	columnMenuLabels: Accessor<GridColumnMenuLabels>;
```

`grid.tsx`: импорты `createEffect` уже есть; добавить `applyColumnState`, `canHideColumn`, `DEFAULT_COLUMN_MENU_LABELS`, `idsWithFlag`, `toggleId`, `visibleColumnIds`, `ColumnMenuTarget`; вставить после `selected`:

```ts
	const [hiddenColumns, setHiddenColumns] = createControllableSignal<ReadonlySet<string>>({
		name: 'Grid',
		value: () => props.hiddenColumns,
		defaultValue: () => props.defaultHiddenColumns ?? idsWithFlag(props.columns, 'hidden'),
		onChange: (next) => props.onHiddenColumnsChange?.(next)
	});
	const [lockedColumns, setLockedColumns] = createControllableSignal<ReadonlySet<string>>({
		name: 'Grid',
		value: () => props.lockedColumns,
		defaultValue: () => props.defaultLockedColumns ?? idsWithFlag(props.columns, 'locked'),
		onChange: (next) => props.onLockedColumnsChange?.(next)
	});
	// состояние колонок собирается из наборов; колонка, чьи флаги не менялись, остаётся прежним объектом
	const stateColumns = createMemo(() => applyColumnState(props.columns, hiddenColumns(), lockedColumns()), [], { equals: sameItems });
	const visibleIds = createMemo(() => visibleColumnIds(props.columns, hiddenColumns()), [], { equals: sameItems });
```

В `layout` заменить `props.columns` на `stateColumns()`:
`const layout = createMemo(() => computeColumnLayout(stateColumns(), widths(), layoutOptions()));`

После `rowMenu`-сигнала добавить состояние меню колонки (в Task 1 открытие и закрытие в минимальном виде, расширяются в Task 2/3):

```ts
	const [columnMenu, setColumnMenu] = createSignal<ColumnMenuTarget>();
```

В `context` добавить:

```ts
		hasColumnMenu: () => props.columnMenu !== false,
		columnMenu,
		toggleColumnMenu: (columnId, anchor, source) => {
			setColumnMenu(columnMenu()?.columnId === columnId ? undefined : { columnId, anchor, source });
		},
		closeColumnMenu: () => {
			setColumnMenu(undefined);
		},
		menuColumns: () => props.columns,
		hiddenColumns,
		lockedColumns,
		toggleHidden: (columnId) => {
			// последнюю видимую колонку скрыть нельзя (меню её отключает, это страховка)
			if (hiddenColumns().has(columnId) || canHideColumn(props.columns, hiddenColumns(), columnId)) {
				setHiddenColumns(toggleId(hiddenColumns(), columnId));
			}
		},
		toggleLocked: (columnId) => {
			setLockedColumns(toggleId(lockedColumns(), columnId));
		},
		canHide: (columnId) => canHideColumn(props.columns, hiddenColumns(), columnId),
		columnMenuLabels: () => ({ ...DEFAULT_COLUMN_MENU_LABELS, ...props.columnMenuLabels }),
```

`index.ts`: добавить `export type { GridColumnMenuLabels } from './grid-column-menu-labels';` (в порядке существующих экспортов).

`createGridResize` продолжает получать `columns: () => props.columns` (нужны только `width`, `minWidth`, `maxWidth`).

- [ ] **Step 4: Run to verify it passes**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/grid`
Expected: PASS (все тесты грида, включая старые).

- [ ] **Step 5: Commit**

```bash
git add src/components/grid
# коммит: feat(grid): состояние hiddenColumns и lockedColumns по id
```

---

### Task 2: кнопка в шапке, меню, закрытие и onColumnMenuClose

**Files:**
- Create: `src/components/grid/grid-column-menu-button.tsx`, `src/components/grid/grid-column-menu.tsx`
- Modify: `src/components/grid/grid-header-cell.tsx`, `src/components/grid/grid.tsx`, `src/components/grid/grid.module.css`
- Test: `src/components/grid/grid.test.tsx` (новый `describe('Grid: меню колонки')`)

**Interfaces:**
- Consumes: контекст из Task 1; `ContextMenu.Root`/`Content`/`Item`/`Separator`/`Group`/`CheckboxItem`.
- Produces: `GridColumnMenuButton`, `GridColumnMenu`; поведение раздела 4–5 спека.

- [ ] **Step 1: Write the failing tests**

```tsx
describe('Grid: меню колонки', () => {
	beforeEach(() => {
		// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
		HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
			this.removeAttribute('popover');
		});
		HTMLElement.prototype.hidePopover = vi.fn();
	});

	function menuButton(title: string): HTMLElement {
		return screen.getByRole('button', { name: `Меню колонки «${title}»` });
	}

	function openMenu(title: string): HTMLElement {
		fireEvent.click(menuButton(title));
		return screen.getByRole('menu');
	}

	function headTitles(): (string | null)[] {
		return [...table().querySelectorAll('thead th')].map((th) => th.textContent);
	}

	it('в каждой ячейке шапки есть кнопка с именем колонки и aria-haspopup', () => {
		renderGrid();
		expect(table().querySelectorAll('thead th [data-grid-column-menu]')).toHaveLength(4);
		expect(menuButton('Возраст').getAttribute('aria-haspopup')).toBe('menu');
		expect(menuButton('Возраст').getAttribute('aria-expanded')).toBe('false');
	});

	it('columnMenu={false} убирает кнопки', () => {
		renderGrid({ columnMenu: false });
		expect(table().querySelectorAll('[data-grid-column-menu]')).toHaveLength(0);
	});

	it('columnMenuLabels меняют подпись кнопки и пункты', () => {
		renderGrid({ columnMenuLabels: { button: (title) => `Menu ${title}`, lock: 'Pin', columns: 'Columns' } });
		fireEvent.click(screen.getByRole('button', { name: 'Menu Возраст' }));
		expect(screen.getByRole('menuitem', { name: 'Pin' })).toBeTruthy();
		expect(screen.getByRole('group', { name: 'Columns' })).toBeTruthy();
	});

	it('клик открывает меню: «Закрепить», группа «Колонки» с переключателями всех колонок, фокус на первом пункте', () => {
		renderGrid();
		const menu = openMenu('Возраст');
		expect(menu.getAttribute('aria-label')).toBe('Меню колонки «Возраст»');
		expect(menuButton('Возраст').getAttribute('aria-expanded')).toBe('true');
		const first = screen.getByRole('menuitem', { name: 'Закрепить' });
		expect(document.activeElement).toBe(first);
		const checkboxes = screen.getAllByRole('menuitemcheckbox');
		expect(checkboxes.map((item) => item.textContent)).toEqual(['Возраст', 'Имя', 'Секрет', 'Номер', 'Заметка']);
		expect(checkboxes.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'true', 'false', 'true', 'true']);
	});

	it('у закреплённой колонки пункт называется «Открепить»', () => {
		renderGrid();
		openMenu('Имя');
		expect(screen.getByRole('menuitem', { name: 'Открепить' })).toBeTruthy();
	});

	it('открытие мышью оставляет фокус на самом меню', () => {
		renderGrid();
		fireEvent.click(menuButton('Возраст'), { detail: 1 });
		expect(document.activeElement).toBe(screen.getByRole('menu'));
	});

	it('повторный клик по кнопке закрывает меню, клик по другой кнопке переносит его', () => {
		renderGrid();
		openMenu('Возраст');
		fireEvent.click(menuButton('Возраст'));
		expect(screen.queryByRole('menu')).toBeNull();
		openMenu('Возраст');
		fireEvent.click(menuButton('Имя'));
		expect(screen.getByRole('menu').getAttribute('aria-label')).toBe('Меню колонки «Имя»');
	});

	it('Esc закрывает меню', () => {
		renderGrid();
		openMenu('Возраст');
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('снятие галочки скрывает колонку: заголовок, ячейки и col исчезают, колбэк получает новый Set', () => {
		const onChange = vi.fn();
		renderGrid({ onHiddenColumnsChange: onChange });
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Заметка' }));
		expect(headTitles()).toEqual(['Имя', 'Номер', 'Возраст']);
		expect(table().querySelectorAll('colgroup > col')).toHaveLength(3);
		expect(table().querySelectorAll('tbody > tr[data-index]:first-child > td')).toHaveLength(3);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect([...(onChange.mock.calls[0]?.[0] as ReadonlySet<string>)]).toEqual(['secret', 'note']);
		expect(screen.getByRole('menu')).toBeTruthy();
	});

	it('галочка у скрытой колонки показывает её', () => {
		renderGrid();
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Секрет' }));
		expect(headTitles()).toContain('Секрет');
	});

	it('скрытие колонки из её же меню закрывает меню, фокус уходит на корень грида', () => {
		const { container } = renderGrid();
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Возраст' }));
		expect(screen.queryByRole('menu')).toBeNull();
		expect(headTitles()).toEqual(['Имя', 'Номер', 'Заметка']);
		expect(document.activeElement).toBe(container.firstElementChild);
	});

	it('последняя видимая колонка в меню отключена, остальные нет', () => {
		renderGrid({ defaultHiddenColumns: new Set(['secret', 'age', 'id', 'note']) });
		openMenu('Имя');
		expect(screen.getByRole('menuitemcheckbox', { name: 'Имя' }).getAttribute('aria-disabled')).toBe('true');
		expect(screen.getByRole('menuitemcheckbox', { name: 'Возраст' }).hasAttribute('aria-disabled')).toBe(false);
	});

	it('«Закрепить» закрепляет колонку и закрывает меню', () => {
		const onChange = vi.fn();
		renderGrid({ onLockedColumnsChange: onChange });
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitem', { name: 'Закрепить' }));
		expect(screen.queryByRole('menu')).toBeNull();
		expect(headTitles()).toEqual(['Имя', 'Номер', 'Возраст', 'Заметка']);
		const sticky = [...table().querySelectorAll('thead th')].map((th) => th.hasAttribute('data-sticky'));
		expect(sticky).toEqual([true, true, true, false]);
		expect([...(onChange.mock.calls[0]?.[0] as ReadonlySet<string>)]).toEqual(['name', 'id', 'age']);
	});

	it('«Открепить» возвращает колонку в обычные', () => {
		renderGrid();
		openMenu('Имя');
		fireEvent.click(screen.getByRole('menuitem', { name: 'Открепить' }));
		const sticky = [...table().querySelectorAll('thead th')].map((th) => th.hasAttribute('data-sticky'));
		expect(sticky).toEqual([true, false, false, false]);
	});

	it('controlled: если родитель не принял изменение, колонка остаётся', () => {
		renderGrid({ hiddenColumns: new Set(['secret']), onHiddenColumnsChange: vi.fn() });
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Заметка' }));
		expect(headTitles()).toContain('Заметка');
	});

	it('на время loading кнопки отключены', () => {
		renderGrid({ loading: true });
		expect((menuButton('Возраст') as HTMLButtonElement).disabled).toBe(true);
	});

	it('правый клик по заголовку меню не открывает', () => {
		renderGrid();
		fireEvent.contextMenu(table().querySelector('thead th') as Element);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('onColumnMenuClose вызывается один раз при закрытии с видимыми id в порядке columns', () => {
		const onClose = vi.fn();
		renderGrid({ onColumnMenuClose: onClose });
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Заметка' }));
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Возраст' }));
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledWith(['name', 'id']);
	});

	it('onColumnMenuClose при закрытии Esc после изменения видимости', () => {
		const onClose = vi.fn();
		renderGrid({ onColumnMenuClose: onClose });
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Секрет' }));
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledWith(['age', 'name', 'secret', 'id', 'note']);
	});

	it('onColumnMenuClose не вызывается, если видимость не менялась или менялось только закрепление', () => {
		const onClose = vi.fn();
		renderGrid({ onColumnMenuClose: onClose });
		openMenu('Возраст');
		fireEvent.keyDown(document.body, { key: 'Escape' });
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitem', { name: 'Закрепить' }));
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Секрет' }));
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Секрет' }));
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onClose).not.toHaveBeenCalled();
	});

	it('controlled: если родитель не принял изменения, onColumnMenuClose не вызывается', () => {
		const onClose = vi.fn();
		renderGrid({ hiddenColumns: new Set(['secret']), onHiddenColumnsChange: vi.fn(), onColumnMenuClose: onClose });
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Заметка' }));
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onClose).not.toHaveBeenCalled();
	});

	it('размонтирование грида при открытом меню onColumnMenuClose не вызывает', () => {
		const onClose = vi.fn();
		const { unmount } = renderGrid({ onColumnMenuClose: onClose });
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Заметка' }));
		unmount();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('колонка, скрытая родителем при открытом меню, закрывает его', () => {
		const [hidden, setHidden] = createSignal<ReadonlySet<string>>(new Set(['secret']));
		render(() => <Grid rows={ROWS} getRowKey={(row) => row.id} columns={COLUMNS} virtualized={false} hiddenColumns={hidden()} aria-label='Люди'/>);
		openMenu('Возраст');
		setHidden(new Set(['secret', 'age']));
		expect(screen.queryByRole('menu')).toBeNull();
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/grid/grid.test.tsx -t "меню колонки"`
Expected: FAIL (кнопок нет).

- [ ] **Step 3: Implement**

`grid-column-menu-button.tsx`:

```tsx
import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';

export interface GridColumnMenuButtonProps {
	columnId: string;
	title: string;
}

/** Кнопка меню колонки в ячейке шапки: три вертикальные точки. Открывает общее меню грида для своей колонки. */
export function GridColumnMenuButton(props: GridColumnMenuButtonProps): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.hasColumnMenu()}>
			<button
				type='button'
				class={styles['menu-button']}
				aria-haspopup='menu'
				aria-expanded={grid.columnMenu()?.columnId === props.columnId}
				aria-label={grid.columnMenuLabels().button(props.title)}
				disabled={grid.loading()}
				data-grid-column-menu={props.columnId}
				onClick={(event) => {
					// detail 0 у клика, вызванного клавиатурой (Enter, Space): тогда фокус уходит на первый пункт
					grid.toggleColumnMenu(props.columnId, event.currentTarget, event.detail === 0 ? 'keyboard' : 'pointer');
				}}
			>
				<svg viewBox='0 0 16 16' aria-hidden='true'>
					<circle cx='8' cy='3.5' r='1.4' fill='currentColor'/>
					<circle cx='8' cy='8' r='1.4' fill='currentColor'/>
					<circle cx='8' cy='12.5' r='1.4' fill='currentColor'/>
				</svg>
			</button>
		</Show>
	);
}
```

`grid-column-menu.tsx`:

```tsx
import { For, type JSX, Show } from 'solid-js';

import { ContextMenu } from '../context-menu';

import { useGrid } from './grid-context';

interface ColumnMenuItemsProps {
	columnId: string;
}

/** Пункты меню одной колонки: закрепление и переключатели видимости всех колонок. */
function ColumnMenuItems(props: ColumnMenuItemsProps): JSX.Element {
	const grid = useGrid();
	const locked = (): boolean => grid.lockedColumns().has(props.columnId);
	return (
		<>
			<ContextMenu.Item
				onSelect={() => {
					grid.toggleLocked(props.columnId);
				}}
			>{locked() ? grid.columnMenuLabels().unlock : grid.columnMenuLabels().lock}</ContextMenu.Item>
			<ContextMenu.Separator/>
			<ContextMenu.Group label={grid.columnMenuLabels().columns}>
				<For each={grid.menuColumns()}>
					{(column) => (
						<ContextMenu.CheckboxItem
							checked={!grid.hiddenColumns().has(column.id)}
							disabled={!grid.canHide(column.id)}
							onCheckedChange={() => {
								grid.toggleHidden(column.id);
							}}
						>{column.title}</ContextMenu.CheckboxItem>
					)}
				</For>
			</ContextMenu.Group>
		</>
	);
}

/** Одно меню колонки на весь грид: рисуется в хосте панели (корне грида), пункты строятся по колонке в момент открытия. */
export function GridColumnMenu(): JSX.Element {
	const grid = useGrid();
	const title = (): string => grid.menuColumns().find((column) => column.id === grid.columnMenu()?.columnId)?.title ?? '';
	return (
		<Show when={grid.hasColumnMenu()}>
			<ContextMenu.Root
				open={grid.columnMenu() !== undefined}
				onOpenChange={(open) => {
					if (!open) {
						grid.closeColumnMenu();
					}
				}}
				anchorElement={grid.columnMenu()?.anchor}
				anchorSource={grid.columnMenu()?.source}
				anchorArea={grid.rootElement()}
			>
				<ContextMenu.Content placement='bottom-end' aria-label={grid.columnMenuLabels().button(title())}>
					<Show when={grid.columnMenu()} keyed>
						{(target) => <ColumnMenuItems columnId={target.columnId}/>}
					</Show>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</Show>
	);
}
```

`grid-header-cell.tsx`: импорт `GridColumnMenuButton`; тело `<th>`:

```tsx
			<div class={styles['head-inner']}>
				<Show when={props.column.sortable === true} fallback={<span class={styles['head-title']}>{props.column.title}</span>}>
					<GridSortButton
						title={props.column.title}
						direction={direction()}
						onClick={() => {
							grid.toggleSort(props.column.id);
						}}
					/>
				</Show>
				<GridColumnMenuButton columnId={props.column.id} title={props.column.title}/>
			</div>
			<GridResizeHandle index={props.index} columnId={props.column.id}/>
```

`grid.tsx`: импорт `GridColumnMenu`, `<GridColumnMenu/>` сразу после `<GridRowMenu/>`; открытие и закрытие меню заменяются полной версией:

```ts
	const [columnMenu, setColumnMenu] = createSignal<ColumnMenuTarget>();
	// видимые колонки в момент открытия: onColumnMenuClose сообщает итог, только если он изменился
	let visibleAtOpen: readonly string[] | undefined;
	const closeColumnMenu = (): void => {
		if (columnMenu() === undefined) {
			return;
		}
		setColumnMenu(undefined);
		const before = visibleAtOpen;
		visibleAtOpen = undefined;
		if (before !== undefined && !sameItems(before, visibleIds())) {
			props.onColumnMenuClose?.(visibleIds());
		}
	};
	const toggleColumnMenu = (columnId: string, anchor: HTMLElement, source: MenuOpenSource): void => {
		if (columnMenu()?.columnId === columnId) {
			closeColumnMenu();
			return;
		}
		if (columnMenu() === undefined) {
			visibleAtOpen = visibleIds();
		}
		setColumnMenu({ columnId, anchor, source });
	};
	// якорь исчез (колонку скрыли из её же меню или это сделал родитель): меню закрывается, фокус возвращается гриду
	createEffect(() => {
		const target = columnMenu();
		if (target !== undefined && !visibleIds().includes(target.columnId)) {
			untrack(closeColumnMenu);
		}
	});
```

В `context`: `toggleColumnMenu,` и `closeColumnMenu,` вместо встроенных вариантов Task 1.

`grid.module.css` (в блок шапки, рядом с `.sort-button`; затем `stylelint --fix`):

```css
.head-inner {
    display: flex;
    gap: 2px;
    align-items: center;

    min-inline-size: 0;
    block-size: calc(var(--s-kit-control-height, var(--s-kit-control-height-md)) - 1px);
}

.head-title {
    overflow: hidden;
    flex: 1 1 auto;
    min-inline-size: 0;
    text-overflow: ellipsis;
}

.menu-button {
    cursor: pointer;

    display: grid;
    flex: none;
    place-items: center;

    box-sizing: border-box;
    inline-size: 24px;
    block-size: 24px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 4px;

    color: inherit;

    appearance: none;
    background: transparent;

    & svg {
        inline-size: 16px;
        block-size: 16px;
    }

    &:focus-visible {
        outline: var(--s-kit-focus-width) solid var(--s-kit-color-focus-ring);
        outline-offset: var(--s-kit-focus-ring-offset, var(--s-kit-focus-offset));
    }

    &[aria-expanded="true"] {
        color: var(--s-kit-color-text);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: var(--s-kit-disabled-opacity);
    }

    @media (hover: hover) {
        &:hover:not(:disabled) {
            color: var(--s-kit-color-text);
        }
    }
}
```

В `.sort-button` добавить `min-inline-size: 0;` (кнопка сжимается рядом с кнопкой меню).

В `grid.module.css` шапка-комментарий токенов не меняется (новых токенов нет).

- [ ] **Step 4: Run to verify it passes**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec stylelint --fix "src/**/*.css" "playground/src/**/*.css"; env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components`
Expected: PASS. Старые тесты шапки и фокуса, которые считают кнопки или `th > …`, обновить под обёртку `head-inner` и появившиеся кнопки (читать упавшие и править ожидания, не поведение).

- [ ] **Step 5: Check and commit**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo "exit=$?"` — ожидается `exit=0`.

```bash
git add src/components/grid
# коммит: feat(grid): меню колонки (закрепление, видимость, onColumnMenuClose)
```

---

### Task 3: playground и автопроверки

**Files:**
- Modify: `playground/src/demo-grid.tsx`, `playground/src/grid-page.tsx`
- Create: `playground/src/column-menu-checks.ts`

**Interfaces:**
- Consumes: `closeWithEscape`, `frames`, `required` из `check-helpers`; `CheckResult` из `theme-checks`.
- Produces: `runColumnMenuChecks(page: HTMLElement): Promise<CheckResult[]>`.

- [ ] **Step 1: demo-grid**

В `DemoGrid` добавить сигналы `const [columnMenuEnabled, setColumnMenuEnabled] = createSignal(true);` и `const [columnsLog, setColumnsLog] = createSignal('ещё не было');`; в ряд управления после «Меню строки»:

```tsx
				<label>
					<input
						type='checkbox'
						data-grid-column-menu-toggle
						checked={columnMenuEnabled()}
						onChange={(event) => setColumnMenuEnabled(event.currentTarget.checked)}
					/>
					Меню колонок
				</label>
```

В `<Grid>` добавить

```tsx
					columnMenu={columnMenuEnabled()}
					onColumnMenuClose={(ids) => {
						setColumnsLog(ids.join(', '));
					}}
```

и в абзац с журналами: `Видимые колонки при закрытии меню: <output data-grid-columns-log>{columnsLog()}</output>`.

- [ ] **Step 2: column-menu-checks.ts**

```ts
import { closeWithEscape, frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

function menuButton(frame: HTMLElement, columnId: string): HTMLElement {
	return required(frame, `[data-grid-column-menu="${columnId}"]`);
}

function headTitles(frame: HTMLElement): string[] {
	return [...frame.querySelectorAll('thead th')].map((th) => th.textContent.trim());
}

function menuItem(role: 'menuitem' | 'menuitemcheckbox', text: string): HTMLElement | undefined {
	return [...document.querySelectorAll<HTMLElement>(`[role="${role}"]`)].find((item) => item.textContent.trim() === text);
}

/**
 * Автопроверки меню колонки: кнопки в шапке, открытие, скрытие и показ, закрепление, журнал onColumnMenuClose.
 * Кольца фокуса, настоящие Tab и закрытие прокруткой проверяются вручную в Chrome. Состояние колонок в конце возвращается.
 */
export async function runColumnMenuChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const frame = required(page, '[data-grid-demo]');
	const log = required(page, '[data-grid-columns-log]');

	const buttons = frame.querySelectorAll('thead th [data-grid-column-menu]').length;
	const heads = frame.querySelectorAll('thead th').length - 1;
	check('Меню колонки: кнопка в каждой ячейке шапки', buttons === heads && buttons > 0, `${buttons} из ${heads}`);

	menuButton(frame, 'note').click();
	await frames();
	const menu = document.querySelector<HTMLElement>('[role="menu"]');
	const toggles = document.querySelectorAll('[role="menuitemcheckbox"]').length;
	check(
		'Меню колонки: открывается с пунктом закрепления и переключателем на каждую колонку',
		menu !== null && menuItem('menuitem', 'Закрепить') !== undefined && toggles === buttons,
		`${menu?.getAttribute('aria-label') ?? 'нет меню'}; переключателей ${toggles}`
	);

	menuItem('menuitemcheckbox', 'Город')?.click();
	await frames();
	check('Меню колонки: снятие галочки скрывает колонку, меню остаётся открытым', !headTitles(frame).includes('Город') && document.querySelector('[role="menu"]') !== null, headTitles(frame).join(', '));

	closeWithEscape();
	await frames();
	check('Меню колонки: Esc закрывает, журнал получает видимые колонки без city', document.querySelector('[role="menu"]') === null && !log.textContent.includes('city') && log.textContent.includes('note'), log.textContent);

	menuButton(frame, 'phone').click();
	await frames();
	menuItem('menuitem', 'Закрепить')?.click();
	await frames();
	const phone = [...frame.querySelectorAll('thead th')].find((th) => th.textContent.trim() === 'Телефон');
	check('Меню колонки: «Закрепить» делает ячейку шапки закреплённой и закрывает меню', phone?.hasAttribute('data-sticky') === true && document.querySelector('[role="menu"]') === null, String(phone?.hasAttribute('data-sticky')));

	menuButton(frame, 'phone').click();
	await frames();
	const unlock = menuItem('menuitem', 'Открепить');
	check('Меню колонки: у закреплённой колонки пункт «Открепить»', unlock !== undefined, unlock?.textContent.trim() ?? 'нет');
	unlock?.click();
	await frames();

	menuButton(frame, 'note').click();
	await frames();
	menuItem('menuitemcheckbox', 'Город')?.click();
	await frames();
	check('Меню колонки: галочка у скрытой колонки возвращает её', headTitles(frame).includes('Город'), headTitles(frame).join(', '));
	closeWithEscape();
	await frames();
	return results;
}
```

Проверить форматирование под ESLint (длина строк до 140: длинные вызовы `check(…)` переносить по аргументам).

- [ ] **Step 3: grid-page.tsx**

Импорт `runColumnMenuChecks` (по алфавиту), в `runChecks`: `setResults([...(await runGridChecks(root)), ...(await runPagerChecks(root)), ...(await runColumnMenuChecks(root))]);`. В тексте ручной приёмки добавить предложение про меню колонок: «Меню колонки: кнопка из трёх точек в шапке, закрепление и видимость, меню закрывается прокруткой грида и Esc».

- [ ] **Step 4: Check and commit**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo "exit=$?"` — ожидается `exit=0`.

```bash
git add playground/src
# коммит: feat(playground): меню колонок в демо и автопроверки
```

---

### Task 4: приёмка в Chrome и итоги

**Files:**
- Modify: `docs/superpowers/specs/2026-11-01-stage-4b-column-menu-design.md` (новый раздел 12 «Итоги приёмки меню колонки»)

- [ ] **Step 1: production-сборка и временный сервер**

```bash
cd /Users/stark/Documents/web/solid-kit
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm --filter playground build
```

Раздать `playground/dist` через `python3 -m http.server <порт>` из этого каталога (порт 5188, запуск в фоне, PID записать, cwd проверить). Порт 5173 (dev владельца) не трогать.

- [ ] **Step 2: автопроверки**

В Chrome (`browser_batch`, вкладку открыть самому и закрыть в конце) открыть страницу «Грид», нажать «Запустить проверки», убедиться: все старые проверки (41) и новые (7 меню колонок) OK.

- [ ] **Step 3: ручные критерии (раздел 8 спека), обе темы**

1. Кнопка открывается мышью и клавиатурой (Tab до кнопки, Enter, Space): фокус на первом пункте; стрелки, Home и End; Esc возвращает фокус на кнопку; повторный клик по кнопке закрывает; клик снаружи закрывает.
2. Кольцо фокуса кнопки видно целиком внутри ячейки (скриншот светлой и тёмной темы), кольцо пункта меню и переключателя.
3. Прокрутка грида (колесо над телом) при открытом меню закрывает его (сценарий (г)); меню в top layer, изоляция событий.
4. Узкая колонка: перетащить ручку «Номер» до `minWidth`: кнопка не вытесняется и не наезжает на ручку; закреплённая колонка с меню; узкое окно (меню разворачивается); длинный список колонок (13) помещается или прокручивается внутри панели.
5. Скрытие своей колонки из её же меню: меню закрывается, фокус на корне грида; скрытие нескольких колонок и возврат; закрепление при горизонтальной прокрутке (колонка встаёт слева, зазоров нет).
6. Лёгкая прокрутка с открытием меню без видимых пропусков кадров.

Любой найденный дефект: чинить с тестом (красный → зелёный) и отдельным коммитом, как у пейджера.

- [ ] **Step 4: уборка**

Убить временный сервер по PID (проверив cwd), закрыть свои вкладки Chrome.

- [ ] **Step 5: итоги в спек, финальная проверка и коммит**

Добавить в спек раздел «12. Итоги приёмки меню колонки (дата)»: что проверено (список критериев с результатом), число автопроверок, найденные и исправленные дефекты, что не проверено (Firefox, Safari, скринридеры, reduced-motion при необходимости). Затем:

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo "exit=$?"` — `exit=0`; `bash scripts/verify-package-form.sh` (если скрипт есть в репозитории) — зелёный.

```bash
git add docs/superpowers/specs/2026-11-01-stage-4b-column-menu-design.md
# коммит: docs(spec): итоги приёмки меню колонки
```
