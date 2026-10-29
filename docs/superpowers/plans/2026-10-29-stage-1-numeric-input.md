# solid-kit, этап 1: NumericInput — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** десятый компонент этапа 1. NumericInput: числовое поле с вводом, который фильтруется на лету, значением `number | null`, шагом стрелками (Shift ×10), границами `min`/`max`, применяемыми при фиксации (blur, Enter), и контрактом `value`/`defaultValue`/`onValueChange`. Поле стоит в одной линии с остальными контролами во всех пяти рядах; поведение проверяется тестами и реальными действиями в Chrome; компонент входит в матрицу формы пакета.

**Архитектура:** плоский компонент-оболочка над `Input` (раздел 3.2): своего CSS и токенов нет, вид и размеры целиком от Input. Числовая логика живёт в чистых функциях `numeric-math.ts` (подсчёт знаков, округление, ограничение, фильтрация текста, разбор, форматирование). Компонент хранит текст поля отдельным сигналом, число держит через `createControllableSignal<number | null>`, передаёт в Input `role="spinbutton"`, `inputmode`, `aria-value*`, а `onKeyDown`/`onBlur` оборачивает своими обработчиками (стрелки, Enter, фиксация).

**Стек:** как в этапе 0 и предыдущих планах этапа 1.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (основной; раздел 3.9 описывает NumericInput, раздел 3.2 Input, разделы 2 и 4 общие соглашения и страницу), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 4.1, 5, 5.1, 7, 11.1, 12).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане, не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`). Тег `v0.2.0` ставится в конце всего этапа 1, не здесь.
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл (демо-компоненты playground тоже). Чистые функции живут отдельным `.ts` без классов.
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)`. У NumericInput своего CSS нет; в `playground/src/playground.css` разрешён только раскладочный CSS демо.
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, `solid/reactivity` как ошибка: сигнал в тесте читать нельзя, использовать `vi.fn`), Stylelint (4 пробела, двойные кавычки, логические свойства; `pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome. Кольца фокуса дают ложные FAIL, если проверки запущены щелчком мыши: запускать с клавиатуры (сфокусировать кнопку «Запустить проверки» через JS и нажать Enter) или сменой темы через переключатель. Координаты скриншота (1505 px) отличаются от CSS-пикселей страницы: клики по координатам из `getBoundingClientRect` пересчитывать (делить на `innerWidth / 1505`), прокрутку делать `scrollIntoView({behavior:'instant'})`, ждать и **снимать скриншот перед щелчком**. JS-инструмент иногда возвращает `[BLOCKED: Cookie/query string data]`: повторить коротким строковым результатом. Firefox и Safari не проверяются.
- Начало плана: `git status` чистый, `pnpm check` зелёный (234 теста).

---

### Task 1: Компонент NumericInput

**Files:**
- Create: `src/components/numeric-input/numeric-math.ts`
- Create: `src/components/numeric-input/numeric-math.test.ts`
- Create: `src/components/numeric-input/numeric-input.tsx`
- Create: `src/components/numeric-input/index.ts`
- Test: `src/components/numeric-input/numeric-input.test.tsx`

**Interfaces:**
- Consumes: `Input`, `InputProps` из `../input` (`index.ts` компонента); `createControllableSignal` из `../../utils/create-controllable-signal`.
- Produces: `NumericInput(props: NumericInputProps): JSX.Element`; тип `NumericInputProps`; чистые функции `countDecimals`, `roundTo`, `clamp`, `sanitizeNumericText`, `parseNumericText`, `formatNumeric` и тип `SanitizeOptions` из `numeric-math.ts`; публичный путь `@stark/solid-kit/numeric-input` (подхватывается `exports` из `package.json` по маске `./*`).

- [ ] **Step 1: Написать падающие тесты чистых функций**

Создать `src/components/numeric-input/numeric-math.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { clamp, countDecimals, formatNumeric, parseNumericText, roundTo, sanitizeNumericText } from './numeric-math';

function options(precision: number, allowNegative = true): { precision: number; allowNegative: boolean } {
	return { precision, allowNegative };
}

describe('countDecimals', () => {
	it('counts the digits after the point', () => {
		expect(countDecimals(1)).toBe(0);
		expect(countDecimals(10)).toBe(0);
		expect(countDecimals(0.25)).toBe(2);
		expect(countDecimals(-1.5)).toBe(1);
	});
});

describe('roundTo', () => {
	it('removes float noise and the negative zero', () => {
		expect(roundTo(0.1 + 0.2, 1)).toBe(0.3);
		expect(roundTo(1.26, 1)).toBe(1.3);
		expect(roundTo(7, 0)).toBe(7);
		expect(Object.is(roundTo(-0.0001, 2), 0)).toBe(true);
	});
});

describe('clamp', () => {
	it('limits the value by the bounds that are set', () => {
		expect(clamp(5, 0, 3)).toBe(3);
		expect(clamp(-1, 0, 3)).toBe(0);
		expect(clamp(2, undefined, undefined)).toBe(2);
		expect(clamp(5, undefined, 3)).toBe(3);
		expect(clamp(-5, 0, undefined)).toBe(0);
	});
});

describe('sanitizeNumericText', () => {
	it('turns a comma into the separator and keeps only the first one', () => {
		expect(sanitizeNumericText('1,5', options(2))).toBe('1.5');
		expect(sanitizeNumericText('1.2.3', options(2))).toBe('1.23');
	});

	it('cuts the fraction to the precision and drops the separator at precision 0', () => {
		expect(sanitizeNumericText('1.999', options(2))).toBe('1.99');
		expect(sanitizeNumericText('1.5', options(0))).toBe('1');
		expect(sanitizeNumericText('1.', options(2))).toBe('1.');
	});

	it('allows the sign only first and only when negatives are allowed', () => {
		expect(sanitizeNumericText('-5', options(0))).toBe('-5');
		expect(sanitizeNumericText('5-', options(0))).toBe('5');
		expect(sanitizeNumericText('-5', options(0, false))).toBe('5');
		expect(sanitizeNumericText('-', options(0))).toBe('-');
	});

	it('removes everything but digits', () => {
		expect(sanitizeNumericText('a1b2c', options(0))).toBe('12');
		expect(sanitizeNumericText('', options(0))).toBe('');
		expect(sanitizeNumericText(' 7 ', options(0))).toBe('7');
	});
});

describe('parseNumericText', () => {
	it('returns null without digits and parses the partial forms', () => {
		expect(parseNumericText('')).toBeNull();
		expect(parseNumericText('-')).toBeNull();
		expect(parseNumericText('.')).toBeNull();
		expect(parseNumericText('-.')).toBeNull();
		expect(parseNumericText('12')).toBe(12);
		expect(parseNumericText('1.')).toBe(1);
		expect(parseNumericText('.5')).toBe(0.5);
		expect(parseNumericText('-0.5')).toBe(-0.5);
	});
});

describe('formatNumeric', () => {
	it('writes null as an empty text and a number as its decimal record', () => {
		expect(formatNumeric(null)).toBe('');
		expect(formatNumeric(0)).toBe('0');
		expect(formatNumeric(12.5)).toBe('12.5');
		expect(formatNumeric(-3)).toBe('-3');
	});
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm exec vitest run src/components/numeric-input/numeric-math.test.ts`
Expected: FAIL (модуль `./numeric-math` не найден).

- [ ] **Step 3: Реализовать чистые функции**

Создать `src/components/numeric-input/numeric-math.ts`:

```ts
export interface SanitizeOptions {
	/** Знаков после запятой; при 0 разделитель и дробная часть отбрасываются. */
	precision: number;
	allowNegative: boolean;
}

