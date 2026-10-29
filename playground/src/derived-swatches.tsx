import { For, type JSX } from 'solid-js';

import { PALETTE_NAMES, PALETTES } from './palettes';

const THEMES = ['light', 'dark'] as const;
const KINDS = ['primary', 'hover', 'active', 'subtle'] as const;

const TOKEN_BY_KIND: Record<(typeof KINDS)[number], string> = {
	primary: '--s-kit-color-primary',
	hover: '--s-kit-color-primary-hover',
	active: '--s-kit-color-primary-active',
	subtle: '--s-kit-color-primary-subtle'
};

/** Покой, hover, active и subtle основной кнопки для палитр Мята, Синий и Моно в обеих темах. */
export function DerivedSwatches(): JSX.Element {
	return (
		<div class='swatch-grid'>
			<For each={PALETTE_NAMES}>
				{(palette) => (
					<For each={THEMES}>
						{(theme) => (
							<div
								data-s-kit
								data-swatch-group={`${palette}-${theme}`}
								data-s-kit-theme={theme}
								style={PALETTES[palette]}
								class='swatch-group'
							>
								<strong>{palette} / {theme}</strong>
								<div class='swatch-row'>
									<For each={KINDS}>
										{(kind) => (
											<span class='swatch' data-swatch={kind} style={{ background: `var(${TOKEN_BY_KIND[kind]})` }}>
												{kind}
											</span>
										)}
									</For>
								</div>
							</div>
						)}
					</For>
				)}
			</For>
		</div>
	);
}
