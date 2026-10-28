# solid-kit, этап 0 «Фундамент»: план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans. Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** репозиторий `@stark/solid-kit` с рабочим фундаментом: пакет в нужной форме, токены и темы, три хелпера (`createControllableSignal`, стек слоёв с показом панелей в top layer, `createAnchoredPosition`), линтеры, Vitest, playground и тестовый компонент `Probe`, на котором выполняются критерии приёмки 1, 2 и 5.

**Архитектура:** исходники без сборки (`.tsx/.ts/.css`), подпуть на компонент через `exports` с условием `solid`. Стили: CSS Modules на чистом CSS и глобальный `tokens.css` (базовые токены → производные через `color-mix(in oklch)` → компонентные с фолбэком). Хелперы в `src/utils/` без DOM-зависимостей там, где это возможно, и с юнит-тестами. `Probe` собирает все хелперы и токены в одном маленьком компоненте; playground и внешний проект-потребитель проверяют его в реальном Vite.

**Стек:** Solid 1.9.17, Vite 8.3.5 + vite-plugin-solid 2.11.14, TypeScript 5.9.3, Vitest + `@solidjs/testing-library` + jsdom, `@floating-ui/dom` 1.8.0, `@tanstack/solid-virtual` 3.13.50 (подключается в зависимости сейчас, используется с этапа 3), pnpm, ESLint 9 (`@stark/eslint-config`) и Stylelint 17 (`@stark/stylelint-config`).

**Спек:** `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 3, 4, 5, 5.1, 7, 8, 11, 12, 13). Исполнитель читает спек и план вместе.

## Решения плана (отступления от текста спека, которые план закрепляет)

1. **pnpm 11.12.0**, а не 12.15.0 из текста спека: спек разрешает выбрать версию на этапе 0 (раздел 12, критерий 1). 11.12.0 стоит на машине владельца и закреплён в его другом проекте. В Task 12 спек исправляется.
2. **TypeScript разработки 5.9.3**: peer `@stark/eslint-config` ограничен `<6.1`. Потребительская матрица (критерий 2) прогоняется отдельно на 5.9.3 и 7.0.2.
3. **`--s-kit-color-control-edge` = 50 %, а не 42 %.** Граница флажка и радио должна давать не менее 3:1 к поверхности (WCAG 1.4.11). Расчёт: `#1d1d1f` с альфой 0,42 поверх `#fff` даёт примерно 2,6:1; при 50 % примерно 3,3:1. Проверяет тест `tokens.test.ts`; владелец увидит отступление в итоговом отчёте этапа.
4. **Значения производных токенов взяты из прототипа `kit.css`**, одобренного владельцем (а не из устаревшего примера в разделе 4.1 спека): `primary-subtle` 10 %, `focus-ring` 75 %, `hover` 5 %, `muted` 62 %, семейство `tint`, `row-selected` 9 %, тень поповера с полупиксельной обводкой. Спек синхронизируется в Task 12.
5. **Критерий 1 выполняется в два захода.** Репозиторий не опубликован на GitHub (публикация это решение владельца, раздел 14, вопрос 4), поэтому установка `github:StarkElessar/solid-kit#<тег>` пока невозможна. Скрипт прогоняет ту же матрицу через `git+file://` (git-зависимость из локального репозитория по коммиту). Повтор с `github:` обязателен после первой публикации и до публичного тега `v0.1.0`.
6. **Firefox 125 и Safari 17.5 на этой машине недоступны.** Критерий 5 в этих браузерах не проверяется агентом: проверяется только установленный Chrome, остальное явно записывается как «не проверено» в отчёте этапа.

## Global Constraints

- Репозиторий **публичный**: ни ключей, ни токенов, ни `.env*`, ни бэкапов в коммитах; `.gitignore` с первого коммита (Task 1). Перед тегом смотреть `git diff` и список файлов.
- **Один класс — один файл.** Имена файлов и папок в kebab-case. Компоненты экспортируются именованно, без `export default`.
- Стили компонентов: только токены; литералы цветов (hex, `rgb()`, `hsl()`, `oklch()`, именованные) допустимы только в `src/styles/tokens.css`. В CSS компонентов нет `outline: none`/`0` без замены, нет `!important`. Префикс токенов `--s-kit-`, атрибутов `data-s-kit-`. Корень каждого компонента и каждой панели несёт `data-s-kit`.
- Любая геометрия, завязанная на размер, читает `var(--s-kit-control-height, var(--s-kit-control-height-md))`; голое `var(--s-kit-control-height)` запрещено.
- Индикатор фокуса: `:focus-visible` + `outline` из `--s-kit-focus-*`; `outline-offset: var(--s-kit-focus-ring-offset, var(--s-kit-focus-offset))`.
- `@property` для цветовых токенов не используется; `all: initial/revert` на корне панели не используется.
- Пропсы не деструктурируются; значения по умолчанию через `mergeProps`, проброс через `splitProps`; `foo` / `defaultFoo` / `onFooChange`, имя `onChange` не используется.
- Строгий TypeScript (флаги раздела 3.6 спека): `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly`; без `enum`, `namespace`, декораторов.
- Минимальные браузеры: Chrome/Edge 123, Firefox 125, Safari и iOS Safari 17.5. SSR вне объёма.
- Формат кода по `@stark/eslint-config`: табы, одинарные кавычки, точки с запятой, Stroustrup, строка до 140 символов. CSS по `@stark/stylelint-config`: 4 пробела, двойные кавычки, логические свойства (`inline-size`, `padding-inline`, ...), порядок свойств автоматически (`stylelint --fix`).
- Коммиты на русском, в конце трейлеры. Один раз за сессию терминала:

```bash
export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'
# коммит: git commit -m "сообщение" -m "$TRAILERS"
```

- Автор коммитов: текущая глобальная git-идентичность. **Не менять её и не переписывать историю без решения владельца**: в 14 существующих коммитах стоит рабочая почта, а репозиторий станет публичным. Это пункт предпубликационной проверки (Task 12), не часть этого плана.
- **Нельзя** без явного слова владельца: создавать удалённый репозиторий, `git push`, пушить теги, добавлять `LICENSE`.

## Карта файлов

```
.gitignore
README.md
package.json                      # форма пакета (раздел 3.2) + скрипты
pnpm-workspace.yaml               # packages: [playground]
tsconfig.json                     # строгий (раздел 3.6)
vitest.config.ts
eslint.config.js
stylelint.config.js               # + запрет литералов цвета и outline: none в components
src/styles/tokens.css             # базовые и производные токены, размеры, темы, фокус
src/styles/tokens.test.ts         # контракт токенов и контраст пар
src/styles/stylelint-rules.test.ts# правила stylelint кита работают
src/utils/color-math.ts (+test)   # контраст и смешение в sRGB (для тестов и playground)
src/utils/create-controllable-signal.ts (+test)
src/utils/layer-stack.ts (+test)
src/utils/create-panel-layer.ts (+test)
src/utils/create-anchored-position.ts (+test)
src/components/probe/             # index.ts, probe.tsx, probe-scope.ts, probe.module.css, probe.test.tsx
src/components/probe-unused/      # index.ts, probe-unused.tsx, probe-unused.module.css (проверка tree-shaking)
playground/                       # package.json, tsconfig.json, vite.config.ts, index.html, src/*
scripts/verify-package-form.sh    # критерий 1
scripts/consumer/                 # шаблон проекта-потребителя для скрипта
```

`probe` и `probe-unused` служат только тестовыми стендами этапа 0; на этапе 1 `probe` заменяется настоящим `Button`, `probe-unused` остаётся, пока нужен для проверки tree-shaking.

---

### Task 0: Проверка окружения

**Files:** нет.

- [ ] **Step 1: Версии и доступы**

```bash
cd /Users/stark/Documents/web/solid-kit
node -v && pnpm -v && git status --short
git ls-remote git@github.com:StarkElessar/stark-eslint-config.git v0.1.0
git ls-remote git@github.com:StarkElessar/stark-stylelint-config.git v0.1.0
```

Expected: Node ≥ 20.19 (на машине v24.15.0), pnpm 11.x, чистое дерево, обе команды `ls-remote` печатают хеш тега. Если `ls-remote` падает, остановиться и сообщить владельцу: конфиги линтеров ставятся только по ssh, это шаг координатора с доступом к ключам; Codex в песочнице их не поставит.

---

### Task 1: Скаффолд репозитория

**Files:**
- Create: `.gitignore`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `vitest.config.ts`, `README.md`

**Interfaces:**
- Produces: скрипты `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check`; корневой `tsconfig.json`, который расширяют `playground/tsconfig.json` и использует `eslint` через `projectService`.

- [ ] **Step 1: `.gitignore` (первым, до любых других файлов)**

```gitignore
node_modules/
dist/
coverage/
.vite/
*.log
.DS_Store

# репозиторий публичный: секреты и бэкапы не коммитятся
.env
.env.*
!.env.example
*.pem
*.key
.npmrc
*.bak
*.backup
backups/
```

- [ ] **Step 2: `package.json`**

```json
{
	"name": "@stark/solid-kit",
	"version": "0.1.0",
	"description": "Личный UI-кит на Solid.js: исходники без сборки, модульный, темизация через CSS-переменные",
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
	"scripts": {
		"dev": "pnpm --filter playground dev",
		"lint": "eslint . --max-warnings 0 && stylelint \"src/**/*.css\" \"playground/src/**/*.css\"",
		"typecheck": "tsc --noEmit && tsc --noEmit -p playground",
		"test": "vitest run",
		"check": "pnpm lint && pnpm typecheck && pnpm test"
	},
	"peerDependencies": {
		"solid-js": "^1.9.0"
	},
	"dependencies": {
		"@floating-ui/dom": "^1.8.0",
		"@tanstack/solid-virtual": "^3.13.50"
	},
	"devDependencies": {
		"@solidjs/testing-library": "^0.8.10",
		"@stark/eslint-config": "git+ssh://git@github.com/StarkElessar/stark-eslint-config.git#v0.1.0",
		"@stark/stylelint-config": "git+ssh://git@github.com/StarkElessar/stark-stylelint-config.git#v0.1.0",
		"eslint": "^9.0.0",
		"eslint-plugin-solid": "^0.14.5",
		"globals": "^17.0.0",
		"jsdom": "^30.0.0",
		"solid-js": "1.9.17",
		"stylelint": "^17.14.0",
		"typescript": "5.9.3",
		"vite": "8.3.5",
		"vite-plugin-solid": "2.11.14",
		"vitest": "^5.0.0"
	},
	"packageManager": "pnpm@11.12.0"
}
```

`license` намеренно отсутствует: решение о лицензии принадлежит владельцу (раздел 14 спека, вопрос 3).

- [ ] **Step 3: `pnpm-workspace.yaml`**

```yaml
packages:
  - playground
```

- [ ] **Step 4: `tsconfig.json`**

```json
{
	"compilerOptions": {
		"target": "ES2022",
		"lib": ["ES2023", "DOM", "DOM.Iterable"],
		"module": "ESNext",
		"moduleResolution": "bundler",
		"jsx": "preserve",
		"jsxImportSource": "solid-js",
		"types": ["vite/client"],
		"noEmit": true,
		"skipLibCheck": true,
		"strict": true,
		"exactOptionalPropertyTypes": true,
		"noUncheckedIndexedAccess": true,
		"noImplicitOverride": true,
		"noImplicitReturns": true,
		"noFallthroughCasesInSwitch": true,
		"noPropertyAccessFromIndexSignature": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"verbatimModuleSyntax": true,
		"isolatedModules": true,
		"erasableSyntaxOnly": true
	},
	"include": ["src", "vitest.config.ts"]
}
```

- [ ] **Step 5: `vitest.config.ts`**

```ts
import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [solid()],
	resolve: { conditions: ['development', 'browser'] },
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.{ts,tsx}'],
		restoreMocks: true,
	},
});
```

- [ ] **Step 6: `README.md`**

```markdown
# @stark/solid-kit

Личный UI-кит на Solid.js. Исходники без сборки, подпуть на компонент, темизация через CSS-переменные `--s-kit-*`.

Статус: этап 0 (фундамент). Дизайн и дорожная карта: `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md`.

## Подключение

```jsonc
// package.json потребителя
"dependencies": { "@stark/solid-kit": "github:StarkElessar/solid-kit#vX.Y.Z" }
```

```ts
import '@stark/solid-kit/tokens.css'; // один раз в точке входа
import { Probe } from '@stark/solid-kit/probe';
```

Требования: Vite 8, `vite-plugin-solid` 2.11+, `solid-js` ^1.9, шрифт IBM Plex Sans (кит его не поставляет).

## Разработка

```sh
pnpm install
pnpm dev     # playground
pnpm check   # lint + typecheck + test
```

Репозиторий публичный: ключи, токены и `.env*` не коммитятся.
```

- [ ] **Step 7: Установить зависимости (нужна сеть и ssh-ключи, шаг координатора)**

Run: `pnpm install`
Expected: установка без ошибок, создан `pnpm-lock.yaml`. Если `eslint-plugin-solid@^0.14.5` не резолвится, выполнить `npm view eslint-plugin-solid version`, взять актуальную и поправить диапазон. Если какая-то версия из списка несовместима (peer-конфликт vitest 5 / vite 8.3.5), записать фактическую рабочую пару в сообщение коммита и здесь в план.

- [ ] **Step 8: Проверить, что секреты не попадут в коммит**

```bash
git status --short
git check-ignore -v node_modules .env .npmrc
```

Expected: в статусе только новые файлы кита и `pnpm-lock.yaml`; три пути проигнорированы.

- [ ] **Step 9: Коммит**

```bash
git add .gitignore package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json vitest.config.ts README.md
git commit -m "chore: скаффолд пакета, строгий tsconfig, Vitest, .gitignore для публичного репозитория" -m "$TRAILERS"
```

---

### Task 2: Линтеры и правила stylelint кита

**Files:**
- Create: `eslint.config.js`, `stylelint.config.js`, `src/styles/stylelint-rules.test.ts`
- Create (временный стенд для прогона): нет

