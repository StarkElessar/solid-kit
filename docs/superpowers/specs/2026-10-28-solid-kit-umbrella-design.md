# solid-kit: зонтичный дизайн-спек

- Дата: 2026-10-28
- Статус: утверждён владельцем на уровне архитектуры; каждый этап получает отдельный спек и план перед началом работ
- Объём документа: архитектура, распространение, токены, размеры, виртуализация, конвенции, инвентарь, дорожная карта. Подробные API компонентов сюда не входят.

## 1. Цель и не-цели

**Цель.** Личный UI-кит на Solid.js, который подключается в любой Solid-проект владельца одной строкой в `package.json` и попадает в бандл только теми компонентами, которые реально импортированы. Кит закрывает типовые задачи бэк-офисных интерфейсов: контролы форм, оверлеи, списки и, главное, универсальный грид с виртуализацией, группировкой и закреплёнными колонками.

**Не-цели первой итерации:**

- публикация в npm и любая сборка кита (`dist`, бандлинг, генерация `.d.ts`);
- поддержка Solid 2.0 (beta): целимся в `solid-js` 1.9;
- SSR и гидрация: кит рассчитан на клиентские SPA на Vite;
- headless-библиотеки (Kobalte, Ark UI и подобные) и `solid-floating-ui`: всё поведение пишется самостоятельно;
- углублённая доступность: полные ARIA-паттерны WAI-ARIA, roving tabindex, ловушки фокуса, тестирование скринридерами. Закладываются семантичный HTML и разумный минимум (раздел 11), но a11y не блокирует ни один этап;
- data-fetching внутри кита (TanStack Query и т. п.);
- горизонтальная виртуализация колонок грида, серверная группировка, экспорт;
- Storybook (может появиться позже поверх `playground/`, раздел 12).

## 2. Принятые решения

| Решение | Причина |
|---|---|
| Git-зависимость `github:StarkElessar/solid-kit#vX.Y.Z`, без npm | Так же распространяются конфиги владельца (`@stark/eslint-config`, `@stark/stylelint-config`); публикация не нужна |
| Исходники `.tsx/.ts/.css` без сборки кита | У потребителей есть Vite 8 и `vite-plugin-solid`, который трансформирует `.tsx` и из `node_modules` |
| Подпуть на компонент `@stark/solid-kit/<имя>` | Модульность и tree-shaking силами сборщика потребителя |
| Условие `"solid"` в `exports` | Без него `vite-plugin-solid` не исключит кит из `optimizeDeps` (раздел 3.3) |
| `solid-js` только в `peerDependencies` | Две копии `solid-js` ломают реактивность и контексты |
| CSS Modules на чистом CSS + CSS-переменные `--sk-*` | Потребителю не нужен `sass`; переменные и есть API кастомизации |
| `"sideEffects": ["**/*.css"]` | `false` целиком разрешает сборщику выбросить импорты CSS (раздел 3.4) |
| Явная высота контролов через `--sk-control-height` | Гарантированно одинаковая высота всех контролов (раздел 5) |
| Виртуализация всех списков по умолчанию, отключение только явным `virtualized={false}` | Списки и гриды владельца большие; производительность не должна зависеть от того, вспомнил ли автор страницы включить её (раздел 6) |
| `@floating-ui/dom` напрямую + собственный хук | Нужны только `computePosition` и middleware; поведение поповеров своё |
| `@tanstack/solid-virtual` | Проверенное ядро виртуализации, то же семейство, что `@tanstack/react-virtual` в референсе |
| Грид «глупый» и controlled, без data-fetching | Загрузка, кэш и пагинация остаются странице; кит не навязывает транспорт |
| Vitest + `@solidjs/testing-library`, `playground/` вместо Storybook | Минимум инфраструктуры на старте |

## 3. Распространение и форма пакета

### 3.1. Раскладка репозитория

```
solid-kit/
├─ package.json            # пакет в корне: pnpm add github:... ставит корень
├─ pnpm-workspace.yaml     # packages: [playground]; нужен только для локальной линковки кита в playground
├─ tsconfig.json           # строгий (раздел 3.6)
├─ src/
│  ├─ styles/tokens.css    # глобальные --sk-* переменные, атрибуты размера и темы
│  ├─ utils/               # createControllableSignal, позиционирование, слои, общие хелперы
│  └─ components/
│     ├─ button/           # index.ts, button.tsx, button.module.css
│     ├─ popover/          # index.ts, popover.tsx, popover.module.css
│     ├─ context-menu/  ├─ select/  ├─ grid/  ...
└─ playground/             # отдельное Vite-приложение, зависит от "@stark/solid-kit": "workspace:*"
```

`playground/` не входит в `exports` и в `files`, потребителю он недоступен. Внутренние примитивы (`ListBox`) лежат в `src/components/list-box/`, но в README публичными не объявляются: подпуть технически доступен через wildcard, стабильность его API не гарантируется.

### 3.2. `package.json`