/** Число знаков после точки в записи числа (шаг 0.25 даёт 2). Экспоненциальная запись (1e-7) не поддерживается и даёт 0. */
export function countDecimals(value: number): number {
	const text = String(value);
	const dot = text.indexOf('.');
	return dot === -1 ? 0 : text.length - dot - 1;
}

/** Округление до `precision` знаков; убирает шум чисел с плавающей точкой и отрицательный ноль. */
export function roundTo(value: number, precision: number): number {
	return Number(value.toFixed(precision)) + 0;
}

export function clamp(value: number, min: number | undefined, max: number | undefined): number {
	let result = value;
	if (max !== undefined && result > max) {
		result = max;
	}
	if (min !== undefined && result < min) {
		result = min;
	}
	return result;
}

/**
 * Оставляет в тексте только записанное число: цифры, первый разделитель (запятая превращается в точку)
 * и минус первым знаком. Промежуточные записи (`-`, `1.`) сохраняются.
 */
export function sanitizeNumericText(text: string, options: SanitizeOptions): string {
	const normalized = text.trim().replace(/,/g, '.');
	const sign = options.allowNegative && normalized.startsWith('-') ? '-' : '';
	const [integerPart = '', ...fractionParts] = normalized.replace(/[^\d.]/g, '').split('.');
	if (fractionParts.length === 0 || options.precision <= 0) {
		return `${sign}${integerPart}`;
	}
	return `${sign}${integerPart}.${fractionParts.join('').slice(0, options.precision)}`;
}

