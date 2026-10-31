import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// light-dark() в токенах не должен понижаться до подстановок --lightningcss-*: они ломают вложенную принудительную тему
export default defineConfig({ plugins: [solid()], build: { cssTarget: ['chrome123', 'safari17.5', 'firefox120'] } });