```json
{
  "name": "@stark/solid-kit",
  "version": "0.1.0",
  "type": "module",
  "files": ["src"],
  "sideEffects": ["**/*.css"],
  "exports": {
    "./tokens.css": "./src/styles/tokens.css",
    "./package.json": "./package.json",
    "./*": {
      "solid": "./src/components/*/index.ts",
      "default": "./src/components/*/index.ts"
    }
  },
  "peerDependencies": { "solid-js": "^1.9.0" },
  "dependencies": {
    "@floating-ui/dom": "^1.8.0",
    "@tanstack/solid-virtual": "^3.13.50"
  }
}
```

В `devDependencies`: `solid-js@1.9.17`, `vite@8.3.5`, `vite-plugin-solid@2.11.14`, `typescript`, `vitest`, `@solidjs/testing-library`, `@stark/eslint-config` и `@stark/stylelint-config` (git-зависимости). Скриптов `prepare`/`postinstall` нет: установка из git ничего не собирает.

Подключение у потребителя:

```jsonc
// package.json потребителя
"dependencies": { "@stark/solid-kit": "github:StarkElessar/solid-kit#v0.3.0" }
```

```ts
// точка входа приложения, один раз
import '@stark/solid-kit/tokens.css';
// в любом модуле
import { Select } from '@stark/solid-kit/select';
```

### 3.3. `exports`, wildcard и условие `solid`

- `"./*"` подставляет совпавшую часть во все `*` справа: `@stark/solid-kit/select` → `./src/components/select/index.ts`. Точные ключи (`./tokens.css`, `./package.json`) имеют приоритет над шаблоном, поэтому `tokens.css` не уходит в `src/components/tokens.css/index.ts`. Корневой импорт `@stark/solid-kit` намеренно не экспортируется (ошибка `ERR_PACKAGE_PATH_NOT_EXPORTED`): так нельзя случайно затянуть весь кит одним импортом.
- Условие `"solid"` нужно не для резолва, а как маркер: `vite-plugin-solid` через `vitefu.crawlFrameworkPkgs` ищет ключ `solid` рекурсивно **только в поле `exports`** (`containsSolidField(pkgJson.exports)`), и найденный пакет исключается из `optimizeDeps` и добавляется в SSR `noExternal`. Плагин также добавляет `solid` в начало `resolve.conditions`.
- `"default"` указывает на те же исходники, чтобы `tsc` потребителя (`moduleResolution: "bundler"`, без `customConditions`) находил типы прямо в `.ts`/`.tsx`; отдельного `"types"` не нужно.
- Зависимости кита (`@floating-ui/dom`, `@tanstack/solid-virtual`) vitefu обходит как зависимости framework-пакета; в глубокий `optimizeDeps.include` он добавляет только пакеты без `module`/`exports` (эвристика CJS), а у обеих зависимостей есть `exports`. Что `solid-js` при этом остаётся в одной копии и в dev, и в build, не проверено чтением исходников и подтверждается критерием приёмки 1 (раздел 12).

### 3.4. `sideEffects`

Каждый компонент импортирует свой `.module.css`, а точка входа потребителя импортирует `tokens.css` только ради побочного эффекта. Если объявить `"sideEffects": false` целиком, сборщик вправе считать любой модуль пакета чистым и выбросить импорт, чей результат не используется: первым пострадает `import '@stark/solid-kit/tokens.css'`, а у сборщиков, которые не размечают CSS сами, и стили компонентов. Поэтому JS/TS объявляется чистым (tree-shaking неиспользуемых экспортов работает), а CSS явно помечается как имеющий побочные эффекты: `"sideEffects": ["**/*.css"]`.

Уточнение по Vite 8.3.5 (прочитано в исходнике): плагин `vite:css-post` сам возвращает `moduleSideEffects: "no-treeshake"` для обычного CSS и `false` для CSS Modules (их стили остаются, пока используется объект классов). То есть в Vite риск ниже, но правило обязательно: оно корректно для любого сборщика и не зависит от внутренностей конкретной версии Vite.

### 3.5. Что требуется от проекта-потребителя

- Vite 8 и `vite-plugin-solid` 2.11+ (для Vite 8 плагин сам задаёт `rolldownOptions.transform.jsx: 'preserve'`);
- `solid-js` ^1.9 в собственных зависимостях;
- типы `vite/client` в tsconfig (в них объявлены `*.module.css` и `*.css`), `jsx: "preserve"`, `jsxImportSource: "solid-js"`, `moduleResolution: "bundler"`;
- однократный импорт `@stark/solid-kit/tokens.css`.

### 3.6. Типы и строгость

`tsc` потребителя проверяет исходники кита как обычный код (`skipLibCheck` пропускает только `.d.ts`). Проверено на `typescript` 5.9.3 и 7.0.2: ошибка внутри `node_modules/@stark/solid-kit/src/...` при `skipLibCheck: true` выводится. Поэтому кит держится под самым строгим набором, чтобы компилироваться при любых настройках потребителя: `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly` (никаких `enum` и `namespace`).

### 3.7. Версии и теги

