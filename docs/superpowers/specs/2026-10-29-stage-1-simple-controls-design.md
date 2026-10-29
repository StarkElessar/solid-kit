# Этап 1. Простые контролы: рамки и общие соглашения

Статус: черновик на проверку владельцем (2026-10-29). Зонтичный спек: `2026-10-28-solid-kit-umbrella-design.md` (далее «зонтичный»), ссылки вида «раздел N» относятся к нему. Здесь только то, чего в зонтичном нет или что нужно уточнить для этапа; остальное не дублируется.

## 1. Рамки

В этапе одиннадцать компонентов: Button, IconButton, ButtonGroup, ToggleGroup, Switch, Checkbox, Radio + RadioGroup, Input, NumericInput, Field, Tabs.

**Решение владельца (2026-10-29): этап режется по одному компоненту.** У каждого компонента свой короткий план и свой коммит (или несколько), зелёная `pnpm check` обязательна перед каждым коммитом. Тег ставится один раз, на конец этапа: `v0.2.0`, когда выполнены все критерии раздела 5 этого документа.

Порядок, от зависимостей к зависимым:

| № | Компонент | Почему в этом месте |
|---|---|---|
| 1 | Button | Образец для всех: вводит варианты, фокус на заливке, общую CSS-основу контролов, страницу «Контролы в ряд». **Готов** (коммиты `7f863d3`, `2e98f2e`, `7598654`, `6f1b445`) |
| 2 | IconButton | Квадратная версия Button, разделяет основу. **Готов** (коммиты `b779c4f`, `18c236c`, `eb0635f`) |
| 3 | Input | Второй вид контрола в ряду высот, проверяет основу на не-кнопке. **Готов** (коммиты `c87b810`, `f65802d`, `eec1e00`) |
| 4 | Field | Label, подсказка и ошибка над Input; контракт для всех контролов значений. **Готов** (коммиты `03511c5`, `43703f1`, `6504dd9`) |
| 5 | ButtonGroup | Контейнер над Button, внутреннее кольцо фокуса. **Готов** (коммиты `84c82f8`, `b4a0d15`, `8800265`) |
| 6 | ToggleGroup | Режимы single и multi поверх ButtonGroup. **Готов** (коммиты `1f13af6`, `14e19c2`, `3200b97`, `8b801df`). |
| 7 | Checkbox | Первый контрол с отметкой: высота строки, `control-edge`. **Готов** (коммиты `f4541c6`, `77c16ea`, `9e30416`). |
| 8 | Radio + RadioGroup | Тот же приём, групповая навигация стрелками. **Готов** (коммиты `a5b6b70`, `f43a5ae`, `9065cae`). |
| 9 | Switch | Третья отметка. **Готов** (коммиты `c65a850`, `ad9ffad`, `be074e7`). |
| 10 | NumericInput | Input с числовой логикой. **Готов** (коммиты `cb0e486`, `5d015f6`, `bac7b8c`). |
| 11 | Tabs | Compound-компонент, горизонтальная прокрутка и внутреннее кольцо. **Готов** (коммиты `d141d53`, `a4aaf43`, `6a1d813`). |

Каждый план начинается с проверки, что предыдущие пункты закоммичены и `pnpm check` зелёный.

Пробный компонент `Probe` и `probe-unused` (этап 0) остаются до этапа 2: на `Probe` держатся страница «Темы» (панель в top layer, вложенные области, критерий 5) и матрица формы пакета (общий контекст приложения и кита); заменит его Popover. Button в матрицу добавляется как второй импортируемый компонент: сборка потребителя проверяет, что стили Button и общей основы попадают в CSS в нужном порядке.

## 2. Общие соглашения компонентов этапа

- **Раскладка папки** по разделу 11: `src/components/<имя>/{index.ts, <имя>.tsx, <имя>.module.css, <имя>.test.tsx}` плюс чистые функции отдельными `.ts`. Один компонент или один хук на файл. Плоские компоненты (Button, IconButton, Input, NumericInput, Switch, Checkbox, Radio, Field, ButtonGroup) не делятся на части; compound: ToggleGroup, RadioGroup, Tabs (раздел 11.1; ButtonGroup переведён в плоские 2026-10-29, раздел 3.4).
- **Общие пропсы** по разделу 7: `size`, `disabled`, `class`, `style`. Остальные атрибуты нативного элемента пробрасываются через `splitProps` (`...rest` на корень). Пропсы не деструктурируются, умолчания через `mergeProps`.
- **Корень** несёт `data-s-kit`; `data-s-kit-size` только если передан `size` (раздел 5). Вариант внешнего вида выражается `data-variant`, состояния вроде `selected` или `invalid`: `data-selected`, `data-invalid`, а не классами: стили читают атрибуты.
- **Общая CSS-основа контролов.** Правила, которые иначе повторялись бы в каждом компоненте (явная высота и ширина по разделу 5 в форме `var(--s-kit-control-height, var(--s-kit-control-height-md))`, `box-sizing`, шрифт, кольцо фокуса, `disabled`, снижение анимаций), живут в `src/styles/control-base.module.css` и подключаются через `composes: control from '../../styles/control-base.module.css'`. Компонентный CSS добавляет только своё (заливку, границу, скругление). Базовое правило `.control` обёрнуто в `:where()` (специфичность 0), чтобы порядок правил в CSS не имел значения (см. итоги Tabs, раздел 18). Если `composes` в Vite 8 ведёт себя нестабильно (например, порядок каскада в сборке), основа заменяется общим `.css` с атрибутом `data-s-kit-control`; это проверяется первой задачей плана Button.
- **Кольцо фокуса** строго по разделу 5.1: `:focus-visible`, внешнее по умолчанию, внутреннее по `data-s-kit-focus-inset` на предке; компоненты заливки используют токен ниже.
- **Компонентные токены** (`--s-kit-<компонент>-*`, публичный API кастомизации) перечисляются шапкой комментария в CSS компонента и читаются с фолбэком на глобальный токен; нигде не объявляются (как в Probe).
- **Недоступное состояние:** `disabled` у нативного элемента, `cursor: not-allowed`, непрозрачность `--s-kit-disabled-opacity` (новый токен, 45 %). Контраст отключённого контрола WCAG не регламентирует (1.4.3 исключает недоступные компоненты).
- **Анимации:** переходы цвета фона и границы 150 мс, под `@media (prefers-reduced-motion: reduce)` отключаются; размеры и позиция не анимируются (правило про свойства раскладки: ширина, высота, отступы; движение через `transform`, как у ползунка Switch, раскладку не меняет и разрешено).
- **Запрещено в компонентном CSS:** литералы цветов, `outline: none/0`, голое `var(--s-kit-control-height)` без фолбэка (последнее проверяется ревью; кандидат на правило stylelint, оценивается в плане Button).

## 3. Button

```ts
interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'style'> {
  variant?: 'primary' | 'tinted' | 'plain' | 'danger'; // по умолчанию 'primary'
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  style?: JSX.CSSProperties;
}
```

`type` по умолчанию `"button"` (в форме Button не отправляет её сам). Дополнительных пропсов нет: нет `loading`, нет `href`/`as`, нет иконок-пропсов; иконка и текст приходят детьми (YAGNI до первого реального случая).

**Варианты** (решение владельца, 2026-10-29):

| Вариант | Фон: покой / hover / active | Цвет текста |
|---|---|---|
| primary | `primary` / `primary-hover` / `primary-active` | `primary-contrast` |
| tinted | `tint` / `tint-hover` / `tint-active` | `text` |
| plain | прозрачный / `hover` / `tint` | `text` |
| danger | `danger` / `danger-hover` / `danger-active` | `primary-contrast` |

`danger-active` добавляется в `tokens.css` по той же схеме, что `primary-active` (`danger` со смесью `text` 26 %), и в список токенов `tokens.test.ts`. Тёмная тема: текст на `danger` это `primary-contrast` (`#04162e`) на `#ff6961`, 6,42:1.

**Состояния и размеры.** Покой, hover, active, `:focus-visible`, `disabled`. Высота, горизонтальный отступ и размер шрифта по разделу 5; радиус `--s-kit-radius`; вес шрифта 500; текст в одну строку (`white-space: nowrap`).

**Фокус на заливке.** Внутреннее кольцо (в контейнере с `data-s-kit-focus-inset`) того же цвета, что заливка primary или danger, даёт 1:1 с ней (раздел 5.1). Решение: в `tokens.css` вводится `--s-kit-focus-ring-on-fill`, по умолчанию равный `--s-kit-color-focus-ring`, а под `[data-s-kit-focus-inset]` равный `--s-kit-color-primary-contrast`. Варианты primary и danger рисуют кольцо цветом `var(--s-kit-focus-ring-on-fill)`, tinted и plain (заливка серая или нет) остаются на `--s-kit-color-focus-ring`. Контраст `primary-contrast` на `primary` в светлой и тёмной теме: 5,43:1 и 8,61:1; на `danger`: 5,38:1 и 6,42:1.

**Тесты** (`@solidjs/testing-library`): рендерит `<button type="button">` с корневыми атрибутами; все четыре варианта ставят `data-variant`; `size` ставит `data-s-kit-size`, без `size` атрибута нет; `disabled` блокирует `click`; пробрасывает `onClick`, `aria-*`, `class`, `style`; `type` по умолчанию `button` и переопределяется на `submit`; дети (текст и элемент). Визуальные состояния и высоты проверяются на странице playground (раздел 4).

### 3.1 IconButton

Квадратная кнопка для одной иконки. Варианты, размеры, состояния, кольцо фокуса и цвета те же, что у Button; отличается только геометрия и обязательное имя.

```ts
interface IconButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'style' | 'aria-label'> {
  'aria-label': string; // обязателен: у кнопки без текста нет другого доступного имени
  variant?: 'primary' | 'tinted' | 'plain' | 'danger'; // по умолчанию 'primary'
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  style?: JSX.CSSProperties;
}
```

Решения (2026-10-29, на утверждение владельцем вместе с планом):