**Interfaces:**
- Produces: `pnpm lint` проходит на пустом дереве; правила stylelint для `src/components/**/*.css` (запрет литералов цвета и `outline: none`/`0`) и для `src/styles/**/*.css` (литералы разрешены).

- [ ] **Step 1: `eslint.config.js`**

```js
import stark, { typeChecked } from '@stark/eslint-config';
import solid from 'eslint-plugin-solid/configs/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
	globalIgnores(['**/dist/**', '**/node_modules/**', '**/.vite/**', 'scripts/consumer/**']),
	...stark,
	{
		files: ['**/*.{js,ts,tsx}'],
		languageOptions: { globals: { ...globals.browser } },
	},
	{
		files: ['*.config.{js,ts}', 'playground/*.config.ts'],
		languageOptions: { globals: { ...globals.node } },
	},
	...typeChecked,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
		},
	},
	{ ...solid, files: ['**/*.{ts,tsx}'] },
]);
```

- [ ] **Step 2: Написать падающий тест правил stylelint**

`src/styles/stylelint-rules.test.ts`:

```ts
import { resolve } from 'node:path';

import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';

const COMPONENT_FILE = resolve('src/components/example/example.module.css');
const TOKENS_FILE = resolve('src/styles/tokens.css');

async function lint(code: string, codeFilename: string): Promise<string[]> {
	const { results } = await stylelint.lint({ code, codeFilename, configFile: resolve('stylelint.config.js') });
	return (results[0]?.warnings ?? []).map((warning) => warning.rule);
}

describe('stylelint rules of the kit', () => {
	it('forbids a hex colour in component CSS', async () => {
		expect(await lint('.a {\n    color: #fff;\n}\n', COMPONENT_FILE)).toContain('color-no-hex');
	});

	it('forbids a named colour in component CSS', async () => {
		expect(await lint('.a {\n    color: red;\n}\n', COMPONENT_FILE)).toContain('color-named');
	});

	it('forbids colour functions with literal channels in component CSS', async () => {
		const rules = await lint('.a {\n    color: rgb(0 0 0);\n    background: oklch(50% 0.1 200);\n}\n', COMPONENT_FILE);
		expect(rules.filter((rule) => rule === 'function-disallowed-list')).toHaveLength(2);
	});

	it('allows transparent, currentColor, tokens and color-mix over tokens', async () => {
		const code = [
			'.a {',
			'    border-color: transparent;',
			'    color: currentcolor;',
			'    background: var(--s-kit-color-surface);',
			'    outline-color: color-mix(in oklch, var(--s-kit-color-primary) 55%, transparent);',
			'}',
			'',
		].join('\n');
		expect(await lint(code, COMPONENT_FILE)).toEqual([]);
	});

	it('forbids outline: none and outline: 0 in component CSS', async () => {
		const rules = await lint('.a {\n    outline: none;\n}\n\n.b {\n    outline: 0;\n}\n', COMPONENT_FILE);
		expect(rules.filter((rule) => rule === 'declaration-property-value-disallowed-list')).toHaveLength(2);
	});

	it('flags a var() that points at an undeclared token', async () => {
		expect(await lint('.a {\n    color: var(--s-kit-color-typo);\n}\n', COMPONENT_FILE)).toContain('no-unknown-custom-properties');
	});

	it('allows literals in the token layer', async () => {
		const rules = await lint(':root {\n    --s-kit-color-primary: light-dark(#0071e3, #4da3ff);\n}\n', TOKENS_FILE);
		expect(rules).not.toContain('color-no-hex');
	});
});
```

- [ ] **Step 3: Запустить тест, убедиться, что падает**

Run: `pnpm exec vitest run src/styles/stylelint-rules.test.ts`
Expected: FAIL: нет `stylelint.config.js` (или правила не сработали).

- [ ] **Step 4: `stylelint.config.js`**

```js
/** Литералы цвета и подавление фокуса запрещены в CSS компонентов; значения живут только в src/styles/tokens.css. */
const componentRules = {
	'color-no-hex': [true, { message: 'Use a colour token from src/styles/tokens.css, not a hex literal.' }],
	'color-named': ['never', { message: 'Use a colour token from src/styles/tokens.css, not a named colour.' }],
	'function-disallowed-list': [
		['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],
		{ message: 'Use a colour token from src/styles/tokens.css, not a colour function with literal channels.' },
	],
	// outline: none без замены запрещён; кольцо задаётся токенами фокуса (спек, раздел 5.1).
	'declaration-property-value-disallowed-list': [
		{ outline: ['none', '0'], 'outline-style': ['none'] },
		{ message: 'Do not remove the focus indicator: use the --s-kit-focus-* tokens.' },
	],
};

/** @type {import('stylelint').Config} */
export default {
	extends: ['@stark/stylelint-config'],
	// var(--x) проверяется по токенам, объявленным в tokens.css
	referenceFiles: ['src/styles/tokens.css'],
	rules: {
		'no-unknown-custom-properties': true,
	},
	overrides: [{ files: ['src/components/**/*.css'], rules: componentRules }],
};
```

- [ ] **Step 5: Создать пустой `src/styles/tokens.css` (нужен `referenceFiles`), прогнать тест**

```bash
mkdir -p src/styles && printf ':root {\n    color-scheme: light dark;\n}\n' > src/styles/tokens.css
pnpm exec vitest run src/styles/stylelint-rules.test.ts
```

Expected: все тесты PASS. Если падает «allows transparent, currentColor» из-за `color-named` или из-за порядка/формата других правил стандартного конфига, исправить входной CSS в тесте под правила форматирования (не ослаблять правила кита) и зафиксировать фактическое поведение `transparent`/`currentcolor` комментарием в тесте (спек, раздел 11 велит уточнить это здесь). Если `no-unknown-custom-properties` не ругается на неизвестный токен, проверить, что `referenceFiles` указан относительно корня и что stylelint запущен из корня репозитория.

- [ ] **Step 6: Прогнать ESLint на текущем дереве**

Run: `pnpm exec eslint . --max-warnings 0`
Expected: без ошибок. Если плагин или конфиг падает (например, `eslint-plugin-solid` не поддерживает текущий ESLint), убрать подключение `solid` из `eslint.config.js`, записать причину в сообщение коммита и вернуть проверку реактивности как задачу этапа 1. Правила `@stark/eslint-config`, не подходящие ките (например, `no-console` для dev-предупреждений), не отключаются глобально: точечный `// eslint-disable-next-line` с причиной.

- [ ] **Step 7: Коммит**

```bash
git add eslint.config.js stylelint.config.js src/styles package.json pnpm-lock.yaml
git commit -m "chore: линтеры владельца, stylelint кита запрещает литералы цвета и outline: none в компонентах" -m "$TRAILERS"
```

---

### Task 3: Математика цвета и токены (`tokens.css`)

**Files:**
- Create: `src/utils/color-math.ts`, `src/utils/color-math.test.ts`, `src/styles/tokens.test.ts`
- Modify: `src/styles/tokens.css`

**Interfaces:**
- Produces (`color-math.ts`):
  - `type Rgb = readonly [red: number, green: number, blue: number]`
  - `parseHex(hex: string): Rgb`
  - `relativeLuminance(rgb: Rgb): number`
  - `contrastRatio(first: Rgb, second: Rgb): number`
  - `blend(foreground: Rgb, alpha: number, background: Rgb): Rgb` (наложение с альфой в sRGB, как это делает браузер)
- Produces (`tokens.css`): все токены разделов 4.1, 5, 5.1 и 4.3 спека; пары контраста проверены тестом.

- [ ] **Step 1: Тест `color-math`**

`src/utils/color-math.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { blend, contrastRatio, parseHex, relativeLuminance } from './color-math';

describe('color-math', () => {
	it('parses long and short hex', () => {
		expect(parseHex('#0071e3')).toEqual([0, 113, 227]);
		expect(parseHex('#fff')).toEqual([255, 255, 255]);
	});

	it('rejects non-hex input', () => {
		expect(() => parseHex('red')).toThrow('Not a hex colour');
	});

	it('gives luminance 1 for white and 0 for black', () => {
		expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10);
		expect(relativeLuminance([0, 0, 0])).toBe(0);
	});

	it('gives 21:1 for black on white and 1:1 for equal colours', () => {
		expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 10);
		expect(contrastRatio([10, 20, 30], [10, 20, 30])).toBe(1);
	});

	it('is symmetric', () => {
		expect(contrastRatio([0, 113, 227], [255, 255, 255])).toBe(contrastRatio([255, 255, 255], [0, 113, 227]));
	});

	it('blends with alpha in sRGB', () => {
		expect(blend([0, 0, 0], 0.5, [255, 255, 255])).toEqual([127.5, 127.5, 127.5]);
		expect(blend([10, 20, 30], 1, [255, 255, 255])).toEqual([10, 20, 30]);
	});
});
```

- [ ] **Step 2: Запустить, убедиться, что падает**

Run: `pnpm exec vitest run src/utils/color-math.test.ts`
Expected: FAIL: модуль не найден.

- [ ] **Step 3: `src/utils/color-math.ts`**