- Версия в `package.json` и аннотированный git-тег `vX.Y.Z` меняются одним коммитом; описание изменений пишется в сообщении тега.
- До завершения этапа 4б (тег `v1.0.0`) действует `0.x`: несовместимое изменение поднимает minor, остальное поднимает patch.
- Потребитель указывает тег; lockfile pnpm фиксирует конкретный коммит, поэтому сборки воспроизводимы, а обновление делается сменой тега.

## 4. Система стилей и токенов

- Стили только на чистом CSS: `*.module.css` на компонент плюс глобальный `tokens.css`. Нативный nesting допустим. SCSS, PostCSS-плагины и CSS-in-JS не используются.
- Хэшированные классы CSS Modules снаружи не перебить, поэтому **публичный API кастомизации это CSS-переменные**. Дополнительно каждый компонент принимает `class` и `style` и навешивает их на корневой элемент.
- Префикс `--sk-`. Два слоя:
  - **общие токены** объявлены в `tokens.css` на `:root`: цвета, радиусы, шрифты, тени, высоты контролов, z-index слоёв;
  - **компонентные токены** (`--sk-select-bg`, `--sk-grid-row-hover-bg`, ...) **нигде не объявляются по умолчанию**, а читаются с фолбэком на общий токен.

Почему фолбэк, а не объявление: значение кастомного свойства с `var()` вычисляется там, где оно объявлено, и наследуется уже готовым. Объявленный на `:root` `--sk-select-bg: var(--sk-color-surface)` перестал бы реагировать на тему, переключённую на обёртке, а объявленный на самом элементе не дал бы переопределить его с предка. Фолбэк решает обе задачи:

```css
/* tokens.css (фрагмент) */
:root {
  --sk-color-surface: #fff;
  --sk-color-text: #1f2328;
  --sk-color-border: #d0d7de;
  --sk-color-accent: #2563eb;
  --sk-radius: 6px;
  --sk-font-size-md: 14px;
  --sk-control-height-sm: 28px;
  --sk-control-height-md: 32px;
  --sk-control-height-lg: 40px;
  --sk-z-popover: 1000;
}

[data-sk-theme='dark'] {
  --sk-color-surface: #1e1f22;
  --sk-color-text: #e6e6e6;
  --sk-color-border: #3a3d42;
}

/* select.module.css (фрагмент) */
.control {
  background: var(--sk-select-bg, var(--sk-color-surface));
  border-radius: var(--sk-select-radius, var(--sk-radius));
}
```

- Тёмная тема: атрибут `data-sk-theme="dark"` на `<html>` или любой обёртке переопределяет общие токены. Следование системной теме кит не навязывает: потребитель ставит атрибут сам.
- Каждый `.module.css` начинается с комментария со списком своих компонентных токенов; страница компонента в playground показывает пример их переопределения.
- В стилях компонентов нет хардкода цветов, радиусов и размеров шрифта: только токены.

## 5. Единая высота контролов

Требование: все кнопки, инпуты, селекты и прочие контролы строго одной высоты в пределах размера. Высота задаётся **явно**, а не выводится из `padding + line-height + border`.

- Токены `--sk-control-height-sm / -md / -lg`, по умолчанию 28 / 32 / 40 px, правятся в одном месте (`tokens.css`).
- Каждый контрол: `box-sizing: border-box; height: var(--sk-control-height, var(--sk-control-height-md));` рамка входит в высоту; содержимое выравнивается через `display: inline-flex; align-items: center`, так что `line-height` и шрифт на высоту не влияют.
- Вместе с высотой масштабируются `--sk-control-padding-x` и `--sk-control-font-size` (тот же механизм).
- Размер выбирается пропом `size="sm" | "md" | "lg"`. Компонент рендерит его как атрибут `data-sk-size` на корневом элементе, а `tokens.css` содержит глобальные правила:

```css
[data-sk-size='sm'] { --sk-control-height: var(--sk-control-height-sm); /* + padding, font-size */ }
[data-sk-size='md'] { --sk-control-height: var(--sk-control-height-md); }
[data-sk-size='lg'] { --sk-control-height: var(--sk-control-height-lg); }
```

- Тот же атрибут ставится на обёртку (форма, тулбар, грид), когда нужно «весь блок в sm»: потомки без пропа `size` наследуют переменную. Контрол без пропа `size` переменную не объявляет, иначе он перекрыл бы значение обёртки; поэтому по умолчанию работает фолбэк на `md`.
- IconButton квадратная: `width = height = var(--sk-control-height)`.
- ButtonGroup и ToggleGroup: рамки соседних кнопок склеиваются (общая граница, скругление только у крайних), высота та же.
- Checkbox, Radio, Switch: сама отметка меньше, но строка «отметка + label» (и без label) имеет `height: var(--sk-control-height)`, поэтому стоит в одной линии с инпутами.
- MultiSelect тоже держит фиксированную высоту: выбранные значения показываются в одну строку, не поместившееся сворачивается в счётчик «+N»; рост контрола в высоту запрещён.
- Высота строки ListBox по умолчанию равна `--sk-control-height` текущего размера.

