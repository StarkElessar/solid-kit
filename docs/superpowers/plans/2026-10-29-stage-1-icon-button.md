# solid-kit, этап 1: IconButton — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** второй компонент этапа 1. Квадратная кнопка IconButton с теми же четырьмя вариантами, что у Button; в ряду «Контролы в ряд» стоит на одной линии с остальными контролами, квадратность и кольцо фокуса проверяются на странице, компонент входит в матрицу формы пакета.

**Архитектура:** собственный `<button>`; CSS подключает правила Button через `composes` (варианты и состояния не дублируются), сверху добавляет только геометрию: квадрат по единому правилу размера, размер дочернего `svg`, свой токен радиуса. Playground получает демо-иконку, четыре IconButton в реестре `DEMO_CONTROLS` и проверку квадратности.

**Стек:** как в этапе 0 и плане Button.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (основной; раздел 3.1 описывает IconButton, разделы 2 и 4 общие соглашения и страницу), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 5, 5.1, 7, 11, 12).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане, не добавлять `LICENSE`, не менять git-идентичность. Тег `v0.2.0` ставится в конце всего этапа 1, не здесь.
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком `var(--s-kit-control-height, var(--s-kit-control-height-md))`).
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140), Stylelint (4 пробела, двойные кавычки, логические свойства; `pnpm exec stylelint --fix <файл>` расставляет свойства по порядку). Перед каждым коммитом `pnpm check` зелёный.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd, никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome; Firefox и Safari не проверяются (записывается в отчёте).
- Начало плана: `git status` чистый, последний коммит `docs: план IconButton ...`, `pnpm check` зелёный (131 тест).

---

### Task 1: Компонент IconButton

**Files:**
- Create: `src/components/icon-button/icon-button.tsx`
- Create: `src/components/icon-button/icon-button.module.css`
- Create: `src/components/icon-button/index.ts`
- Test: `src/components/icon-button/icon-button.test.tsx`

**Interfaces:**
- Consumes: `.root` из `src/components/button/button.module.css` (через `composes`), типы `ButtonSize`, `ButtonVariant` из `src/components/button`.
- Produces: `IconButton(props: IconButtonProps): JSX.Element`; типы `IconButtonProps`, `IconButtonSize`, `IconButtonVariant`; публичный путь `@stark/solid-kit/icon-button` (подхватывается шаблоном `./*` из `exports`); компонентный токен `--s-kit-icon-button-radius`.

- [ ] **Step 1: Написать падающие тесты**

Создать `src/components/icon-button/icon-button.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IconButton } from './icon-button';

afterEach(cleanup);

describe('IconButton', () => {
	it('renders a native button with type=button, the kit root attribute and the accessible name', () => {
		render(() => <IconButton aria-label='Закрыть'>×</IconButton>);
		const button = screen.getByRole('button', { name: 'Закрыть' });
		expect(button.tagName).toBe('BUTTON');
		expect(button.getAttribute('type')).toBe('button');
		expect(button.hasAttribute('data-s-kit')).toBe(true);
	});

	it('is primary by default', () => {
		render(() => <IconButton aria-label='Да'>★</IconButton>);
		expect(screen.getByRole('button').getAttribute('data-variant')).toBe('primary');
	});

	it.each(['primary', 'tinted', 'plain', 'danger'] as const)('sets data-variant for %s', (variant) => {
		render(() => <IconButton aria-label='Да' variant={variant}>★</IconButton>);
		expect(screen.getByRole('button').getAttribute('data-variant')).toBe(variant);
	});

	it('sets data-s-kit-size only when size is passed', () => {
		render(() => (
			<>
				<IconButton aria-label='Без размера'>★</IconButton>
				<IconButton aria-label='Большая' size='lg'>★</IconButton>
			</>
		));
		expect(screen.getByRole('button', { name: 'Без размера' }).hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('button', { name: 'Большая' }).getAttribute('data-s-kit-size')).toBe('lg');
	});

	it('does not call onClick when disabled and calls it otherwise', () => {
		const onClick = vi.fn();
		render(() => (
			<>
				<IconButton aria-label='Выключена' disabled onClick={onClick}>★</IconButton>
				<IconButton aria-label='Включена' onClick={onClick}>★</IconButton>
			</>
		));
		const disabled = screen.getByRole<HTMLButtonElement>('button', { name: 'Выключена' });
		expect(disabled.disabled).toBe(true);
		disabled.click();
		expect(onClick).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Включена' }));
		expect(onClick).toHaveBeenCalledOnce();
	});

	it('forwards native attributes, class and style', () => {
		render(() => (
			<IconButton aria-label='Закрыть' class='extra' style={{ 'margin-inline-start': '4px' }} data-testid='b'>
				×
			</IconButton>
		));
		const button = screen.getByTestId('b');
		expect(button.classList.contains('extra')).toBe(true);
		expect(button.style.marginInlineStart).toBe('4px');
	});

	it('lets the type be overridden', () => {
		render(() => <IconButton aria-label='Отправить' type='submit'>→</IconButton>);
		expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
	});

	it('renders element children', () => {
		render(() => (
			<IconButton aria-label='Звезда'>
				<svg data-testid='icon' viewBox='0 0 1 1' />
			</IconButton>
		));
		expect(screen.getByTestId('icon').tagName.toLowerCase()).toBe('svg');
	});

	it('does not compile without an accessible name', () => {
		// @ts-expect-error aria-label обязателен
		const withoutName = (): unknown => <IconButton>×</IconButton>;
		expect(withoutName).toBeTypeOf('function');
	});
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm exec vitest run src/components/icon-button`
Expected: FAIL, не найден модуль `./icon-button`.

