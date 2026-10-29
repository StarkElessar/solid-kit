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
