// В jsdom нет ResizeObserver, в браузерах он есть всегда: заглушка здесь избавляет боевой код от проверок под тестовую среду
class ResizeObserverStub {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverStub;