- [ ] **Step 3: Реализовать компонент**

Создать `src/components/icon-button/icon-button.tsx`:

```tsx
import styles from './icon-button.module.css';

import { type JSX, mergeProps, splitProps } from 'solid-js';

import type { ButtonSize, ButtonVariant } from '../button';

export type IconButtonVariant = ButtonVariant;
export type IconButtonSize = ButtonSize;

export interface IconButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'style' | 'aria-label'> {
	/** Обязателен: у кнопки без текста нет другого доступного имени. */
	'aria-label': string;
	variant?: IconButtonVariant | undefined;
	size?: IconButtonSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function IconButton(props: IconButtonProps): JSX.Element {
	const merged = mergeProps({ variant: 'primary', type: 'button' } as const, props);
	const [local, rest] = splitProps(merged, ['variant', 'size', 'class', 'style']);

	return (
		<button
			{...rest}
			data-s-kit
			data-variant={local.variant}
			data-s-kit-size={local.size}
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		/>
	);
}
```

Создать `src/components/icon-button/index.ts`:

```ts
export type { IconButtonProps, IconButtonSize, IconButtonVariant } from './icon-button';
export { IconButton } from './icon-button';
```

Создать `src/components/icon-button/icon-button.module.css`:

```css
/*
 * Компонентные токены IconButton (публичный API кастомизации, читаются с фолбэком на глобальные):
 *   --s-kit-icon-button-radius
 * Цвета и состояния берутся у Button: --s-kit-button-bg, --s-kit-button-bg-hover, --s-kit-button-bg-active, --s-kit-button-color.
 * Варианты задаются атрибутом data-variant: primary, tinted, plain, danger.
 */

.root {
    composes: root from "../button/button.module.css";
    flex: none;
    padding-inline: 0;
    inline-size: var(--s-kit-control-height, var(--s-kit-control-height-md));
    border-radius: var(--s-kit-icon-button-radius, var(--s-kit-button-radius, var(--s-kit-radius)));
}

.root > svg {
    flex: none;
    inline-size: 1.25em;
    block-size: 1.25em;
}
```

- [ ] **Step 4: Тесты проходят**

Run: `pnpm exec vitest run src/components/icon-button`
Expected: PASS, 12 тестов (8 одиночных и 4 из `it.each` по вариантам), ни одного пропущенного.

- [ ] **Step 5: Полная проверка**

