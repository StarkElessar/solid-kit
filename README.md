# @stark/solid-kit

Личный UI-кит на Solid.js. Исходники без сборки, подпуть на компонент, темизация через CSS-переменные `--s-kit-*`.

Статус: этапы 0 (фундамент), 1 (простые контролы), 2 (оверлеи: Popover, Dialog, ContextMenu) и 3 (списки: Select, Combobox, MultiSelect) готовы. Дизайн и дорожная карта: `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md`.

## Подключение

```jsonc
// package.json потребителя
"dependencies": { "@stark/solid-kit": "github:StarkElessar/solid-kit#vX.Y.Z" }
```

```ts
import '@stark/solid-kit/tokens.css'; // один раз в точке входа
import { Popover } from '@stark/solid-kit/popover';
```

Требования: Vite 8, `vite-plugin-solid` 2.11+, `solid-js` ^1.9, шрифт IBM Plex Sans (кит его не поставляет).

### Цели сборки CSS

Токены темы построены на `light-dark()`, а кит отдаёт исходный CSS: его собирает бандлер потребителя. Цели сборки CSS должны быть не ниже Chrome 123, Safari 17.5 и Firefox 120. Иначе минификатор (в Vite 8 это lightningcss) понизит `light-dark()` до подстановок `--lightningcss-light` и `--lightningcss-dark` на корне: в dev-режиме всё работает, а в production токены внутри вложенной обёртки `data-s-kit-theme` остаются от темы корня, и принудительная светлая область в тёмной ОС получает светлый текст на светлом фоне.

```ts
// vite.config.ts потребителя
export default defineConfig({
	plugins: [solid()],
	build: { cssTarget: ['chrome123', 'safari17.5', 'firefox120'] }
});
```

Проверка: в собранном CSS не должно быть `--lightningcss-`, а `--s-kit-color-text` должен остаться значением `light-dark(...)`.

## Разработка

```sh
pnpm install
pnpm dev     # playground
pnpm check   # lint + typecheck + test
```

Репозиторий публичный: ключи, токены и `.env*` не коммитятся.

## Лицензия

[MIT](LICENSE), © 2026 Chevdar Sergei.
