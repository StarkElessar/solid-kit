import { afterEach, describe, expect, it } from 'vitest';

import { resolvePanelHost } from './panel-host';

function build(html: string): HTMLElement {
	const root = document.createElement('div');
	root.innerHTML = html;
	document.body.append(root);
	return root;
}

afterEach(() => {
	document.body.replaceChildren();
});

describe('resolvePanelHost', () => {
	it('is the parent of the anchor when no blocking ancestor exists', () => {
		const root = build('<section id="host"><div><button id="anchor"></button></div></section>');
		expect(resolvePanelHost(root.querySelector('#anchor') as Element)).toBe(root.querySelector('div'));
	});

	it('skips a label: the host is the parent of the label', () => {
		const root = build('<section id="host"><label><span><button id="anchor"></button></span></label></section>');
		expect(resolvePanelHost(root.querySelector('#anchor') as Element)).toBe(root.querySelector('#host'));
	});

	it('skips a table: the host is the parent of the table', () => {
		const root = build('<section id="host"><table><tbody><tr><td><button id="anchor"></button></td></tr></tbody></table></section>');
		expect(resolvePanelHost(root.querySelector('#anchor') as Element)).toBe(root.querySelector('#host'));
	});

	it('skips a link and a summary', () => {
		const link = build('<section id="host"><a href="/x"><span id="anchor"></span></a></section>');
		expect(resolvePanelHost(link.querySelector('#anchor') as Element)).toBe(link.querySelector('#host'));
		const summary = build('<details id="outer"><summary><span id="anchor2"></span></summary></details>');
		expect(resolvePanelHost(summary.querySelector('#anchor2') as Element)).toBe(summary.querySelector('#outer'));
	});

	it('takes the parent of the outermost blocking ancestor when several are nested', () => {
		const root = build('<section id="host"><label><a href="/x"><button id="anchor"></button></a></label></section>');
		expect(resolvePanelHost(root.querySelector('#anchor') as Element)).toBe(root.querySelector('#host'));
	});

	it('does not treat the anchor itself as a blocking ancestor', () => {
		const root = build('<div id="host"><button id="anchor"></button></div>');
		expect(resolvePanelHost(root.querySelector('#anchor') as Element)).toBe(root.querySelector('#host'));
	});

	it('falls back to the body for a detached anchor and for an anchor directly in the body', () => {
		expect(resolvePanelHost(document.createElement('button'))).toBe(document.body);
		const loose = document.createElement('button');
		document.body.append(loose);
		expect(resolvePanelHost(loose)).toBe(document.body);
	});
});