/** Число из текста; `null`, если в тексте нет ни одной цифры (`''`, `-`, `.`). */
export function parseNumericText(text: string): number | null {
	if (!/\d/.test(text)) {
		return null;
	}
	const value = Number(text);
	return Number.isFinite(value) ? value : null;
}

export function formatNumeric(value: number | null): string {
	return value === null ? '' : String(value);
}
```

- [ ] **Step 4: Убедиться, что тесты чистых функций проходят**

Run: `pnpm exec vitest run src/components/numeric-input/numeric-math.test.ts`
Expected: PASS, 9 тестов.

- [ ] **Step 5: Написать падающие тесты компонента**

Создать `src/components/numeric-input/numeric-input.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NumericInput } from './numeric-input';

afterEach(cleanup);

function field(name = 'Число'): HTMLInputElement {
	return screen.getByRole<HTMLInputElement>('spinbutton', { name });
}

function typeInto(input: HTMLElement, text: string): void {
	(input as HTMLInputElement).value = text;
	fireEvent.input(input);
}

/** Возвращает false, если обработчик вызвал preventDefault. */
function press(input: HTMLElement, key: string, init: KeyboardEventInit = {}): boolean {
	return fireEvent.keyDown(input, { key, ...init });
}

describe('NumericInput', () => {
	it('renders a text input with the spinbutton role and the kit root attribute', () => {
		render(() => <NumericInput aria-label='Число'/>);
		const input = field();
		expect(input.type).toBe('text');
		expect(input.hasAttribute('data-s-kit')).toBe(true);
		expect(input.getAttribute('inputmode')).toBe('decimal');
		expect(input.value).toBe('');
		expect(input.hasAttribute('aria-valuenow')).toBe(false);
	});

	it('asks for the numeric keypad when only non-negative integers are possible', () => {
		render(() => <NumericInput aria-label='Число' min={0}/>);
		expect(field().getAttribute('inputmode')).toBe('numeric');
	});

	it('mirrors the value and the range in the aria attributes', () => {
		render(() => <NumericInput aria-label='Число' min={0} max={10} defaultValue={5}/>);
		const input = field();
		expect(input.value).toBe('5');
		expect(input.getAttribute('aria-valuenow')).toBe('5');
		expect(input.getAttribute('aria-valuemin')).toBe('0');
		expect(input.getAttribute('aria-valuemax')).toBe('10');
	});

	it('reports a typed number', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' defaultValue={3} onValueChange={onValueChange}/>);
		const input = field();
		expect(input.value).toBe('3');
		typeInto(input, '12');
		expect(input.value).toBe('12');
		expect(onValueChange).toHaveBeenLastCalledWith(12);
	});

	it('drops the characters that are not part of a number', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, 'a1b2');
		expect(input.value).toBe('12');
		expect(onValueChange).toHaveBeenLastCalledWith(12);
	});

	it('accepts a comma and keeps the fraction within the precision taken from the step', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' step={0.1} onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, '1,5');
		expect(input.value).toBe('1.5');
		expect(onValueChange).toHaveBeenLastCalledWith(1.5);
		typeInto(input, '1.55');
		expect(input.value).toBe('1.5');
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});

	it('takes the precision from the precision prop over the step', () => {
		render(() => <NumericInput aria-label='Число' step={1} precision={2}/>);
		const input = field();
		typeInto(input, '1.999');
		expect(input.value).toBe('1.99');
	});

	it('cuts the fraction when the step is an integer', () => {
		render(() => <NumericInput aria-label='Число'/>);
		const input = field();
		typeInto(input, '1.99');
		expect(input.value).toBe('1');
	});

	it('keeps partial text while typing and reports null for a bare sign', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' step={0.1} defaultValue={5} onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, '-');
		expect(input.value).toBe('-');
		expect(onValueChange).toHaveBeenLastCalledWith(null);
		typeInto(input, '1.');
		expect(input.value).toBe('1.');
		expect(onValueChange).toHaveBeenLastCalledWith(1);
	});

	it('ignores the minus sign when min is not negative', () => {
		render(() => <NumericInput aria-label='Число' min={0}/>);
		const input = field();
		typeInto(input, '-5');
		expect(input.value).toBe('5');
	});

	it('clamps and rounds the number when the field loses focus', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' min={0} max={10} onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, '50');
		expect(onValueChange).toHaveBeenLastCalledWith(50);
		fireEvent.blur(input);
		expect(input.value).toBe('10');
		expect(onValueChange).toHaveBeenLastCalledWith(10);
		expect(input.getAttribute('aria-valuenow')).toBe('10');
	});

	it('commits on Enter without preventing the default action', () => {
		render(() => <NumericInput aria-label='Число' max={10}/>);
		const input = field();
		typeInto(input, '99');
		expect(press(input, 'Enter')).toBe(true);
		expect(input.value).toBe('10');
	});

	it('clears a dangling sign on blur', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' defaultValue={5} onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, '-');
		fireEvent.blur(input);
		expect(input.value).toBe('');
		expect(onValueChange).toHaveBeenLastCalledWith(null);
	});

	it('steps by the step on ArrowUp and ArrowDown and by ten steps with Shift', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' step={2} defaultValue={5} onValueChange={onValueChange}/>);
		const input = field();
		expect(press(input, 'ArrowUp')).toBe(false);
		expect(input.value).toBe('7');
		press(input, 'ArrowDown');
		expect(input.value).toBe('5');
		press(input, 'ArrowUp', { shiftKey: true });
		expect(input.value).toBe('25');
		expect(onValueChange).toHaveBeenLastCalledWith(25);
	});

	it('stops at min and max and does not report an unchanged value', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' min={0} max={3} defaultValue={2} onValueChange={onValueChange}/>);
		const input = field();
		press(input, 'ArrowUp');
		press(input, 'ArrowUp');
		expect(input.value).toBe('3');
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});

	it('starts from zero when the field is empty', () => {
		render(() => (
			<>
				<NumericInput aria-label='Вверх' step={5}/>
				<NumericInput aria-label='Вниз' step={5}/>
				<NumericInput aria-label='От нуля' step={5} min={0}/>
			</>
		));
		press(field('Вверх'), 'ArrowUp');
		press(field('Вниз'), 'ArrowDown');
		press(field('От нуля'), 'ArrowDown');
		expect(field('Вверх').value).toBe('5');
		expect(field('Вниз').value).toBe('-5');
		expect(field('От нуля').value).toBe('0');
	});

	it('rounds the float noise of a fractional step', () => {
		render(() => <NumericInput aria-label='Число' step={0.1} defaultValue={0.2}/>);
		const input = field();
		press(input, 'ArrowUp');
		expect(input.value).toBe('0.3');
	});

	it('ignores the arrows when readOnly', () => {
		render(() => <NumericInput aria-label='Число' readOnly defaultValue={5}/>);
		const input = field();
		expect(press(input, 'ArrowUp')).toBe(true);
		expect(input.value).toBe('5');
	});

	it('follows the parent value and writes typed numbers back', () => {
		let setExternal: (next: number | null) => void = () => undefined;
		render(() => {
			const [value, setValue] = createSignal<number | null>(1);
			setExternal = setValue;
			return <NumericInput aria-label='Число' value={value()} onValueChange={(next) => setValue(next)}/>;
		});
		const input = field();
		expect(input.value).toBe('1');
		typeInto(input, '7');
		expect(input.value).toBe('7');
		setExternal(9);
		expect(input.value).toBe('9');
		setExternal(null);
		expect(input.value).toBe('');
	});

	it('returns the text to the parent value when the parent refuses the number', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' value={3} onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, '8');
		expect(onValueChange).toHaveBeenLastCalledWith(8);
		expect(input.value).toBe('3');
	});

	it('treats null as a controlled empty value', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' value={null} onValueChange={onValueChange}/>);
		const input = field();
		expect(input.value).toBe('');
		typeInto(input, '4');
		expect(onValueChange).toHaveBeenLastCalledWith(4);
		expect(input.value).toBe('');
	});

	it('calls the own key and blur handlers and lets the key handler cancel the step', () => {
		const onKeyDown = vi.fn((event: KeyboardEvent) => {
			event.preventDefault();
		});
		const onBlur = vi.fn();
		render(() => <NumericInput aria-label='Число' defaultValue={5} onKeyDown={onKeyDown} onBlur={onBlur}/>);
		const input = field();
		press(input, 'ArrowUp');
		expect(onKeyDown).toHaveBeenCalledTimes(1);
		expect(input.value).toBe('5');
		fireEvent.blur(input);
		expect(onBlur).toHaveBeenCalledTimes(1);
	});

	it('passes size, class, style and aria-invalid to the field', () => {
		render(() => (
			<NumericInput aria-label='Число' size='lg' class='extra' style={{ 'inline-size': '8rem' }} aria-invalid='true'/>
		));
		const input = field();
		expect(input.getAttribute('data-s-kit-size')).toBe('lg');
		expect(input.classList.contains('extra')).toBe(true);
		expect(input.style.inlineSize).toBe('8rem');
		expect(input.getAttribute('aria-invalid')).toBe('true');
	});
});
```

- [ ] **Step 6: Убедиться, что тесты компонента падают**

Run: `pnpm exec vitest run src/components/numeric-input`
Expected: FAIL (модуль `./numeric-input` не найден).

- [ ] **Step 7: Реализовать компонент**

Создать `src/components/numeric-input/numeric-input.tsx`:

```tsx
import { batch, createEffect, createSignal, type JSX, on, splitProps, untrack } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';
import { Input, type InputProps } from '../input';