**Критерий приёмки:** страница playground «Контролы в ряд» показывает button, icon-button, input, numeric, select, combobox, datepicker, switch и checkbox на одной линии в трёх размерах (три ряда), в светлой и тёмной теме. Верх и низ всех контролов в ряду совпадают пиксель в пиксель (проверка глазами плюс встроенная в страницу проверка, которая сравнивает `getBoundingClientRect()` контролов ряда и выводит отклонения). Компоненты, которые ещё не реализованы, добавляются на страницу в своём этапе; datepicker появится на этапе 5.

## 6. Виртуализация списков по умолчанию (киллер-фича)

**Виртуализация включена по умолчанию во всех списках кита: Grid, Select, Combobox, MultiSelect и в общем внутреннем ListBox (а значит, и в ContextMenu и меню колонок грида, которые строятся на ListBox начиная с этапа 3).** Её можно только отключить явным пропом `virtualized={false}`; без этого пропа она работает всегда, при любом числе элементов.

- Движок: `@tanstack/solid-virtual` (`createVirtualizer`), одна обёртка в `src/utils/` используется и ListBox, и гридом.
- Высота элементов: оценка (`estimateSize`) берётся из текущего `--sk-control-height` (через `getComputedStyle`), реальная высота измеряется `measureElement`, поэтому строки грида с переносом текста поддерживаются, как в референсе.
- В гриде невидимые строки заменяются двумя spacer-строками внутри `<tbody>` (приём из референса): таблица сохраняет семантику `<table>`, `<colgroup>`, sticky-шапку и подвал.
- `overscan` настраивается пропом; значения по умолчанию из референса: 12 для грида, 6 для списков.
- Выбранный элемент при открытии списка прокручивается в видимую область через `scrollToIndex`.
- Состояние (выбор, подсветка) хранится по ключу элемента, а не в DOM: строка вне окна рендера остаётся выбранной (так сделано и в референсе).
- Компромисс, который принимается сознательно: поиск браузера (Ctrl+F) не находит строки вне окна рендера.

Нужно ли внутри ListBox пропускать оконный рендер на совсем маленьких списках, решает владелец: см. раздел 14, вопрос 2.

## 7. Принципы данных и API

- **Controlled/uncontrolled для всех контролов** через общий хелпер:

```ts
function createControllableSignal<T>(options: {
  value: () => T | undefined;      // контролируемое значение из пропсов
  defaultValue?: () => T;          // начальное значение для неконтролируемого режима
  onChange?: (next: T) => void;
}): [get: Accessor<T>, set: (next: T) => void];
```

Режим контролируемый, если `value()` не `undefined`. Отсутствие значения поэтому выражается `null` (например, ничего не выбрано в Select), а `undefined` всегда означает «не контролируется».

- **Именование пропсов:** тройка `foo` / `defaultFoo` / `onFooChange`: `value`, `defaultValue`, `onValueChange`; `checked`, `defaultChecked`, `onCheckedChange`; `open`, `defaultOpen`, `onOpenChange`. Имя `onChange` не используется, чтобы не путать с DOM-событием.
- **Общие пропсы контролов:** `size`, `disabled`, `class`, `style`. Все встроенные тексты («Загрузка…», «Нет элементов для отображения») передаются пропами с русскими значениями по умолчанию.
- **Пример формы публичных пропсов** (финализируется в спеке этапа 3):

```ts
interface SelectProps<T> {
  items: readonly T[];
  getKey: (item: T) => string | number;
  getLabel: (item: T) => string;
  renderItem?: (item: T) => JSX.Element;
  groupBy?: (item: T) => string;
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T | null) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  loading?: boolean;
  virtualized?: boolean;            // по умолчанию true
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  class?: string;
  style?: JSX.CSSProperties;
}
```

- **Грид «глупый»:** получает `rows`, `total`, `loading` и текущие `sort`/`page`, а загрузкой, пагинацией и сортировкой управляет страница через `onSortChange`, `onPageChange`, `onRefresh`. Внутреннее UI-состояние (ширины, видимость и закрепление колонок, группировка, свёрнутые группы, выбор строк) управляемо по той же схеме `foo` / `defaultFoo` / `onFooChange`, чтобы страница могла сохранять его.
- **TanStack Query и любой data-fetching остаются вне кита** (в референсе внутри грида `useQuery` нет). Ни один компонент не делает сетевых запросов. Асинхронные источники подключаются снаружи: страница передаёт `items` и `loading`, а Combobox и MultiSelect сообщают ей введённый текст через `onQueryChange`.

## 8. Позиционирование и оверлеи

