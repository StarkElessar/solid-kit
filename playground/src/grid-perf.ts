// бюджет кадра 16,7 мс (60 кадров/с) плюс допуск 0,8 мс: при 120 Гц кадр из двух синхронизаций (16,67 мс)
// приходит как 16,7–16,8 и медленным не считается
const SLOW_FRAME_MS = 17.5;
const SETTLE_MS = 500;
const RUN_MS = 4000;
const RUNS_PER_SPEED = 3;

export const SCROLL_SPEEDS = [1500, 3000, 20_000] as const;

interface ScrollRun {
	frames: number;
	slow: number;
	worst: number;
}

/** Один заход равномерной прокрутки: `scrollTop` растёт на `speed` px/с по кадрам, считаются кадры длиннее 16,7 мс. */
export async function measureGridScroll(scroller: HTMLElement, speed: number, durationMs: number): Promise<ScrollRun> {
	scroller.scrollTop = 0;
	await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
	return new Promise((resolve) => {
		const run: ScrollRun = { frames: 0, slow: 0, worst: 0 };
		const start = performance.now();
		let last = start;
		const step = (now: number): void => {
			const delta = now - last;
			last = now;
			run.frames++;
			run.worst = Math.max(run.worst, delta);
			if (delta > SLOW_FRAME_MS) {
				run.slow++;
			}
			scroller.scrollTop += speed * delta / 1000;
			if (now - start < durationMs) {
				requestAnimationFrame(step);
			}
			else {
				resolve(run);
			}
		};
		requestAnimationFrame(step);
	});
}

function median(values: number[]): number {
	const sorted = [...values].sort((first, second) => first - second);
	return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/**
 * Замер критерия 1 (спек 4а, раздел 13): по каждой скорости три захода, первый отбрасывается как прогрев;
 * в отчёт идёт медиана доли медленных кадров и худший кадр. Цифры в спек берутся только отсюда.
 */
export async function runGridPerf(scroller: HTMLElement, report: (line: string) => void): Promise<void> {
	for (const speed of SCROLL_SPEEDS) {
		const runs: ScrollRun[] = [];
		for (let attempt = 0; attempt < RUNS_PER_SPEED; attempt++) {
			runs.push(await measureGridScroll(scroller, speed, RUN_MS));
		}
		const measured = runs.slice(1);
		const share = median(measured.map((run) => 100 * run.slow / run.frames));
		const worst = Math.max(...measured.map((run) => run.worst));
		const frames = Math.round(median(measured.map((run) => run.frames)));
		report(`${speed} px/с: ${share.toFixed(2)} % (кадров ${frames}, худший ${worst.toFixed(1)} мс)`);
	}
	scroller.scrollTop = 0;
}