import { clamp, countDecimals, formatNumeric, parseNumericText, roundTo, sanitizeNumericText } from './numeric-math';

const SHIFT_STEP_FACTOR = 10;

export interface NumericInputProps
	extends Omit<InputProps, 'value' | 'defaultValue' | 'onValueChange' | 'type' | 'role' | 'inputmode' | 'onKeyDown' | 'onBlur'> {
	value?: number | null | undefined;
	defaultValue?: number | null | undefined;
	onValueChange?: ((value: number | null) => void) | undefined;
	min?: number | undefined;
	max?: number | undefined;
	step?: number | undefined;
	precision?: number | undefined;
	onKeyDown?: JSX.EventHandler<HTMLInputElement, KeyboardEvent> | undefined;
	onBlur?: JSX.EventHandler<HTMLInputElement, FocusEvent> | undefined;
}

export function NumericInput(props: NumericInputProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'value', 'defaultValue', 'onValueChange', 'min', 'max', 'step', 'precision', 'readOnly', 'onKeyDown', 'onBlur'
	]);

	const step = (): number => local.step ?? 1;
	const precision = (): number => local.precision ?? countDecimals(step());
	const allowNegative = (): boolean => local.min === undefined || local.min < 0;

	const [value, setValue] = createControllableSignal<number | null>({
		name: 'NumericInput',
		value: () => local.value,
		defaultValue: () => local.defaultValue ?? null,
		onChange: (next) => local.onValueChange?.(next)
	});
	// текст хранится отдельно от числа, чтобы промежуточные записи (`-`, `1.`) не терялись
	const [text, setText] = createSignal(formatNumeric(untrack(value)));

	// родитель сменил значение: текст перезаписывается, только если он уже не означает это число
	createEffect(on(value, (next) => {
		if (parseNumericText(text()) !== next) {
			setText(formatNumeric(next));
		}
	}, { defer: true }));

	/** Принять число; в контролируемом режиме родитель может его не принять, тогда текст возвращается к его значению. */
	const accept = (next: number | null, nextText: string): void => {
		batch(() => {
			setText(nextText);
			if (next !== value()) {
				setValue(next);
			}
		});
		if (parseNumericText(text()) !== value()) {
			setText(formatNumeric(value()));
		}
	};

	const handleTextChange = (raw: string): void => {
		const clean = sanitizeNumericText(raw, { precision: precision(), allowNegative: allowNegative() });
		accept(parseNumericText(clean), clean);
	};

	const settle = (next: number): number => roundTo(clamp(next, local.min, local.max), precision());

	/** Фиксация: число приводится к границам и точности, висящий знак очищается. */
	const commit = (): void => {
		const parsed = parseNumericText(text());
		const next = parsed === null ? null : settle(parsed);
		accept(next, formatNumeric(next));
	};

	const handleKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (event) => {
		local.onKeyDown?.(event);
		if (event.defaultPrevented) {
			return;
		}
		if (event.key === 'Enter') {
			commit();
			return;
		}
		if (local.readOnly || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) {
			return;
		}
		event.preventDefault();
		const direction = event.key === 'ArrowUp' ? 1 : -1;
		const delta = step() * (event.shiftKey ? SHIFT_STEP_FACTOR : 1) * direction;
		const next = settle((value() ?? 0) + delta);
		accept(next, formatNumeric(next));
	};

	const handleBlur: JSX.EventHandler<HTMLInputElement, FocusEvent> = (event) => {
		local.onBlur?.(event);
		commit();
	};

	return (
		<Input
			{...rest}
			role='spinbutton'
			inputmode={precision() > 0 || allowNegative() ? 'decimal' : 'numeric'}
			readOnly={local.readOnly}
			value={text()}
			onValueChange={handleTextChange}
			onKeyDown={handleKeyDown}
			onBlur={handleBlur}
			aria-valuenow={value() ?? undefined}
			aria-valuemin={local.min}
			aria-valuemax={local.max}
		/>
	);
}
```

Создать `src/components/numeric-input/index.ts`:

```ts
export type { NumericInputProps } from './numeric-input';
export { NumericInput } from './numeric-input';
```

Примечание для исполнителя: если типы Solid JSX не принимают `inputmode` (или принимают только `inputMode`), заменить имя атрибута в `<Input>` и в `Omit` на то, что есть в типах, и записать это в итоги.

- [ ] **Step 8: Убедиться, что все тесты проходят**

Run: `pnpm exec vitest run src/components/numeric-input`
Expected: PASS, 31 тест (9 чистых функций и 22 компонента). Если число иное, зафиксировать фактическое в итогах.

- [ ] **Step 9: Полная проверка и коммит**

Run: `pnpm check`
Expected: зелёный, 265 тестов (234 + 31).

```bash
git add src/components/numeric-input
git commit -m "feat: NumericInput, числовое поле со стрелками, границами и фильтрацией ввода" -m "$TRAILERS"
```

---

### Task 2: NumericInput в playground и проверки

**Files:**
- Modify: `playground/src/demo-controls.tsx`
- Create: `playground/src/demo-numeric-inputs.tsx`
- Create: `playground/src/numeric-input-checks.ts`
- Modify: `playground/src/controls-row-page.tsx`
- Modify: `playground/src/playground.css`

**Interfaces:**
- Consumes: `NumericInput` из `@stark/solid-kit/numeric-input`; `CheckResult` из `./theme-checks`.
- Produces: контрол ряда `numeric-input` (`data-row-control` на самом `input`, он же корень `[data-s-kit]`); раздел с демо (`data-numeric-demo` на `input`: `plain`, `range`, `decimal`, `invalid`), живое значение `output[data-numeric-live]` и недоступное поле; `runNumericInputChecks(page: HTMLElement): CheckResult[]`; поле в блоках фокуса (`data-focus-name='numeric-input'`).

- [ ] **Step 1: Поле в ряду**

В `playground/src/demo-controls.tsx` добавить `import { NumericInput } from '@stark/solid-kit/numeric-input';` (после `input`, перед `radio-group`) и в конец массива `DEMO_CONTROLS` (запятую после `switch-bare` добавить):

```tsx
	{
		id: 'numeric-input',
		render: (size) => <NumericInput data-row-control='numeric-input' aria-label='Число' defaultValue={42} size={size}/>
	}