- **Имя обязательно на уровне типов.** `aria-label` без значения не компилируется. `aria-labelledby` не поддерживается отдельным путём (YAGNI): нужную подпись можно передать и через `aria-label`.
- **Геометрия** по единому правилу размера (зонтичный спек, раздел 5): `inline-size` и `block-size` равны `var(--s-kit-control-height, var(--s-kit-control-height-md))`, горизонтальный отступ 0, `flex: none`, чтобы строка с `flex` не сжимала квадрат. Дочерний `svg` получает `1.25em` по обеим осям и `flex: none`, то есть иконка растёт вместе с размером шрифта контрола; иконки других видов (текст, `img`) остаются на совести вызывающего.
- **Реализация.** Собственный `<button>`, а не обёртка над `Button`; CSS подключает правила Button через `composes: root from '../button/button.module.css'`, поэтому варианты и состояния не дублируются. Зависимость только вниз: IconButton → Button (стили) → общая основа.
- **Токены.** Читает токены Button (`--s-kit-button-bg`, `-bg-hover`, `-bg-active`, `-color`), так что оформление, заданное на предке для Button, действует и на IconButton. Добавляется один свой: `--s-kit-icon-button-radius` (фолбэк: `--s-kit-button-radius`, затем `--s-kit-radius`), потому что квадратные кнопки часто делают круглыми.
- **Тесты:** те же, что у Button (корень, варианты, размер, `disabled`, проброс атрибутов, `type`), плюс доступное имя по `aria-label` и проверка на уровне типов, что без `aria-label` не компилируется. Квадратность проверяется на странице playground (раздел 4): для контролов с `data-row-square` ширина равна высоте.

### 3.2 Input

Однострочное текстовое поле на нативном `<input>`. Первый контрол значений: задаёт контракт `value`/`defaultValue`/`onValueChange` для NumericInput и других.

```ts
interface InputProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'class' | 'style' | 'size' | 'value' | 'defaultValue' | 'onInput'> {
  value?: string;                       // контролируемый режим
  defaultValue?: string;                // неконтролируемый режим, по умолчанию ''
  onValueChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';            // нативный числовой size не поддерживается
  class?: string;
  style?: JSX.CSSProperties;
}
```

Решения (2026-10-29, на утверждение владельцем вместе с планом):

- **Граница поля: `--s-kit-color-control-edge`** (решение владельца по вопросу 8 зонтичного спека: вариант (б)). Контраст границы к поверхности не ниже 3:1 в обеих темах (WCAG 1.4.11; уже проверяет `tokens.test.ts`). `border-strong` для полей не используется.
- **Режимы значения** только через `createControllableSignal`. В контролируемом режиме, если родитель не принял новое значение, поле возвращается к значению пропса сразу после события (иначе DOM разойдётся с состоянием).
- **`onInput` не пробрасывается**: значение отдаёт `onValueChange`; остальные события (`onFocus`, `onBlur`, `onKeyDown`, `onChange` …) проходят нативными. `type` по умолчанию `text`, переопределяется.
- **Ошибка поля: нативный `aria-invalid="true"`**, отдельного пропса `invalid` и `data-invalid` нет. Field (следующий компонент) работает с контролами через общие `id`, `aria-describedby`, `aria-invalid`, поэтому стиль читает тот же атрибут: красная граница `danger` и красное кольцо фокуса (без красной заливки, по зонтичному спеку, раздел 4).
- **Корень** `data-s-kit`, `data-s-kit-size` только при `size`; размеры по единому правилу, основа `control-base` через `composes`. Курсор `text`, у `disabled` общее правило основы (`not-allowed`, непрозрачность).
- **Цвета:** фон `surface`, текст `text`, плейсхолдер `muted` с `opacity: 1` (Firefox иначе осветляет). Контраст текста и плейсхолдера к фону не ниже 4,5:1 проверяется на странице playground (плейсхолдер собран через `color-mix`, поэтому считается в браузере).
- **Компонентные токены:** `--s-kit-input-border`, `--s-kit-input-radius`, `--s-kit-input-width` (фолбэк `12rem`). Граница `danger` при `aria-invalid` токеном не переопределяется.
- **Тесты:** корень и тип по умолчанию, переопределение `type`, `size` ставит `data-s-kit-size` и не ставит нативный `size`, неконтролируемый режим (`defaultValue`, `onValueChange`), контролируемый режим (значение, отказ родителя, обновление родителем), `disabled`, проброс `aria-invalid`, `placeholder`, `class`, `style`, нативных событий.

### 3.3 Field

Обёртка формы: подпись, контрол, подсказка или текст ошибки. Плоский компонент без внутреннего контекста и без зависимости от Input: связь с контролом идёт через функцию-ребёнка, которая получает общие атрибуты.

```ts
interface FieldControlProps {
  readonly id: string;                           // для связи <label for> и контрола
  readonly 'aria-describedby': string | undefined; // id подсказки или ошибки, если они показаны
  readonly 'aria-invalid': true | undefined;     // true, пока показана ошибка
}

interface FieldProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'children' | 'id'> {
  label: JSX.Element;
  hint?: JSX.Element;
  error?: JSX.Element;    // наличие содержимого означает «поле с ошибкой»
  id?: string;            // id контрола; по умолчанию createUniqueId()
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  style?: JSX.CSSProperties;
  children: (control: FieldControlProps) => JSX.Element;
}
```

```tsx
<Field label='Имя' hint='Как в паспорте' error={error()}>
  {(control) => <Input {...control} value={name()} onValueChange={setName} />}
</Field>
```

Решения (2026-10-29, на утверждение владельцем вместе с планом):

- **Функция-ребёнок вместо контекста.** Явная передача `id`, `aria-describedby`, `aria-invalid` работает с любым контролом значений (Input, NumericInput, Select …) без общего контекста и без зависимости Field от конкретных компонентов; типы проверяются в точке использования. `FieldControlProps` экспортируется как контракт для контролов. Объект передаётся с геттерами, поэтому `{...control}` остаётся реактивным (ошибка появляется и пропадает без перерисовки контрола).
- **Ошибка заменяет подсказку.** Показывается одно сообщение под контролом: при ошибке `error`, иначе `hint`; `aria-describedby` указывает на показанное. «Пусто» это `undefined`, `null`, `false` и пустая строка. Пока ошибка показана, контрол получает `aria-invalid="true"` (его стиль читает этот атрибут, раздел 3.2), а корень Field `data-invalid`.
- **Без живой области и без `required`** (YAGNI): ошибку читают через `aria-describedby` при фокусе; `required` передаётся самому контролу, звёздочку можно положить в `label`.
- **Размер.** `size` ставит `data-s-kit-size` на корень Field, тем самым как обёртка задаёт размер вложенному контролу (правило раздела 5 зонтичного спека) и размер шрифта подписи и сообщения. Без `size` атрибута нет.
- **Раскладка:** колонка (`flex`), зазор `--s-kit-field-gap` (фолбэк 6 px), подпись весом 500 цветом `text`, сообщение цветом `muted`, ошибка `danger`; ширину контрола задаёт сам контрол или родитель.
- **Тесты** (на нативном `<input>`, без Input): подпись связана с контролом (`getByLabelText`), свой `id`, уникальные id у двух Field, подсказка и `aria-describedby`, ошибка заменяет подсказку и ставит `aria-invalid`, ничего не показано, реактивное появление и пропажа ошибки, «пустые» значения ошибки, корневые атрибуты и `data-invalid`, проброс `class`, `style` и нативных атрибутов. Совместимость с Input проверяет `tsc` playground (`<Input {...control} />`), поведение в браузере проверяют проверки на странице.

### 3.4 ButtonGroup

Оболочка для двух-пяти кнопок, собранных вместе: общий размер, общая заливка под кнопками, внутреннее кольцо фокуса. Кнопки внутри обычные `Button`.

```ts
interface ButtonGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  style?: JSX.CSSProperties;
}
```

```tsx
<ButtonGroup aria-label='Период' size='sm'>
  <Button variant='plain'>День</Button>
  <Button variant='plain'>Неделя</Button>
  <Button variant='plain'>Месяц</Button>
</ButtonGroup>
```

Решения (2026-10-29, на утверждение владельцем вместе с планом):

- **ButtonGroup плоский, не compound.** Критерий раздела 11.1 зонтичного спека («больше одной самостоятельно размещаемой области или пользователь вставляет свою разметку между частями») к нему не подходит: части это готовые `Button`, а общего состояния у группы нет. Поэтому ни контекста, ни `ButtonGroup.Item`. Из списка compound в разделе 2 этого документа и в разделе 11.1 зонтичного спека ButtonGroup переносится в плоские; **compound остаётся ToggleGroup**, у которого есть общее состояние выбора.
- **Геометрия** по зонтичному спеку (раздел 5): оболочка `inline-flex`, высота оболочки равна высоте контрола (`var(--s-kit-control-height, var(--s-kit-control-height-md))`), внутренний отступ 2 px, зазор 2 px, заливка `--s-kit-color-tint`, радиус `--s-kit-radius`. Кнопки внутри на 4 px ниже оболочки, их радиус равен радиусу оболочки минус отступ (концентрично). Единицей сравнения высоты в ряду служит оболочка.
- **Правила CSS написаны селекторами `.root > [data-s-kit]`** (специфичность выше, чем у правил Button), поэтому порядок следования CSS Button и ButtonGroup в бандле не важен. Группа владеет высотой и радиусом сегментов: локальный `size` у кнопки внутри группы на высоту не влияет (размер задаётся на группе).
- **Размер.** `size` ставит `data-s-kit-size` на оболочку; вложенные кнопки наследуют высоту, отступ и шрифт через переменные (как от любой обёртки). Без `size` атрибута нет.
- **Кольцо фокуса сегментов внутреннее:** оболочка всегда несёт `data-s-kit-focus-inset` (на нём работают `--s-kit-focus-ring-offset` и `--s-kit-focus-ring-on-fill` из `tokens.css`), отдельного пропса нет.
- **Вариант кнопок задаёт вызывающий.** Группа не меняет умолчание Button (`primary`); сегментированный вид получается с `variant='plain'`. Для `plain`-сегментов группа задаёт свои состояния поверх заливки оболочки: наведение `tint-hover`, нажатие `tint-active` (как у варианта `tinted`), потому что стандартный `hover` у `plain` почти сливается с `tint`. Токены кнопки (`--s-kit-button-bg-hover`, `--s-kit-button-bg-active`) при этом остаются читаемыми с теми же фолбэками.
- **Семантика:** `role="group"` по умолчанию, переопределяется (например, `toolbar`); имя через `aria-label` или `aria-labelledby`, обязательным его не делаем.
- **Компонентные токены:** `--s-kit-button-group-padding` (2px), `--s-kit-button-group-gap` (2px), `--s-kit-button-group-radius`.
- **Тесты:** корень `div` с `role="group"` и `data-s-kit`, `data-s-kit-focus-inset`; доступное имя; размер только при `size`; дети в порядке следования; проброс `class`, `style`, нативных атрибутов и переопределение `role`. Высоты и отступы сегментов, кольцо внутри оболочки проверяются на странице playground (раздел 4).

