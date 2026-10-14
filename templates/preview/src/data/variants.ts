/**
 * The design directions being shown to the client.
 *
 * Studio-only data: this file, `src/pages/preview.astro` and
 * `src/components/_preview/` are the whole preview harness, and all three are
 * deleted the moment the client picks a direction (stage 3, revisions). Nothing the client
 * keeps imports any of them.
 *
 * Each variant is a real page at /v/<id>/, rendered without data-jtk-path (a
 * page with annotations and no content document is refused by the catalogue
 * check) and left out of PAGES. `label` is what the client reads in the bar;
 * `note` is the one-line thesis of the direction, shown beside it.
 */

export interface Variant {
  readonly id: string;
  readonly label: string;
  readonly note: string;
}

export const VARIANTS: readonly Variant[] = [
  // { id: 'noir', label: 'Noir', note: 'ein schwarzer Salon am Abend' },
];

/**
 * The direction every other one canonicalises to while several exist, so N
 * near-identical pages do not compete with each other in search. It costs
 * nothing on a private preview and it is the setting nobody remembers on the
 * day it starts to matter.
 */
export const CANONICAL_VARIANT = VARIANTS[0]?.id ?? '';

export const DEFAULT_ACCENT = '#2f5bff';

/** What the bar calls itself. The client's language. */
export const BAR_COPY = {
  tag: '',
  colour: '',
  desktop: '',
  tablet: '',
  mobile: '',
} as const;
