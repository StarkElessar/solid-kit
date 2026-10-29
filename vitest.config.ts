import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [solid()],
	resolve: { conditions: ['development', 'browser'] },
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.{ts,tsx}'],
		restoreMocks: true,
		// tokens.css читается тестами как текст (?raw); по умолчанию Vitest подменяет любой CSS пустым модулем
		css: { include: [/\.css\?raw$/] }
	}
});