```

- [ ] **Step 2: Раздел с демо**

Создать `playground/src/demo-numeric-inputs.tsx`:

```tsx
import { NumericInput } from '@stark/solid-kit/numeric-input';
import { createSignal, type JSX } from 'solid-js';

/** Поля для проверок в numeric-input-checks.ts и для ручной проверки клавиш: диапазон, дробный шаг, ошибка, недоступное. */
export function DemoNumericInputs(): JSX.Element {
	const [price, setPrice] = createSignal<number | null>(12.5);
	return (
		<div class='numeric-input-demos'>
			<NumericInput data-numeric-demo='plain' aria-label='Количество' defaultValue={3}/>
			<NumericInput data-numeric-demo='range' aria-label='От 0 до 10' min={0} max={10} defaultValue={5}/>
			<NumericInput
				data-numeric-demo='decimal'
				aria-label='Цена'
				step={0.5}
				value={price()}
				onValueChange={(next) => setPrice(next)}
			/>
			<output data-numeric-live>Цена: {price() ?? 'пусто'}</output>
			<NumericInput data-numeric-demo='invalid' aria-label='С ошибкой' aria-invalid='true' max={10} defaultValue={99}/>
			<NumericInput aria-label='Недоступное' disabled defaultValue={1}/>
		</div>
	);
}
```

- [ ] **Step 3: Проверки раздела**

Создать `playground/src/numeric-input-checks.ts`:

```ts
import type { CheckResult } from './theme-checks';

