import { type Accessor, createContext } from 'solid-js';

/** Предки инициатора, детьми которых панель быть не может (спек этапа 2, раздел 3.2; зонтичный, раздел 8.1). */
const BLOCKING_ANCESTORS = 'table, label, button, a[href], summary';

/** Хост панели по умолчанию: родитель инициатора, а при блокирующем предке родитель самого внешнего такого предка. */
export function resolvePanelHost(anchor: Element): Element {
	let outermost: Element | null = null;
	for (let element = anchor.parentElement; element; element = element.parentElement) {
		if (element.matches(BLOCKING_ANCESTORS)) {
			outermost = element;
		}
	}
	return (outermost ?? anchor).parentElement ?? document.body;
}

/** Переопределение хоста: ближайший провайдер выигрывает. Грид (этап 4а) и Dialog задают хост своим корнем. */
export const PanelHostContext = createContext<Accessor<Element | undefined>>();