### 3.5 ToggleGroup

Группа переключателей поверх ButtonGroup с общим состоянием выбора: режим `single` (один выбранный сегмент, сегментированный контрол) и `multi` (любое число выбранных). Compound: `ToggleGroup.Root` и `ToggleGroup.Item`.

```ts
interface ToggleGroupBaseProps extends ButtonGroupProps { // size, class, style, нативные атрибуты div
  disabled?: boolean;
}
interface ToggleGroupSingleProps extends ToggleGroupBaseProps {
  mode?: 'single';                          // по умолчанию
  value?: string | null;                    // null: контролируемо, ничего не выбрано
  defaultValue?: string | null;             // по умолчанию null
  onValueChange?: (value: string) => void;
}
interface ToggleGroupMultiProps extends ToggleGroupBaseProps {
  mode: 'multi';
  value?: readonly string[];
  defaultValue?: readonly string[];         // по умолчанию []
  onValueChange?: (value: string[]) => void; // весь выбор, в порядке включения
}
interface ToggleGroupItemProps extends Omit<ButtonProps, 'variant' | 'size' | 'onClick' | 'aria-pressed'> {
  value: string;
}
```

```tsx
<ToggleGroup.Root aria-label='Период' defaultValue='week' size='sm'>
  <ToggleGroup.Item value='day'>День</ToggleGroup.Item>
  <ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
</ToggleGroup.Root>
```

Решения (2026-10-29, на утверждение владельцем вместе с планом):

- **Compound без быстрой формы.** Состояние выбора живёт в `ToggleGroup.Root` (`createControllableSignal`) и отдаётся частям через контекст (`isSelected`, `toggle`, `disabled`); `Item` вне `Root` бросает понятную ошибку. Фасада `<ToggleGroup items={...}>` нет (YAGNI: сегменты пишутся разметкой, как в примере). Корень это `ButtonGroup`, поэтому геометрия, внутреннее кольцо фокуса и размер приходят от него без дублирования; `Item` это `Button` с `variant='plain'`.
- **Режимы.** `mode='single'` по умолчанию. Контракт значения по зонтичному спеку (раздел 7): `undefined` значит «не контролируется», пустой выбор выражается `null` в single и `[]` в multi. Внутри состояние одно и то же, список выбранных; `value` режима single приводится к списку из нуля или одного элемента.
- **В режиме single повторный щелчок по выбранному сегменту выбор не снимает** и `onValueChange` не вызывает (сегментированный контрол: один сегмент выбран всегда, кроме начального состояния без `defaultValue`). Опция `deselectable` не вводится; добавить её позже можно без поломки API. `onValueChange` в single получает `string`, а не `string | null`.
- **В режиме multi** щелчок включает и выключает сегмент; `onValueChange` получает новый массив (порядок включения, входной массив не мутируется).
- **Семантика.** Корень `role="group"` от ButtonGroup, имя через `aria-label` или `aria-labelledby`. Каждый сегмент это `<button aria-pressed="true|false">` в обоих режимах. Клавиатура: Tab к каждому сегменту по очереди, Space и Enter переключают (нативная кнопка). **Стрелки и roving tabindex не делаются:** это вне цели первой итерации (раздел 1 зонтичного спека), в итогах записывается как ограничение, а не как заявленная навигация. Radio-семантика single-режима (`role="radiogroup"`) не используется: она требует стрелок.
- **Вид выбранного сегмента.** Сегмент несёт `data-selected` (атрибут, а не класс). Выбранный сегмент «приподнят» над оболочкой, как в сегментированном контроле Apple (решение владельца 2026-10-29, вариант «подложка с тенью»; сначала была заливка `primary-subtle`, которая к оболочке почти не контрастна): заливка `--s-kit-toggle-group-selected-bg`, по умолчанию `light-dark(surface, tint-active)` (светлее оболочки в обеих темах), тонкая тень `--s-kit-toggle-group-selected-shadow` (`0 1px 2px` цветом `--s-kit-shadow-color` и `0 0 0 0.5px` `border-strong`) и цвет текста `--s-kit-toggle-group-selected-color`, по умолчанию `--s-kit-color-primary` (второй признак). Фактический контраст заливки к оболочке и текста к заливке измеряет страница playground. Наведение и нажатие на выбранный сегмент заливку не меняют (явные правила со специфичностью выше, чем у `plain`-состояний ButtonGroup). Невыбранные сегменты ведут себя как `plain` в ButtonGroup.
- **CSS.** Правила выбранного сегмента написаны как `[data-s-kit-focus-inset] .item[data-selected][data-variant="plain"]...` (специфичность выше, чем у правил Button и ButtonGroup), поэтому порядок CSS в бандле не важен, как у ButtonGroup.
- **`disabled`.** На `Root` отключает все сегменты, на `Item` один сегмент (нативный `disabled`, непрозрачность и курсор из общей основы). Своего `onClick` у `Item` нет: щелчок переключает выбор; реакция на изменение это `onValueChange` корня.
- **Размер задаёт только группа** (`size` у `Root`, либо обёртка); `Item` свой `size` и `variant` не принимает.
- **Компонентные токены:** `--s-kit-toggle-group-selected-bg`, `--s-kit-toggle-group-selected-color`, `--s-kit-toggle-group-selected-shadow`; геометрия оболочки и сегментов это токены ButtonGroup.
- **Раскладка папки** (раздел 2, compound): `toggle-group-selection.ts` (чистые функции `toSelection`, `nextSelection`), `toggle-group-context.ts`, `toggle-group-root.tsx`, `toggle-group-item.tsx`, `toggle-group.module.css`, `index.ts` (`export const ToggleGroup = { Root, Item }`).
- **Тесты:** чистые функции (приведение значения, переходы single и multi, отсутствие мутации); компонент: группа с именем и атрибутами корня, `aria-pressed` и `data-selected` у сегментов, single uncontrolled и controlled (родитель не принял изменение, `null` как пустой выбор), повторный щелчок в single, multi uncontrolled и controlled, `disabled` корня и сегмента, `size`, проброс `class`, `style` и нативных атрибутов, ошибка у `Item` вне `Root`. Геометрия, кольцо внутри группы, контраст выбранного сегмента и реальный щелчок проверяются на странице playground (раздел 4).
- **Вне объёма:** стрелки и roving tabindex, снятие выбора в single (`deselectable`), вертикальная ориентация, иконочные сегменты (квадратные), быстрая форма.

### 3.6 Checkbox

Флажок с подписью и без. Плоский компонент: корень `<label>` (клик по подписи переключает флажок), внутри нативный `<input type="checkbox">` с `appearance: none`, нарисованный киту, и необязательная подпись из `children`.

```ts
interface CheckboxProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>,
  'class' | 'style' | 'size' | 'type' | 'checked' | 'defaultChecked' | 'onChange' | 'onInput' | 'children'> {
  checked?: boolean;
  defaultChecked?: boolean;          // по умолчанию false
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;           // только вид; состоянием владеет вызывающий
  size?: 'sm' | 'md' | 'lg';         // на корне
  class?: string;                    // на корне
  style?: JSX.CSSProperties;         // на корне
  children?: JSX.Element;            // подпись
}
```

```tsx
<Checkbox defaultChecked>Согласен</Checkbox>
<Checkbox aria-label='Выбрать строку' checked={selected()} onCheckedChange={setSelected}/>
```

Решения (2026-10-29, владелец поручил писать план и сразу выполнять, подтверждение по ходу не требовалось):

- **Куда идут атрибуты.** `class`, `style`, `size` и `children` относятся к корню `label`; все остальные нативные атрибуты (`id`, `name`, `value`, `disabled`, `required`, `aria-*`, `data-*`) идут на `input`. Поэтому `<Checkbox {...control}/>` из Field получает `id`, `aria-describedby`, `aria-invalid` на настоящий элемент. Корень несёт `data-s-kit` и `data-s-kit-size` (только при `size`), `input` `data-s-kit` не несёт: страница-ряд измеряет «корень контрола» как ближайший `[data-s-kit]`.
- **Высота.** Корень `inline-flex`, `block-size: var(--s-kit-control-height, var(--s-kit-control-height-md))`, поэтому строка «отметка + подпись» (и без подписи) стоит в одной линии с остальными контролами (зонтичный спек, раздел 5). Сама отметка 16 px (токен `--s-kit-checkbox-size`), зазор до подписи 8 px (`--s-kit-checkbox-gap`).
- **Вид.** Невыбранный: заливка `surface`, граница `1px solid --s-kit-color-control-edge` (контраст к поверхности не ниже 3:1, зонтичный спек, раздел 4.1), радиус 4 px (`--s-kit-checkbox-radius`). Выбранный и неопределённый: заливка и граница `--s-kit-color-primary`, галочка или тире цвета `--s-kit-color-primary-contrast` (inline-SVG `stroke: currentColor`, поверх input с `pointer-events: none`). Наведение: невыбранный `--s-kit-color-hover`, выбранный `primary-hover`; нажатие `primary-active`. `aria-invalid="true"` даёт красную границу и красное кольцо (как у Input).
- **Кольцо фокуса** на самом `input` (`:focus-visible`, токены раздела 5.1): снаружи по умолчанию, внутри по `data-s-kit-focus-inset` на предке; у выбранного input цвет кольца `--s-kit-focus-ring-on-fill`.
- **Controlled/uncontrolled** через `createControllableSignal<boolean>`: `checked` / `defaultChecked` / `onCheckedChange`. В контролируемом режиме, если родитель не принял изменение, DOM возвращается к значению родителя (как у Input).
- **`indeterminate`** выставляется как DOM-свойство (`prop:indeterminate`); после щелчка браузер сам его сбрасывает, поэтому обработчик возвращает значение пропа: состояние «частично» меняет только вызывающий (главный флажок грида: щелчок даёт `onCheckedChange(true)`, а вызывающий решает, что дальше). Для скринридера нативный `indeterminate` даёт `mixed`. При `indeterminate` рисуется тире, а не галочка, независимо от `checked`.
- **`disabled`:** нативный на `input`; корень получает `data-disabled`, курсор `not-allowed`, непрозрачность `--s-kit-disabled-opacity` на всю строку.
- **Анимации:** переход фона и границы 150 мс, отключается при `prefers-reduced-motion`.
- **Компонентные токены:** `--s-kit-checkbox-size`, `--s-kit-checkbox-radius`, `--s-kit-checkbox-gap`.
- **Тесты:** нативный чекбокс с доступным именем от подписи и от `aria-label`; корень `label` с `data-s-kit`, `input` без него; `size` только при передаче; uncontrolled (`defaultChecked`, щелчок, `onCheckedChange`); controlled (следует за родителем, возврат при отказе); `indeterminate` (свойство, возврат после щелчка, реакция на смену пропа); `disabled`; проброс атрибутов на `input`, а `class` и `style` на корень; подпись только при `children`. Геометрия, контраст отметки и кольцо фокуса проверяются на странице playground (раздел 4).
- **Вне объёма:** трёхсостоятельный цикл «частично → выбрано → снято» внутри компонента, группа флажков (`CheckboxGroup`), иконка вместо галочки через проп.

