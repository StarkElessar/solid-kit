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
for _ in $(seq 1 60); do curl -sf --noproxy '*' "http://localhost:$PORT/" >/dev/null && break; sleep 0.5; done
curl -s --noproxy '*' "http://localhost:$PORT/src/main.tsx" >/dev/null
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
grep -lq -- '--s-kit-button-radius' dist/assets/*.css && ok "Button styles are in the built CSS" || fail "Button styles are missing from the built CSS"
# composes: правило общей основы (класс _control_) должно стоять в CSS раньше правил Button, иначе основа перекроет их
node -e '
const fs = require("node:fs");
const dir = "dist/assets";
const css = fs.readdirSync(dir).filter((file) => file.endsWith(".css")).map((file) => fs.readFileSync(dir + "/" + file, "utf8")).join("\n");
const base = css.search(/\._control_[a-z0-9_]+\{/);
const button = css.indexOf("--s-kit-button-radius");
console.log("control base at", base, "button rules at", button);
process.exit(base >= 0 && button > base ? 0 : 1);
' && ok "control base comes before Button rules in the built CSS" || fail "control base is missing or comes after Button rules in the built CSS"
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
grep -lq -- '--s-kit-field-gap' dist/assets/*.css && ok "Field styles are in the built CSS" || fail "Field styles are missing from the built CSS"
grep -lq -- '--s-kit-button-group-gap' dist/assets/*.css && ok "ButtonGroup styles are in the built CSS" || fail "ButtonGroup styles are missing from the built CSS"
grep -lq 'marker-used' dist/assets/*.js && ok "imported component is in the bundle" || fail "imported component is missing from the bundle"
grep -lq 'marker-unused' dist/assets/*.js && fail "not imported component leaked into the bundle" || ok "not imported component is not in the bundle"

echo
echo "Browser step (manual): run 'cd $WORK && ./node_modules/.bin/vite' and 'vite preview';"
echo "expect #scope = probe-scope and #app = app in both (one solid-js copy), no console errors."
echo "consumer project kept at: $WORK"
exit "$FAILED"