Run: `pnpm exec stylelint --fix src/components/icon-button/icon-button.module.css && pnpm exec eslint --fix src/components/icon-button && pnpm check`
Expected: зелёный; число тестов выросло на 12 (было 131, стало 143). Если ESLint переставил импорты или `// @ts-expect-error` в тесте мешает правилам, поправить минимально, не отключая правила глобально. Если `tsc` ругается на неиспользованный `@ts-expect-error`, значит тип не требует `aria-label`: проверить `Omit` в `IconButtonProps`.

- [ ] **Step 6: Закоммитить**

```bash
git add src/components/icon-button
git commit -m "feat: IconButton, квадратная кнопка на основе Button" -m "$TRAILERS"
```

---

### Task 2: Playground: IconButton в рядах и проверка квадратности

**Files:**
- Create: `playground/src/demo-icon.tsx`
- Modify: `playground/src/demo-controls.tsx`
- Modify: `playground/src/row-checks.ts`
- Modify: `playground/src/button-checks.ts`
- Modify: `playground/src/controls-row-page.tsx`

**Interfaces:**
- Consumes: `IconButton` из `@stark/solid-kit/icon-button`; `DemoControl`, `DEMO_CONTROLS` (Task 3 плана Button).
- Produces: `DemoIcon(): JSX.Element`; контролы `icon-button-primary|tinted|plain|danger` в `DEMO_CONTROLS` с атрибутом `data-row-square`; в `runRowChecks` проверка «ширина равна высоте» для контролов с этим атрибутом; в блоках фокуса по четыре IconButton с `data-focus-name`.

- [ ] **Step 1: Демо-иконка**

Создать `playground/src/demo-icon.tsx` (SVG без атрибутов размера, чтобы размер задавал `1.25em` из CSS IconButton; `currentColor`, чтобы иконка брала цвет кнопки):

```tsx
import type { JSX } from 'solid-js';

/** Плюс для демо IconButton: размер задаёт CSS кнопки, цвет берётся у текста. */
export function DemoIcon(): JSX.Element {
	return (
		<svg viewBox='0 0 16 16' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' aria-hidden='true'>
			<path d='M8 3v10M3 8h10'/>
		</svg>
	);
}
```

- [ ] **Step 2: Контролы в реестре**

В `playground/src/demo-controls.tsx` добавить импорты (`IconButton` после `Button`, `DemoIcon` локальным импортом по порядку проекта) и четыре записи после кнопок:

```tsx
	{
		id: 'icon-button-primary',
		render: (size) => <IconButton data-row-control='icon-button-primary' data-row-square aria-label='Добавить' size={size}><DemoIcon/></IconButton>
	},
	{
		id: 'icon-button-tinted',
		render: (size) => (
			<IconButton data-row-control='icon-button-tinted' data-row-square aria-label='Добавить' variant='tinted' size={size}><DemoIcon/></IconButton>
		)
	},
	{
		id: 'icon-button-plain',
		render: (size) => (
			<IconButton data-row-control='icon-button-plain' data-row-square aria-label='Добавить' variant='plain' size={size}><DemoIcon/></IconButton>
		)
	},
	{
		id: 'icon-button-danger',
		render: (size) => (
			<IconButton data-row-control='icon-button-danger' data-row-square aria-label='Добавить' variant='danger' size={size}><DemoIcon/></IconButton>
		)
	}
```

Если ESLint (`max-len 140`) требует другой разбивки, оставить форму, которую примет `eslint --fix`.

- [ ] **Step 3: Проверка квадратности в рядах**

В `playground/src/row-checks.ts` сразу после `results.push({...})` проверки высоты, внутри цикла по контролам, добавить:

```ts
			if (control.hasAttribute('data-row-square')) {
				results.push({
					name: `${rowId}: ${control.dataset['rowControl'] ?? '?'} (${size}) квадратная`,
					ok: Math.abs(rect.width - rect.height) <= 0.01,
					detail: `ширина ${rect.width}px, высота ${rect.height}px`
				});
			}
```

- [ ] **Step 4: Метка в проверках фокуса**