### 3.7 Radio и RadioGroup

Группа радиокнопок: compound `RadioGroup.Root` (оболочка с состоянием выбора) и `RadioGroup.Item` (одна радиокнопка с подписью или без). Нативные `<input type="radio">` с общим `name`, нарисованные тем же приёмом, что Checkbox.

```ts
interface RadioGroupRootProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
  value?: string | null;                    // null: контролируемо, ничего не выбрано
  defaultValue?: string | null;             // по умолчанию null
  onValueChange?: (value: string) => void;
  name?: string;                            // по умолчанию уникальное имя группы
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';  // по умолчанию vertical
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  style?: JSX.CSSProperties;
}
interface RadioGroupItemProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>,
  'class' | 'style' | 'size' | 'type' | 'name' | 'value' | 'checked' | 'defaultChecked' | 'onChange' | 'onInput' | 'children'> {
  value: string;
  class?: string;                           // на корне (label)
  style?: JSX.CSSProperties;                // на корне (label)
  children?: JSX.Element;                   // подпись
}
```

```tsx
<RadioGroup.Root aria-label='Тариф' defaultValue='basic'>
  <RadioGroup.Item value='basic'>Базовый</RadioGroup.Item>
  <RadioGroup.Item value='pro'>Расширенный</RadioGroup.Item>
</RadioGroup.Root>
```

Решения (2026-10-29, владелец поручил писать план и сразу выполнять):

- **Radio это `RadioGroup.Item`.** Отдельной папки `radio` и отдельного публичного пути нет: одиночная радиокнопка без группы не имеет смысла (YAGNI), публичный путь один, `@stark/solid-kit/radio-group`. Строка «Radio + RadioGroup» таблицы порядка закрывается этим компонентом. Отступление от формулировки «плоские: Radio» раздела 2: Radio существует только как часть compound.
- **Нативная группа.** Все `input` группы получают один `name` (`name` корня или уникальный, `createUniqueId`), поэтому браузер сам даёт то, ради чего радио и существует: один Tab-стоп на группу, стрелки перемещают и выбирают, пропуск отключённых, Space выбирает. Собственной клавиатурной логики и roving tabindex нет.
- **Корень** `div role="radiogroup"` с `data-s-kit`, `data-s-kit-size` (только при `size`), `data-orientation`; имя через `aria-label` или `aria-labelledby`. `inline-flex`: вертикально без зазора (строка и так высотой с контрол), горизонтально зазор 16 px. Остальные нативные атрибуты (`id`, `aria-describedby`, `aria-invalid`) идут на корень, поэтому группа принимает атрибуты Field.
- **Item** как Checkbox: корень `label` (`data-s-kit`, `class`, `style`, подпись), внутри `input` с `appearance: none` и соседний SVG с точкой поверх него; остальные нативные атрибуты на `input`. Размер задаёт только группа (`size` у корня или обёртка), у Item `size` нет. Высота корня Item равна высоте контрола, как у Checkbox.
- **Вид.** Круглая отметка 16 px (`--s-kit-radio-size`): не выбрана заливка `surface` и граница `control-edge`; выбрана заливка и граница `primary`, точка `primary-contrast`; hover, active, фокус и `disabled` как у Checkbox. `aria-invalid="true"` на корне группы даёт красную границу не выбранных радио и красное кольцо у них.
- **Controlled/uncontrolled** через `createControllableSignal<string | null>`: `value` / `defaultValue` / `onValueChange` (вызывается только со значением выбранного элемента). Выбранный Item определяется сравнением значения. В контролируемом режиме, если родитель не принял изменение, корень после выбора возвращает `checked` всех радио группы к значению родителя (браузер уже перенёс выбор).
- **`disabled`:** на корне отключает все радио, на Item одно; корень Item получает `data-disabled`, курсор `not-allowed`, непрозрачность `--s-kit-disabled-opacity`.
- **Компонентные токены:** `--s-kit-radio-size`, `--s-kit-radio-gap` (до подписи, 8px), `--s-kit-radio-group-gap`.
- **Раскладка папки:** `radio-group-context.ts`, `radio-group-root.tsx`, `radio-group-item.tsx`, `radio-group.module.css`, `index.ts` (`export const RadioGroup = { Root, Item }`).
- **Тесты:** группа с именем и атрибутами корня, радио с доступным именем от подписи и от `aria-label`, общий и уникальный `name` (и переопределение), `defaultValue`, выбор и `onValueChange`, повторный щелчок по выбранному молчит, controlled (следует за родителем, возврат при отказе, `null`), `disabled` группы и элемента, `size` и `orientation`, проброс атрибутов, ошибка у Item вне группы. Геометрия, контраст отметки, кольцо и стрелки проверяются на странице playground (раздел 4).
- **Вне объёма:** одиночный `Radio`, `required` и валидация группы, отдельный `aria-orientation`, карточки-радио (Item со своей разметкой внутри).

### 3.8 Switch

Переключатель «включено / выключено» с подписью и без. Плоский компонент по образцу Checkbox: корень `<label>`, внутри нативный `<input type="checkbox" role="switch">` с `appearance: none` (дорожка) и соседний `span` (ползунок).

```ts
interface SwitchProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>,
  'class' | 'style' | 'size' | 'type' | 'role' | 'checked' | 'defaultChecked' | 'onChange' | 'onInput' | 'children'> {
  checked?: boolean;
  defaultChecked?: boolean;          // по умолчанию false
  onCheckedChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';         // на корне
  class?: string;                    // на корне
  style?: JSX.CSSProperties;         // на корне
  children?: JSX.Element;            // подпись
}
```

```tsx
<Switch defaultChecked>Уведомления</Switch>
<Switch aria-label='Тёмная тема' checked={dark()} onCheckedChange={setDark}/>
```

Решения (2026-10-29, владелец поручил писать план и сразу выполнять):

- **Устройство как у Checkbox** (раздел 3.6): `class`, `style`, `size`, `children` на корне `label`, остальные нативные атрибуты на `input` (поэтому `<Switch {...control}/>` из Field получает `id` и `aria-*` на настоящий элемент), `data-s-kit` и `data-s-kit-size` (только при `size`) на корне, `data-disabled` у корня при `disabled`. Роль `switch` задана самим компонентом и не переопределяется: браузер отдаёт скринридеру состояние `checked` как `aria-checked`.
- **Controlled/uncontrolled:** `checked` / `defaultChecked` / `onCheckedChange` через `createControllableSignal<boolean>`; если родитель не принял изменение, DOM возвращается к его значению (как у Checkbox). Состояния `indeterminate` у переключателя нет.
- **Высота** корня равна высоте контрола (`var(--s-kit-control-height, var(--s-kit-control-height-md))`), как у Checkbox, поэтому строка стоит в одной линии с остальными контролами.
- **Вид.** Дорожка 32×18 px, скругление в полукруг (`--s-kit-switch-width`, `--s-kit-switch-height`), ползунок на 4 px меньше высоты дорожки и на 2 px от её края. Выключен: дорожка цвета `--s-kit-color-control-edge` (контраст к поверхности не ниже 3:1, зонтичный спек, раздел 4.1), ползунок `--s-kit-color-surface`. Включён: дорожка `--s-kit-color-primary`, ползунок `--s-kit-color-primary-contrast`. Включённая: hover `primary-hover`, active `primary-active`. У выключенной дорожки hover и active не меняются (подходящего токена нет). Кольцо фокуса на самом `input` (снаружи по умолчанию, внутри по `data-s-kit-focus-inset`; внутреннее кольцо всегда цвета `--s-kit-focus-ring-on-fill`, потому что дорожка залита и выключенной: на серой дорожке обычный цвет кольца давал контраст 1,65:1). Красного состояния для `aria-invalid` нет (YAGNI: переключатель не участвует в валидации).
- **Анимации.** Цвет дорожки 150 мс и сдвиг ползунка (`transform`) 150 мс, оба отключаются при `prefers-reduced-motion`. Правило раздела 2 «размеры и позиция не анимируются» относится к свойствам раскладки (ширина, высота, отступы): ползунок двигается `transform` и на раскладку не влияет, раздел 2 уточнён этим комментарием.
- **Тексты и RTL.** Подпись стоит справа от переключателя; сдвиг ползунка рассчитан на LTR, RTL в этапе не поддерживается.
- **Компонентные токены:** `--s-kit-switch-width` (32px), `--s-kit-switch-height` (18px), `--s-kit-switch-gap` (8px, до подписи).
- **Тесты:** нативный чекбокс с ролью `switch` и доступным именем от подписи и от `aria-label`; корень `label` с `data-s-kit`, `input` без него; `size` только при передаче; uncontrolled (`defaultChecked`, щелчок, `onCheckedChange`); щелчок по подписи; controlled (следует за родителем, возврат при отказе); `disabled`; проброс атрибутов на `input`, `class` и `style` на корень; подпись только при `children`. Геометрия, контраст дорожки и ползунка, кольцо фокуса проверяются на странице playground (раздел 4).
- **Вне объёма:** красное состояние ошибки, подписи «Вкл/Выкл» внутри дорожки, иконки в ползунке, RTL.

### 3.9 NumericInput

Числовое поле на нативном текстовом `<input>`: оболочка над Input (раздел 3.2) с разбором числа, шагом стрелками и границами. Отдельного CSS и отдельных токенов нет: вид, размеры, `aria-invalid` и компонентные токены `--s-kit-input-*` те же, что у Input.

```ts
interface NumericInputProps extends Omit<InputProps, 'value' | 'defaultValue' | 'onValueChange' | 'type' | 'role' | 'inputmode' | 'onKeyDown' | 'onBlur'> {
  value?: number | null;                 // контролируемый режим; null: контролируемое пустое поле
  defaultValue?: number | null;          // неконтролируемый режим, по умолчанию null (пусто)
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;                         // шаг стрелок, по умолчанию 1
  precision?: number;                    // знаков после запятой, по умолчанию как у step
  onKeyDown?: JSX.EventHandler<HTMLInputElement, KeyboardEvent>;
  onBlur?: JSX.EventHandler<HTMLInputElement, FocusEvent>;
}
```

