# solid-kit, этап 1: Field — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** четвёртый компонент этапа 1. Field: подпись, контрол, подсказка или ошибка. Связывает их через `id`, `aria-describedby`, `aria-invalid`, работает с любым контролом значений, размер раздаёт вложенному контролу. На странице «Контролы в ряд» появляется раздел с двумя Field вокруг Input и браузерные проверки связи, размера и контраста сообщений; компонент входит в матрицу формы пакета.

**Архитектура:** плоский компонент без контекста и без зависимости от Input; контрол получает атрибуты через функцию-ребёнка (`children: (control: FieldControlProps) => JSX.Element`), объект передаётся с геттерами, чтобы `{...control}` оставался реактивным. Стили не используют `control-base` (это не контрол): колонка, подпись, сообщение.

**Стек:** как в этапе 0 и планах Button, IconButton, Input.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (основной; раздел 3.3 описывает Field, раздел 2 общие соглашения), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 5, 7, 11, 12).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане, не добавлять `LICENSE`, не менять git-идентичность. Тег `v0.2.0` ставится в конце всего этапа 1, не здесь.
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл (демо-компоненты playground тоже).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком).
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, `solid/reactivity` как ошибка), Stylelint (4 пробела, двойные кавычки, логические свойства; `pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome; окно должно быть в фокусе (клик по странице), иначе кольца фокуса дают ложные FAIL; Firefox и Safari не проверяются (записывается в отчёте).
- Начало плана: `git status` чистый, `pnpm check` зелёный (153 теста).

---

### Task 1: Компонент Field

**Files:**
- Create: `src/components/field/field.tsx`
- Create: `src/components/field/field.module.css`
- Create: `src/components/field/index.ts`
- Test: `src/components/field/field.test.tsx`

**Interfaces:**
- Consumes: из `solid-js`: `children`, `createUniqueId`, `Show`, `splitProps`, `type JSX`.
- Produces: `Field(props: FieldProps): JSX.Element`; типы `FieldProps`, `FieldSize`, `FieldControlProps` (`{ readonly id: string; readonly 'aria-describedby': string | undefined; readonly 'aria-invalid': true | undefined }`); публичный путь `@stark/solid-kit/field`; токен `--s-kit-field-gap`.

- [ ] **Step 1: Написать падающие тесты**

Создать `src/components/field/field.test.tsx`:

```tsx
import { cleanup, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from './field';

afterEach(cleanup);

function describedText(control: HTMLElement): string {
	const ids = control.getAttribute('aria-describedby')?.split(' ') ?? [];
	return ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
}

describe('Field', () => {
	it('links the label to the control', () => {
		render(() => <Field label='Имя'>{(control) => <input {...control}/>}</Field>);
		const input = screen.getByLabelText('Имя');
		expect(input.tagName).toBe('INPUT');
		expect(input.id).not.toBe('');
	});

	it('uses the given id for the control and the label', () => {
		render(() => <Field label='Имя' id='name-field'>{(control) => <input {...control}/>}</Field>);
		expect(screen.getByLabelText('Имя').id).toBe('name-field');
	});

	it('gives two fields different ids', () => {
		render(() => (
			<>
				<Field label='Первое'>{(control) => <input {...control}/>}</Field>
				<Field label='Второе'>{(control) => <input {...control}/>}</Field>
			</>
		));
		expect(screen.getByLabelText('Первое').id).not.toBe(screen.getByLabelText('Второе').id);
	});

	it('shows the hint and describes the control with it', () => {
		render(() => <Field label='Имя' hint='Как в паспорте'>{(control) => <input {...control}/>}</Field>);
		const input = screen.getByLabelText('Имя');
		expect(describedText(input)).toBe('Как в паспорте');
		expect(input.hasAttribute('aria-invalid')).toBe(false);
	});

	it('shows the error instead of the hint and marks the control invalid', () => {
		render(() => (
			<Field label='Имя' hint='Как в паспорте' error='Обязательное поле'>
				{(control) => <input {...control}/>}
			</Field>
		));
		const input = screen.getByLabelText('Имя');
		expect(describedText(input)).toBe('Обязательное поле');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(screen.queryByText('Как в паспорте')).toBeNull();
	});

	it('has no description and no invalid mark without a hint or an error', () => {
		render(() => <Field label='Имя'>{(control) => <input {...control}/>}</Field>);
		const input = screen.getByLabelText('Имя');
		expect(input.hasAttribute('aria-describedby')).toBe(false);
		expect(input.hasAttribute('aria-invalid')).toBe(false);
	});

	it('follows the error appearing and disappearing', () => {
		const [error, setError] = createSignal<string | undefined>();
		render(() => (
			<Field label='Имя' hint='Подсказка' error={error()}>
				{(control) => <input {...control}/>}
			</Field>
		));
		const input = screen.getByLabelText('Имя');
		expect(describedText(input)).toBe('Подсказка');
		setError('Обязательно');
		expect(describedText(input)).toBe('Обязательно');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		setError(undefined);
		expect(describedText(input)).toBe('Подсказка');
		expect(input.hasAttribute('aria-invalid')).toBe(false);
	});

	it.each([undefined, null, false, ''] as const)('treats %j as no error', (empty) => {
		render(() => <Field label='Имя' error={empty}>{(control) => <input {...control}/>}</Field>);
		expect(screen.getByLabelText('Имя').hasAttribute('aria-invalid')).toBe(false);
	});

	it('sets the root attributes: size only when passed, invalid only with an error', () => {
		render(() => (
			<>
				<Field label='Один' data-testid='plain'>{(control) => <input {...control}/>}</Field>
				<Field label='Два' size='sm' error='Ошибка' data-testid='sized'>{(control) => <input {...control}/>}</Field>
			</>
		));
		const plain = screen.getByTestId('plain');
		const sized = screen.getByTestId('sized');
		expect(plain.hasAttribute('data-s-kit')).toBe(true);
		expect(plain.hasAttribute('data-s-kit-size')).toBe(false);
		expect(plain.hasAttribute('data-invalid')).toBe(false);
		expect(sized.getAttribute('data-s-kit-size')).toBe('sm');
		expect(sized.hasAttribute('data-invalid')).toBe(true);
	});

	it('forwards class and style to the root', () => {
		render(() => (
			<Field label='Имя' class='extra' style={{ 'margin-inline-start': '4px' }} data-testid='root'>
				{(control) => <input {...control}/>}
			</Field>
		));
		const root = screen.getByTestId('root');
		expect(root.classList.contains('extra')).toBe(true);
		expect(root.style.marginInlineStart).toBe('4px');
	});
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm exec vitest run src/components/field`
Expected: FAIL, не найден модуль `./field`.

- [ ] **Step 3: Реализовать компонент**

Создать `src/components/field/field.tsx`:

```tsx
import styles from './field.module.css';

import { children, createUniqueId, type JSX, Show, splitProps } from 'solid-js';

export type FieldSize = 'sm' | 'md' | 'lg';

/** Атрибуты, которые Field передаёт контролу: контракт для всех контролов значений. */
export interface FieldControlProps {
	readonly id: string;
	readonly 'aria-describedby': string | undefined;
	readonly 'aria-invalid': true | undefined;
}

export interface FieldProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'children' | 'id'> {
	label: JSX.Element;
	hint?: JSX.Element | undefined;
	/** Наличие содержимого означает «поле с ошибкой»; ошибка показывается вместо подсказки. */
	error?: JSX.Element | undefined;
	/** id контрола; по умолчанию уникальный. */
	id?: string | undefined;
	size?: FieldSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children: (control: FieldControlProps) => JSX.Element;
}

// «пусто»: undefined, null, false и пустая строка (в том числе внутри массива)
function isPresent(resolved: unknown): boolean {
	const items = Array.isArray(resolved) ? resolved : [resolved];
	return items.some((item) => item !== undefined && item !== null && item !== false && item !== '');
}

export function Field(props: FieldProps): JSX.Element {
	const [local, rest] = splitProps(props, ['label', 'hint', 'error', 'id', 'size', 'class', 'style', 'children']);
	const generatedId = createUniqueId();
	const controlId = (): string => local.id ?? generatedId;
	const hintId = (): string => `${controlId()}-hint`;
	const errorId = (): string => `${controlId()}-error`;

	// children() вычисляет JSX один раз: повторное чтение пропса создало бы элемент заново
	const hint = children(() => local.hint);
	const error = children(() => local.error);
	const hasError = (): boolean => isPresent(error());
	const hasHint = (): boolean => !hasError() && isPresent(hint());

	// геттеры: {...control} остаётся реактивным, когда ошибка появляется и пропадает
	const control: FieldControlProps = {
		get id() {
			return controlId();
		},
		get 'aria-describedby'() {
			if (hasError()) {
				return errorId();
			}
			return hasHint() ? hintId() : undefined;
		},
		get 'aria-invalid'() {
			return hasError() ? true : undefined;
		}
	};

	return (
		<div
			{...rest}
			data-s-kit
			data-s-kit-size={local.size}
			data-invalid={hasError() ? '' : undefined}
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		>
			<label for={controlId()} class={styles['label']}>{local.label}</label>
			{local.children(control)}
			<Show when={hasError()}>
				<div id={errorId()} class={styles['message']}>{error()}</div>
			</Show>
			<Show when={hasHint()}>
				<div id={hintId()} class={styles['message']}>{hint()}</div>
			</Show>
		</div>
	);
}
```

Создать `src/components/field/index.ts`:

```ts
export type { FieldControlProps, FieldProps, FieldSize } from './field';
export { Field } from './field';
```

Создать `src/components/field/field.module.css`:

```css
/*
 * Компонентные токены Field (публичный API кастомизации, читаются с фолбэком на глобальные):
 *   --s-kit-field-gap
 * Размер на корне (data-s-kit-size) действует и на вложенный контрол; ошибка показывается атрибутом data-invalid.
 */

.root {
    display: flex;
    flex-direction: column;
    gap: var(--s-kit-field-gap, 6px);

    font-family: var(--s-kit-font);
    font-size: var(--s-kit-control-font-size, var(--s-kit-control-font-size-md));
    line-height: var(--s-kit-line-height);
    color: var(--s-kit-color-text);
}

.label {
    font-weight: 500;
}

.message {
    color: var(--s-kit-color-muted);
}

.root[data-invalid] .message {
    color: var(--s-kit-color-danger);
}
```

- [ ] **Step 4: Тесты проходят**

Run: `pnpm exec vitest run src/components/field`
Expected: PASS, 13 тестов (9 одиночных и 4 из `it.each`), ни одного пропущенного. Если «follows the error appearing…» падает, убедиться, что в `control` используются геттеры, а не значения. Если проваливаются случаи `it.each` с `''` или `false`, проверить `isPresent` и то, как `children()` разворачивает значение (при необходимости логировать `error()`).

- [ ] **Step 5: Полная проверка**

Run: `pnpm exec stylelint --fix src/components/field/field.module.css && pnpm exec eslint --fix src/components/field && pnpm check`
Expected: зелёный, 166 тестов (было 153). Если `solid/reactivity` жалуется на чтение `local.children(control)` в JSX или на геттеры, поправить минимально (например, вынести в функцию), не отключая правило глобально; если `tsc` не принимает `data-invalid={... ? '' : undefined}`, использовать `attr:`-форму или булев `data-invalid={hasError()}` (Solid выставит атрибут при `true`) и сверить тест корневых атрибутов.

- [ ] **Step 6: Закоммитить**

```bash
git add src/components/field
git commit -m "feat: Field, подпись, подсказка и ошибка вокруг контрола" -m "$TRAILERS"
```

---

### Task 2: Playground: раздел с Field и браузерные проверки

**Files:**
- Create: `playground/src/demo-fields.tsx`
- Create: `playground/src/field-checks.ts`
- Modify: `playground/src/controls-row-page.tsx`
- Modify: `playground/src/playground.css` (только если нужен отступ раздела)

**Interfaces:**
- Consumes: `Field`, `FieldControlProps` из `@stark/solid-kit/field`; `Input` из `@stark/solid-kit/input`; `resolveColor`, `CheckResult` из `theme-checks.ts`; `contrastRatio`, `Rgb` из `src/utils/color-math`.
- Produces: `DemoFields(): JSX.Element`; `runFieldChecks(page: HTMLElement): CheckResult[]`; по 4 проверки на каждый из двух Field с `data-field-demo`.

- [ ] **Step 1: Демо-компонент**

Создать `playground/src/demo-fields.tsx` (первый Field без размера и с подсказкой, второй с `size='sm'` и ошибкой; маркер `data-field-demo` на корне):

```tsx
import { Field } from '@stark/solid-kit/field';
import { Input } from '@stark/solid-kit/input';
import type { JSX } from 'solid-js';

/** Два Field вокруг Input: с подсказкой (md по умолчанию) и с ошибкой (обёртка sm). */
export function DemoFields(): JSX.Element {
	return (
		<div class='field-demos'>
			<Field label='Имя' hint='Как в паспорте' data-field-demo='hint'>
				{(control) => <Input {...control} placeholder='Анна'/>}
			</Field>
			<Field label='Почта' error='Введите адрес в формате name@example.com' size='sm' data-field-demo='error'>
				{(control) => <Input {...control} defaultValue='anna'/>}
			</Field>
		</div>
	);
}
```

- [ ] **Step 2: Браузерные проверки**

Создать `playground/src/field-checks.ts`:

```ts
import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Связь подписи и поля, описание сообщением, размер вложенного поля и контраст сообщения у каждого Field с data-field-demo. */
export function runFieldChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const field of page.querySelectorAll<HTMLElement>('[data-field-demo]')) {
		const id = field.dataset['fieldDemo'] ?? '?';
		const label = field.querySelector('label');
		const input = field.querySelector('input');
		if (!label || !input) {
			throw new Error(`Playground element is missing in Field ${id}`);
		}

		check(`Field ${id}: подпись связана с полем`, label.control === input, `label.control = ${label.control?.tagName ?? 'null'}`);

		const describedBy = input.getAttribute('aria-describedby') ?? '';
		const message = describedBy ? document.getElementById(describedBy) : null;
		const text = message?.textContent?.trim() ?? '';
		check(`Field ${id}: aria-describedby указывает на непустой текст`, text !== '', `aria-describedby = "${describedBy}", текст "${text}"`);

		if (message) {
			const color = resolveColor(getComputedStyle(message).color);
			const ratio = contrastRatio(blend(rgb(color), color[3] / 255, rgb(surface)), rgb(surface));
			check(`Field ${id}: текст сообщения читаем (4.5:1)`, ratio >= 4.5, `контраст ${ratio.toFixed(2)}:1`);
		}
		else {
			check(`Field ${id}: текст сообщения читаем (4.5:1)`, false, 'сообщение не найдено');
		}

		const size = field.closest('[data-s-kit-size]')?.getAttribute('data-s-kit-size') ?? 'md';
		const expected = Number.parseFloat(getComputedStyle(field).getPropertyValue(`--s-kit-control-height-${size}`));
		const height = input.getBoundingClientRect().height;
		check(`Field ${id}: поле внутри (${size}) имеет высоту токена`, Math.abs(height - expected) <= 0.01, `высота ${height}px, ожидалось ${expected}px`);
	}
	return results;
}
```

Строки длиннее 140 символов разбить так, как примет `eslint --fix`.

- [ ] **Step 3: Раздел на странице**

В `playground/src/controls-row-page.tsx`: добавить импорты `DemoFields` и `runFieldChecks`; в `runChecks` добавить `...runFieldChecks(page)` после `runInputChecks`; перед разделом «Проверки» вставить:

```tsx
			<section>
				<h2>Field: подпись, подсказка и ошибка вокруг поля</h2>
				<DemoFields/>
			</section>
```

В `playground/src/playground.css` добавить (стиль по соседним правилам, 4 пробела, логические свойства):

```css
.field-demos {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: flex-start;
}
```

- [ ] **Step 4: Статическая проверка**

Run: `pnpm exec eslint --fix playground/src && pnpm exec stylelint --fix playground/src/playground.css && pnpm check`
Expected: зелёный, 166 тестов. `tsc -p playground` проверяет здесь, что `<Input {...control} />` принимает `FieldControlProps`: если нет, исправить тип в `field.tsx` (например, `'aria-invalid'`), а не ослаблять Input.

- [ ] **Step 5: Проверка в браузере (Chrome)**

`pnpm dev` в фоне (порт из вывода Vite, PID сохранить), открыть `<адрес>/#controls-row`, кликнуть по странице, нажать «Запустить проверки», проверить темы system, light, dark (после смены темы ждать 700 мс; после возврата в system сначала сменить тему на другую, иначе событие не сработает).
Expected в каждой теме:
- **162 проверки, все OK** (было 154: +8 проверок двух Field). Если число или результат другие, выяснить причину до коммита;
- глазами: у первого Field подпись «Имя», поле и серая подсказка под ним; у второго меньший размер (поле 28 px), красная граница поля, красный текст ошибки; клик по подписи переводит фокус в поле;
- ввод в поле второго Field не меняет сообщение (оно статично), консоль без ошибок.

Остановить dev-сервер по PID (после проверки cwd).

- [ ] **Step 6: Закоммитить**

```bash
git add playground
git commit -m "feat(playground): раздел Field и проверки связи, размера и контраста сообщений" -m "$TRAILERS"
```

---

### Task 3: Field в матрице формы пакета

**Files:**
- Modify: `scripts/consumer/src/main.tsx`
- Modify: `scripts/verify-package-form.sh`

**Interfaces:**
- Consumes: путь `@stark/solid-kit/field`; токен `--s-kit-field-gap` как маркер стилей Field в собранном CSS.
- Produces: один новый пункт матрицы: стили Field в CSS (Field не использует общую основу, порядок с ней не проверяется).

- [ ] **Step 1: Потребитель импортирует Field**

В `scripts/consumer/src/main.tsx` добавить `import { Field } from '@stark/solid-kit/field';` (по порядку импортов, перед `icon-button`) и рядом с остальными элементами `<Field label="Почта" hint="Подсказка">{(control) => <input {...control} />}</Field>`. `tsc` потребителя этим проверяет публичные типы, включая `FieldControlProps`.

- [ ] **Step 2: Проверка сборки**

В `scripts/verify-package-form.sh` после пункта про порядок основы и Input добавить:

```bash
grep -lq -- '--s-kit-field-gap' dist/assets/*.css && ok "Field styles are in the built CSS" || fail "Field styles are missing from the built CSS"
```

- [ ] **Step 3: Коммит и прогон матрицы**

Матрица ставит пакет по коммиту, поэтому сначала закоммитить:

```bash
git add scripts
git commit -m "test: Field в матрице формы пакета" -m "$TRAILERS"
scripts/verify-package-form.sh "$(git rev-parse HEAD)"
```

Expected: все пункты OK, включая новый; `tsc` потребителя проходит на TypeScript 5.9.3 и 7.0.2.

- [ ] **Step 4: Удалить временный проект-потребитель**

Скрипт печатает `consumer project kept at: ...`; проверить, что каталог лежит вне репозитория, и удалить его (`git status` чистый).

---

### Task 4: Спек и закрытие плана

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md`

- [ ] **Step 1: Итоги в спеке этапа**

В таблице порядка (раздел 1) у строки Field добавить **Готов** и коммиты (`git log --oneline -4`). Добавить раздел «11. Итоги Field (2026-10-29)» по образцу разделов 8–10: число проверок страницы (из Task 2 Step 5), что `<Input {...control} />` и `<input {...control} />` компилируются (`tsc` playground и потребителя), что реактивность `{...control}` подтверждена тестом и в браузере, и список непроверенного (Firefox 125, Safari 17.5, `forced-colors`, чтение подсказки и ошибки экранным диктором). Если по ходу принималось решение, отличающееся от раздела 3.3, исправить раздел 3.3 тем же коммитом.

- [ ] **Step 2: Итоговая проверка и коммит**

Run: `pnpm check` и `git status` (чисто). Затем:

```bash
git add docs
git commit -m "docs: Field готов" -m "$TRAILERS"
```

Тег не ставится. Следующий компонент по порядку: ButtonGroup.

---

## Самопроверка плана

- **Покрытие спека (раздел 3.3):** функция-ребёнок и экспорт контракта (Task 1), геттеры и реактивность (Task 1 тест «follows the error…»), ошибка заменяет подсказку и `aria-invalid`/`data-invalid` (Task 1), «пустые» значения (Task 1 `it.each`), размер на корне и наследование вложенным контролом (Task 1 тест корня, Task 2 проверка высоты в браузере), токен `--s-kit-field-gap` (Task 1 CSS, маркер в Task 3), совместимость с Input (Task 2 `tsc` playground), связь подписи и поля и контраст сообщений в браузере (Task 2), матрица (Task 3), закрытие (Task 4).
- **Типы:** `FieldControlProps` одинаков в `field.tsx`, `index.ts` и демо; `data-field-demo` задаётся в `demo-fields.tsx` и читается как `dataset['fieldDemo']`; число проверок 162 выведено расчётом (2 Field × 4).
- **Известные риски:** разворачивание «пустых» значений `children()` (Task 1 Step 4); форма булева `data-invalid` и правило `solid/reactivity` на геттерах (Task 1 Step 5); сообщение на фоне страницы считается как на `surface`, на другом фоне порог не гарантирован; число проверок страницы требует сверки.
- **Не покрыто сознательно:** живая область для ошибок и `required` (YAGNI, см. спек 3.3), `disabled` на Field, поддержка нескольких контролов в одном Field (группы Radio и Checkbox решаются в своих компонентах).