/** Ожидаемые `aria-valuemin` и `aria-valuemax` каждого демо (`null`: атрибута нет). */
const EXPECTED_RANGE: Readonly<Record<string, { min: string | null; max: string | null }>> = {
	plain: { min: null, max: null },
	range: { min: '0', max: '10' },
	decimal: { min: null, max: null },
	invalid: { min: null, max: '10' }
};

/** Роль spinbutton, `aria-valuenow` по тексту и границы диапазона в ARIA у каждого поля с data-numeric-demo. */
export function runNumericInputChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	for (const input of page.querySelectorAll<HTMLInputElement>('[data-numeric-demo]')) {
		const id = input.dataset['numericDemo'] ?? '?';
		const expected = EXPECTED_RANGE[id];
		if (!expected) {
			throw new Error(`Unknown NumericInput demo: ${id}`);
		}
		check(`NumericInput ${id}: роль spinbutton`, input.getAttribute('role') === 'spinbutton', `role = ${input.getAttribute('role') ?? 'null'}`);

		const now = input.getAttribute('aria-valuenow');
		check(
			`NumericInput ${id}: aria-valuenow совпадает с текстом`,
			now === String(Number(input.value)),
			`aria-valuenow = ${now ?? 'null'}, текст = "${input.value}"`
		);

		const min = input.getAttribute('aria-valuemin');
		const max = input.getAttribute('aria-valuemax');
		check(
			`NumericInput ${id}: границы диапазона в ARIA`,
			min === expected.min && max === expected.max,
			`min = ${min ?? 'null'}, max = ${max ?? 'null'}`
		);
	}
	return results;
}
```

(Строка с `check('... роль spinbutton' ...)` может превысить 140 символов: если ESLint жалуется, разбить вызов на несколько строк, как соседний.)

- [ ] **Step 4: Подключить на страницу**

В `playground/src/controls-row-page.tsx`:

1. Импорты, по порядку: `import { NumericInput } from '@stark/solid-kit/numeric-input';` между `input` и `radio-group`; `import { DemoNumericInputs } from './demo-numeric-inputs';` между `./demo-icon` и `./demo-radio-groups`; `import { runNumericInputChecks } from './numeric-input-checks';` между `./input-checks` и `./pick`.
2. В `renderFocusControls` после `input-invalid`:

```tsx
		<NumericInput aria-label='Число' defaultValue={7} data-focus-name='numeric-input'/>,