```tsx
<NumericInput aria-label='Количество' min={0} max={99} defaultValue={1}/>
<NumericInput aria-label='Цена' step={0.5} value={price()} onValueChange={setPrice}/>
```

Решения (2026-10-29, на утверждение владельцем вместе с планом):

- **Текстовое поле, а не `type="number"`.** Нативный `type="number"` зависит от локали, принимает `e`, пропускает прокрутку колесом и не даёт управлять вводом. Берётся `type="text"` с `role="spinbutton"`, `inputmode` (`decimal`, если допустимы дробная часть или минус, иначе `numeric`) и ARIA `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. `type`, `role` и `inputmode` не переопределяются.
- **Значение `number | null`.** Пустое поле это `null`; `undefined` у `value` значит «не контролируется», `null` значит контролируемое пустое (контракт `createControllableSignal`). Текст в поле хранится отдельно от числа, поэтому промежуточные записи (`-`, `1.`) не теряются.
- **Ввод фильтруется на лету.** Остаются цифры, один разделитель (запятая превращается в точку) и минус только первым знаком и только если `min` не задан или отрицателен; дробная часть обрезается до `precision`, при `precision` 0 разделитель не допускается. Запись вроде `-`, `.`, `1.` даёт число `null`, `null`, `1`. Локализованный вывод (разделители тысяч, запятая вместо точки) вне объёма: поле показывает `String(value)`.
- **Границы применяются при фиксации, а не при вводе.** `onValueChange` вызывается на каждый ввод с разобранным числом без обрезки (чтобы форма видела значение сразу); при потере фокуса и по Enter число приводится к `min`/`max` и округляется до `precision`, пустой остаток (`-`, `.`) очищается, при необходимости вызывается `onValueChange` ещё раз. Enter не отменяется: отправка формы идёт нативно после фиксации.
- **Клавиши.** `ArrowUp`/`ArrowDown` меняют значение на `step`, с Shift на `10 × step`; результат приводится к границам и округляется до `precision` (чтобы `0.1 + 0.2` давало `0.3`); пустое поле считается нулём до приведения к границам. Действие отменяется (`preventDefault`), пользовательский `onKeyDown` вызывается первым и может его отменить; при `readOnly` стрелки не действуют. PageUp/PageDown, Home/End вне объёма.
- **Контролируемый режим** как у Input: если родитель не принял число, текст возвращается к значению родителя (`format(value)`), в том числе после фиксации.
- **Кнопок «плюс»/«минус» нет** (YAGNI этапа 1): только клавиатура. Колесо мыши значение не меняет.
- **Тесты:** чистые функции `numeric-math.ts` отдельным файлом тестов (`countDecimals`, `roundTo`, `clamp`, `sanitizeNumericText`, `parseNumericText`, `formatNumeric`); компонент: роль и атрибуты, `inputmode`, `aria-value*`, неконтролируемый режим, фильтрация ввода, разделитель и точность, промежуточные записи, минус при неотрицательном `min`, фиксация на blur и Enter, очистка висящего знака, стрелки и Shift, границы и пустой старт, округление шага, `readOnly`, контролируемый режим (следование, отказ, `null`), пользовательские обработчики, проброс `size`, `class`, `style`, `aria-invalid`.
- **Вне объёма:** кнопки шага, колесо, форматирование по локали и тысячам, единицы измерения, шаг-привязка (округление к кратному `step`), экспоненциальная запись.

### 3.10 Tabs

Вкладки с панелями. Compound-компонент (зонтичный спек, раздел 11.1): `Tabs.Root` держит состояние, `Tabs.List` это полоса вкладок (скроллер), `Tabs.Tab` кнопка вкладки, `Tabs.Panel` панель содержимого.

```ts
interface TabsRootProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
  value?: string | null;                 // контролируемый режим; null: ничего не выбрано
  defaultValue?: string | null;          // неконтролируемый режим, по умолчанию null
  onValueChange?: (value: string) => void;
  class?: string;
  style?: JSX.CSSProperties;
}
interface TabsListProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'role' | 'onKeyDown'> {
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  style?: JSX.CSSProperties;
  onKeyDown?: JSX.EventHandler<HTMLDivElement, KeyboardEvent>;
}
interface TabsTabProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'role' | 'type' | 'onClick' | 'onFocus'> {
  value: string;
  class?: string;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
  onFocus?: JSX.EventHandler<HTMLButtonElement, FocusEvent>;
}
interface TabsPanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'role'> {
  value: string;
  keepMounted?: boolean;                 // содержимое невыбранной панели остаётся в DOM (скрытое)
  class?: string;
}
```

```tsx
<Tabs.Root defaultValue='overview'>
  <Tabs.List aria-label='Разделы'>
    <Tabs.Tab value='overview'>Обзор</Tabs.Tab>
    <Tabs.Tab value='details'>Детали</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value='overview'>…</Tabs.Panel>
  <Tabs.Panel value='details'>…</Tabs.Panel>
</Tabs.Root>
```

Решения (2026-10-29, владелец поручил писать план и сразу выполнять):

- **Разметка по WAI-ARIA Tabs.** `Tabs.List`: `role="tablist"`; `Tabs.Tab`: настоящая `<button type="button" role="tab">` с `aria-selected`, `aria-controls` (id панели) и `id`; `Tabs.Panel`: `role="tabpanel"`, `aria-labelledby` (id вкладки), по умолчанию `tabindex="0"` (переопределяется своим `tabindex`). Идентификаторы строятся из `createUniqueId()` корня и значения вкладки, значение кодируется `encodeURIComponent` (пробел в `id` ломает `aria-controls`, это список через пробел). У каждой вкладки ожидается панель с тем же `value`; вкладки без панелей (навигация) в этом компоненте не предусмотрены.
- **Состояние:** `createControllableSignal<string | null>` (как RadioGroup). Щелчок и клавиши вызывают `onValueChange` только при смене значения; если родитель отказал, выбор остаётся родительским (состояние берётся из `value()`).
- **Клавиатура (автоматическая активация).** Один Tab-стоп на полосу: у выбранной доступной вкладки `tabindex="0"`, у остальных `-1`; если выбранной доступной нет, в порядок Tab входит первая доступная (реестр вкладок в `Tabs.Root`). `ArrowRight`/`ArrowLeft` переводят фокус на следующую/предыдущую доступную вкладку с переходом по кругу и сразу выбирают её, `Home`/`End` на первую/последнюю; недоступные пропускаются; с Ctrl, Alt, Meta и другие клавиши игнорируются; пользовательский `onKeyDown` полосы вызывается первым и может отменить. Tab из полосы уходит на панель (`tabindex=0`). Вертикальная ориентация, ручная активация (`activationMode`), RTL вне объёма.
- **Панели.** Невыбранная панель остаётся элементом с `hidden` (чтобы `aria-controls` вёл на существующий узел), но её содержимое не монтируется; `keepMounted` оставляет содержимое в DOM скрытым (состояние формы внутри не теряется).
- **Полоса прокручивается.** `Tabs.List` это горизонтальный скроллер (`overflow: auto hidden`, ширина по содержимому, но не больше контейнера), полоса прокрутки скрыта (`scrollbar-width: none`), вкладки не сжимаются (`flex: none`). Вкладка прокручивается в видимую область при фокусе, при смене выбора (в том числе родителем) и при первом показе, если она выбрана; прокручивается только полоса, страница не двигается. Стрелок прокрутки и затухания у краёв нет (YAGNI этапа 1; закрывает вопрос 3 раздела 7): прокрутка нативная (тач, трекпад, Shift + колесо) и клавишная. Подсказки о том, что вкладки продолжаются за краем, нет; если владелец найдёт это проблемой, добавляются отдельным пунктом.
- **Внутреннее кольцо.** `Tabs.List` ставит `data-s-kit-focus-inset` (зонтичный спек, раздел 5.1: «вкладки в прокручиваемом списке Tabs» внутреннее), поэтому кольцо вкладки всегда внутри и не обрезается скроллером.
- **Вид.** Высота полосы равна высоте контрола (`var(--s-kit-control-height, var(--s-kit-control-height-md))`, `box-sizing: border-box`), снизу линия `--s-kit-color-hairline` 1 px; вкладки на всю оставшуюся высоту, основа контролов через `composes`. Не выбранная: текст `--s-kit-color-muted`, hover: текст `--s-kit-color-text` и фон `--s-kit-color-hover`. Выбранная: текст `--s-kit-color-text` и линия-индикатор `--s-kit-color-primary` толщиной `--s-kit-tabs-indicator-width` (2 px) внизу вкладки (`box-shadow: inset`, поэтому размеры не меняются). Верхние углы вкладки скруглены `--s-kit-tabs-radius`, нижние нет. Недоступная: общее правило основы. Контраст текста обеих вкладок к поверхности не ниже 4,5:1, индикатора к поверхности не ниже 3:1 (проверка на странице). При `forced-colors` индикатор из `box-shadow` пропадает (не проверено; выбранная вкладка остаётся различима `aria-selected` и цветом текста только в обычном режиме).
- **Размер** задаётся у `Tabs.List` (токены размера стекают только на вкладки, содержимое панелей наследует размер контейнера страницы). `Tabs.Root` корнем контрола не является (`data-s-kit` нет); корень контрола в ряду это `Tabs.List`.
- **Компонентные токены:** `--s-kit-tabs-gap` (0), `--s-kit-tabs-indicator-width` (2px), `--s-kit-tabs-radius` (фолбэк `--s-kit-radius`).
- **Тесты:** чистые функции `tabs-ids.ts`, `tabs-navigation.ts`, `reveal-in-scroller.ts` отдельными файлами тестов; компонент: роли и имена, выбранная панель и скрытые, связи `id`/`aria-controls`/`aria-labelledby` (в том числе для значения с пробелом), щелчок и однократность `onValueChange`, недоступная вкладка, roving `tabindex` (включая первую доступную без выбора и `value={null}`), стрелки по кругу с пропуском недоступных, Home/End, игнор лишних и модифицированных клавиш, контролируемый режим (следование, отказ, `null`), `keepMounted`, пользовательские `onClick` и `onKeyDown`, атрибуты полосы (`data-s-kit`, `data-s-kit-focus-inset`, `size`, `class`, `style`), `tabindex` панели, ошибка вне `Tabs.Root`, перестройка порядка Tab при удалении выбранной вкладки, прокрутка вкладки в видимую область при фокусе.
- **Вне объёма:** вертикальная ориентация, `activationMode="manual"`, RTL, стрелки прокрутки и затухание краёв, закрываемые и перетаскиваемые вкладки, вкладки-ссылки, индикатор с анимацией перемещения.

## 4. Страница «Контролы в ряд» и проверка высот

Страница `controls-row-page.tsx` в playground, наращивается с каждым компонентом (раздел 5 зонтичного). Пять рядов: (1) без `size` и без обёртки, (2) обёртка `sm`, (3) обёртка `lg`, (4) обёртка `sm` и часть контролов с локальным `size="lg"`, (5) явный `size` у каждого. В каждом ряду контролы стоят на одной линии. Встроенная проверка сравнивает `getBoundingClientRect()` верха и низа каждого контрола с эталоном ряда и выводит отклонения как OK/FAIL (по образцу `theme-checks.ts`); допуск 0 px (контролы одного размера совпадают пиксель в пиксель), для рядов 4 и 5 эталон считается по размеру каждого контрола. Для групп (ButtonGroup, ToggleGroup) эталоном служит оболочка группы.

Переключение страниц в playground: хэш-маршрутизация `#themes`, `#controls-row` (без роутера; один компонент `app.tsx` выбирает страницу по `location.hash`).