В `playground/src/button-checks.ts`, в цикле по кнопкам блока фокуса, после `const variant = ...` добавить `const label = button.dataset['focusName'] ?? variant;` и в трёх `check(...)` заменить `${mode}/${variant}` на `${mode}/${label}`. Заменить также упоминание «Button» в JSDoc функции на «Button и IconButton» (проверки контраста текста по токенам относятся только к вариантам и не меняются).

- [ ] **Step 5: IconButton в блоках фокуса**

В `playground/src/controls-row-page.tsx`: добавить импорты `IconButton` и `DemoIcon`; вынести общий для обоих блоков набор в функцию рядом с `renderRow` и использовать её в обоих блоках вместо текущего `<For each={VARIANTS}>...`:

```tsx
// оба блока фокуса показывают одни и те же контролы; список статичен, поэтому реактивность по индексу не нужна
function renderFocusControls(): JSX.Element[] {
	return [
		...VARIANTS.map((variant) => <Button variant={variant}>{variant}</Button>),
		...VARIANTS.map((variant) => (
			<IconButton variant={variant} aria-label={variant} data-focus-name={`icon-${variant}`}><DemoIcon/></IconButton>
		))
	];
}
```

Блоки: `<div class='focus-block' data-focus-block='outer'>{renderFocusControls()}</div>` и то же с `data-focus-block='inset' data-s-kit-focus-inset`.

- [ ] **Step 6: Статическая проверка**

Run: `pnpm exec eslint --fix playground/src && pnpm check`
Expected: зелёный, число тестов то же (143: у playground тестов нет).

- [ ] **Step 7: Проверка в браузере (Chrome)**

Запустить `pnpm dev` в фоне, взять адрес из вывода Vite, открыть `<адрес>/#controls-row`, ждать 300 мс.
Expected (светлая, тёмная, system):
- в каждом из пяти рядов четыре квадратные кнопки с плюсом стоят на одной линии с остальными контролами, ровно по верху и низу;
- плюс в кнопке виден и растёт вместе с размером (sm < md < lg), цвет плюса совпадает с цветом текста варианта;
- нажать «Запустить проверки»: все проверки OK. Ожидаемое число после плана Button было 64, теперь **128**: добавилось 20 высот, 20 квадратностей и 24 проверки кольца (четыре IconButton × 3 проверки × 2 блока). Если число другое, выяснить причину до коммита;
- клавишей Tab дойти до IconButton в обоих блоках фокуса: кольцо снаружи (с зазором) и внутри (на primary и danger тонкая белая линия) не обрезается и не сдвигает соседей;
- консоль без ошибок.

Остановить dev-сервер по PID (после проверки cwd процесса). Если Vite выдал ошибку `composes` (не найден класс `root`), проверить, что в `button.module.css` класс называется `.root`.

- [ ] **Step 8: Закоммитить**

```bash
git add playground
git commit -m "feat(playground): IconButton в рядах, проверка квадратности и кольца фокуса" -m "$TRAILERS"
```

---

### Task 3: IconButton в матрице формы пакета

**Files:**
- Modify: `scripts/consumer/src/main.tsx`
- Modify: `scripts/verify-package-form.sh`

**Interfaces:**
- Consumes: путь `@stark/solid-kit/icon-button`; токен `--s-kit-icon-button-radius` как маркер стилей IconButton в собранном CSS.
- Produces: два новых пункта матрицы: стили IconButton в CSS; порядок «основа, Button, IconButton».

- [ ] **Step 1: Потребитель импортирует IconButton**

В `scripts/consumer/src/main.tsx` добавить `import { IconButton } from '@stark/solid-kit/icon-button';` (по порядку импортов, после `button`) и рядом с Button элемент `<IconButton id="icon-btn" aria-label="Закрыть" variant="tinted">×</IconButton>`.

- [ ] **Step 2: Проверки сборки**

В `scripts/verify-package-form.sh` после пункта про порядок основы и Button добавить:

