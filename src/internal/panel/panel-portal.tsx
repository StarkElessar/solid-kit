import { type Accessor, type JSX, useContext } from 'solid-js';
import { Portal } from 'solid-js/web';

import { PanelHostContext, resolvePanelHost } from './panel-host';

export interface PanelPortalProps {
	/** Реальный элемент инициатора: от него считается хост по умолчанию. */
	anchor: Accessor<Element | undefined>;
	children: JSX.Element;
}

/** Монтирует панель в хост (спек этапа 2, раздел 3.2): не в `body` и не внутрь инициатора. */
export function PanelPortal(props: PanelPortalProps): JSX.Element {
	const provided = useContext(PanelHostContext);
	// Не createMemo: при defaultOpen панель создаётся, пока инициатор ещё не вставлен в DOM (parentElement равен null),
	// а мемо закэшировало бы `body`. Обычная функция читается эффектом Portal уже после вставки.
	const host = (): Element => {
		const fromContext = provided?.();
		if (fromContext) {
			return fromContext;
		}
		const anchor = props.anchor();
		return anchor ? resolvePanelHost(anchor) : document.body;
	};

	return (
		<Portal
			mount={host()}
			ref={(container) => {
				// обёртка Portal не должна стать элементом раскладки хоста (flex или grid с gap)
				container.style.display = 'contents';
			}}
		>
			{props.children}
		</Portal>
	);
}