Для Button на странице: все четыре варианта в каждом ряду и в обеих темах, состояния hover/active/disabled закреплены классами-стендами только в playground (их нельзя вызвать в CSS без интерактивности), фокус проверяется клавиатурой вручную и встроенной проверкой кольца: у внешнего кольца `outline-offset` равен `--s-kit-focus-offset`, у внутреннего отрицательный.

## 5. Критерии готовности этапа

Из дорожной карты: страница «Контролы в ряд» проходит проверку высот во всех пяти рядах в обеих темах для всех контролов этапа; критерий 7 раздела 12 пройден для контролов этапа (включая сегменты ToggleGroup и ButtonGroup и вкладки Tabs в прокручиваемом списке); controlled/uncontrolled покрыты тестами. Дополнительно, из ревью Astra: контраст текста всех вариантов Button в покое, hover и active не ниже 4,5:1 (проверка на странице), кольцо фокуса на заливке видно (3:1 к заливке). Проверка идёт в Chrome; Firefox 125 и Safari 17.5 по-прежнему не проверяются (список непроверенного в зонтичном спеке остаётся в силе).

## 6. Применённые паттерны и границы абстракций (требование раздела 11)

- Плоские компоненты, без внутренних контекстов. Зависимости только вниз: компонент → `utils/` (хелперы этапа 0) и `styles/`; компоненты друг от друга зависят по таблице порядка (ButtonGroup → Button, ToggleGroup → ButtonGroup, Field не зависит от Input).
- LSP: контролы значений (Input, NumericInput, Checkbox, Radio, Switch, ToggleGroup) соблюдают единый контракт `value`/`defaultValue`/`onValueChange` (для флагов `checked`/…), `disabled`, `size`, `class`, `style`; Field работает с любым из них через общие атрибуты `id`, `aria-describedby`, `aria-invalid`.
- Controlled/uncontrolled только через `createControllableSignal`.

## 7. Вопросы этапа

1. **`composes` общей CSS-основы (закрыт 2026-10-29).** Работает в сборке Vite 8: правило `_control_` стоит в итоговом CSS раньше правил Button, у Button в бандле два имени класса. Проверяет матрица формы пакета (скрипт ищет позицию правила основы и правил Button). Запасной вариант не нужен. Побочное требование: в конфиге stylelint `composes` внесён в `property-no-unknown` как исключение. Уточнение 2026-10-29 (Tabs): порядок правил в бандле оказался нестабильным (см. раздел 18), поэтому основа сделана нулевой специфичности через `:where()`, а пункты матрицы про «основа раньше Button и Input» заменены проверкой самого `:where()`.
2. **Правило stylelint про `var(--s-kit-control-height)` без фолбэка (закрыт 2026-10-29).** Принято: `declaration-property-value-disallowed-list` с регулярным ключом, действует в `src/components/**/*.css` и `src/styles/**/*.module.css`, покрыто тестами.
3. **Прокрутка вкладок Tabs (закрыт 2026-10-29).** Принято: нативная прокрутка скрытой полосой без стрелок и без затухания у краёв, вкладка прокручивается в видимую область при фокусе, смене выбора и первом показе (раздел 3.10).
4. **Вид выбранного сегмента ToggleGroup (открыт, 2026-10-29; обновлено после просмотра).** Первая версия (ниже) была отвергнута владельцем; по его решению выбран вариант «подложка с тенью» (раздел 3.5): заливка к оболочке 1,17:1 в светлой и 1,28:1 в тёмной теме, различие держат тень и цвет текста, порог 3:1 для заливки не достигается (текст выбранного сегмента по-прежнему не ниже 4,5:1). Остаётся открытым до просмотра владельцем новой версии. Первая версия:  заливка `primary-subtle` и текст цвета primary. Измерено на странице: заливка выбранного сегмента к оболочке 1,02:1 в светлой и 1,00:1 в тёмной теме, то есть сегмент отличает почти только цвет текста (6,93:1 к заливке в тёмной, 4,72:1 в светлой). Закрывается после просмотра владельцем страницы «Контролы в ряд»: если выбранный сегмент не читается на оболочке, меняется заливка (например, белая «подложка» `surface` с тенью, как у сегментированного контрола Apple) или добавляется второй признак; на API это не влияет.

## 8. Итоги Button (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 64 проверки OK в светлой и тёмной теме (высоты в пяти рядах, контраст текста всех вариантов в покое, hover и active, внешнее и внутреннее кольцо фокуса в светлой теме на всех вариантах).
- Внутреннее кольцо на заливке primary и danger контрастно (`--s-kit-focus-ring-on-fill`), у tinted и plain кольцо цвета `focus-ring` по серой заливке тоже проходит 3:1.
- Проверка «кольцо» использует `focus({ focusVisible: true })`; реальным Tab кольцо проверено глазами (внешнее и внутреннее на primary). Окно браузера без фокуса кольцо не рисует.
- Проверки контраста запускаются после окончания переходов цвета (250 мс): сразу после смены темы они читают промежуточные цвета и дают ложные FAIL.
- Не проверено: Firefox 125, Safari 17.5, hover и active мышью (проверены по значениям токенов), `forced-colors`.

## 9. Итоги IconButton (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 128 проверок OK в темах system, light и dark (было 64: добавилось 20 высот, 20 проверок «ширина равна высоте» и 24 проверки кольца фокуса у восьми IconButton в двух блоках). Все четыре IconButton стоят на одной линии с кнопками во всех пяти рядах, квадрат 32, 28 и 40 px по размерам.
- Иконка `svg` без атрибутов размера получает `1.25em` (17,5 px при 14 px шрифта md); внешнее кольцо видно с зазором, внутреннее белое на primary, `outline-offset` равен -2 px (проверено реальным Tab и `focus({ focusVisible: true })`).
- Порядок CSS при двухуровневом `composes` подтверждён матрицей: основа (5011), Button (5925), IconButton (7984); два новых пункта скрипта проверяют стили IconButton и порядок. `tsc` потребителя проходит на TypeScript 5.9.3 и 7.0.2.
- Автозапуск проверок сразу после первой загрузки в окне без фокуса даёт ложные FAIL у колец (окно без фокуса не рисует кольцо); с фокусом на странице и по кнопке «Запустить проверки» всё OK. Это то же ограничение, что у Button.
- Решения раздела 3.1 не менялись по ходу плана.
- Не проверено: Firefox 125, Safari 17.5, hover и active мышью (по значениям токенов), `forced-colors`.

## 10. Итоги Input (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 154 проверки OK в темах system, light и dark (было 128: добавилось 10 высот, 12 проверок кольца у двух полей в двух блоках фокуса и 4 проверки Input). Поля стоят на одной линии с кнопками во всех пяти рядах (высоты 28, 32 и 40 px), сдвига базовой линии из-за `inline-flex` основы не было, `inline-block` не понадобился.
- Измеренные контрасты (тёмная тема): граница поля 4,88:1, граница поля с ошибкой 6,03:1, текст 15,63:1, плейсхолдер 6,08:1; пороги 3:1, 3:1, 4,5:1 и 4,5:1. Вопрос 8 закрыт вариантом (б) (граница `control-edge`).
- Кольцо фокуса: у поля с ошибкой красное снаружи (проверено реальным Tab и вводом текста), у остальных цвета `focus-ring`; внутри контейнера `data-s-kit-focus-inset` отрицательный `outline-offset` (проверки колец OK).
- Порядок CSS подтверждён матрицей: основа (5011), Input (8389); `tsc` потребителя проходит на TypeScript 5.9.3 и 7.0.2.
- Автозапуск проверок в окне без фокуса даёт ложные FAIL у колец (то же ограничение, что у Button и IconButton); после смены темы или по кнопке при фокусе страницы всё OK.
- Не проверено: Firefox 125, Safari 17.5, hover мышью, `forced-colors`, возврат контролируемого значения в Firefox и Safari (проверено только в jsdom и Chrome).

## 11. Итоги Field (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 162 проверки OK в темах system, light и dark (было 154: добавилось 8 проверок двух Field). Подпись связана с полем (`label.control` равен `input`), `aria-describedby` указывает на непустой текст сообщения, контраст сообщения 5,45:1 (подсказка) и 5,38:1 (ошибка) в светлой теме при пороге 4,5:1, поле внутри Field с `size='sm'` имеет высоту 28 px, без размера 32 px.
- Клик по подписи реальной мышью переводит фокус в поле; консоль при загрузке чистая.
- Контракт `FieldControlProps` принимают и нативный `<input {...control} />` (тесты, матрица потребителя), и `<Input {...control} />` (`tsc` playground). Реактивность `{...control}` подтверждена тестом (ошибка появляется и пропадает без перерисовки контрола).
- «Пустые» значения ошибки (`undefined`, `null`, `false`, `''`) работают через `children()` и `isPresent` без правок плана; правило `solid/reactivity` к геттерам не придиралось.
- Решения раздела 3.3 не менялись по ходу плана.
- Не проверено: Firefox 125, Safari 17.5, `forced-colors`, чтение подсказки и ошибки экранным диктором (проверена только разметка и связи атрибутов).