```

3. В `runChecks` после `...runSwitchChecks(page)` (запятую добавить): `...runNumericInputChecks(page)`.
4. Раздел после раздела Switch:

```tsx
			<section>
				<h2>NumericInput: ввод, стрелки, границы и фиксация на потере фокуса</h2>
				<DemoNumericInputs/>
			</section>
```

- [ ] **Step 5: Раскладка демо**

В `playground/src/playground.css` после `.switch-demos`:

```css
.numeric-input-demos {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
}
```

- [ ] **Step 6: Статическая проверка**

Run: `pnpm check`
Expected: зелёный (265 тестов; lint, typecheck основного пакета и playground проходят).

- [ ] **Step 7: Проверка в Chrome**

Запустить `pnpm dev` (в фоне), взять порт из вывода Vite, открыть страницу `#controls-row` в новой вкладке. Выполнить:

1. Консоль после загрузки (`?r=N`, `read_console_messages` с `pattern: .`): только сообщения Vite.
2. Запустить проверки с клавиатуры в темах system, light, dark: все OK. Ожидание порядка 324 проверок (307 + 5 высот одного поля в рядах + 6 колец в блоках фокуса + 12 проверок демо), фактическое число записать в итоги. Высота поля совпадает по верху и низу с соседями во всех пяти рядах.
3. Реальными действиями (скриншот перед каждым щелчком):
   - `plain` (3): щелчок, выделить всё, ввести `abc12` → в поле `12`; ArrowUp → `13`; Shift+ArrowDown → `3`.
   - `range` (0–10): ввести `50` и Tab → `10`, `aria-valuenow` = 10; ArrowDown одиннадцать раз → `0` и не ниже; ввести `-5` → минус не появляется.
   - `decimal` (шаг 0.5, значение родителя): ArrowUp → `13`, живое значение рядом `Цена: 13`; выделить всё, ввести `1,25` → `1.2`, значение `1.2`; стереть всё → `Цена: пусто`.
   - Tab на поле: кольцо фокуса снаружи (`outline-offset` 2 px, `:focus-visible`); в блоке с `data-s-kit-focus-inset` внутри (−2 px; проверки блоков фокуса OK).
   - Недоступное поле не получает фокус и не меняется.
4. Остановить dev-сервер по PID (проверить cwd), закрыть вкладку.

Если какой-либо пункт не проходит, это находка: исправить причину (код или проверку), перепрогнать, записать в итоги, а не подгонять ожидание.

- [ ] **Step 8: Коммит**

```bash
git add playground
git commit -m "feat(playground): NumericInput в рядах, демо и проверки ARIA" -m "$TRAILERS"
```

(Если на шаге 7 правился `src/components/numeric-input`, добавить и его: `git add playground src`.)

---

### Task 3: NumericInput в матрице формы пакета

**Files:**
- Modify: `scripts/consumer/src/main.tsx`

**Interfaces:**
- Consumes: путь `@stark/solid-kit/numeric-input`.
- Produces: потребитель импортирует и рисует NumericInput, `tsc` потребителя проверяет типы на TypeScript 5.9.3 и 7.0.2. Отдельного CSS-маркера нет: у компонента нет своего CSS, стили Input уже проверяет маркер `--s-kit-input-radius`.

- [ ] **Step 1: Потребитель импортирует NumericInput**

В `scripts/consumer/src/main.tsx` добавить `import { NumericInput } from '@stark/solid-kit/numeric-input';` (по порядку, после `input`) и рядом с остальными элементами, после `Input`:

