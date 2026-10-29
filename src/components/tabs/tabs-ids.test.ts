import { describe, expect, it } from 'vitest';

import { panelId, tabId } from './tabs-ids';

describe('tabs ids', () => {
	it('builds distinct ids for the tab and the panel of one value', () => {
		expect(tabId('t1', 'overview')).toBe('t1-tab-overview');
		expect(panelId('t1', 'overview')).toBe('t1-panel-overview');
	});

	it('encodes the value so that an id never contains whitespace', () => {
		expect(tabId('t1', 'two words')).toBe('t1-tab-two%20words');
		expect(/\s/.test(panelId('t1', 'two words\tand more'))).toBe(false);
	});
});