```ts
export type Rgb = readonly [red: number, green: number, blue: number];

/** `#rgb` или `#rrggbb` в байты sRGB. */
export function parseHex(hex: string): Rgb {
	const digits = hex.replace('#', '');
	const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits;
	if (!/^[0-9a-f]{6}$/i.test(full)) {
		throw new Error(`Not a hex colour: ${hex}`);
	}
	return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function linearize(channel: number): number {
	const value = channel / 255;
	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** Относительная яркость по WCAG 2.x. */
export function relativeLuminance([red, green, blue]: Rgb): number {
	return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
}

/** Контраст по WCAG 2.x: от 1 до 21. */
export function contrastRatio(first: Rgb, second: Rgb): number {
	const a = relativeLuminance(first);
	const b = relativeLuminance(second);
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Цвет с прозрачностью `alpha` поверх непрозрачного фона (наложение в sRGB, как у браузера). */
export function blend(foreground: Rgb, alpha: number, background: Rgb): Rgb {
	const mix = (front: number, back: number): number => front * alpha + back * (1 - alpha);
	return [mix(foreground[0], background[0]), mix(foreground[1], background[1]), mix(foreground[2], background[2])];
}
```

- [ ] **Step 4: Тест проходит**

Run: `pnpm exec vitest run src/utils/color-math.test.ts`
Expected: PASS (6 тестов).

- [ ] **Step 5: Тест контракта токенов и контраста**

`src/styles/tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { blend, contrastRatio, parseHex } from '../utils/color-math';
import tokens from './tokens.css?raw';

const THEMES = ['light', 'dark'] as const;

const BASE_COLORS = ['primary', 'primary-contrast', 'surface', 'text', 'border', 'danger', 'success', 'warning'] as const;

const DERIVED_COLORS = [
	'primary-hover',
	'primary-active',
	'primary-subtle',
	'focus-ring',
	'muted',
	'hover',
	'tint',
	'tint-hover',
	'tint-active',
	'row-selected',
	'surface-2',
	'group',
	'hairline',
	'border-strong',
	'control-edge',
	'danger-subtle',
	'danger-hover',
	'success-subtle',
	'success-hover',
	'warning-subtle',
	'warning-hover',
	'panel',
] as const;

const OTHER_TOKENS = [
	'radius',
	'font',
	'font-size',
	'line-height',
	'control-height-sm',
	'control-height-md',
	'control-height-lg',
	'control-padding-x-sm',
	'control-padding-x-md',
	'control-padding-x-lg',
	'control-font-size-sm',
	'control-font-size-md',
	'control-font-size-lg',
	'focus-width',
	'focus-offset',
	'focus-space',
	'panel-blur',
	'panel-opacity',
	'shadow-color',
	'shadow-popover',
	'z-sticky',
	'z-loader',
] as const;

function lightDark(name: string): Record<(typeof THEMES)[number], string> {
	const match = new RegExp(`--s-kit-color-${name}:\\s*light-dark\\((#[0-9a-f]{3,6}),\\s*(#[0-9a-f]{3,6})\\)`, 'i').exec(tokens);
	if (!match?.[1] || !match[2]) {
		throw new Error(`Base token --s-kit-color-${name} must be declared as light-dark(#x, #y)`);
	}
	return { light: match[1], dark: match[2] };
}

describe('token contract', () => {
	it.each(BASE_COLORS)('declares base colour %s as light-dark()', (name) => {
		expect(() => lightDark(name)).not.toThrow();
	});

	it.each(DERIVED_COLORS)('declares derived colour %s', (name) => {
		expect(tokens).toMatch(new RegExp(`--s-kit-color-${name}:`));
	});

	it.each(OTHER_TOKENS)('declares --s-kit-%s', (name) => {
		expect(tokens).toMatch(new RegExp(`--s-kit-${name}:`));
	});

	it('follows the system theme and lets a wrapper force a theme by color-scheme only', () => {
		expect(tokens).toMatch(/:root\s*{[^}]*color-scheme:\s*light dark/);
		expect(tokens).toMatch(/\[data-s-kit-theme="light"\]\s*{\s*color-scheme:\s*light;\s*}/);
		expect(tokens).toMatch(/\[data-s-kit-theme="dark"\]\s*{\s*color-scheme:\s*dark;\s*}/);
	});

	it('resolves control size through data-s-kit-size and the inset focus ring through data-s-kit-focus-inset', () => {
		for (const size of ['sm', 'md', 'lg']) {
			expect(tokens).toMatch(new RegExp(`\\[data-s-kit-size="${size}"\\]`));
		}
		expect(tokens).toMatch(/\[data-s-kit-focus-inset\]/);
	});

	it('recomputes derived tokens on every component root', () => {
		expect(tokens).toMatch(/:root,\s*\[data-s-kit\]\s*{/);
	});

	it('never registers colour tokens with @property (a wrapper override would stop working)', () => {
		expect(tokens).not.toContain('@property');
	});

	it('uses only the --s-kit- prefix', () => {
		expect(tokens).not.toMatch(/--sk-/);
	});
});

describe('contrast of base token pairs (WCAG 2.x, 4.5:1)', () => {
	const pairs = [
		['text', 'surface'],
		['primary-contrast', 'primary'],
		['primary', 'surface'],
		['danger', 'surface'],
		['success', 'surface'],
		['warning', 'surface'],
	] as const;

	for (const theme of THEMES) {
		for (const [foreground, background] of pairs) {
			it(`${theme}: ${foreground} on ${background}`, () => {
				const ratio = contrastRatio(parseHex(lightDark(foreground)[theme]), parseHex(lightDark(background)[theme]));
				expect(ratio).toBeGreaterThanOrEqual(4.5);
			});
		}
	}
});

describe('contrast of the control edge (WCAG 1.4.11, 3:1)', () => {
	const share = /--s-kit-color-control-edge:\s*color-mix\(in oklch,\s*var\(--s-kit-color-text\)\s*(\d+)%,\s*transparent\)/.exec(tokens)?.[1];

	for (const theme of THEMES) {
		it(`${theme}: text at ${share ?? '?'}% over surface against surface`, () => {
			expect(share).toBeDefined();
			const text = parseHex(lightDark('text')[theme]);
			const surface = parseHex(lightDark('surface')[theme]);
			const edge = blend(text, Number(share) / 100, surface);
			expect(contrastRatio(edge, surface)).toBeGreaterThanOrEqual(3);
		});
	}
});
```

- [ ] **Step 6: Запустить, убедиться, что падает**

Run: `pnpm exec vitest run src/styles/tokens.test.ts`
Expected: FAIL: токены не объявлены.

- [ ] **Step 7: Написать `src/styles/tokens.css`**

```css
/*
 * solid-kit: глобальные токены (спек, разделы 4, 4.1-4.3, 5, 5.1).
 * Базовые токены публичны: переопределяются на :root или на любой обёртке.
 * Производные внутренние: считаются на :root и на корне каждого компонента [data-s-kit],
 * поэтому переопределённый на обёртке primary перестраивает всё внутри неё.
 * Компонентные токены (--s-kit-<компонент>-*) нигде не объявляются: компонент читает их с фолбэком.
 * Литералы цветов допустимы только в этом файле.
 */

:root {
    color-scheme: light dark;

    /* базовые цвета: палитра «Синий» (светлая тема, тёмная тема) */
    --s-kit-color-primary: light-dark(#0071e3, #4da3ff);
    --s-kit-color-primary-contrast: light-dark(#fff, #04162e);
    --s-kit-color-surface: light-dark(#fff, #1c1c1e);
    --s-kit-color-text: light-dark(#1d1d1f, #f5f5f7);
    --s-kit-color-border: light-dark(#d2d2d7, #3a3a3c);
    --s-kit-color-danger: light-dark(#d70015, #ff6961);
    --s-kit-color-success: light-dark(#1f7a37, #4cd964);
    --s-kit-color-warning: light-dark(#a85200, #ffb340);

    /* форма и шрифт; кит файлы шрифтов не поставляет */
    --s-kit-radius: 8px;
    --s-kit-font: "IBM Plex Sans", system-ui, sans-serif;
    --s-kit-font-size: 14px;
    --s-kit-line-height: 1.4;

    /* размеры контролов (раздел 5) */
    --s-kit-control-height-sm: 28px;
    --s-kit-control-height-md: 32px;
    --s-kit-control-height-lg: 40px;
    --s-kit-control-padding-x-sm: 10px;
    --s-kit-control-padding-x-md: 12px;
    --s-kit-control-padding-x-lg: 16px;
    --s-kit-control-font-size-sm: 12px;
    --s-kit-control-font-size-md: 14px;
    --s-kit-control-font-size-lg: 15px;

    /* фокус (раздел 5.1) */
    --s-kit-focus-width: 2px;
    --s-kit-focus-offset: 2px;

    /* материал панелей (раздел 4.3) */
    --s-kit-panel-blur: 20px;
    --s-kit-panel-opacity: 82%;

    /* слои вне top layer: липкие шапки, лоадер грида */
    --s-kit-z-sticky: 10;
    --s-kit-z-loader: 20;
}

:root,
[data-s-kit] {
    --s-kit-focus-space: calc(var(--s-kit-focus-width) + var(--s-kit-focus-offset));

    /* hover и active смешиваются с primary-contrast: состояние заметно у любой палитры, включая монохромную */
    --s-kit-color-primary-hover: color-mix(in oklch, var(--s-kit-color-primary), var(--s-kit-color-primary-contrast) 14%);
    --s-kit-color-primary-active: color-mix(in oklch, var(--s-kit-color-primary), var(--s-kit-color-primary-contrast) 26%);
    --s-kit-color-primary-subtle: color-mix(in oklch, var(--s-kit-color-primary) 10%, var(--s-kit-color-surface));
    --s-kit-color-focus-ring: color-mix(in oklch, var(--s-kit-color-primary) 75%, transparent);
    --s-kit-color-muted: color-mix(in oklch, var(--s-kit-color-text) 62%, var(--s-kit-color-surface));
    --s-kit-color-hover: color-mix(in oklch, var(--s-kit-color-text) 5%, var(--s-kit-color-surface));
    --s-kit-color-tint: color-mix(in oklch, var(--s-kit-color-text) 7%, var(--s-kit-color-surface));
    --s-kit-color-tint-hover: color-mix(in oklch, var(--s-kit-color-text) 11%, var(--s-kit-color-surface));
    --s-kit-color-tint-active: color-mix(in oklch, var(--s-kit-color-text) 16%, var(--s-kit-color-surface));
    --s-kit-color-row-selected: color-mix(in oklch, var(--s-kit-color-primary) 9%, var(--s-kit-color-surface));
    --s-kit-color-surface-2: color-mix(in oklch, var(--s-kit-color-text) 4%, var(--s-kit-color-surface));
    --s-kit-color-group: color-mix(in oklch, var(--s-kit-color-text) 2%, transparent);

    /* линии полупрозрачные и считаются от text: мягкие на любом фоне */
    --s-kit-color-hairline: color-mix(in oklch, var(--s-kit-color-text) 8%, transparent);
    --s-kit-color-border-strong: color-mix(in oklch, var(--s-kit-color-text) 14%, transparent);

    /* граница флажка и радио: не менее 3:1 к поверхности (WCAG 1.4.11), проверяет tokens.test.ts */
    --s-kit-color-control-edge: color-mix(in oklch, var(--s-kit-color-text) 50%, transparent);

    --s-kit-color-danger-subtle: color-mix(in oklch, var(--s-kit-color-danger) 14%, var(--s-kit-color-surface));
    --s-kit-color-danger-hover: color-mix(in oklch, var(--s-kit-color-danger), var(--s-kit-color-primary-contrast) 14%);
    --s-kit-color-success-subtle: color-mix(in oklch, var(--s-kit-color-success) 14%, var(--s-kit-color-surface));
    --s-kit-color-success-hover: color-mix(in oklch, var(--s-kit-color-success), var(--s-kit-color-primary-contrast) 14%);
    --s-kit-color-warning-subtle: color-mix(in oklch, var(--s-kit-color-warning) 16%, var(--s-kit-color-surface));
    --s-kit-color-warning-hover: color-mix(in oklch, var(--s-kit-color-warning), var(--s-kit-color-primary-contrast) 14%);

    /* полупрозрачный материал панели; у компонента обязателен запасной сплошной фон surface */
    --s-kit-color-panel: color-mix(in oklch, var(--s-kit-color-surface) var(--s-kit-panel-opacity), transparent);

    --s-kit-shadow-color: color-mix(in oklch, var(--s-kit-color-text) 18%, transparent);
    --s-kit-shadow-popover: 0 10px 30px var(--s-kit-shadow-color), 0 0 0 0.5px var(--s-kit-color-border-strong);
}

/* принудительная тема только задаёт color-scheme: light-dark() разрешается по нему на элементе-потребителе */
[data-s-kit-theme="light"] {
    color-scheme: light;
}

[data-s-kit-theme="dark"] {
    color-scheme: dark;
}

/* размер: на контроле или на обёртке; контрол без size переменную не объявляет */
[data-s-kit-size="sm"] {
    --s-kit-control-height: var(--s-kit-control-height-sm);
    --s-kit-control-padding-x: var(--s-kit-control-padding-x-sm);
    --s-kit-control-font-size: var(--s-kit-control-font-size-sm);
}

[data-s-kit-size="md"] {
    --s-kit-control-height: var(--s-kit-control-height-md);
    --s-kit-control-padding-x: var(--s-kit-control-padding-x-md);
    --s-kit-control-font-size: var(--s-kit-control-font-size-md);
}

[data-s-kit-size="lg"] {
    --s-kit-control-height: var(--s-kit-control-height-lg);
    --s-kit-control-padding-x: var(--s-kit-control-padding-x-lg);
    --s-kit-control-font-size: var(--s-kit-control-font-size-lg);
}

/* внутреннее кольцо фокуса для потомков обрезающего контейнера (раздел 5.1) */
[data-s-kit-focus-inset] {
    --s-kit-focus-ring-offset: calc(-1 * var(--s-kit-focus-width));
}
```

- [ ] **Step 8: Прогнать тесты и stylelint**

```bash
pnpm exec vitest run src/styles src/utils/color-math.test.ts
pnpm exec stylelint --fix "src/**/*.css"
pnpm exec stylelint "src/**/*.css"
```

Expected: все тесты PASS, stylelint без замечаний. `stylelint --fix` переупорядочит свойства и поправит форматирование; после `--fix` перезапустить тесты, они читают файл как есть. Если контраст какой-то пары в тесте < 4.5 (значения палитры утверждены владельцем), **не менять палитру молча**: остановиться и сообщить владельцу пару, значение и предложение; тест `control-edge` при 50 % должен пройти (расчёт в «Решениях плана», п. 3), если он падает, найти минимальный процент, проходящий 3:1 в обеих темах, поставить его и записать в сообщение коммита.

- [ ] **Step 9: Коммит**

```bash
git add src/utils/color-math.ts src/utils/color-math.test.ts src/styles
git commit -m "feat(tokens): базовые и производные токены Синей палитры, размеры, темы, фокус; тесты контракта и контраста" -m "$TRAILERS"
```

---

### Task 4: `createControllableSignal`

**Files:**
- Create: `src/utils/create-controllable-signal.ts`, `src/utils/create-controllable-signal.test.ts`

**Interfaces:**
- Produces:
  - `interface ControllableSignalOptions<T> { name: string; value: () => T | undefined; defaultValue: () => T; onChange?: ((next: T) => void) | undefined }`
  - `createControllableSignal<T>(options: ControllableSignalOptions<T>): [get: Accessor<T>, set: (next: T) => void]`
  - Режим фиксируется при первом вычислении; `undefined` из `value()` это «не контролируется», отсутствие значения выражается `null`.

- [ ] **Step 1: Падающий тест**

`src/utils/create-controllable-signal.test.ts`:

```ts
import { createRoot, createSignal } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';

import { createControllableSignal } from './create-controllable-signal';

function silentWarn() {
	return vi.spyOn(console, 'warn').mockImplementation(() => undefined);
}

describe('createControllableSignal', () => {
	it('uncontrolled: starts from defaultValue, set updates the value and calls onChange', () => {
		createRoot((dispose) => {
			const onChange = vi.fn();
			const [get, set] = createControllableSignal<number>({ name: 'Test', value: () => undefined, defaultValue: () => 1, onChange });
			expect(get()).toBe(1);
			set(2);
			expect(get()).toBe(2);
			expect(onChange).toHaveBeenCalledExactlyOnceWith(2);
			dispose();
		});
	});

	it('controlled: set only calls onChange, the value follows the prop', () => {
		createRoot((dispose) => {
			const [prop, setProp] = createSignal<number | undefined>(5);
			const onChange = vi.fn();
			const [get, set] = createControllableSignal<number>({ name: 'Test', value: prop, defaultValue: () => 0, onChange });
			expect(get()).toBe(5);
			set(6);
			expect(get()).toBe(5);
			expect(onChange).toHaveBeenCalledExactlyOnceWith(6);
			setProp(6);
			expect(get()).toBe(6);
			dispose();
		});
	});

	it('null is a controlled value, not "uncontrolled"', () => {
		createRoot((dispose) => {
			const [get, set] = createControllableSignal<string | null>({ name: 'Test', value: () => null, defaultValue: () => 'x' });
			expect(get()).toBeNull();
			set('y');
			expect(get()).toBeNull();
			dispose();
		});
	});

	it('stores function values as values, not as updaters', () => {
		createRoot((dispose) => {
			const first = (): number => 1;
			const second = (): number => 2;
			const [get, set] = createControllableSignal<() => number>({ name: 'Test', value: () => undefined, defaultValue: () => first });
			set(second);
			expect(get()).toBe(second);
			dispose();
		});
	});

	it('controlled to uncontrolled: keeps the last controlled value and warns once', () => {
		const warn = silentWarn();
		createRoot((dispose) => {
			const [prop, setProp] = createSignal<number | undefined>(5);
			const [get] = createControllableSignal<number>({ name: 'Counter', value: prop, defaultValue: () => 0 });
			expect(get()).toBe(5);
			setProp(undefined);
			expect(get()).toBe(5);
			expect(get()).toBe(5);
			expect(warn).toHaveBeenCalledOnce();
			expect(String(warn.mock.calls[0]?.[0])).toContain('Counter');
			dispose();
		});
	});

	it('uncontrolled to controlled: ignores the new prop and warns once', () => {
		const warn = silentWarn();
		createRoot((dispose) => {
			const [prop, setProp] = createSignal<number | undefined>(undefined);
			const [get] = createControllableSignal<number>({ name: 'Counter', value: prop, defaultValue: () => 1 });
			expect(get()).toBe(1);
			setProp(9);
			expect(get()).toBe(1);
			expect(get()).toBe(1);
			expect(warn).toHaveBeenCalledOnce();
			dispose();
		});
	});

	it('works without onChange', () => {
		createRoot((dispose) => {
			const [get, set] = createControllableSignal<boolean>({ name: 'Test', value: () => undefined, defaultValue: () => false });
			set(true);
			expect(get()).toBe(true);
			dispose();
		});
	});
});
```

- [ ] **Step 2: Тест падает**

Run: `pnpm exec vitest run src/utils/create-controllable-signal.test.ts`
Expected: FAIL: модуль не найден.

- [ ] **Step 3: Реализация**

`src/utils/create-controllable-signal.ts`:

```ts
import { type Accessor, createSignal } from 'solid-js';

export interface ControllableSignalOptions<T> {
	/** Имя компонента для предупреждений в dev-сборке. */
	name: string;
	/** Контролируемое значение из пропсов; `undefined` означает «не контролируется». */
	value: () => T | undefined;
	/** Начальное значение неконтролируемого режима. */
	defaultValue: () => T;
	onChange?: ((next: T) => void) | undefined;
}

/**
 * Общий хелпер controlled/uncontrolled. Режим фиксируется при первом вычислении:
 * переходы между режимами не поддерживаются и предупреждают в dev-сборке (раздел 7 спека).
 */
export function createControllableSignal<T>(options: ControllableSignalOptions<T>): [get: Accessor<T>, set: (next: T) => void] {
	const initial = options.value();
	const controlled = initial !== undefined;
	const [internal, setInternal] = createSignal<T>(initial !== undefined ? initial : options.defaultValue());

	let lastControlled = initial;
	let warned = false;
	const warnOnce = (message: string): void => {
		if (!import.meta.env.DEV || warned) {
			return;
		}
		warned = true;
		// eslint-disable-next-line no-console -- предупреждение разработчику, только в dev-сборке
		console.warn(`[solid-kit] ${options.name}: ${message}`);
	};

	const get: Accessor<T> = () => {
		const current = options.value();
		if (controlled) {
			if (current !== undefined) {
				lastControlled = current;
				return current;
			}
			warnOnce('the value switched from controlled to uncontrolled; the last controlled value is kept.');
			return lastControlled as T;
		}
		if (current !== undefined) {
			warnOnce('a value appeared on an uncontrolled component and is ignored.');
		}
		return internal();
	};

	const set = (next: T): void => {
		if (!controlled) {
			setInternal(() => next);
		}
		options.onChange?.(next);
	};

	return [get, set];
}
```

- [ ] **Step 4: Тесты проходят, линт чист**

```bash
pnpm exec vitest run src/utils/create-controllable-signal.test.ts
pnpm exec eslint src/utils --max-warnings 0
```

Expected: PASS (7 тестов), ESLint без замечаний (если `no-console` не включён, снять `eslint-disable`-комментарий: «неиспользуемая директива» тоже ошибка при `--max-warnings 0`).

- [ ] **Step 5: Коммит**

```bash
git add src/utils/create-controllable-signal.ts src/utils/create-controllable-signal.test.ts
git commit -m "feat(utils): createControllableSignal с предупреждениями о смене режима" -m "$TRAILERS"
```

---

### Task 5: Стек слоёв (`layer-stack`)

**Files:**
- Create: `src/utils/layer-stack.ts`, `src/utils/layer-stack.test.ts`

**Interfaces:**
- Produces:
  - `interface Layer { contains: (target: Node) => boolean; close: () => void }`
  - `registerLayer(layer: Layer): () => void` (возвращает функцию снятия с регистрации; повторный вызов безопасен)
  - `getLayerCount(): number`
  - Нативные слушатели `keydown` (Escape) и `pointerdown` на `document` в фазе захвата ставятся при первом слое и снимаются при последнем. Esc: `preventDefault()` + `stopPropagation()` + `close()` верхнего слоя. `pointerdown` вне `contains` верхнего слоя вызывает его `close()`. Закрывается только верхний слой; владелец слоя снимает его регистрацию сам.

- [ ] **Step 1: Падающий тест**

`src/utils/layer-stack.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLayerCount, registerLayer } from './layer-stack';

const unregisters: Array<() => void> = [];

function addLayer(contains: (target: Node) => boolean = () => false): { close: () => void; unregister: () => void } {
	const close = vi.fn();
	const unregister = registerLayer({ contains, close });
	unregisters.push(unregister);
	return { close, unregister };
}

function pressEscape(): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
	document.body.dispatchEvent(event);
	return event;
}

function pointerDownOn(target: Element): void {
	target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
}

afterEach(() => {
	for (const unregister of unregisters.splice(0)) {
		unregister();
	}
});

describe('layer stack', () => {
	it('Escape closes only the top layer and cancels the default action', () => {
		const lower = addLayer();
		const upper = addLayer();
		const event = pressEscape();
		expect(upper.close).toHaveBeenCalledOnce();
		expect(lower.close).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(true);
	});

	it('after the top layer is unregistered, Escape reaches the layer below', () => {
		const lower = addLayer();
		const upper = addLayer();
		upper.unregister();
		pressEscape();
		expect(lower.close).toHaveBeenCalledOnce();
	});

	it('ignores other keys', () => {
		const layer = addLayer();
		document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
		expect(layer.close).not.toHaveBeenCalled();
	});

	it('pointerdown outside the top layer closes it, inside does not', () => {
		const inside = document.createElement('div');
		const outside = document.createElement('div');
		document.body.append(inside, outside);
		const lower = addLayer();
		const upper = addLayer((target) => inside.contains(target));
		pointerDownOn(inside);
		expect(upper.close).not.toHaveBeenCalled();
		pointerDownOn(outside);
		expect(upper.close).toHaveBeenCalledOnce();
		expect(lower.close).not.toHaveBeenCalled();
		inside.remove();
		outside.remove();
	});

	it('counts layers and tolerates a repeated unregister', () => {
		expect(getLayerCount()).toBe(0);
		const layer = addLayer();
		expect(getLayerCount()).toBe(1);
		layer.unregister();
		layer.unregister();
		expect(getLayerCount()).toBe(0);
	});

	it('does nothing when the stack is empty', () => {
		const layer = addLayer();
		layer.unregister();
		const event = pressEscape();
		expect(event.defaultPrevented).toBe(false);
		expect(layer.close).not.toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Тест падает**

Run: `pnpm exec vitest run src/utils/layer-stack.test.ts`
Expected: FAIL: модуль не найден.

- [ ] **Step 3: Реализация**

`src/utils/layer-stack.ts`:

```ts
/** Открытый слой (панель или диалог). Раздел 8 спека: Esc и клик снаружи обрабатывает только верхний слой. */
export interface Layer {
	/** Принадлежит ли цель события слою (его панель или его инициатор). */
	contains: (target: Node) => boolean;
	/** Запрос закрытия; регистрацию снимает владелец слоя. */
	close: () => void;
}

const layers: Layer[] = [];
let listening = false;

function onKeyDown(event: KeyboardEvent): void {
	const top = layers.at(-1);
	if (event.key !== 'Escape' || !top) {
		return;
	}
	// фаза захвата на document: раньше любых обработчиков панели и делегированных обработчиков Solid
	event.preventDefault();
	event.stopPropagation();
	top.close();
}

function onPointerDown(event: PointerEvent): void {
	const top = layers.at(-1);
	if (!top || !(event.target instanceof Node) || top.contains(event.target)) {
		return;
	}
	top.close();
}

function startListening(): void {
	document.addEventListener('keydown', onKeyDown, true);
	document.addEventListener('pointerdown', onPointerDown, true);
	listening = true;
}

function stopListening(): void {
	document.removeEventListener('keydown', onKeyDown, true);
	document.removeEventListener('pointerdown', onPointerDown, true);
	listening = false;
}

/** Кладёт слой на вершину стека. Возвращает функцию снятия; повторный вызов безопасен. */
export function registerLayer(layer: Layer): () => void {
	layers.push(layer);
	if (!listening) {
		startListening();
	}
	return () => {
		const index = layers.indexOf(layer);
		if (index === -1) {
			return;
		}
		layers.splice(index, 1);
		if (layers.length === 0) {
			stopListening();
		}
	};
}

export function getLayerCount(): number {
	return layers.length;
}
```

- [ ] **Step 4: Тесты и линт**

```bash
pnpm exec vitest run src/utils/layer-stack.test.ts
pnpm exec eslint src/utils --max-warnings 0
```

Expected: PASS (6 тестов), линт чист.

- [ ] **Step 5: Коммит**

```bash
git add src/utils/layer-stack.ts src/utils/layer-stack.test.ts
git commit -m "feat(utils): стек слоёв: Esc и клик снаружи закрывают только верхний слой" -m "$TRAILERS"
```

---

### Task 6: Показ панели в top layer (`createPanelLayer`)

**Files:**
- Create: `src/utils/create-panel-layer.ts`, `src/utils/create-panel-layer.test.ts`

**Interfaces:**
- Consumes: `registerLayer`, `Layer` из `./layer-stack`.
- Produces:
  - `interface PanelLayerOptions { open: Accessor<boolean>; panel: Accessor<HTMLElement | undefined>; anchor: Accessor<Element | undefined>; onDismiss: () => void }`
  - `createPanelLayer(options: PanelLayerOptions): void`: пока `open()` и панель есть, ставит `popover="manual"`, вызывает `showPopover()`, регистрирует слой (`contains` = панель или инициатор, `close` = `onDismiss`); при закрытии или размонтировании снимает слой и вызывает `hidePopover()`, если панель ещё в документе.

- [ ] **Step 1: Падающий тест**

`src/utils/create-panel-layer.test.ts`:

```ts
import { createRoot, createSignal } from 'solid-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPanelLayer } from './create-panel-layer';
import { getLayerCount } from './layer-stack';

// jsdom не реализует Popover API
const showPopover = vi.fn();
const hidePopover = vi.fn();

beforeEach(() => {
	showPopover.mockReset();
	hidePopover.mockReset();
	HTMLElement.prototype.showPopover = showPopover;
	HTMLElement.prototype.hidePopover = hidePopover;
});

function mount() {
	const panel = document.createElement('div');
	const anchor = document.createElement('button');
	document.body.append(panel, anchor);
	const onDismiss = vi.fn();
	const [open, setOpen] = createSignal(false);
	createPanelLayer({ open, panel: () => panel, anchor: () => anchor, onDismiss });
	return { panel, anchor, onDismiss, setOpen };
}

describe('createPanelLayer', () => {
	it('shows the panel in the top layer and registers a layer while open', () => {
		createRoot((dispose) => {
			const { panel, setOpen } = mount();
			expect(showPopover).not.toHaveBeenCalled();
			setOpen(true);
			expect(panel.getAttribute('popover')).toBe('manual');
			expect(showPopover).toHaveBeenCalledOnce();
			expect(getLayerCount()).toBe(1);
			dispose();
		});
	});

	it('hides the panel and unregisters the layer on close', () => {
		createRoot((dispose) => {
			const { setOpen } = mount();
			setOpen(true);
			setOpen(false);
			expect(hidePopover).toHaveBeenCalledOnce();
			expect(getLayerCount()).toBe(0);
			dispose();
		});
	});

	it('unregisters the layer when the owner is disposed', () => {
		createRoot((dispose) => {
			const { setOpen } = mount();
			setOpen(true);
			dispose();
		});
		expect(getLayerCount()).toBe(0);
	});

	it('requests dismiss on Escape and on a pointerdown outside, not on the panel or the anchor', () => {
		createRoot((dispose) => {
			const { panel, anchor, onDismiss, setOpen } = mount();
			setOpen(true);
			panel.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
			anchor.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
			expect(onDismiss).not.toHaveBeenCalled();
			document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
			expect(onDismiss).toHaveBeenCalledTimes(1);
			document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
			expect(onDismiss).toHaveBeenCalledTimes(2);
			dispose();
		});
	});

	it('does nothing without a panel element', () => {
		createRoot((dispose) => {
			const [open] = createSignal(true);
			createPanelLayer({ open, panel: () => undefined, anchor: () => undefined, onDismiss: vi.fn() });
			expect(showPopover).not.toHaveBeenCalled();
			expect(getLayerCount()).toBe(0);
			dispose();
		});
	});

	it('does not throw when the panel is already detached on cleanup', () => {
		createRoot((dispose) => {
			const { panel, setOpen } = mount();
			setOpen(true);
			panel.remove();
			expect(() => setOpen(false)).not.toThrow();
			expect(hidePopover).not.toHaveBeenCalled();
			dispose();
		});
	});
});
```

- [ ] **Step 2: Тест падает**

Run: `pnpm exec vitest run src/utils/create-panel-layer.test.ts`
Expected: FAIL: модуль не найден.

- [ ] **Step 3: Реализация**

`src/utils/create-panel-layer.ts`:

```ts
import { type Accessor, createEffect, onCleanup, untrack } from 'solid-js';

import { registerLayer } from './layer-stack';

export interface PanelLayerOptions {
	open: Accessor<boolean>;
	panel: Accessor<HTMLElement | undefined>;
	/** Инициатор: pointerdown по нему не считается кликом снаружи. */
	anchor: Accessor<Element | undefined>;
	onDismiss: () => void;
}

function hidePanel(panel: HTMLElement): void {
	if (!panel.isConnected) {
		return;
	}
	try {
		panel.hidePopover();
	} catch {
		// браузер уже скрыл панель сам: повторное скрытие бросает InvalidStateError
	}
}

/**
 * Показ плавающей панели в top layer (Popover API, режим manual) и участие в стеке слоёв.
 * Закрытием управляет стек, а не браузер, поэтому `popover="manual"` (раздел 8 спека).
 */
export function createPanelLayer(options: PanelLayerOptions): void {
	createEffect(() => {
		const panel = options.panel();
		if (!options.open() || !panel) {
			return;
		}
		panel.setAttribute('popover', 'manual');
		panel.showPopover();
		const unregister = registerLayer({
			contains: (target) => panel.contains(target) || (options.anchor()?.contains(target) ?? false),
			close: () => {
				untrack(options.onDismiss);
			},
		});
		onCleanup(() => {
			unregister();
			hidePanel(panel);
		});
	});
}
```

- [ ] **Step 4: Тесты и линт**

```bash
pnpm exec vitest run src/utils/create-panel-layer.test.ts
pnpm exec eslint src/utils --max-warnings 0
```

Expected: PASS (6 тестов). Если «does not throw when the panel is already detached» падает из-за порядка очистки, проверить, что `hidePanel` смотрит на `isConnected` до вызова `hidePopover()`.

- [ ] **Step 5: Коммит**

```bash
git add src/utils/create-panel-layer.ts src/utils/create-panel-layer.test.ts
git commit -m "feat(utils): createPanelLayer: показ панели в top layer через Popover API и участие в стеке слоёв" -m "$TRAILERS"
```

---

### Task 7: `createAnchoredPosition`

**Files:**
- Create: `src/utils/create-anchored-position.ts`, `src/utils/create-anchored-position.test.ts`

**Interfaces:**
- Produces:
  - `type AnchorElement = Element | VirtualElement`
  - `interface AnchoredPositionOptions { anchor: Accessor<AnchorElement | undefined>; floating: Accessor<HTMLElement | undefined>; open: Accessor<boolean>; placement?: Placement; gap?: number; padding?: number; matchAnchorWidth?: boolean }`
  - `createAnchoredPosition(options): void`: пока `open()` и оба элемента есть, считает позицию через `computePosition` (strategy `fixed`, `offset(gap=4)`, `flip({padding=8})`, `shift({padding=8})`, `size({padding=8})` с `max-height` по доступной высоте и опциональной шириной якоря) и пишет `position: fixed; left; top` в `style` панели; `autoUpdate` живёт только пока панель открыта и снимается в `onCleanup`. Значения по умолчанию из референса (раздел 8 спека): `placement: 'bottom-start'`.

- [ ] **Step 1: Падающий тест**

`src/utils/create-anchored-position.test.ts`:

```ts
import type { VirtualElement } from '@floating-ui/dom';
import { createRoot, createSignal } from 'solid-js';
import { describe, expect, it } from 'vitest';

import { createAnchoredPosition } from './create-anchored-position';

function pointAnchor(x: number, y: number): VirtualElement {
	return {
		getBoundingClientRect: () => ({ x, y, left: x, top: y, right: x, bottom: y, width: 0, height: 0, toJSON: () => ({}) }),
	};
}

describe('createAnchoredPosition', () => {
	it('places the floating element under the anchor with the default offset and fixed strategy', async () => {
		const floating = document.createElement('div');
		document.body.append(floating);
		await createRoot(async (dispose) => {
			const [open, setOpen] = createSignal(false);
			createAnchoredPosition({ anchor: () => pointAnchor(100, 100), floating: () => floating, open });
			setOpen(true);
			await expect.poll(() => floating.style.left).toBe('100px');
			expect(floating.style.top).toBe('104px');
			expect(floating.style.position).toBe('fixed');
			expect(floating.style.maxHeight).toMatch(/^\d+(\.\d+)?px$/);
			dispose();
		});
		floating.remove();
	});

	it('does not write styles while closed', async () => {
		const floating = document.createElement('div');
		document.body.append(floating);
		createRoot((dispose) => {
			createAnchoredPosition({ anchor: () => pointAnchor(10, 10), floating: () => floating, open: () => false });
			dispose();
		});
		await Promise.resolve();
		expect(floating.style.left).toBe('');
		floating.remove();
	});

	it('does not write styles after the owner is disposed', async () => {
		const floating = document.createElement('div');
		document.body.append(floating);
		createRoot((dispose) => {
			createAnchoredPosition({ anchor: () => pointAnchor(10, 10), floating: () => floating, open: () => true });
			dispose();
		});
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(floating.style.left).toBe('');
		floating.remove();
	});
});
```

- [ ] **Step 2: Тест падает**

Run: `pnpm exec vitest run src/utils/create-anchored-position.test.ts`
Expected: FAIL: модуль не найден.

- [ ] **Step 3: Реализация**

`src/utils/create-anchored-position.ts`:

```ts
import { autoUpdate, computePosition, flip, offset, type Placement, shift, size, type VirtualElement } from '@floating-ui/dom';
import { type Accessor, createEffect, onCleanup } from 'solid-js';

/** Реальный элемент или виртуальный (точка клика ContextMenu). */
export type AnchorElement = Element | VirtualElement;

export interface AnchoredPositionOptions {
	anchor: Accessor<AnchorElement | undefined>;
	floating: Accessor<HTMLElement | undefined>;
	open: Accessor<boolean>;
	/** По умолчанию `bottom-start`. */
	placement?: Placement;
	/** Зазор между якорем и панелью, по умолчанию 4. */
	gap?: number;
	/** Отступ от краёв вьюпорта для flip/shift/size, по умолчанию 8. */
	padding?: number;
	/** Ширина панели равна ширине якоря (разделы 6.2 и 8 спека). */
	matchAnchorWidth?: boolean;
}

/**
 * Позиционирование плавающей панели поверх `@floating-ui/dom`. Панель показывается в top layer
 * (createPanelLayer), поэтому позиция `fixed` считается относительно вьюпорта.
 */
export function createAnchoredPosition(options: AnchoredPositionOptions): void {
	createEffect(() => {
		const anchor = options.anchor();
		const floating = options.floating();
		if (!options.open() || !anchor || !floating) {
			return;
		}

		const padding = options.padding ?? 8;
		let active = true;

		const update = (): void => {
			void computePosition(anchor, floating, {
				placement: options.placement ?? 'bottom-start',
				strategy: 'fixed',
				middleware: [
					offset(options.gap ?? 4),
					flip({ padding }),
					shift({ padding }),
					size({
						padding,
						apply({ availableHeight, rects, elements }) {
							elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
							if (options.matchAnchorWidth) {
								elements.floating.style.width = `${rects.reference.width}px`;
							}
						},
					}),
				],
			}).then(({ x, y }) => {
				if (active) {
					Object.assign(floating.style, { position: 'fixed', left: `${x}px`, top: `${y}px` });
				}
			});
		};

		const stop = autoUpdate(anchor, floating, update);
		onCleanup(() => {
			active = false;
			stop();
		});
	});
}
```

- [ ] **Step 4: Тесты и линт**

```bash
pnpm exec vitest run src/utils/create-anchored-position.test.ts
pnpm exec eslint src/utils --max-warnings 0
```

Expected: PASS (3 теста). Если в jsdom `computePosition` бросает из-за отсутствия API (ResizeObserver и т. п.), не мокать Floating UI: `autoUpdate` проверяет наличие `ResizeObserver`/`IntersectionObserver` сам; разобрать фактическую ошибку и записать в комментарий теста, что именно не поддерживает jsdom. Реальная геометрия проверяется в playground (Task 10).

- [ ] **Step 5: Коммит**

```bash
git add src/utils/create-anchored-position.ts src/utils/create-anchored-position.test.ts
git commit -m "feat(utils): createAnchoredPosition поверх @floating-ui/dom (flip, shift, size, autoUpdate)" -m "$TRAILERS"
```

---

### Task 8: Тестовые компоненты `Probe` и `ProbeUnused`

**Files:**
- Create: `src/components/probe/{index.ts, probe.tsx, probe-scope.ts, probe.module.css, probe.test.tsx}`
- Create: `src/components/probe-unused/{index.ts, probe-unused.tsx, probe-unused.module.css}`

**Interfaces:**
- Consumes: `createControllableSignal`, `createPanelLayer`, `createAnchoredPosition`, `tokens.css`.
- Produces:
  - `Probe(props: ProbeProps)`; `interface ProbeProps { open?; defaultOpen?; onOpenChange?; size?: 'sm' | 'md' | 'lg'; class?; style?; children?: JSX.Element }`. Кнопка-инициатор и панель (в top layer) соседи в DOM; панель несёт `data-s-kit` и `data-probe-panel`; кнопка `data-probe="marker-used"`.
  - `ProbeScope: Context<{ label: string }>` (значение по умолчанию `{ label: 'default' }`; панель оборачивает детей в провайдер со значением `{ label: 'probe-scope' }`). Используется критерием 1 для проверки единственной копии `solid-js`.
  - `ProbeUnused`: компонент с маркером `data-probe="marker-unused"`; никем не импортируется, служит проверкой tree-shaking.
  - Компонентные токены: `--s-kit-probe-bg`, `--s-kit-probe-bg-hover`, `--s-kit-probe-bg-active`, `--s-kit-probe-color`, `--s-kit-probe-radius`, `--s-kit-probe-panel-bg`.

- [ ] **Step 1: Падающий компонентный тест**

`src/components/probe/probe.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { useContext } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Probe } from './probe';
import { ProbeScope } from './probe-scope';

beforeEach(() => {
	// jsdom не реализует Popover API
	HTMLElement.prototype.showPopover = vi.fn();
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

function Scope() {
	return <span data-testid="scope">{useContext(ProbeScope).label}</span>;
}

describe('Probe', () => {
	it('is closed by default and toggles on click (uncontrolled)', () => {
		render(() => <Probe>content</Probe>);
		const button = screen.getByRole('button');
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(screen.queryByText('content')).toBeNull();
		fireEvent.click(button);
		expect(button.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getByText('content')).toBeTruthy();
		fireEvent.click(button);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('controlled: click only reports the change, the prop decides', () => {
		const onOpenChange = vi.fn();
		render(() => <Probe open={false} onOpenChange={onOpenChange}>content</Probe>);
		fireEvent.click(screen.getByRole('button'));
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('defaultOpen starts open', () => {
		render(() => <Probe defaultOpen>content</Probe>);
		expect(screen.getByText('content')).toBeTruthy();
	});

	it('Escape closes the open panel', () => {
		render(() => <Probe defaultOpen>content</Probe>);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByText('content')).toBeNull();
	});

	it('a click outside closes the panel, a click on the trigger does not close it by itself', () => {
		render(() => <Probe defaultOpen>content</Probe>);
		fireEvent.pointerDown(screen.getByRole('button'));
		expect(screen.getByText('content')).toBeTruthy();
		fireEvent.pointerDown(document.body);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('exposes the kit scope to the panel content through the shared context', () => {
		render(() => (
			<Probe defaultOpen>
				<Scope />
			</Probe>
		));
		expect(screen.getByTestId('scope').textContent).toBe('probe-scope');
	});

	it('puts data-s-kit and the size attribute on the roots', () => {
		render(() => (
			<Probe defaultOpen size="lg">
				content
			</Probe>
		));
		const button = screen.getByRole('button');
		expect(button.hasAttribute('data-s-kit')).toBe(true);
		expect(button.getAttribute('data-s-kit-size')).toBe('lg');
		expect(document.querySelector('[data-probe-panel]')?.hasAttribute('data-s-kit')).toBe(true);
	});
});
```

- [ ] **Step 2: Тест падает**

Run: `pnpm exec vitest run src/components/probe`
Expected: FAIL: модули не найдены.

- [ ] **Step 3: `probe-scope.ts`**

```ts
import { createContext } from 'solid-js';

export interface ProbeScopeValue {
	label: string;
}

/** Контекст кита: по нему критерий 1 проверяет, что у приложения и кита одна копия solid-js. */
export const ProbeScope = createContext<ProbeScopeValue>({ label: 'default' });
```

- [ ] **Step 4: `probe.module.css`**

```css
/*
 * Компонентные токены Probe (публичный API кастомизации):
 *   --s-kit-probe-bg, --s-kit-probe-bg-hover, --s-kit-probe-bg-active, --s-kit-probe-color,
 *   --s-kit-probe-radius, --s-kit-probe-panel-bg
 * Probe это тестовый стенд этапа 0 (критерии 1, 2, 5); на этапе 1 его заменяет Button.
 */

.root {
    display: inline-flex;
    box-sizing: border-box;
    align-items: center;
    justify-content: center;
    padding-block: 0;
    padding-inline: var(--s-kit-control-padding-x, var(--s-kit-control-padding-x-md));
    border: 0;
    border-radius: var(--s-kit-probe-radius, var(--s-kit-radius));
    background: var(--s-kit-probe-bg, var(--s-kit-color-primary));
    block-size: var(--s-kit-control-height, var(--s-kit-control-height-md));
    color: var(--s-kit-probe-color, var(--s-kit-color-primary-contrast));
    font-family: var(--s-kit-font);
    font-size: var(--s-kit-control-font-size, var(--s-kit-control-font-size-md));
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 150ms;
}

.root:hover {
    background: var(--s-kit-probe-bg-hover, var(--s-kit-color-primary-hover));
}

.root:active {
    background: var(--s-kit-probe-bg-active, var(--s-kit-color-primary-active));
}

.root:focus-visible {
    outline: var(--s-kit-focus-width) solid var(--s-kit-color-focus-ring);
    outline-offset: var(--s-kit-focus-ring-offset, var(--s-kit-focus-offset));
}

.panel {
    /* сброс UA-стилей [popover]; позиция приходит от Floating UI (inline-стили) */
    inset: auto;
    box-sizing: border-box;
    min-inline-size: 160px;
    margin: 0;
    padding: 6px;
    overflow: auto;
    border: 0;
    border-radius: calc(var(--s-kit-radius) * 1.5);

    /* запасной сплошной фон, затем полупрозрачный материал (раздел 4.3) */
    background: var(--s-kit-probe-panel-bg, var(--s-kit-color-surface));
    box-shadow: var(--s-kit-shadow-popover);
    color: var(--s-kit-color-text);

    /* сброс наследуемых свойств на корне панели (раздел 8.2): токены и color-scheme не трогаем */
    font-family: var(--s-kit-font);
    font-size: var(--s-kit-font-size);
    font-style: normal;
    font-weight: 400;
    line-height: var(--s-kit-line-height);
    text-align: start;
    text-indent: 0;
    text-shadow: none;
    text-transform: none;
    letter-spacing: normal;
    white-space: normal;
    word-break: normal;
    visibility: visible;
    cursor: auto;
    pointer-events: auto;
    user-select: text;
}

@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    @media not (prefers-reduced-transparency: reduce) {
        .panel {
            background: var(--s-kit-probe-panel-bg, var(--s-kit-color-panel));
            -webkit-backdrop-filter: blur(var(--s-kit-panel-blur));
            backdrop-filter: blur(var(--s-kit-panel-blur));
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    .root {
        transition: none;
    }
}
```

- [ ] **Step 5: `probe.tsx`**

```tsx
import { createSignal, type JSX, Show } from 'solid-js';

import { createAnchoredPosition } from '../../utils/create-anchored-position';
import { createControllableSignal } from '../../utils/create-controllable-signal';
import { createPanelLayer } from '../../utils/create-panel-layer';
import styles from './probe.module.css';
import { ProbeScope } from './probe-scope';

export interface ProbeProps {
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	size?: 'sm' | 'md' | 'lg' | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

/** Тестовый стенд этапа 0: кнопка и панель в top layer на хелперах кита. */
export function Probe(props: ProbeProps): JSX.Element {
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'Probe',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next),
	});
	const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
	const [panel, setPanel] = createSignal<HTMLDivElement>();

	createAnchoredPosition({ anchor: trigger, floating: panel, open });
	createPanelLayer({ panel, anchor: trigger, open, onDismiss: () => setOpen(false) });

	return (
		<>
			<button
				ref={setTrigger}
				type="button"
				data-s-kit
				data-probe="marker-used"
				data-s-kit-size={props.size}
				class={props.class ? `${styles['root']} ${props.class}` : styles['root']}
				style={props.style}
				aria-expanded={open()}
				onClick={() => setOpen(!open())}
			>
				Probe
			</button>
			<Show when={open()}>
				<div ref={setPanel} data-s-kit data-probe-panel class={styles['panel']}>
					<ProbeScope.Provider value={{ label: 'probe-scope' }}>{props.children}</ProbeScope.Provider>
				</div>
			</Show>
		</>
	);
}
```

`styles['root']` из-за `noPropertyAccessFromIndexSignature` (тип `CSSModuleClasses` это индексная сигнатура).

- [ ] **Step 6: `index.ts`**

```ts
export { Probe } from './probe';
export type { ProbeProps } from './probe';
export { ProbeScope } from './probe-scope';
export type { ProbeScopeValue } from './probe-scope';
```

- [ ] **Step 7: `ProbeUnused` (проверка tree-shaking)**

`src/components/probe-unused/probe-unused.module.css`:

```css
/* Стенд критерия 1: компонент, который никто не импортирует и которого не должно быть в бандле потребителя. */

.root {
    color: var(--s-kit-color-text);
}
```

`src/components/probe-unused/probe-unused.tsx`:

```tsx
import type { JSX } from 'solid-js';

import styles from './probe-unused.module.css';

export function ProbeUnused(): JSX.Element {
	return <span data-probe="marker-unused" class={styles['root']}>unused</span>;
}
```

`src/components/probe-unused/index.ts`:

```ts
export { ProbeUnused } from './probe-unused';
```

- [ ] **Step 8: Тесты, линты, типы**

```bash
pnpm exec vitest run
pnpm exec stylelint --fix "src/**/*.css" && pnpm exec stylelint "src/**/*.css"
pnpm exec eslint . --max-warnings 0 --fix
pnpm exec tsc --noEmit
```

Expected: все тесты PASS (в том числе тесты прежних задач), stylelint и ESLint чисты, `tsc` без ошибок. Типичные поправки: порядок импортов и отступы (автофикс), типы `style` под `exactOptionalPropertyTypes`, расхождение имён классов CSS Modules. Если `styles['root']` не типизируется, проверить, что в `tsconfig.json` стоит `"types": ["vite/client"]`.

- [ ] **Step 9: Коммит**

```bash
git add src/components
git commit -m "feat(probe): тестовые компоненты этапа 0: Probe (хелперы, токены, top layer) и ProbeUnused (tree-shaking)" -m "$TRAILERS"
```

---

### Task 9: Playground и страница «Темы»

**Files:**
- Create: `playground/package.json`, `playground/tsconfig.json`, `playground/vite.config.ts`, `playground/index.html`
- Create: `playground/src/{main.tsx, playground.css, palettes.ts, derived-swatches.tsx, theme-checks.ts, themes-page.tsx}`

**Interfaces:**
- Consumes: `@stark/solid-kit/probe` (через `workspace:*`, то есть через `exports` кита, а не относительным путём), `@stark/solid-kit/tokens.css`, `src/utils/color-math.ts` (относительный импорт: это внутренний хелпер, он не экспортируется).
- Produces: страница «Темы» с переключателями темы, размера, primary и палитры-примера; сценарии критерия 5; блок «Проверки» с результатами OK/FAIL (`runThemeChecks(root): CheckResult[]`).

- [ ] **Step 1: Файлы проекта playground**

`playground/package.json`:

```json
{
	"name": "playground",
	"private": true,
	"type": "module",
	"scripts": {
		"dev": "vite",
		"build": "vite build"
	},
	"dependencies": {
		"@stark/solid-kit": "workspace:*",
		"solid-js": "1.9.17"
	},
	"devDependencies": {
		"vite": "8.3.5",
		"vite-plugin-solid": "2.11.14"
	}
}
```

`playground/tsconfig.json`:

```json
{
	"extends": "../tsconfig.json",
	"include": ["src", "vite.config.ts"]
}
```

`playground/vite.config.ts` (никаких `optimizeDeps`/`ssr`/`dedupe`: настройки появятся в требованиях к потребителю, только если матрица критерия 1 покажет необходимость):

```ts
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({ plugins: [solid()] });
```

`playground/index.html`:

```html
<!doctype html>
<html lang="ru">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>solid-kit playground</title>
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/main.tsx"></script>
	</body>
</html>
```

- [ ] **Step 2: Палитры-примеры**

`playground/src/palettes.ts`:

```ts
import type { JSX } from 'solid-js';

export type PaletteName = 'blue' | 'mono';

export const PALETTE_NAMES: readonly PaletteName[] = ['blue', 'mono'];

/**
 * Переопределения базовых токенов для палитр-примеров. Синий равен `tokens.css` (рабочая палитра),
 * Моно проверяет худший случай: primary почти равен цвету текста (раздел 4.1 спека).
 */
export const PALETTES: Record<PaletteName, JSX.CSSProperties> = {
	blue: {},
	mono: {
		'--s-kit-color-primary': 'light-dark(#1d1d1f, #f5f5f7)',
		'--s-kit-color-primary-contrast': 'light-dark(#fff, #1d1d1f)',
	},
};
```

- [ ] **Step 3: Проверки страницы**

`playground/src/theme-checks.ts`:

```ts
import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

export interface CheckResult {
	readonly name: string;
	readonly ok: boolean;
	readonly detail: string;
}

type Rgba = readonly [red: number, green: number, blue: number, alpha: number];

let context: CanvasRenderingContext2D | undefined;

/** Приводит любой CSS-цвет (в том числе результат color-mix и light-dark) к байтам sRGB через канвас 1x1. */
function resolveColor(cssColor: string): Rgba {
	if (!context) {
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		const created = canvas.getContext('2d', { willReadFrequently: true });
		if (!created) {
			throw new Error('2d canvas is not available');
		}
		context = created;
	}
	const canvasContext = context;
	const read = (sentinel: string): Rgba => {
		canvasContext.clearRect(0, 0, 1, 1);
		canvasContext.fillStyle = sentinel;
		canvasContext.fillStyle = cssColor;
		canvasContext.fillRect(0, 0, 1, 1);
		const [red = 0, green = 0, blue = 0, alpha = 0] = canvasContext.getImageData(0, 0, 1, 1).data;
		return [red, green, blue, alpha];
	};
	const onBlack = read('#000');
	const onWhite = read('#fff');
	// если строка не разобралась, fillStyle остаётся прежним и результаты расходятся
	if (onBlack.some((channel, index) => channel !== onWhite[index])) {
		throw new Error(`Cannot parse colour: ${cssColor}`);
	}
	return onBlack;
}

function required(root: ParentNode, selector: string): HTMLElement {
	const element = root.querySelector<HTMLElement>(selector);
	if (!element) {
		throw new Error(`Playground element is missing: ${selector}`);
	}
	return element;
}

function background(element: Element): Rgba {
	return resolveColor(getComputedStyle(element).backgroundColor);
}

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

function distance(first: Rgba, second: Rgba): number {
	return Math.max(Math.abs(first[0] - second[0]), Math.abs(first[1] - second[1]), Math.abs(first[2] - second[2]));
}

/** Сценарии критерия 5 (раздел 12 спека), которые можно проверить кодом в браузере. */
export function runThemeChecks(root: ParentNode): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	// вложенные области: тёмная обёртка sm с переопределённым primary, форма с компонентным токеном, панель в top layer
	const nested = required(root, '[data-scenario="nested"]');
	const panel = required(nested, '[data-probe-panel]');
	const chip = required(panel, '[data-chip]');

	check('панель показана в top layer', panel.matches(':popover-open'), `:popover-open = ${panel.matches(':popover-open')}`);

	const panelBackground = background(panel);
	check(
		'панель получила компонентный токен формы (--s-kit-probe-panel-bg)',
		panelBackground[0] === 255 && panelBackground[1] === 232 && panelBackground[2] === 204,
		`фон панели rgb(${panelBackground[0]} ${panelBackground[1]} ${panelBackground[2]}), ожидался rgb(255 232 204)`,
	);

	const height = getComputedStyle(panel).getPropertyValue('--s-kit-control-height').trim();
	check('размер обёртки (sm) дошёл до панели', height === '28px', `--s-kit-control-height = "${height}"`);

	const originalTheme = nested.getAttribute('data-s-kit-theme');
	for (const [theme, expected] of [
		['light', [124, 58, 237]],
		['dark', [167, 139, 250]],
	] as const) {
		nested.setAttribute('data-s-kit-theme', theme);
		const colorScheme = getComputedStyle(panel).colorScheme;
		const primary = background(chip);
		check(
			`смена темы обёртки на ${theme} при открытой панели отражается на панели и на primary`,
			colorScheme === theme && primary[0] === expected[0] && primary[1] === expected[1] && primary[2] === expected[2],
			`color-scheme = ${colorScheme}, primary = rgb(${primary[0]} ${primary[1]} ${primary[2]})`,
		);
	}
	if (originalTheme) {
		nested.setAttribute('data-s-kit-theme', originalTheme);
	}

	const originalSize = nested.getAttribute('data-s-kit-size');
	nested.setAttribute('data-s-kit-size', 'lg');
	const largeHeight = getComputedStyle(panel).getPropertyValue('--s-kit-control-height').trim();
	check('смена размера обёртки на lg при открытой панели отражается на панели', largeHeight === '40px', `--s-kit-control-height = "${largeHeight}"`);
	if (originalSize) {
		nested.setAttribute('data-s-kit-size', originalSize);
	}

	// hover и active заметно отличаются от покоя на обеих палитрах в обеих темах (раздел 4.1)
	for (const group of root.querySelectorAll<HTMLElement>('[data-swatch-group]')) {
		const rest = background(required(group, '[data-swatch="primary"]'));
		const hover = background(required(group, '[data-swatch="hover"]'));
		const active = background(required(group, '[data-swatch="active"]'));
		const hoverShift = distance(rest, hover);
		const activeShift = distance(rest, active);
		check(
			`${group.dataset['swatchGroup'] ?? '?'}: hover и active отличаются от покоя`,
			hoverShift >= 12 && activeShift > hoverShift,
			`сдвиг hover = ${hoverShift}, active = ${activeShift} (нужно hover >= 12 и active > hover)`,
		);
	}

	// материал панели: контраст текста не ниже 4.5:1 на самых неблагоприятных фонах под панелью (раздел 4.3)
	for (const theme of ['light', 'dark']) {
		const material = required(root, `[data-scenario="${theme}"] [data-probe-panel]`);
		const style = getComputedStyle(material);
		const fill = resolveColor(style.backgroundColor);
		const text = rgb(resolveColor(style.color));
		const worst = Math.min(
			...([
				[0, 0, 0],
				[255, 255, 255],
			] as const).map((backdrop) => contrastRatio(text, blend(rgb(fill), fill[3] / 255, backdrop))),
		);
		check(`${theme}: контраст текста панели на любом фоне под ней`, worst >= 4.5, `минимум ${worst.toFixed(2)}:1 (нужно 4.5:1)`);
	}

	return results;
}
```

- [ ] **Step 4: Образцы производных токенов**

`playground/src/derived-swatches.tsx`:

```tsx
import { For, type JSX } from 'solid-js';

import { PALETTE_NAMES, PALETTES } from './palettes';

const THEMES = ['light', 'dark'] as const;
const KINDS = ['primary', 'hover', 'active', 'subtle'] as const;

const TOKEN_BY_KIND: Record<(typeof KINDS)[number], string> = {
	primary: '--s-kit-color-primary',
	hover: '--s-kit-color-primary-hover',
	active: '--s-kit-color-primary-active',
	subtle: '--s-kit-color-primary-subtle',
};

/** Покой, hover, active и subtle основной кнопки для палитр Синий и Моно в обеих темах. */
export function DerivedSwatches(): JSX.Element {
	return (
		<div class="swatch-grid">
			<For each={PALETTE_NAMES}>
				{(palette) => (
					<For each={THEMES}>
						{(theme) => (
							<div data-s-kit data-swatch-group={`${palette}-${theme}`} data-s-kit-theme={theme} style={PALETTES[palette]} class="swatch-group">
								<strong>{palette} / {theme}</strong>
								<div class="swatch-row">
									<For each={KINDS}>
										{(kind) => (
											<span class="swatch" data-swatch={kind} style={{ background: `var(${TOKEN_BY_KIND[kind]})` }}>
												{kind}
											</span>
										)}
									</For>
								</div>
							</div>
						)}
					</For>
				)}
			</For>
		</div>
	);
}
```

- [ ] **Step 5: Страница «Темы»**

`playground/src/themes-page.tsx`:

```tsx
import { Probe } from '@stark/solid-kit/probe';
import { createEffect, createSignal, For, type JSX, onMount } from 'solid-js';

import { DerivedSwatches } from './derived-swatches';
import { PALETTE_NAMES, PALETTES, type PaletteName } from './palettes';
import { type CheckResult, runThemeChecks } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';
type Size = 'default' | 'sm' | 'md' | 'lg';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];
const SIZES: readonly Size[] = ['default', 'sm', 'md', 'lg'];

function pick<T extends string>(options: readonly T[], value: string, fallback: T): T {
	return options.find((option) => option === value) ?? fallback;
}

export function ThemesPage(): JSX.Element {
	const [theme, setTheme] = createSignal<Theme>('system');
	const [size, setSize] = createSignal<Size>('default');
	const [palette, setPalette] = createSignal<PaletteName>('blue');
	const [primary, setPrimary] = createSignal('');
	const [results, setResults] = createSignal<readonly CheckResult[]>([]);
	let page: HTMLElement | undefined;
	let dialog: HTMLDialogElement | undefined;

	// системная тема: атрибута нет; иначе color-scheme принудительно на <html>
	createEffect(() => {
		const root = document.documentElement;
		if (theme() === 'system') {
			root.removeAttribute('data-s-kit-theme');
		} else {
			root.setAttribute('data-s-kit-theme', theme());
		}
	});

	const pageStyle = (): JSX.CSSProperties => ({
		...PALETTES[palette()],
		...(primary() ? { '--s-kit-color-primary': primary() } : {}),
	});

	const runChecks = (): void => {
		if (page) {
			setResults(runThemeChecks(page));
		}
	};

	// панели позиционируются асинхронно: проверки запускаются после двух кадров
	onMount(() => {
		requestAnimationFrame(() => {
			requestAnimationFrame(runChecks);
		});
	});

	return (
		<main ref={page} class="page" data-s-kit-size={size() === 'default' ? undefined : size()} style={pageStyle()}>
			<header class="toolbar">
				<h1>Темы</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
				<label>
					Размер
					<select onChange={(event) => setSize(pick(SIZES, event.currentTarget.value, 'default'))}>
						<For each={SIZES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
				<label>
					Палитра
					<select onChange={(event) => setPalette(pick(PALETTE_NAMES, event.currentTarget.value, 'blue'))}>
						<For each={PALETTE_NAMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
				<label>
					Primary
					<input type="color" value="#0071e3" onInput={(event) => setPrimary(event.currentTarget.value)} />
				</label>
				<button type="button" onClick={() => setPrimary('')}>
					Сбросить primary
				</button>
			</header>

			<section>
				<h2>1. Системная тема и принудительная тема на обёртке</h2>
				<p>
					prefers-color-scheme: dark = {String(window.matchMedia('(prefers-color-scheme: dark)').matches)}. Обёртки ниже
					принудительно светлая и тёмная; тема переключается только внутри них.
				</p>
				<div class="boxes">
					<div class="box" data-scenario="light" data-s-kit-theme="light">
						<Probe defaultOpen>Светлая обёртка</Probe>
					</div>
					<div class="box" data-scenario="dark" data-s-kit-theme="dark">
						<Probe defaultOpen>Тёмная обёртка</Probe>
					</div>
				</div>
			</section>

			<section>
				<h2>2. Производные токены: покой, hover, active, subtle</h2>
				<DerivedSwatches />
			</section>

			<section>
				<h2>3. Вложенные области: панель в top layer получает тему, размер, primary и токен формы</h2>
				<div
					class="box"
					data-scenario="nested"
					data-s-kit-theme="dark"
					data-s-kit-size="sm"
					style={{ '--s-kit-color-primary': 'light-dark(#7c3aed, #a78bfa)' }}
				>
					<form style={{ '--s-kit-probe-panel-bg': '#ffe8cc' }} onSubmit={(event) => event.preventDefault()}>
						<Probe defaultOpen>
							<i class="chip" data-chip />
							Содержимое панели
						</Probe>
					</form>
				</div>
			</section>

			<section>
				<h2>4. Панель поверх модального Dialog</h2>
				<button type="button" onClick={() => dialog?.showModal()}>
					Открыть dialog
				</button>
				<dialog ref={dialog} data-s-kit-theme="dark" data-s-kit-size="sm" class="dialog">
					<Probe>Панель над dialog</Probe>
					<button type="button" onClick={() => dialog?.close()}>
						Закрыть
					</button>
				</dialog>
			</section>

			<section>
				<h2>5. Проверки</h2>
				<button type="button" onClick={runChecks}>
					Запустить проверки
				</button>
				<ul class="checks">
					<For each={results()}>
						{(result) => (
							<li data-ok={result.ok}>
								{result.ok ? 'OK' : 'FAIL'}: {result.name} <small>({result.detail})</small>
							</li>
						)}
					</For>
				</ul>
			</section>
		</main>
	);
}
```

- [ ] **Step 6: Точка входа и стили**

`playground/src/main.tsx`:

```tsx
import '@stark/solid-kit/tokens.css';
import './playground.css';

import { render } from 'solid-js/web';

import { ThemesPage } from './themes-page';

const root = document.getElementById('root');
if (!root) {
	throw new Error('#root is missing');
}
render(() => <ThemesPage />, root);
```

`playground/src/playground.css`:

```css
html {
    background: var(--s-kit-color-surface);
    color: var(--s-kit-color-text);
    font-family: var(--s-kit-font);
    font-size: var(--s-kit-font-size);
    line-height: var(--s-kit-line-height);
}

body {
    margin: 0;
}

.page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-inline-size: 1100px;
    padding: 24px;
    background: var(--s-kit-color-surface);
    color: var(--s-kit-color-text);
}

.toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
}

.toolbar h1 {
    margin: 0 auto 0 0;
    font-size: 20px;
}

h2 {
    margin: 0 0 8px;
    font-size: 14px;
}

.boxes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.box {
    min-block-size: 220px;
    padding: 16px;
    border: 1px solid var(--s-kit-color-hairline);
    border-radius: calc(var(--s-kit-radius) * 1.5);
    background: var(--s-kit-color-surface);
    color: var(--s-kit-color-text);
}

.chip {
    display: inline-block;
    inline-size: 16px;
    block-size: 16px;
    margin-inline-end: 8px;
    border-radius: 4px;
    background: var(--s-kit-color-primary);
    vertical-align: middle;
}

.swatch-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.swatch-group {
    padding: 12px;
    border-radius: var(--s-kit-radius);
    background: var(--s-kit-color-surface);
    color: var(--s-kit-color-text);
}

.swatch-row {
    display: flex;
    gap: 8px;
    margin-block-start: 8px;
}

.swatch {
    display: grid;
    flex: 1;
    place-items: center;
    block-size: 40px;
    border-radius: var(--s-kit-radius);
    color: var(--s-kit-color-primary-contrast);
    font-size: 11px;
}

.dialog {
    border: 0;
    border-radius: calc(var(--s-kit-radius) * 1.5);
    background: var(--s-kit-color-surface);
    color: var(--s-kit-color-text);
}

.checks {
    padding: 0;
    list-style: none;
}

.checks li {
    padding-block: 2px;
}

.checks li[data-ok="true"] {
    color: var(--s-kit-color-success);
}

.checks li[data-ok="false"] {
    color: var(--s-kit-color-danger);
    font-weight: 600;
}
```

- [ ] **Step 7: Установка, типы, линт, сборка**

```bash
pnpm install
pnpm exec stylelint --fix "playground/src/**/*.css"
pnpm exec eslint . --max-warnings 0 --fix
pnpm typecheck
pnpm --filter playground build
```

Expected: `pnpm install` линкует playground на корень (`workspace:*`), типы и линт чисты, `vite build` собирает без ошибок и без предупреждения о нескольких копиях `solid-js`. Если сборка не может разрешить `@stark/solid-kit/probe`: проверить `exports` (`./*`) и что `vite-plugin-solid` 2.11.14 установлен в `playground`. Любую настройку Vite (`optimizeDeps`, `resolve.dedupe`, `ssr.noExternal`) добавлять **только** при доказанной необходимости и записать это в раздел 3.5 спека (Task 12).

- [ ] **Step 8: Коммит**

```bash
git add playground pnpm-lock.yaml
git commit -m "feat(playground): страница «Темы» со сценариями критерия 5 и встроенными проверками" -m "$TRAILERS"
```

---

### Task 10: Приёмка критерия 5 в браузере и workspace-линковка

**Files:** нет изменений кода; результат это отчёт (фиксируется в Task 12) и, при находках, правки токенов/компонентов с тестами.

- [ ] **Step 1: Запустить playground**

Run (в фоне): `pnpm dev -- --port 5173 --strictPort`
Expected: Vite 8 стартует, в логе нет предупреждений о повторной оптимизации или о нескольких копиях solid-js. Остановить сервер по PID после проверки (не `pkill` по имени).

- [ ] **Step 2: Открыть страницу в Chrome (инструменты браузера) и прочитать блок «Проверки»**

Открыть `http://localhost:5173/`, подождать 1 с, прочитать текст секции 5 и консоль браузера.
Expected: все строки `OK`; в консоли нет ошибок и нет предупреждения `You appear to have multiple instances of Solid`. Любой `FAIL` разобрать по существу: это либо дефект токенов/компонента (исправить с тестом), либо дефект проверки (исправить проверку и объяснить в коммите). Не ослаблять порог ради зелёного результата.

- [ ] **Step 3: Визуальная проверка**

Сделать скриншоты страницы в `system`, `light`, `dark`; убедиться глазами: кнопки Probe на своей высоте (28 в `sm`-обёртке, 32 по умолчанию); панели открыты у своих кнопок и не обрезаны; панель в секции 3 оранжевая (`#ffe8cc` из токена формы) при тёмной теме обёртки; в секции 4 панель видна поверх открытого `<dialog>`; hover/active у кнопок различимы (навести курсор и записать, что видно).

- [ ] **Step 4: Esc и клик снаружи в реальном браузере**

Кликнуть по пустому месту: закрывается только верхний слой (последняя открытая панель), остальные остаются. Нажать Esc: закрывается следующий верхний слой. Открыть `dialog`, открыть в нём панель, нажать Esc: сначала закрывается панель, потом (вторым Esc) должен закрыться `dialog`. **Dialog-маршрутизация Esc (раздел 8 спека) это работа этапа 2**: на этапе 0 нативный `<dialog>` закроется первым же Esc вместе с панелью. Это ожидаемо, записать наблюдение в отчёт, не чинить.

- [ ] **Step 5: Что не проверено на этом этапе (записать в отчёт дословно)**

Firefox 125 и Safari 17.5 (минимальные версии) на машине недоступны: критерий 5 в них **не проверен**; поведение `light-dark()` внутри `color-mix()` в кастомных свойствах и top layer с `position: fixed` подтверждено только в установленной версии Chrome (версию записать). Проверка в Firefox и Safari это задача владельца или отдельная сессия с доступом к ним.

- [ ] **Step 6: Остановить сервер, при находках закоммитить исправления**

Если правились токены или компонент, перед коммитом: `pnpm check`. Коммит с описанием находки (`fix(tokens): ...` или `fix(probe): ...`) и трейлерами.

---

### Task 11: Критерии 1 и 2: матрица формы пакета

**Files:**
- Create: `scripts/verify-package-form.sh`
- Create: `scripts/consumer/{package.json, tsconfig.json, vite.config.ts, index.html, src/main.tsx}`

**Interfaces:**
- Consumes: Probe и ProbeScope через публичные подпути `@stark/solid-kit/probe`, `@stark/solid-kit/tokens.css`.
- Produces: `scripts/verify-package-form.sh <ref> [source]`: ставит кит в проект вне репозитория (по умолчанию `git+file://<репозиторий>#<ref>`, после публикации `github:StarkElessar/solid-kit`) и печатает `OK:`/`FAIL:` по каждому пункту критерия 1; код возврата ненулевой при любом `FAIL`. `ref` это коммит или тег, он должен быть закоммичен.

- [ ] **Step 1: Шаблон потребителя**

`scripts/consumer/package.json`:

```json
{
	"name": "consumer",
	"private": true,
	"type": "module",
	"scripts": {
		"dev": "vite",
		"build": "vite build",
		"preview": "vite preview",
		"typecheck": "tsc --noEmit"
	},
	"dependencies": {
		"solid-js": "1.9.17"
	},
	"devDependencies": {
		"typescript": "5.9.3",
		"vite": "8.3.5",
		"vite-plugin-solid": "2.11.14"
	}
}
```

`scripts/consumer/tsconfig.json` (матрица раздела 3.6: те же строгие флаги, что у кита):

```json
{
	"compilerOptions": {
		"target": "ES2022",
		"lib": ["ES2023", "DOM", "DOM.Iterable"],
		"module": "ESNext",
		"moduleResolution": "bundler",
		"jsx": "preserve",
		"jsxImportSource": "solid-js",
		"types": ["vite/client"],
		"noEmit": true,
		"skipLibCheck": true,
		"strict": true,
		"exactOptionalPropertyTypes": true,
		"noUncheckedIndexedAccess": true,
		"noImplicitOverride": true,
		"noImplicitReturns": true,
		"noFallthroughCasesInSwitch": true,
		"noPropertyAccessFromIndexSignature": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"verbatimModuleSyntax": true,
		"isolatedModules": true,
		"erasableSyntaxOnly": true
	},
	"include": ["src"]
}
```

`scripts/consumer/vite.config.ts` (без `optimizeDeps`/`ssr`/`dedupe`):

```ts
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({ plugins: [solid()] });
```

`scripts/consumer/index.html`:

```html
<!doctype html>
<html lang="ru">
	<head>
		<meta charset="utf-8" />
		<title>consumer</title>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/main.tsx"></script>
	</body>
</html>
```

`scripts/consumer/src/main.tsx` (контекст приложения читается внутри компонента кита и наоборот: так проверяется единственная копия `solid-js`):

```tsx
import '@stark/solid-kit/tokens.css';

import { Probe, ProbeScope } from '@stark/solid-kit/probe';
import { createContext, useContext } from 'solid-js';
import { render } from 'solid-js/web';

const AppContext = createContext('app-default');

function ScopeReader() {
	const scope = useContext(ProbeScope);
	const app = useContext(AppContext);
	return (
		<>
			<output id="scope">{scope.label}</output>
			<output id="app">{app}</output>
		</>
	);
}

const root = document.getElementById('root');
if (!root) {
	throw new Error('#root is missing');
}

render(
	() => (
		<AppContext.Provider value="app">
			<Probe defaultOpen>
				<ScopeReader />
			</Probe>
		</AppContext.Provider>
	),
	root,
);
```

Ожидание в браузере (одна копия `solid-js`): `#scope` = `probe-scope`, `#app` = `app`. Две копии дали бы `default` и `app-default`.

- [ ] **Step 2: Скрипт**

`scripts/verify-package-form.sh`:

```bash
#!/usr/bin/env bash
# Критерий 1 спека (раздел 12): установка тега кита в проект вне репозитория и проверка формы пакета.
# Использование: scripts/verify-package-form.sh <ref> [source]
#   ref     коммит или тег (должен быть закоммичен)
#   source  по умолчанию git+file://<этот репозиторий>; после первой публикации: github:StarkElessar/solid-kit
set -euo pipefail

REF="${1:?usage: verify-package-form.sh <ref> [source]}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="${2:-git+file://$REPO_ROOT}"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/solid-kit-consumer.XXXXXX")"
PORT=5199
FAILED=0
DEV_PID=""

ok() { echo "OK:   $*"; }
fail() { echo "FAIL: $*"; FAILED=1; }
note() { echo "NOTE: $*"; }
cleanup() { if [ -n "$DEV_PID" ]; then kill "$DEV_PID" 2>/dev/null || true; fi; }
trap cleanup EXIT

echo "consumer project: $WORK"
echo "kit source:       $SOURCE#$REF"
cp -R "$REPO_ROOT/scripts/consumer/." "$WORK/"
cd "$WORK"

pnpm install --ignore-workspace
pnpm add --ignore-workspace "$SOURCE#$REF"

# --- состав установленного пакета: применён ли files, что попало в пакет
KIT="$(cd node_modules/@stark/solid-kit && pwd -P)"
echo "--- installed package: $KIT"
ls -A "$KIT"
[ -d "$KIT/src" ] && ok "src/ is installed" || fail "src/ is missing"
[ -e "$KIT/playground" ] && fail "playground/ was installed (files was not applied)" || ok "playground/ is not installed"
[ -e "$KIT/docs" ] && fail "docs/ was installed (files was not applied)" || ok "docs/ is not installed"
[ -e "$KIT/pnpm-workspace.yaml" ] && note "pnpm-workspace.yaml is installed" || ok "pnpm-workspace.yaml is not installed"
if ls -d node_modules/.pnpm/*/node_modules/vitest >/dev/null 2>&1; then
	note "devDependencies of the kit were installed (vitest is present)"
else
	ok "devDependencies of the kit were not installed"
fi

# --- единственная копия solid-js на диске
COPIES="$(find node_modules/.pnpm -maxdepth 1 -name 'solid-js@*' | wc -l | tr -d ' ')"
[ "$COPIES" = "1" ] && ok "one solid-js copy on disk" || fail "solid-js copies on disk: $COPIES"

# --- критерий 2: tsc --noEmit в поддерживаемой матрице, на TypeScript 5.9.3 и 7.0.2
if pnpm exec tsc --noEmit; then ok "tsc --noEmit on TypeScript $(pnpm exec tsc -v)"; else fail "tsc --noEmit on TypeScript 5.9.3"; fi
if pnpm --package=typescript@7.0.2 dlx tsc --noEmit; then ok "tsc --noEmit on TypeScript 7.0.2"; else fail "tsc --noEmit on TypeScript 7.0.2"; fi

# --- vite dev с холодной оптимизацией: кит не должен попасть в pre-bundle
rm -rf node_modules/.vite
./node_modules/.bin/vite --port "$PORT" --strictPort >dev.log 2>&1 &
DEV_PID=$!
for _ in $(seq 1 60); do curl -sf "http://localhost:$PORT/" >/dev/null && break; sleep 0.5; done
curl -s "http://localhost:$PORT/src/main.tsx" >/dev/null
sleep 3
if node --input-type=module -e '
import fs from "node:fs";
const meta = JSON.parse(fs.readFileSync("node_modules/.vite/deps/_metadata.json", "utf8"));
const names = Object.keys(meta.optimized);
console.log("optimized deps:", names.join(", ") || "(none)");
process.exit(names.some((name) => name.includes("solid-kit")) ? 1 : 0);
'; then ok "kit is not in the Vite dependency pre-bundle"; else fail "kit was pre-bundled by Vite"; fi
if grep -qi "multiple instances of Solid" dev.log; then fail "dev log reports multiple Solid instances"; else ok "no multiple-Solid warning in the dev log"; fi
kill "$DEV_PID" 2>/dev/null || true
DEV_PID=""

# --- vite build: стили и токены на месте, неимпортированного компонента в бандле нет
if pnpm exec vite build >build.log 2>&1; then ok "vite build"; else fail "vite build (see $WORK/build.log)"; fi
grep -lq -- '--s-kit-color-primary' dist/assets/*.css && ok "tokens are in the built CSS" || fail "tokens are missing from the built CSS"
grep -lq -- '--s-kit-probe-radius' dist/assets/*.css && ok "Probe styles are in the built CSS" || fail "Probe styles are missing from the built CSS"
grep -lq 'marker-used' dist/assets/*.js && ok "imported component is in the bundle" || fail "imported component is missing from the bundle"
grep -lq 'marker-unused' dist/assets/*.js && fail "not imported component leaked into the bundle" || ok "not imported component is not in the bundle"

echo
echo "Browser step (manual): run 'cd $WORK && ./node_modules/.bin/vite' and 'vite preview';"
echo "expect #scope = probe-scope and #app = app in both (one solid-js copy), no console errors."
echo "consumer project kept at: $WORK"
exit "$FAILED"
```

- [ ] **Step 3: Прогнать скрипт на закоммиченном HEAD**

Сначала закоммитить скрипт и шаблон (чтобы `HEAD` их содержал; для скрипта они не нужны в пакете, но чистое состояние обязательно):

```bash
chmod +x scripts/verify-package-form.sh
git add scripts
git commit -m "test: скрипт матрицы формы пакета (критерии 1 и 2) и шаблон проекта-потребителя" -m "$TRAILERS"
scripts/verify-package-form.sh "$(git rev-parse HEAD)"
```

Expected: все строки `OK:`, код возврата 0, `NOTE:` допускаются (они фиксируют факты о pnpm, их читать и записывать в отчёт). Типичные причины `FAIL` и реакция:
- `pnpm add git+file://...` не принимает форму URL: попробовать `pnpm add "git+file://$REPO_ROOT#$REF"` вручную, подобрать рабочую форму (например, через `file:` на клон), записать фактическую форму в комментарий скрипта.
- `files` не применён (`playground/` попал в пакет): записать как находку; исправить можно `.npmignore`-подобным способом только после разбора, как pnpm пакует git-зависимости; решение (например, вынести `playground/` из корня) принимает владелец.
- Кит попал в pre-bundle или есть предупреждение о двух копиях Solid: добавить в `scripts/consumer/vite.config.ts` минимально необходимую настройку, зафиксировать в разделе 3.5 спека как требование к потребителю (Task 12) и повторить прогон.
- `tsc` на TypeScript 7.0.2 не находит `vite/client`: убедиться, что команда запускается из каталога проекта; если проблема в самом TS 7, записать как находку матрицы (поддержка 7.x в спеке заявлена по проверенному чтению, не по прогону).

- [ ] **Step 4: Браузерная часть матрицы**

В созданном проекте потребителя (путь печатает скрипт) запустить `./node_modules/.bin/vite --port 5199`, открыть в Chrome, прочитать `#scope` и `#app`, консоль; затем `vite build && vite preview` и то же. Остановить серверы по PID.
Expected: `#scope` = `probe-scope`, `#app` = `app`, панель открыта в top layer, ошибок в консоли нет.

- [ ] **Step 5: Workspace-линковка (пункт матрицы)**

Выполнено в Task 9 (`pnpm --filter playground build` и dev через `workspace:*`) и Task 10 (страница работает). Записать в отчёт: «workspace:* → OK» со ссылкой на эти шаги.

---

### Task 12: Синхронизация спека, финальная проверка и локальный тег

**Files:**
- Modify: `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md`

- [ ] **Step 1: Правки спека (по фактическим результатам Task 3, 10, 11)**

1. §3.2 и критерий 1 (раздел 12): версия pnpm это `11.12.0` (было «на момент спека актуальна 12.15.0; версия выбирается на этапе 0»); пометить «выбрана на этапе 0».
2. §4.1: заменить пример токенов актуальными значениями Синей палитры и производных из `src/styles/tokens.css` (primary-subtle 10 %, focus-ring 75 %, hover 5 %, muted 62 %, row-selected 9 %, `tint`-семейство, `panel`, `shadow-popover`, `control-edge` 50 %); в абзаце «Линии и выделение» заменить `--s-kit-color-control-edge` 42 % на 50 % с причиной «не менее 3:1 к поверхности (WCAG 1.4.11), проверено тестом».
3. §3.5: добавить требования к потребителю, если Task 11 их выявил; если нет, добавить предложение «`optimizeDeps`/`ssr`/`dedupe` не требуются: проверено матрицей этапа 0».
4. §3.6: добавить «разработка кита идёт на TypeScript 5.9.3 (peer `@stark/eslint-config` ограничен `<6.1`)».
5. §13, строка этапа 0: пометить выполненные части и явно перечислить невыполненное (Firefox 125 и Safari 17.5; критерий 1 через `github:` после публикации).
6. §14: добавить вопрос 6 «Автор коммитов и публикация: все коммиты репозитория сделаны под рабочей идентичностью (имя и почта рабочего домена из глобального gitconfig); перед публикацией решить, оставлять ли историю как есть, переписать авторство или начать публикацию с чистой историей» (почту в спек не вписывать).

- [ ] **Step 2: Полная проверка**

```bash
pnpm check
```

Expected: ESLint, Stylelint, `tsc` (корень и playground) и все тесты зелёные, код возврата 0. Только после этого переходить к тегу.

- [ ] **Step 3: Проверка на секреты перед тегом (репозиторий публичный)**

```bash
git status --short
git ls-files | grep -Ei '\.env|\.pem|\.key|\.npmrc|backup|secret|token' || echo "no sensitive file names"
git diff $(git rev-list --max-parents=0 HEAD) HEAD | grep -Ein 'password|secret|token|api[_-]?key|BEGIN (RSA|OPENSSH|PRIVATE)' || echo "no sensitive strings"
```

Expected: дерево чистое, чувствительных имён и строк нет. Совпадения разобрать вручную (слова `token` в названиях дизайн-токенов ожидаемы и безопасны).

- [ ] **Step 4: Коммит спека и локальный аннотированный тег**

```bash
git add docs
git commit -m "docs(spec): синхронизация со стадией 0: pnpm 11.12.0, токены Синей палитры, control-edge 50%, итоги матрицы" -m "$TRAILERS"
scripts/verify-package-form.sh "$(git rev-parse HEAD)"
git tag -a v0.1.0 -m "Этап 0: фундамент (токены, хелперы, playground, матрица формы пакета)" -m "$TRAILERS"
git tag -n3 v0.1.0
```

Expected: повторный прогон матрицы на финальном коммите зелёный; тег создан **локально**. Не выполнять `git push`, не создавать удалённый репозиторий.

- [ ] **Step 5: Отчёт владельцу (в чат, по-русски)**

Содержимое: что сделано по критериям 1, 2, 5 (с фактами, не пересказом плана); что **не проверено** (Firefox 125, Safari 17.5, критерий 1 через `github:`, Dialog-Esc этапа 2); отступления от спека (`control-edge` 50 %, pnpm 11.12.0, значения производных из прототипа) и причины; находки Astra (повторное ревью) и что с ними сделано; вопросы, требующие решения владельца: лицензия, публикация и проверка истории (включая рабочую почту в авторстве коммитов), вопросы 1 и 2 этапа 4б.

---

## Самопроверка плана

**Покрытие спека (этап 0, раздел 13):**
- Скаффолд репозитория (раздел 3), tsconfig, Vitest → Task 1. Линтеры и stylelint-запрет литералов → Task 2 (`outline: none` из раздела 5.1 тоже). `tokens.css` с размерами, базовыми и производными цветами, темами на `light-dark()` → Task 3. `createControllableSignal` → Task 4. Показ панелей в top layer и стек слоёв → Tasks 5–6. `createAnchoredPosition` → Task 7. Playground с переключателем темы и размера, полем primary, переключателем палитры → Task 9. Критерии 1, 2, 5 → Tasks 10–11. Тег `v0.1.0` (локально) → Task 12.
- `PanelHost`, изоляция событий, сброс наследуемых свойств, Dialog-Esc: этап 2, не входят. Сброс наследуемых свойств на корне панели Probe сделан в CSS (раздел 8.2) как часть стенда, без компонента хоста.
- `@tanstack/solid-virtual` подключён как зависимость без кода (нужен для проверки формы пакета, раздел 3.2).

**Плейсхолдеры:** нет «TBD/TODO/позже». Условные ветки (поведение `git+file`, `files` в pnpm, совместимость плагинов) описаны как «если X, то Y» с конкретной реакцией.

**Согласованность имён и типов:** `registerLayer(layer: Layer): () => void`, `getLayerCount()` (Task 5) используются в Task 6 без изменений; `createPanelLayer({ open, panel, anchor, onDismiss })` и `createAnchoredPosition({ anchor, floating, open })` (Tasks 6–7) вызываются в `Probe` (Task 8) с теми же именами; `ProbeScope` и `Probe` экспортируются из `index.ts` и импортируются потребителем (Task 11) и playground (Task 9); маркеры `marker-used` / `marker-unused` в `Probe`/`ProbeUnused` совпадают с проверкой в скрипте; атрибуты `data-probe-panel`, `data-chip`, `data-scenario`, `data-swatch-group`, `data-swatch` совпадают между `themes-page.tsx`, `derived-swatches.tsx` и `theme-checks.ts`.

**Известные риски исполнения (чинить по месту, фиксируя в коммите):** совместимость версий vitest 5 и vite 8.3.5; `eslint-plugin-solid` с ESLint 9; точная форма `git+file://` у pnpm 11; формат вывода `getComputedStyle().colorScheme` в Chrome; допустимость `transparent`/`currentcolor` в `color-named`.