- **Хук позиционирования** `createAnchoredPosition` в `src/utils/` поверх `@floating-ui/dom` 1.8.0 (`computePosition`, `autoUpdate`, `offset`, `flip`, `shift`, `size`). Параметры по умолчанию взяты из референса (`use-anchored-popover.ts`): `placement: 'bottom-start'`, `strategy: 'fixed'`, `offset(4)`, `flip({ padding: 8 })`, `shift({ padding: 8 })`, `size({ padding: 8 })` с ограничением `max-height` доступной высотой и опцией `matchReferenceWidth`. `autoUpdate` запускается только пока поповер открыт и снимается в `onCleanup`.
- Для ContextMenu якорем служит виртуальный элемент в точке клика (Floating UI принимает объект с `getBoundingClientRect`); ручное зажатие во вьюпорт из референса (`row-context-menu.tsx`, `column-menu.tsx`) заменяется теми же `flip`/`shift`.
- **Popover** (свой): открытие и закрытие (controllable `open`), портал, dismiss по клику снаружи (`pointerdown` вне якоря и панели) и по Esc.
- **Portal и стек слоёв:** модульный стек открытых слоёв. Esc и клик снаружи обрабатывает только верхний слой; вложенный поповер (Select внутри Dialog, подменю) не закрывает родителя. z-index задаётся токенами `--sk-z-popover`, `--sk-z-dialog`, `--sk-z-toast`.
- **Dialog** строится на нативном `<dialog>` и `showModal()`: модальность, затемнение (`::backdrop`) и Esc даёт браузер. Модальный `<dialog>` живёт в top layer, поэтому поповеры, открытые внутри него, порталятся не в `body`, а в элемент верхнего открытого диалога из стека слоёв; иначе они оказались бы под диалогом при любом z-index. Поэтому сам `<dialog>` не получает `transform`, `filter` и `contain`: они сделали бы его контейнером для `position: fixed` и сдвинули бы поповеры.
- Фокус: при открытии Dialog фокус ставится на первый фокусируемый элемент, при закрытии возвращается на элемент, открывший слой. Ловушка фокуса за пределами того, что даёт `<dialog>`, вне первой итерации.

## 9. Инвентарь по слоям

| Слой | Компоненты |
|---|---|
| L0 Фундамент | токены, система размеров, `createControllableSignal`, Portal + стек слоёв (z-index), позиционирование на Floating UI |
| L1 Простые контролы | Button, IconButton (квадратная), ButtonGroup (2–5 кнопок вместе), ToggleGroup (режим single/multi: включение/отключение), Switch, Checkbox (с label и без), Radio + RadioGroup (с label и без), Input, NumericInput, Field (label + ошибка + подсказка), Tabs |
| L2 Оверлеи | Popover, Dialog (модалка/попап), ContextMenu |
| L3 Списки | Select (это и есть dropdown; отдельного `Dropdown` и алиаса не будет), Combobox, MultiSelect; общий внутренний `ListBox` (подсветка, выбор, прокрутка, виртуализация по умолчанию), его же используют ContextMenu и меню колонок грида |
| L4 Грид | ядро (виртуализация по умолчанию, колонки, сортировка, ресайз колонок, закреплённые колонки, выбор строк и массовые операции, контекстное меню строки), затем надстройки (группировка drag-and-drop с групповыми заголовками и футерами, меню колонок, пейджер, автосуммы) |
| L5 Дата/время | Calendar, DatePicker, TimePicker, DateTimePicker |

Общие внутренние примитивы: `ListBox`, `Popover`, `Field`. Доменные куски референса (`employee-options`, `employees`, `columns.ts` с колонками задач, `format.ts`) в кит не входят.

## 10. Целевой API грида и перенос из референса

### 10.1. Целевая форма API (эскиз; подробности в спеке этапа 4)

```ts
type RowKey = string | number;

interface GridColumn<T> {
  id: string;                                // стабильный ключ колонки
  title: string;
  value: (row: T) => unknown;                // сортировка, группировка, суммы
  cell?: (row: T) => JSX.Element;            // рендер ячейки; по умолчанию String(value)
  width?: number;
  minWidth?: number;                         // по умолчанию 60, как в референсе
  locked?: boolean;
  hidden?: boolean;
  sortable?: boolean;
  groupable?: boolean;
  aggregate?: (rows: readonly T[]) => unknown; // футер группы и автосуммы
  footer?: (aggregate: unknown) => JSX.Element;
}

interface GridProps<T> {
  rows: readonly T[];
  getRowKey: (row: T) => RowKey;
  columns: readonly GridColumn<T>[];
  total?: number;
  loading?: boolean;
  emptyText?: string;
  sort?: { columnId: string; direction: 'asc' | 'desc' } | null;
  onSortChange?: (sort: GridProps<T>['sort']) => void;   // цикл asc → desc → null
  page?: number;
  pageSize?: number;
  pageSizes?: readonly number[];
  onPageChange?: (page: number, pageSize: number) => void;
  onRefresh?: () => void;
  selectable?: boolean;                                   // колонка чекбоксов массовых операций
  selection?: ReadonlySet<RowKey>;
  defaultSelection?: ReadonlySet<RowKey>;
  onSelectionChange?: (keys: ReadonlySet<RowKey>) => void;
  onRowDoubleClick?: (row: T) => void;
  rowContextMenu?: (row: T) => readonly MenuItem[];       // MenuItem: тип пункта ContextMenu (этап 2)
  totals?: Readonly<Record<string, unknown>>;             // глобальные автосуммы приходят снаружи
  virtualized?: boolean;                                  // по умолчанию true
  class?: string;
  style?: JSX.CSSProperties;
}
```