```tsx
			<NumericInput aria-label="Количество" min={0} defaultValue={1} />
```

- [ ] **Step 2: Коммит и прогон матрицы**

```bash
git add scripts
git commit -m "test: NumericInput в матрице формы пакета" -m "$TRAILERS"
scripts/verify-package-form.sh "$(git rev-parse HEAD)"
```

Expected: все пункты OK; `tsc --noEmit` потребителя проходит на TypeScript 5.9.3 и 7.0.2; сборка зелёная, стили Input на месте, не импортированные компоненты не попадают в бандл.

- [ ] **Step 3: Удалить временный проект-потребитель**

Скрипт печатает `consumer project kept at: ...`; проверить, что каталог лежит вне репозитория (`/var/folders/.../solid-kit-consumer.*`), и удалить его (`git status` чистый).

---

### Task 4: Закрытие плана в спеке

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md`

- [ ] **Step 1: Таблица порядка и итоги**

В таблице порядка (раздел 1) у строки NumericInput добавить **Готов** и коммиты (`git log --oneline -6`), с точкой в конце ячейки, как у соседних строк. Добавить раздел «17. Итоги NumericInput (2026-10-29)» по образцу разделов 8–16: число проверок страницы и разбивка прироста, результаты реальных действий (ввод, стрелки, Shift, границы на blur, запятая, живое значение, кольцо фокуса, недоступное поле), консоль, число тестов, матрица на обоих TypeScript, отличия от плана по ходу работы (в том числе имя атрибута `inputmode`, если менялось) и список непроверенного: Firefox 125 и Safari 17.5, экранный диктор (проверена только разметка: `spinbutton` и `aria-value*`, объявление изменения значения не проверялось), мобильные клавиатуры (`inputmode`), вставка текста из буфера (ограничена фильтром, проверялась только событием `input`), IME-ввод, поведение внутри Field (тестами не покрыто), округление больших и экспоненциальных чисел. Если по ходу принималось решение, отличающееся от раздела 3.9, исправить раздел 3.9 тем же коммитом.

- [ ] **Step 2: Итоговая проверка и коммит**

Run: `pnpm check` и `git status` (чисто). Затем:

```bash
git add docs
git commit -m "docs: NumericInput готов" -m "$TRAILERS"
```

Тег не ставится. Следующий и последний компонент этапа 1: Tabs.

---

## Самопроверка плана

- **Покрытие спека (раздел 3.9):** текстовое поле с ролью, `inputmode` и ARIA (Task 1 код и тесты 1–3, проверка страницы Task 2); значение `number | null` и контракт `createControllableSignal` (Task 1, тесты контролируемого режима); фильтрация ввода и точность (Task 1 `sanitizeNumericText`, тесты разделителя, обрезки дроби и минуса); границы при фиксации на blur и Enter (тесты 10–12); стрелки, Shift, пустой старт, округление шага, `readOnly` (тесты 13–17); отказ родителя и `null` (тесты 19–20); пользовательские `onKeyDown`/`onBlur` (тест 21); проброс `size`, `class`, `style`, `aria-invalid` через Input (тест 22); высота в рядах и кольцо фокуса (Task 2); матрица (Task 3); закрытие (Task 4). «Вне объёма» (кнопки шага, колесо, локаль, шаг-привязка, экспонента) в коде не реализовано.
- **Типы и имена:** `NumericInputProps` расширяет `Omit<InputProps, …>` с теми же ключами, что перечислены в разделе 3.9; `SanitizeOptions` объявлен в `numeric-math.ts` и структурно совпадает с аргументом, который передаёт компонент; `data-numeric-demo` ставится на `input` через `rest` и читается как `dataset['numericDemo']`; `data-row-control` на `input` измеряется как ближайший `[data-s-kit]` (это сам `input`); число тестов 265 = 234 + 9 + 22.
- **Известные риски:** (1) атрибут `inputmode` в типах Solid JSX (см. примечание в Task 1); (2) эффект `on(value, …, { defer: true })` и порядок записи текста и числа в `accept` (запись внутри `batch`; чтение после него) проверяется тестами контролируемого режима; (3) контрол ряда не имеет собственной обёртки: если высота `input` в рядах разойдётся с соседями, причина в базе Input, а не в этом компоненте; (4) число 324 проверок страницы оценочное; (5) `aria-valuenow` показывает неподтверждённое значение во время набора (до blur), это сознательно.
- **Не покрыто сознательно:** кнопки шага, колесо мыши, форматирование по локали, привязка к кратным `step`, PageUp/PageDown, Home/End, экспоненциальная запись.