## 12. Итоги ButtonGroup (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 184 проверки OK в темах system, light и dark (было 162: добавилось 5 высот оболочки, 5 проверок сегментов и 12 проверок кольца у двух кнопок группы в двух блоках фокуса). Оболочка совпадает по верху и низу с соседями во всех пяти рядах, сегменты на 4 px ниже оболочки и на 2 px от края (например, 28 из 32 px при md).
- Кольцо у сегментов внутреннее и в блоке без `data-s-kit-focus-inset` (оболочка сама ставит маркер): реальным Tab проверено, что `outline-offset` равен -2 px, кольцо видно внутри сегмента и не обрезано.
- Замена `underlying` в проверках колец (фон ищется вверх по предкам до непрозрачной заливки) и определение режима кольца по ближайшему `[data-s-kit-focus-inset]` не изменили результатов старых проверок: все прежние проверки остались OK.
- Порядок CSS Button и ButtonGroup не проверяется матрицей: правила группы написаны с повышенной специфичностью; матрица проверяет только наличие стилей ButtonGroup в сборке. `tsc` потребителя проходит на TypeScript 5.9.3 и 7.0.2.
- Решения раздела 3.4 не менялись по ходу плана; ButtonGroup перенесён из compound в плоские компоненты (здесь и в разделе 11.1 зонтичного спека).
- Не проверено: Firefox 125, Safari 17.5, hover и active мышью (проверено по значениям токенов и глазами в статике), `forced-colors`, группа из пяти кнопок и поведение при нехватке ширины (ширина группы не ограничивается).

## 13. Итоги ToggleGroup (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 214 проверок OK в темах system, light и dark (было 184: +5 высот оболочки, +5 проверок сегментов, +12 колец у двух сегментов группы в двух блоках фокуса, +8 проверок двух живых примеров). Оболочка совпадает по верху и низу с соседями во всех пяти рядах, сегменты 28 из 32 px при `md` и одинаковой высоты у выбранного и невыбранного. Ряды помещаются на страницу (`scrollWidth` 1779 при ширине окна 1794), правка `max-inline-size` не понадобилась.
- Контраст текста выбранного сегмента: 4,72:1 в светлой и 6,93:1 в тёмной теме (порог 4,5:1). Заливка выбранного сегмента к оболочке почти не отличается (1,02:1 светлая, 1,00:1 тёмная): сегмент заметен цветом текста, а не заливкой. Вопрос 4 раздела 7 остаётся открытым до просмотра владельцем. Обновление 2026-10-29: заливка заменена на «приподнятую» подложку с тенью (раздел 3.5), заливка к оболочке теперь 1,17:1 и 1,28:1, страница 367 проверок OK; числа выше относятся к первой версии.
- Кольцо фокуса на выбранном сегменте внутри (`outline-offset` −2 px, `:focus-visible`), контрастно к его заливке (проверки блоков фокуса в обоих режимах, все OK).
- Реальными щелчками мыши: в single щелчок по «Месяц» переносит выбор (`single: month`), повторный щелчок ничего не меняет; в multi «Неделя» добавляется в порядке включения (`multi: day, month, week`), «День» снимается. Реальным Tab и клавишами: фокус приходит на следующий сегмент, Space снимает выбор, Enter возвращает.
- Матрица формы пакета зелёная: стили ToggleGroup в сборке, `tsc` потребителя (оба примера, в том числе `mode='multi'` с массивом) проходит на TypeScript 5.9.3 и 7.0.2. Порядок CSS не проверяется: правила выбранного сегмента написаны с повышенной специфичностью. `pnpm check`: 196 тестов (+25).
- Решения раздела 3.5 не менялись по ходу плана. Сужение объединения `ToggleGroupRootProps` по `props.mode` прошло `tsc` без обходов.
- Ограничения и непроверенное: стрелки и roving tabindex не реализованы (только Tab, Space, Enter); Firefox 125, Safari 17.5, hover и active мышью на выбранном сегменте (отсутствие смены заливки проверено только по CSS), `forced-colors`, экранный диктор (`aria-pressed` проверен только разметкой), группа из пяти сегментов и нехватка ширины. Консоль проверена только после первого обращения к ней (щелчки и клавиши), загрузка страницы в этот период не попала.

## 14. Итоги Checkbox (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 246 проверок OK в темах system, light и dark (было 214: +10 высот двух флажков в пяти рядах, +12 колец у двух флажков в двух блоках фокуса, +10 проверок четырёх демо-флажков). Корень флажка (`label`) совпадает по верху и низу с соседями во всех пяти рядах, с подписью и без; `row-checks.ts` теперь измеряет корень контрола как ближайший `[data-s-kit]` (для остальных контролов это он сам, результаты прежних проверок не изменились).
- Контраст (светлая / тёмная): граница не выбранного флажка к поверхности 3,26:1 / 4,88:1, граница флажка с ошибкой 5,38:1 / 6,03:1, заливка выбранного и частично выбранного 5,43:1 / 8,09:1, галочка и тире к заливке 5,43:1 / 8,61:1 (порог 3:1).
- Реальными действиями: щелчок по подписи ставит флажок, Tab даёт кольцо снаружи (`outline-offset` 2 px) в обычном блоке и внутри (−2 px) в блоке с `data-s-kit-focus-inset` (проверки блоков фокуса OK), Space снимает выбор, недоступный флажок на щелчок не реагирует. Консоль при загрузке чистая (только сообщения Vite).
- `pnpm check`: 209 тестов (+13). Матрица формы пакета зелёная на TypeScript 5.9.3 и 7.0.2, стили Checkbox в сборке; порядок CSS не проверяется, `composes` компонент не использует.
- Отличия от плана по ходу работы (раздел 3.6 не менялся): `indeterminate` выставляется через `ref` и эффект, а не через `prop:indeterminate` (типы Solid JSX не принимают его при спреде атрибутов); атрибут `focusable` у SVG убран (нет в типах, нужен только старому IE); тест `disabled` использует `input.click()`, потому что `fireEvent.click` в jsdom обходит `disabled`.
- Не проверено: Firefox 125 и Safari 17.5 (`appearance: none`, `:indeterminate`), hover и active мышью, `forced-colors` (отметка рисуется заливкой и SVG, при принудительных цветах может пропасть), экранный диктор (проверена только разметка: нативный `input`, `mixed` по `indeterminate`), группа флажков, узкое окно (страница с рядами и так шире окна, горизонтальная прокрутка).

## 15. Итоги RadioGroup (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 277 проверок OK в темах system, light и dark (было 246: +10 высот двух радио в пяти рядах, +12 колец у двух радио в двух блоках фокуса, +9 проверок раздела: общий `name` у двух групп, подпись связана с радио у трёх демо-радио, граница не выбранного и с ошибкой, заливка и точка выбранного). Корни Item совпадают по верху и низу с соседями во всех пяти рядах; `row-checks.ts` менять не пришлось (корень контрола находится как ближайший `[data-s-kit]`, это `label` Item).
- Контраст (светлая / тёмная): граница не выбранного радио 3,26:1 / 4,88:1, граница радио в группе с ошибкой 5,38:1 / 6,03:1, заливка выбранного 5,43:1 / 8,09:1, точка к заливке 5,43:1 / 8,61:1 (порог 3:1).
- Реальными действиями в Chrome: щелчок по подписи «Базовый» переносит выбор; стрелка вниз сдвигает фокус и выбор на «Расширенный» (кольцо видно, `:focus-visible`), вниз и вверх возвращает на него же; Tab выходит из группы сразу в следующую (на «Да»), то есть один Tab-стоп на группу даёт браузер, собственной клавиатурной логики в компоненте нет; щелчок по недоступной группе выбор не меняет (координаты щелчка наводились по скриншоту, попадание именно в подпись второго недоступного радио не подтверждено отдельно). Консоль при загрузке чистая (только сообщения Vite).
- `pnpm check`: 223 теста (+14). Матрица формы пакета зелёная на TypeScript 5.9.3 и 7.0.2, стили RadioGroup в сборке; порядок CSS не проверяется, `composes` не используется.
- Отличия от плана по ходу работы (раздел 3.7 не менялся): число тестов 14, а не 15 (оценка плана была на единицу выше); файлы Task 1 и playground создавались из блоков плана скриптом, поэтому код совпадает с планом, кроме разбиения двух длинных строк под max-len.
- Отступление от раздела 2, зафиксированное в 3.7: Radio существует только как `RadioGroup.Item`, отдельного пути `@stark/solid-kit/radio` нет.
- Не проверено: Firefox 125 и Safari 17.5 (`appearance: none` на радио, порядок стрелок с отключённым элементом внутри группы), hover и active мышью, `forced-colors` (точка рисуется SVG и заливкой), экранный диктор (проверена только разметка: `radiogroup` и нативные радио), атрибуты Field на корне группы (тестами подтверждён только проброс `aria-invalid`), карточки-радио.

## 16. Итоги Switch (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 307 проверок OK в темах system, light и dark (было 277: +10 высот двух переключателей в пяти рядах, +12 колец у двух переключателей в двух блоках фокуса, +8 проверок четырёх демо: роль `switch`, `label.control === input`, контраст дорожки к поверхности и ползунка к дорожке). Корень (`label`) совпадает по верху и низу с соседями во всех пяти рядах, с подписью и без.
- Контраст (светлая / тёмная): дорожка выключенного к поверхности 3,26:1 / 4,88:1, ползунок выключенного к дорожке 3,26:1 / 4,88:1, дорожка включённого 5,43:1 / 8,09:1, ползунок включённого 5,43:1 / 8,61:1 (порог 3:1). Кольцо фокуса: внутреннее на выключенном 3,26:1 / 5,19:1, на включённом 5,43:1 / 8,61:1, внешнее 3,34:1 / 5,09:1.
- Реальными действиями в Chrome: щелчок по подписи включает переключатель, ползунок отступает 16 px слева и 2 px справа, 2 px сверху и снизу, дорожка 32×18; Tab даёт кольцо снаружи (`outline-offset` 2 px, `:focus-visible`), Space выключает; недоступные переключатели не меняются. Консоль при загрузке чистая (только сообщения Vite).
- `pnpm check`: 234 теста (+11). Матрица формы пакета зелёная на TypeScript 5.9.3 и 7.0.2, стили Switch в сборке; порядок CSS не проверяется, `composes` не используется.
- **Находка в ходе работы.** Первый прогон страницы дал 307 проверок и один FAIL: внутреннее кольцо на выключенной серой дорожке имело контраст 1,65:1. Исправление: кольцо внутри всегда цвета `--s-kit-focus-ring-on-fill` (одно правило `:focus-visible` вместо двух). Заодно `underlying()` в `button-checks.ts` научили смешивать полупрозрачную заливку с фоном под ней (рекурсивно, `Element | null`); результаты прежних проверок не изменились. Раздел 3.8 и раздел 2 (анимации) уточнены по итогам.
- Не проверено: Firefox 125 и Safari 17.5 (`appearance: none` на `checkbox`, роль `switch`), hover и active мышью, `forced-colors` (ползунок и дорожка рисуются заливкой), экранный диктор (проверена только разметка: `role=switch` на нативном `input`), RTL (не поддерживается), Switch внутри Field.