Состояние колонок (ширины, видимость, закрепление, порядок), группировка и свёрнутые группы управляются тройками `foo` / `defaultFoo` / `onFooChange`; их точные имена и форма фиксируются в спеке этапа 4. Тип строки `T` выводится из `rows`, `getRowKey` заменяет жёсткий `row.Id`, `columns` заменяет константу `COLUMNS`, `cell` заменяет `formatCell` и шаблоны метаданных.

### 10.2. Таблица переноса

Общие замечания React → Solid: компонент выполняется один раз, поэтому `memo`, `useCallback`, `useMemo` и приёмы вроде `lockedWidthsKey` (ключ, чтобы не перерисовывать memo-строки) не нужны: точечная реактивность обновляет только затронутые ячейки. `useRef` становится обычной переменной в замыкании, `useEffect` становится `createEffect`/`onCleanup`, `.map` с `key` становится `<For>`. Пропсы не деструктурируются (иначе теряется реактивность): `splitProps`/`mergeProps`.

| Фича референса (файл) | Этап | Заметка о переносе |
|---|---|---|
| Виртуализация строк, spacer-строки, `measureElement`, `overscan` 12, оценка 33px (`grid.tsx`) | 4, ядро | `createVirtualizer`; оценка берётся из токена; после ресайза колонки `virtualizer.measure()`, как в референсе |
| Ресайз колонок: `<colgroup>`, Pointer Events + `setPointerCapture`, минимум 60px, двойной клик сбрасывает, последняя колонка добирает ширину через `ResizeObserver` (`grid.tsx`) | 4, ядро | Логика ширин в чистых функциях с юнит-тестами; ширины в store; ResizeObserver в `onMount`/`onCleanup` |
| Закреплённые колонки: `position: sticky` + накопленный `inset-inline-start`, закреплённые идут первыми (`grid.tsx`, `grid.scss`) | 4, ядро | Смещения через `createMemo`; z-index слоёв ячеек токенами |
| Сортировка по клику: asc → desc → сброс, `aria-sort` (`grid.tsx`) | 4, ядро | Controlled через `sort`/`onSortChange`; поле заменяется `columnId` |
| Массовый выбор: `Set` ключей, главный чекбокс с `indeterminate`, клик по строке выбирает сразу, двойной клик откатывает выбор (`grid.tsx`) | 4, ядро | Ключ из `getRowKey`; выбор controllable; чекбоксы это Checkbox кита (этап 1) |
| Двойной клик по строке, оверлей загрузки, пустое состояние (`grid.tsx`) | 4, ядро | Без изменений по смыслу; тексты пропами |
| Контекстное меню строки: пресеты add/edit/delete + `items`, backdrop, зажим во вьюпорт (`row-context-menu.tsx`) | 4, ядро | Строится на ContextMenu (этап 2); пресеты add/edit/delete доменные и не переносятся: пункты задаёт `rowContextMenu(row)` |
| Группировка drag-and-drop: Pointer Events, порог 4px, призрак, якорь вставки, перестановка чипов (`use-grouping-drag.ts`, `grouping.ts`, `group-panel.tsx`) | 4, надстройки | `applyGroupDrop` переносится как чистая функция; хук становится `createGroupingDrag` на сигналах |
| Групповые заголовки и футеры: плоский список «заголовок → строки → футер», ключ группы как путь, свернуть/развернуть по уровню и все (`grouped-items.ts`, `grouped-rows.tsx`) | 4, надстройки | `buildGroupedItems<T>` generic через `column.value`; суммы через `column.aggregate` вместо `kind === 'duration'`; сравнение строк через `Intl.Collator` вместо жёсткого `'ru'` |
| Меню колонки: закрепить/открепить, список видимости, «Сгруппировать», `onColumnsChange` один раз при закрытии (`column-menu.tsx`) | 4, надстройки | Строится на Popover + ListBox; правило «одно событие при закрытии» сохраняется |
| Пейджер: номера с пропусками, размеры страниц, «Отображены записи … из …», обновление (`pager.tsx`) | 4, надстройки | `getPageItems` переносится чистой функцией с тестами; кнопки и выбор размера это Button и Select кита |
| Автосуммы в `tfoot`, ручной режим загрузки (`grid.tsx`, `pager.tsx`) | 4, надстройки | Значения приходят снаружи (`totals`); загрузка по кнопке остаётся заботой страницы |
| Метаданные колонок, шаблоны ссылок, HTML с санитизацией, цветные ячейки (`grid.tsx`, `columns.ts`, `format.ts`) | не переносится | Доменная часть; заменяется функцией `cell`. Санитизация HTML остаётся на стороне потребителя |
| Один Select с режимами combobox/dropdown/multiselect, `allKey`, режимы чипов (`controls/select.tsx`) | 3 | Делится на Select, Combobox, MultiSelect над общим ListBox; «Все» и чипы становятся опциями MultiSelect (детали в спеке этапа 3) |
| `SelectList`: виртуализация, `groupBy`, липкий заголовок группы, скелетон загрузки (`controls/select-list.tsx`) | 3 | Становится ListBox; фиксированные 29/30px заменяются высотой из токенов |
| `useAnchoredPopover` (`controls/use-anchored-popover.ts`) | 0 | Становится `createAnchoredPosition` на `@floating-ui/dom`; `useDismiss` заменяется собственным dismiss в Popover |

