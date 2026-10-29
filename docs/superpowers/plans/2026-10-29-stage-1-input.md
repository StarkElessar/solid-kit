# solid-kit, этап 1: Input — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** третий компонент этапа 1. Текстовое поле Input на нативном `<input>` с контролируемым и неконтролируемым значением, границей `control-edge` (3:1), состоянием ошибки через `aria-invalid`; в ряду «Контролы в ряд» стоит на одной линии с кнопками, контраст границы, текста и плейсхолдера и кольцо фокуса проверяются на странице, компонент входит в матрицу формы пакета.

**Архитектура:** плоский компонент на `splitProps`/`mergeProps`; значение через `createControllableSignal`; общая основа контролов подключается через `composes`, компонентный CSS добавляет границу, цвета и курсор. Состояние ошибки читается из нативного `aria-invalid`, чтобы Field мог управлять любым контролом одним способом.

**Стек:** как в этапе 0 и плане Button.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (основной; раздел 3.2 описывает Input, разделы 2 и 4 общие соглашения и страницу), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 4, 5, 5.1, 7, 11, 12, вопрос 8).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане, не добавлять `LICENSE`, не менять git-идентичность. Тег `v0.2.0` ставится в конце всего этапа 1, не здесь.
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком `var(--s-kit-control-height, var(--s-kit-control-height-md))`).
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140), Stylelint (4 пробела, двойные кавычки, логические свойства; `pnpm exec stylelint --fix <файл>` расставляет свойства по порядку). Перед каждым коммитом `pnpm check` зелёный.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd, никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome; окно должно быть в фокусе (клик по странице), иначе кольца фокуса дают ложные FAIL; Firefox и Safari не проверяются (записывается в отчёте).
- Начало плана: `git status` чистый, `pnpm check` зелёный (143 теста). Решение владельца по вопросу 8: граница полей `control-edge` (вариант (б)).

---

### Task 1: Компонент Input

**Files:**
- Create: `src/components/input/input.tsx`
- Create: `src/components/input/input.module.css`
- Create: `src/components/input/index.ts`
- Test: `src/components/input/input.test.tsx`

**Interfaces:**
- Consumes: `createControllableSignal<T>(options: { name: string; value: () => T | undefined; defaultValue: () => T; onChange?: (next: T) => void }): [get: Accessor<T>, set: (next: T) => void]` из `src/utils/create-controllable-signal.ts`; класс `control` из `src/styles/control-base.module.css`.
- Produces: `Input(props: InputProps): JSX.Element`; типы `InputProps`, `InputSize`; публичный путь `@stark/solid-kit/input`; компонентные токены `--s-kit-input-border`, `--s-kit-input-radius`, `--s-kit-input-width`.

- [ ] **Step 1: Написать падающие тесты**