## 17. Итоги NumericInput (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 330 проверок OK в темах system, light и dark (было 307: +5 высот поля в пяти рядах, +6 колец фокуса в двух блоках, +12 проверок четырёх демо: роль `spinbutton`, `aria-valuenow` по тексту, границы диапазона в ARIA). Оценка плана (324) была арифметической ошибкой: 5 + 6 + 12 = 23. Поле стоит по верху и низу с соседями во всех пяти рядах (корень измеряется как ближайший `[data-s-kit]`, это сам `input`; `row-checks.ts` менять не пришлось).
- Реальными действиями в Chrome: ввод `abc12` даёт `12`; ArrowUp даёт `13`, Shift+ArrowDown даёт `3`; в поле 0–10 ввод `50` до потери фокуса остаётся `50` (`aria-valuenow` 50), после Tab становится `10`; ввод `-5` даёт `5` (минус отброшен при `min` 0); одиннадцать нажатий ArrowDown останавливаются на `0`; в поле «Цена» (шаг 0.5, значение родителя) ArrowUp даёт `13` и живое значение рядом `Цена: 13`, ввод `1,25` даёт `1.2`, очистка даёт «пусто»; Tab даёт кольцо снаружи (`outline-offset` 2 px, `:focus-visible`), в блоке с `data-s-kit-focus-inset` внутри (проверки блоков фокуса OK); недоступное поле фокус не получает. Консоль при загрузке чистая (только сообщения Vite).
- `pnpm check`: 266 тестов (+32: 9 на чистые функции `numeric-math.ts`, 23 на компонент; оценка плана была 31). Матрица формы пакета зелёная на TypeScript 5.9.3 и 7.0.2; отдельного CSS-маркера нет (стили Input проверяет прежний маркер, у NumericInput своего CSS нет), типы потребителя проходят.
- Отличия от плана по ходу работы (раздел 3.9 не менялся): единственное исправление при выполнении, строка проверки в `numeric-input-checks.ts` длиннее 140 символов (предсказано в плане) разбита на несколько строк; атрибут `inputmode` типы Solid JSX приняли как есть. Файлы Task 1 и playground создавались из блоков плана скриптом.
- Не проверено: Firefox 125 и Safari 17.5, экранный диктор (проверена только разметка: `spinbutton`, `aria-value*`; объявление изменения значения не проверялось), мобильные клавиатуры (`inputmode`), вставка из буфера и IME-ввод (проверялось только событием `input`), NumericInput внутри Field (тестами не покрыт), округление больших и экспоненциальных чисел, hover и active мышью, `forced-colors`.

## 18. Итоги Tabs (2026-10-29)

- Страница «Контролы в ряд» в Chrome: 367 проверок OK в темах system, light и dark (было 330: +5 высот полосы в пяти рядах, +12 проверок колец у двух вкладок в двух блоках фокуса, +19 проверок двух демо: роль, одна выбранная вкладка, одна видимая панель, связи по id, контраст двух текстов и индикатора, у полосы `scroll` ещё ширина содержимого, прокрутка и высота вкладок; +1 проверка ширины границы Input, см. находку ниже). Полоса стоит по верху и низу с соседями во всех пяти рядах, высота равна токену размера.
- Контраст (светлая / тёмная): текст выбранной вкладки 16,83:1 / 15,63:1, невыбранной 5,45:1 / 6,08:1, индикатор к поверхности 5,43:1 / 8,09:1 (пороги 4,5:1, 4,5:1 и 3:1).
- Реальными действиями в Chrome: Tab из соседнего поля попадает на выбранную вкладку, кольцо внутри (`outline-offset` −2 px, `:focus-visible`); ArrowRight переводит фокус и выбор («Обзор» → «Детали» → «Журнал»), панель меняется; следующий ArrowRight пропускает недоступный «Архив» и возвращается на «Обзор»; End даёт «Журнал», Home «Обзор»; Tab из полосы уходит на панель (кольцо снаружи, `aria-labelledby` ведёт на вкладку); щелчок по «Журнал» выбирает её, щелчок по недоступному «Архив» ничего не меняет. Узкая полоса с восемью вкладками: `scrollWidth` 733 при `clientWidth` 224; End выбирает «Вкладку 8» и прокручивает полосу ровно до края (`scrollLeft` 509 из 509, вкладка целиком внутри полосы), Home возвращает `scrollLeft` в 0, страница по вертикали не двигается, высота вкладок 31 px при 31 px полосы (полоса прокрутки не занимает место). Консоль при загрузке чистая (только сообщения Vite).
- `pnpm check`: 295 тестов (+29: 8 на чистые функции и 21 на компонент, как в плане). Матрица формы пакета зелёная на TypeScript 5.9.3 и 7.0.2, стили Tabs в сборке. Собранный потребитель (`vite preview`) открыт в Chrome: граница Input и NumericInput 1 px, курсор `text`, вкладка 31 px, полоса 32 px, у вкладки скруглены только верхние углы.
- **Находка по ходу работы (две правки основы и матрицы).** После добавления Tabs у Input пропала граница на странице (`border-width` 0 при цвете границы 3:1, поэтому проверки контраста этого не заметили). Причина: основа контролов подключается через `composes`, и Vite в dev-режиме кладёт копию основы в стиль каждого компонента, который её подключает; копия из позже загруженного Tabs (`border: 0`, `cursor: pointer`, `border-radius`) стояла после правил Input и перекрывала их при равной специфичности. Раньше этого не было лишь потому, что последним компонентом с `composes` был Input. В сборке картина та же по существу: одинаковые копии схлопываются в одну, и она оказалась после правил Button и Input (поэтому пункты матрицы «основа раньше Button» и «основа раньше Input» упали). Исправление: базовое правило основы обёрнуто в `:where(.control)` (специфичность 0), правила компонентов выигрывают при любом порядке; правила `:focus-visible` и `:disabled` основы остаются со своей специфичностью (им и надо перекрывать компонент). Пункты матрицы про порядок для Button, Input и Tabs заменены одной проверкой, что основа в собранном CSS обёрнута в `:where()` и без обёртки её нет; порядок Button перед IconButton (двухуровневый `composes`) проверяется как раньше. На странице добавлена проверка «Input: граница имеет ширину». Dev-сервер после правки основы пришлось перезапустить: Vite не пересобирает CSS уже загруженных модулей при изменении composes-файла.
- Отличия от плана по ходу работы (раздел 3.10 не менялся): четыре длинные строки (три в `tabs-checks.ts`, одна в тесте) разбиты под max-len (предсказано в плане); jsdom сохраняет `scrollLeft`, запасной приём не понадобился; stylelint принял `overflow: auto hidden` и `::-webkit-scrollbar`; вместо двух пунктов матрицы про порядок Tabs (план) сделан один пункт про `:where()` из-за находки выше. Файлы Task 1 и playground создавались из блоков плана скриптом.
- Не проверено: Firefox 125 и Safari 17.5 (скрытая полоса прокрутки: в Safari 17.5 работает только `::-webkit-scrollbar`, `scrollbar-width` не поддержан, `:where()` в обоих поддержан), экранный диктор (проверена только разметка: `tablist`, `tab`, `tabpanel`, `aria-selected`, связи по id), `forced-colors` (индикатор из `box-shadow` пропадает), RTL и вертикальная ориентация (не поддерживаются), реальный hover и active мышью (контраст текста при hover статически не проверяется), очень длинные подписи вкладок, Tabs внутри Dialog и грида (появятся позже), поведение с тачем и трекпадом (прокрутка пальцем).

## 19. Итоги этапа 1 (2026-10-29)

- Готовы все одиннадцать компонентов: Button, IconButton, Input, Field, ButtonGroup, ToggleGroup, Checkbox, RadioGroup, Switch, NumericInput, Tabs. Всё в локальных коммитах ветки `main`; push и тегов нет.
- Итого: 295 тестов (`pnpm check` зелёный: lint, typecheck основного пакета и playground, тесты). Страница «Контролы в ряд»: 367 проверок OK в темах system, light и dark. Матрица формы пакета зелёная на TypeScript 5.9.3 и 7.0.2.
- Критерии раздела 5 выполнены: высоты всех контролов этапа сходятся в пяти рядах в обеих темах (проверка страницы); критерий 7 раздела 12 для контролов этапа (кольцо фокуса внутри у сегментов ToggleGroup и ButtonGroup и вкладок Tabs в прокручиваемой полосе, снаружи у свободных контролов; проверки блоков фокуса); controlled/uncontrolled покрыты тестами у каждого контрола значений; контраст текста вариантов Button в покое, hover и active не ниже 4,5:1 и кольцо на заливке видно (проверки страницы, раздел 8).
- Находки этапа, сохранившиеся как правила: кольцо фокуса на выключенной дорожке Switch (раздел 16), основа контролов нулевой специфичности (раздел 18); обе найдены измерением в браузере, а не тестами.
- Не проверено по всему этапу: Firefox 125, Safari 17.5, экранный диктор, `forced-colors`, hover и active реальной мышью (кроме отмеченного в отдельных разделах); список в итогах каждого компонента.
- Открыто для владельца: вид выбранного сегмента ToggleGroup (раздел 7, вопрос 4: контраст заливки к оболочке 1,02:1 светлая и 1,00:1 тёмная, сегмент отличает почти только цвет текста); LICENSE; публикация репозитория и рабочая git-идентичность коммитов; вопросы 1–2 этапа 4b зонтичного спека.
- Публикация (2026-10-29): добавлены LICENSE (MIT, © 2026 Chevdar Sergei) и поля `license`, `repository` в `package.json`; история переписана на личную идентичность (основная личная почта автора), поэтому все хеши коммитов в этом документе обновлены по соответствию старых и новых; теги `v0.1.0` и `v0.2.0` пересозданы, `v0.2.0` стоит на последнем коммите (включает LICENSE и новый вид сегмента ToggleGroup). Репозиторий `StarkElessar/solid-kit` создан (публичный), push выполняется отдельным шагом.
- Тег `v0.2.0` в этом плане не ставится: по договорённости он ставится один раз локально в конце этапа 1 (без push) отдельным шагом после этого коммита.