## 11. Конвенции кода

- **Один класс — один файл.** Два класса в одном файле недопустимы, включая вложенные DTO, схемы конфигов и классы ошибок: каждый в своём файле с именем по классу в kebab-case, связанные классы импортируют друг друга. В компонентном коде классов почти не будет, но правило действует и проверяется на ревью.
- Имена файлов и папок в kebab-case: `context-menu.tsx`, `create-controllable-signal.ts`.
- **Один компонент — своя папка** в `src/components/` с `index.ts` (только реэкспорт публичного), `<имя>.tsx`, `<имя>.module.css`, при необходимости `<имя>.test.tsx` и чистые функции в отдельных `.ts`.
- Компоненты экспортируются именованно, без `export default`. Имя подпути совпадает с именем папки.
- Компоненты импортируют друг друга через относительные пути внутри `src/`, а не через `@stark/solid-kit/...`.
- Логика (группировка, сортировка, вычисление видимых строк, ширины колонок, номера страниц, даты) живёт в чистых функциях без DOM и покрывается юнит-тестами.
- Пропсы не деструктурируются; значения по умолчанию через `mergeProps`, проброс атрибутов через `splitProps`.
- Минимум a11y, который закладывается сразу: нативные `<button>`, `<input>`, `<label>`, `<table>`, `<dialog>`; `type="button"` у кнопок; `role="listbox"`/`option` и `aria-selected` у ListBox, `aria-expanded` у триггеров, `aria-sort` у заголовков грида, `aria-label` у иконочных кнопок; Esc закрывает слои; стрелки и Enter в открытом списке. Всё остальное не цель первой итерации.
- Линтинг: `@stark/eslint-config` и `@stark/stylelint-config`; линтер и `tsc --noEmit` проходят без ошибок перед каждым тегом.

## 12. Тестирование и playground