Создать `src/components/input/input.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Input } from './input';

afterEach(cleanup);

function typeInto(input: HTMLElement, text: string): void {
	(input as HTMLInputElement).value = text;
	fireEvent.input(input);
}

describe('Input', () => {
	it('renders a native text input with the kit root attribute', () => {
		render(() => <Input aria-label='Имя'/>);
		const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Имя' });
		expect(input.tagName).toBe('INPUT');
		expect(input.type).toBe('text');
		expect(input.hasAttribute('data-s-kit')).toBe(true);
	});

	it('lets the type be overridden', () => {
		render(() => <Input aria-label='Пароль' type='password' data-testid='p'/>);
		expect(screen.getByTestId<HTMLInputElement>('p').type).toBe('password');
	});

	it('sets data-s-kit-size only when size is passed and never the native size attribute', () => {
		render(() => (
			<>
				<Input aria-label='Без размера'/>
				<Input aria-label='Большое' size='lg'/>
			</>
		));
		const plain = screen.getByRole('textbox', { name: 'Без размера' });
		const large = screen.getByRole('textbox', { name: 'Большое' });
		expect(plain.hasAttribute('data-s-kit-size')).toBe(false);
		expect(large.getAttribute('data-s-kit-size')).toBe('lg');
		expect(large.hasAttribute('size')).toBe(false);
	});

	it('shows defaultValue and reports typing through onValueChange when uncontrolled', () => {
		const onValueChange = vi.fn();
		render(() => <Input aria-label='Имя' defaultValue='Анна' onValueChange={onValueChange}/>);
		const input = screen.getByRole<HTMLInputElement>('textbox');
		expect(input.value).toBe('Анна');
		typeInto(input, 'Анна М');
		expect(onValueChange).toHaveBeenCalledWith('Анна М');
		expect(input.value).toBe('Анна М');
	});

	it('is empty by default', () => {
		render(() => <Input aria-label='Имя'/>);
		expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('');
	});

	it('shows the controlled value and follows the parent', () => {
		const [value, setValue] = createSignal('один');
		render(() => <Input aria-label='Имя' value={value()} onValueChange={setValue}/>);
		const input = screen.getByRole<HTMLInputElement>('textbox');
		expect(input.value).toBe('один');
		typeInto(input, 'два');
		expect(value()).toBe('два');
		expect(input.value).toBe('два');
		setValue('три');
		expect(input.value).toBe('три');
	});

	it('returns to the controlled value when the parent does not accept the change', () => {
		const onValueChange = vi.fn();
		render(() => <Input aria-label='Имя' value='закреплено' onValueChange={onValueChange}/>);
		const input = screen.getByRole<HTMLInputElement>('textbox');
		typeInto(input, 'другое');
		expect(onValueChange).toHaveBeenCalledWith('другое');
		expect(input.value).toBe('закреплено');
	});

	it('is disabled when asked to', () => {
		render(() => <Input aria-label='Имя' disabled/>);
		expect(screen.getByRole<HTMLInputElement>('textbox').disabled).toBe(true);
	});

	it('forwards native attributes, class, style and events', () => {
		const onFocus = vi.fn();
		render(() => (
			<Input
				aria-label='Почта'
				aria-invalid='true'
				placeholder='name@example.com'
				class='extra'
				style={{ 'margin-inline-start': '4px' }}
				onFocus={onFocus}
			/>
		));
		const input = screen.getByRole<HTMLInputElement>('textbox');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.placeholder).toBe('name@example.com');
		expect(input.classList.contains('extra')).toBe(true);
		expect(input.style.marginInlineStart).toBe('4px');
		fireEvent.focus(input);
		expect(onFocus).toHaveBeenCalledOnce();
	});

	it('does not accept the raw onInput handler', () => {
		// @ts-expect-error значение отдаёт onValueChange, onInput не пробрасывается
		const withOnInput = (): unknown => <Input aria-label='Имя' onInput={() => undefined}/>;
		expect(withOnInput).toBeTypeOf('function');
	});
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm exec vitest run src/components/input`
Expected: FAIL, не найден модуль `./input`.

- [ ] **Step 3: Реализовать компонент**

Создать `src/components/input/input.tsx`:

```tsx
import styles from './input.module.css';

import { type JSX, mergeProps, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
	extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'class' | 'style' | 'size' | 'value' | 'defaultValue' | 'onInput'> {
	value?: string | undefined;
	defaultValue?: string | undefined;
	onValueChange?: ((value: string) => void) | undefined;
	size?: InputSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function Input(props: InputProps): JSX.Element {
	const merged = mergeProps({ type: 'text' } as const, props);
	const [local, rest] = splitProps(merged, ['value', 'defaultValue', 'onValueChange', 'size', 'class', 'style']);

	const [value, setValue] = createControllableSignal<string>({
		name: 'Input',
		value: () => local.value,
		defaultValue: () => local.defaultValue ?? '',
		onChange: (next) => local.onValueChange?.(next)
	});

	const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (event) => {
		setValue(event.currentTarget.value);
		// контролируемый режим: родитель мог не принять значение, тогда поле возвращается к нему
		if (event.currentTarget.value !== value()) {
			event.currentTarget.value = value();
		}
	};

	return (
		<input
			{...rest}
			value={value()}
			onInput={handleInput}
			data-s-kit
			data-s-kit-size={local.size}
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		/>
	);
}
```

Создать `src/components/input/index.ts`:

```ts
export type { InputProps, InputSize } from './input';
export { Input } from './input';
```

Создать `src/components/input/input.module.css`:

```css
/*
 * Компонентные токены Input (публичный API кастомизации, читаются с фолбэком на глобальные):
 *   --s-kit-input-border, --s-kit-input-radius, --s-kit-input-width
 * Ошибка поля задаётся нативным aria-invalid="true": красная граница и красное кольцо фокуса.
 */

.root {
    composes: control from "../../styles/control-base.module.css";
    cursor: text;
    inline-size: var(--s-kit-input-width, 12rem);
    min-inline-size: 0;
    border: 1px solid var(--s-kit-input-border, var(--s-kit-color-control-edge));
    border-radius: var(--s-kit-input-radius, var(--s-kit-radius));
    color: var(--s-kit-color-text);
    background: var(--s-kit-color-surface);
}

.root::placeholder {
    color: var(--s-kit-color-muted);
    opacity: 1;
}

.root[aria-invalid="true"] {
    border-color: var(--s-kit-color-danger);
}

.root[aria-invalid="true"]:focus-visible {
    outline-color: var(--s-kit-color-danger);
}
```