```bash
grep -lq -- '--s-kit-icon-button-radius' dist/assets/*.css && ok "IconButton styles are in the built CSS" || fail "IconButton styles are missing from the built CSS"
# composes в два шага: правила Button должны стоять в CSS раньше правил IconButton, иначе квадрат и радиус не перекроют Button
node -e '
const fs = require("node:fs");
const dir = "dist/assets";
const css = fs.readdirSync(dir).filter((file) => file.endsWith(".css")).map((file) => fs.readFileSync(dir + "/" + file, "utf8")).join("\n");
const button = css.indexOf("--s-kit-button-radius");
const iconButton = css.indexOf("--s-kit-icon-button-radius");
console.log("button rules at", button, "icon button rules at", iconButton);
process.exit(button >= 0 && iconButton > button ? 0 : 1);
' && ok "Button rules come before IconButton rules in the built CSS" || fail "IconButton rules are missing or come before Button rules in the built CSS"
```

- [ ] **Step 3: Коммит и прогон матрицы**

Матрица ставит пакет по коммиту, поэтому сначала закоммитить:

```bash
git add scripts
git commit -m "test: IconButton в матрице формы пакета, проверка порядка CSS" -m "$TRAILERS"
scripts/verify-package-form.sh "$(git rev-parse HEAD)"
```

Expected: все пункты OK, включая два новых; `tsc` потребителя проходит на TypeScript 5.9.3 и 7.0.2 (в потребителе `<IconButton aria-label=...>` компилируется). Если порядок CSS не тот, исправить в `icon-button.module.css` (например, поднять специфичность `.root[data-s-kit]`) и повторить Task 1 Step 5 и этот шаг; в отчёте записать причину.

- [ ] **Step 4: Удалить временный проект-потребитель**

Скрипт печатает путь `consumer project kept at: ...`; проверить, что каталог лежит вне репозитория (`git status` чистый), и удалить его.

---

### Task 4: Спек и закрытие плана

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md`

- [ ] **Step 1: Обновить спек этапа**

В таблице порядка (раздел 1) у строки IconButton заменить «Квадратная версия Button, разделяет основу» на то же описание с пометкой **Готов** и списком коммитов (`git log --oneline -4`). В конец документа добавить раздел «9. Итоги IconButton (2026-10-29)» по образцу раздела 8: число проверок страницы (из Task 2 Step 7), что порядок CSS «основа, Button, IconButton» подтверждён матрицей, и список непроверенного (Firefox 125, Safari 17.5, hover и active мышью, `forced-colors`). Если по ходу плана принималось решение, отличающееся от раздела 3.1, исправить раздел 3.1 тем же коммитом.

- [ ] **Step 2: Итоговая проверка и коммит**

Run: `pnpm check` и `git status` (чисто). Затем:

```bash
git add docs
git commit -m "docs: IconButton готов" -m "$TRAILERS"
```

Тег не ставится (ставится в конце этапа 1). Следующий компонент по порядку: Input.

---

## Самопроверка плана

- **Покрытие спека (раздел 3.1):** обязательное имя на уровне типов (Task 1: интерфейс и тест `@ts-expect-error`), геометрия по единому правилу размера, `flex: none` и размер `svg` (Task 1 CSS), реализация через `composes` и токен радиуса (Task 1; порядок CSS в Task 3), общие тесты и доступное имя (Task 1), квадратность и кольцо на странице (Task 2), матрица (Task 3), закрытие (Task 4). Общие соглашения раздела 2: раскладка папки, `splitProps`/`mergeProps`, `data-s-kit`, `data-s-kit-size` только при `size`, фолбэк высоты.
- **Типы:** `IconButtonVariant`/`IconButtonSize` совпадают по значениям с `ButtonVariant`/`ButtonSize`; `data-row-square` читается в `row-checks.ts` через `hasAttribute`; `data-focus-name` читается через `dataset['focusName']`.
- **Известные риски:** порядок CSS при двухуровневом `composes` (Task 3 Step 3); тип `JSX.ButtonHTMLAttributes` допускает `data-*` для `data-row-square` без значения (если `tsc` не принимает, задать `data-row-square=''`); число проверок страницы 128 выведено расчётом (Task 2 Step 7), расхождение требует разбора; `ESLint --fix` может переставить импорты.
- **Не покрыто сознательно:** отдельные состояния hover/active (общие с Button, проверены токенами в плане Button); поддержка `aria-labelledby` (YAGNI, см. спек 3.1).