- **Юнит-тесты** (Vitest) на чистые функции: `createControllableSignal`, группировка, сортировка групп, ширины колонок, номера страниц, вычисления дат.
- **Компонентные тесты** (`@solidjs/testing-library`) на поведение: controlled/uncontrolled, открытие и закрытие слоёв, выбор в списках. В jsdom нет раскладки, поэтому виртуализатору в тестах передаётся `initialRect` (опция `@tanstack/virtual-core`), а точная геометрия проверяется в playground.
- **playground/** это Vite 8-приложение в workspace: страница на компонент, состояния прямо в JSX, переключатель темы (`data-sk-theme`) и размера (`data-sk-size` на корне страницы). Отдельные страницы: «Контролы в ряд» (раздел 5) и «Большие списки» (Select и Grid на 100 000 элементов).
- Storybook не используется. `storybook-solidjs-vite@10.7.4` поддерживает Vite 8, поэтому его можно добавить позже поверх тех же компонентов; компоненты от него не зависят.

**Критерии приёмки для кита в целом:**

1. Тестовый проект-потребитель вне репозитория ставит кит через `github:StarkElessar/solid-kit#<тег>`, импортирует компонент и `tokens.css`; `vite build` проходит, стили компонента и токены есть в итоговом CSS, неимпортированных компонентов в бандле нет, `solid-js` в бандле в одной копии.
2. `tsc --noEmit` потребителя со строгими настройками проходит без ошибок в исходниках кита.
3. Страница «Контролы в ряд» проходит проверку высот (раздел 5).
4. На странице «Большие списки» прокрутка Select и Grid на 100 000 элементов остаётся плавной, а в DOM находится только окно рендера плюс `overscan`.

## 13. Дорожная карта

Каждый этап начинается с короткого собственного спека и плана; этот документ фиксирует только рамки.

| Этап | Что входит | Зависит от | Критерий готовности |
|---|---|---|---|
| 0. Фундамент | Скаффолд репозитория (раздел 3), tsconfig, линтеры, Vitest, playground с переключателем темы и размера; `tokens.css` с системой размеров и тёмной темой; `createControllableSignal`; Portal и стек слоёв; `createAnchoredPosition` | — | Критерии приёмки 1 и 2 раздела 12 выполнены на тестовом компоненте; тесты хелперов зелёные; тег `v0.1.0` |
| 1. Простые контролы | Button, IconButton, ButtonGroup, ToggleGroup, Switch, Checkbox, Radio + RadioGroup, Input, NumericInput, Field, Tabs | 0 | Страница «Контролы в ряд» с готовыми контролами проходит проверку высот в трёх размерах и двух темах; controlled/uncontrolled покрыты тестами |
| 2. Оверлеи | Popover, Dialog, ContextMenu (пока без ListBox: простое меню), dismiss, вложенность слоёв | 0, 1 | Вложенный поповер внутри Dialog виден и закрывается независимо; Esc закрывает только верхний слой; ContextMenu позиционируется в точке клика и не выходит за вьюпорт |
| 3. Списки | ListBox с виртуализацией по умолчанию, Select, Combobox, MultiSelect; перевод ContextMenu на ListBox | 0, 1, 2 | Select/Combobox/MultiSelect стоят в ряду контролов без разнобоя; список на 100 000 элементов открывается и прокручивается плавно; `virtualized={false}` рендерит все элементы |
| 4а. Грид-ядро | `Grid<T>`: колонки, виртуализация строк, сортировка, ресайз, закреплённые колонки, выбор строк и массовые операции, контекстное меню строки, загрузка и пустое состояние | 0–3 (Button, Checkbox, Select, ContextMenu) | Грид на 100 000 строк в playground работает с ресайзом и закреплёнными колонками; чистые функции покрыты тестами |
| 4б. Грид-надстройки | Группировка drag-and-drop, групповые заголовки и футеры, меню колонок, пейджер, автосуммы | 4а | Сценарии из таблицы 10.2 воспроизведены в playground на демо-данных; тег `v1.0.0` после 4б |
| 5. Дата и время | Calendar, DatePicker, TimePicker, DateTimePicker | 0–3 | DatePicker в ряду контролов той же высоты; разбор и форматирование дат покрыты юнит-тестами |

Грид не требует компонентов даты, поэтому этап 5 идёт последним.

## 14. Открытые вопросы

1. **Библиотека дат или свои хелперы на `Date` + `Intl` (этап 5).** Рекомендация: свои чистые хелперы на `Date` и `Intl.DateTimeFormat` (`formatToParts` для названий месяцев и дней недели, первый день недели из настроек), с юнит-тестами; в референсе уже есть `date-input-utils.ts` как отправная точка (файла нет в скачанном наборе, его содержимое я не видел). Аргументы: ноль зависимостей, календарю нужны только арифметика дней и форматирование. Если понадобятся часовые пояса или разбор произвольных форматов, рассмотреть `date-fns` 4 или `Temporal` (поддержку `Temporal` в целевых браузерах я не проверял).
2. **Пропускать ли оконный рендер на совсем маленьких списках внутри ListBox.** Рекомендация: отдельного порога не вводить, а держать один путь рендера через виртуализатор с раскладкой на spacer-элементах (как строки грида), а не на абсолютном позиционировании. Аргументы за отказ от порога: один путь кода и одно поведение, обещание «виртуализация всегда» буквально выполняется, а список из 5 пунктов и так рендерится целиком, потому что помещается в окно плюс `overscan`. Аргументы за порог: при абсолютном позиционировании пунктов панель не может подстроить ширину под содержимое (важно для ContextMenu), и нет мигания до первого измерения. Раскладка на spacer-элементах снимает проблему ширины и без порога; решение за владельцем.
3. **Размеры 28 / 32 / 40 px.** Рекомендация: оставить. 32 — распространённая высота по умолчанию для плотных бэк-офисных интерфейсов, 28 подходит для тулбаров и грида, 40 для крупных форм. Строка грида в референсе около 33px, пункт списка 29px, так что `md` и `sm` близки к тому, к чему владелец привык. Числа правятся в одном месте.
4. **Имя пакета.** Рекомендация: `@stark/solid-kit`, по аналогии с `@stark/eslint-config` и `@stark/stylelint-config` (так названы пакеты в репозиториях владельца). Занят ли скоуп `@stark` на npm, я не проверял; для git-зависимостей это не важно, а при будущей публикации имя, возможно, придётся сменить.

## Приложение: что проверено при подготовке спека

- `vite-plugin-solid` 2.11.14 (исходник): `containsSolidField` смотрит только `exports`; `solid` добавляется в начало `resolve.conditions`; для Vite 8 задаётся `rolldownOptions.transform.jsx: 'preserve'`.
- `vitefu` 1.1.3 (исходник): framework-пакет попадает в `optimizeDeps.exclude` и `ssr.noExternal`, его CJS-зависимости в `optimizeDeps.include`.
- Vite 8.3.5 (исходник): `moduleSideEffects` для CSS (раздел 3.4); `vite/client` объявляет `*.module.css` и `*.css`.
- Node 24: форма `exports` из раздела 3.2 резолвит `select`, `tokens.css`, `package.json` и отклоняет корневой импорт.
- `tsc` 5.9.3 и 7.0.2 (`moduleResolution: "bundler"`): подпуть резолвится в `.ts`-исходник, ошибки исходников кита видны при `skipLibCheck: true`.
- `@floating-ui/dom` 1.8.0 экспортирует `computePosition`, `autoUpdate`, `offset`, `flip`, `shift`, `size`; `@tanstack/solid-virtual` 3.13.50 экспортирует `createVirtualizer` и зависит от `@tanstack/virtual-core` 3.19.8 (опции `initialRect`, `measureElement`, `scrollToIndex` есть).
- Не проверено, проверяется на этапе 0 критерием приёмки 1: учитывает ли pnpm поле `files` при установке git-зависимости, линкуется ли корневой пакет в playground через `workspace:*` и остаётся ли `solid-js` в одной копии.