- [ ] **Step 4: Тесты проходят**

Run: `pnpm exec vitest run src/components/input`
Expected: PASS, 10 тестов, ни одного пропущенного. Если «returns to the controlled value» падает, убедиться, что в `handleInput` присвоение `event.currentTarget.value = value()` стоит после `setValue`. Если `tsc` ругается на неиспользованный `@ts-expect-error`, значит `onInput` не исключён из `InputProps`.

- [ ] **Step 5: Полная проверка**

Run: `pnpm exec stylelint --fix src/components/input/input.module.css && pnpm exec eslint --fix src/components/input && pnpm check`
Expected: зелёный, 153 теста (было 143). `solid/reactivity` в `input.tsx` не должен жаловаться: чтения пропсов стоят внутри функций. Если ESLint переставил импорты или пересобрал отступы, оставить его вариант.

- [ ] **Step 6: Закоммитить**

```bash
git add src/components/input
git commit -m "feat: Input, текстовое поле с граничным контрастом 3:1" -m "$TRAILERS"
```

---

### Task 2: Playground: Input в рядах, проверки контраста и кольца

**Files:**
- Modify: `playground/src/demo-controls.tsx`
- Create: `playground/src/input-checks.ts`
- Modify: `playground/src/button-checks.ts`
- Modify: `playground/src/controls-row-page.tsx`

**Interfaces:**
- Consumes: `Input` из `@stark/solid-kit/input`; `resolveColor`, `CheckResult` из `theme-checks.ts`; `contrastRatio`, `blend`, `Rgb` из `src/utils/color-math`; `DEMO_CONTROLS`, `renderFocusControls`.
- Produces: контролы `input` и `input-invalid` в `DEMO_CONTROLS`; `runInputChecks(page: HTMLElement): CheckResult[]`; два поля в блоках фокуса с `data-focus-name`.

- [ ] **Step 1: Поля в реестре**

В `playground/src/demo-controls.tsx` добавить импорт `Input` (после `IconButton`) и две записи в конец `DEMO_CONTROLS`:

```tsx
	{ id: 'input', render: (size) => <Input data-row-control='input' aria-label='Поле' placeholder='Текст' size={size}/> },
	{
		id: 'input-invalid',
		render: (size) => <Input data-row-control='input-invalid' aria-label='Поле с ошибкой' aria-invalid='true' defaultValue='Ошибка' size={size}/>
	}
```

Если строка длиннее 140 символов, разбить так, как примет `eslint --fix`.

- [ ] **Step 2: Проверки поля**

Создать `playground/src/input-checks.ts`:

```ts
import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Цвет поверх фона: полупрозрачные цвета (граница, кольцо) смешиваются с заливкой под ними. */
function over(color: Rgba, under: Rgba): Rgb {
	return blend(rgb(color), color[3] / 255, rgb(under));
}

/** Граница поля 3:1 (WCAG 1.4.11), текст и плейсхолдер 4.5:1 на обычном поле и граница поля с ошибкой 3:1. */
export function runInputChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const input = page.querySelector<HTMLInputElement>('[data-row="row-1"] [data-row-control="input"]');
	const invalid = page.querySelector<HTMLInputElement>('[data-row="row-1"] [data-row-control="input-invalid"]');
	if (!input || !invalid) {
		throw new Error('Playground element is missing: input in row-1');
	}
	const surface = resolveColor(getComputedStyle(input).backgroundColor);
	const ratio = (foreground: Rgb): number => contrastRatio(foreground, rgb(surface));

	const border = ratio(over(resolveColor(getComputedStyle(input).borderTopColor), surface));
	check('Input: граница отличима от фона (3:1)', border >= 3, `контраст ${border.toFixed(2)}:1`);

	const invalidBorder = ratio(over(resolveColor(getComputedStyle(invalid).borderTopColor), surface));
	check('Input с ошибкой: граница отличима от фона (3:1)', invalidBorder >= 3, `контраст ${invalidBorder.toFixed(2)}:1`);

	const text = ratio(over(resolveColor(getComputedStyle(input).color), surface));
	check('Input: текст читаем (4.5:1)', text >= 4.5, `контраст ${text.toFixed(2)}:1`);

	const placeholder = ratio(over(resolveColor(getComputedStyle(input, '::placeholder').color), surface));
	check('Input: плейсхолдер читаем (4.5:1)', placeholder >= 4.5, `контраст ${placeholder.toFixed(2)}:1`);
	return results;
}
```

- [ ] **Step 3: Фокус на полях**

В `playground/src/button-checks.ts`: в цикле по блокам фокуса заменить `block.querySelectorAll<HTMLButtonElement>('button')` на `block.querySelectorAll<HTMLElement>('button, input')`, переименовать переменную `button` в `control` (во всём цикле, включая `underlying(control, surface)`), а `const label = ...` привести к виду:

```ts
			const label = control.dataset['focusName'] ?? control.dataset['variant'] ?? '?';
```

Строку `const variant = ...` удалить, если она больше нигде не используется. В JSDoc функции дописать «и поля Input (кольцо)».

- [ ] **Step 4: Поля в блоках фокуса и запуск проверок**

В `playground/src/controls-row-page.tsx`: импорт `Input` и `runInputChecks`; в `renderFocusControls` добавить в конец возвращаемого массива:

```tsx
		<Input aria-label='Поле' placeholder='Текст' data-focus-name='input'/>,
		<Input aria-label='Поле с ошибкой' aria-invalid='true' defaultValue='Ошибка' data-focus-name='input-invalid'/>
```

В `runChecks` добавить `...runInputChecks(page)` к списку результатов (после `runButtonChecks`).

- [ ] **Step 5: Статическая проверка**

Run: `pnpm exec eslint --fix playground/src && pnpm check`
Expected: зелёный, 153 теста (у playground тестов нет).

- [ ] **Step 6: Проверка в браузере (Chrome)**

`pnpm dev` в фоне (порт из вывода Vite, PID сохранить), открыть `<адрес>/#controls-row`, кликнуть по странице (фокус окна), нажать «Запустить проверки», проверить темы system, light, dark (после смены темы ждать 600 мс).
Expected в каждой теме:
- в каждом из пяти рядов два поля стоят на одной линии с остальными контролами, верх и низ совпадают, высоты 28, 32 и 40 px;
- **154 проверки, все OK** (было 128: +10 высот, +12 колец у двух полей в двух блоках, +4 проверки Input). Если число или результат другие, выяснить причину до коммита;
- глазами: граница поля заметна в обеих темах, поле с ошибкой с красной границей, плейсхолдер читаем; Tab на поле даёт внешнее кольцо с зазором, у поля с ошибкой красное, в блоке `data-s-kit-focus-inset` кольцо внутри поля;
- ввод текста в поле меняет его и не ломает ряд; консоль без ошибок.

Остановить dev-сервер по PID (после проверки cwd процесса: `lsof -a -p <PID> -d cwd -Fn`).

- [ ] **Step 7: Закоммитить**

```bash
git add playground
git commit -m "feat(playground): Input в рядах, проверки границы, текста, плейсхолдера и кольца" -m "$TRAILERS"
```

---

### Task 3: Input в матрице формы пакета

**Files:**
- Modify: `scripts/consumer/src/main.tsx`
- Modify: `scripts/verify-package-form.sh`

**Interfaces:**
- Consumes: путь `@stark/solid-kit/input`; токен `--s-kit-input-radius` как маркер стилей Input в собранном CSS.
- Produces: два новых пункта матрицы: стили Input в CSS; правило основы стоит в CSS раньше правил Input.

- [ ] **Step 1: Потребитель импортирует Input**

В `scripts/consumer/src/main.tsx` добавить `import { Input } from '@stark/solid-kit/input';` (по порядку импортов, после `icon-button`) и рядом с остальными элементами `<Input id="field" aria-label="Имя" defaultValue="Анна" aria-invalid="true" />`.

- [ ] **Step 2: Проверки сборки**

В `scripts/verify-package-form.sh` после пункта про порядок Button и IconButton добавить:

```bash
grep -lq -- '--s-kit-input-radius' dist/assets/*.css && ok "Input styles are in the built CSS" || fail "Input styles are missing from the built CSS"
# composes: правило общей основы должно стоять в CSS раньше правил Input, иначе основа (border: 0) перекроет границу поля
node -e '
const fs = require("node:fs");
const dir = "dist/assets";
const css = fs.readdirSync(dir).filter((file) => file.endsWith(".css")).map((file) => fs.readFileSync(dir + "/" + file, "utf8")).join("\n");
const base = css.search(/\._control_[a-z0-9_]+\{/);
const input = css.indexOf("--s-kit-input-radius");
console.log("control base at", base, "input rules at", input);
process.exit(base >= 0 && input > base ? 0 : 1);
' && ok "control base comes before Input rules in the built CSS" || fail "control base is missing or comes after Input rules in the built CSS"
```

- [ ] **Step 3: Коммит и прогон матрицы**

Матрица ставит пакет по коммиту, поэтому сначала закоммитить:

```bash
git add scripts
git commit -m "test: Input в матрице формы пакета, проверка порядка CSS" -m "$TRAILERS"
scripts/verify-package-form.sh "$(git rev-parse HEAD)"
```

Expected: все пункты OK, включая два новых; `tsc` потребителя проходит на TypeScript 5.9.3 и 7.0.2.

- [ ] **Step 4: Удалить временный проект-потребитель**

Скрипт печатает `consumer project kept at: ...`; проверить, что каталог лежит вне репозитория, и удалить его (`git status` чистый).

---

### Task 4: Спек и закрытие плана

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md`
- Modify: `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md`

- [ ] **Step 1: Закрыть вопрос 8 в зонтичном спеке**

В `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md`:
- в списке открытых вопросов (раздел 14) вопрос 8 пометить закрытым (2026-10-29): выбран вариант (б), граница полей ввода `--s-kit-color-control-edge`, 3:1 в обеих темах; Select, Combobox, MultiSelect и DatePicker берут ту же границу в своих этапах;
- в абзаце «Линии и выделение» раздела 4 заменить фразу про границу `border-strong` у полей ввода и триггеров на `control-edge` и убрать оговорку про открытый вопрос 8 (`border-strong` остаётся у линий панелей и заголовков групп).

- [ ] **Step 2: Итоги в спеке этапа**

В таблице порядка (раздел 1) у строки Input добавить **Готов** и коммиты (`git log --oneline -4`). Добавить раздел «10. Итоги Input (2026-10-29)» по образцу разделов 8 и 9: число проверок страницы (из Task 2 Step 6), порядок CSS «основа, Input» подтверждён матрицей, что граница, текст и плейсхолдер проходят пороги, и список непроверенного (Firefox 125, Safari 17.5, hover мышью, `forced-colors`, сброс контролируемого значения в Safari и Firefox). Если по ходу принималось решение, отличающееся от раздела 3.2, исправить раздел 3.2 тем же коммитом.

- [ ] **Step 3: Итоговая проверка и коммит**

Run: `pnpm check` и `git status` (чисто). Затем:

```bash
git add docs
git commit -m "docs: Input готов, вопрос 8 закрыт (граница control-edge)" -m "$TRAILERS"
```

Тег не ставится. Следующий компонент по порядку: Field.

---

## Самопроверка плана

- **Покрытие спека (раздел 3.2):** граница `control-edge` (Task 1 CSS, проверка контраста на странице в Task 2, уже существующий тест токена), режимы значения и отказ родителя (Task 1 тесты и `handleInput`), `onInput` не пробрасывается и нативный `size` исключён (Task 1 типы и тесты), `aria-invalid` (Task 1 CSS, Task 2 демо и кольцо), корень и размеры (Task 1), основа через `composes` (Task 1, порядок в Task 3), цвета и контраст текста и плейсхолдера (Task 2 `runInputChecks`), токены (Task 1 CSS, маркер в Task 3), вопрос 8 закрыт (Task 4).
- **Типы:** `InputSize` совпадает с `ButtonSize` по значениям; `data-focus-name` читается через `dataset['focusName']`; `runInputChecks` берёт `row-1` и атрибуты `data-row-control`, заданные в `DEMO_CONTROLS`.
- **Известные риски:** `display: inline-flex` из основы на `<input>` может сдвинуть базовую линию в ряду (поймают проверки высот и верха и низа; при необходимости задать `display: inline-block` в `input.module.css`); `getComputedStyle(el, '::placeholder')` в Chrome возвращает цвет плейсхолдера, в других браузерах не проверяется; число проверок 154 выведено расчётом; `eslint --fix` может переставить импорты.
- **Не покрыто сознательно:** отдельный стиль `readonly` и `hover` поля (YAGNI), `aria-labelledby`/подпись (за Field), типизация `type` по видам ввода, поведение `type='number'` (за NumericInput).
