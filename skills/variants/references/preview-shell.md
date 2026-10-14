# The preview shell

Three files, copied from `$JT/templates/preview/` into the site's project, that
let a client compare N variants on three viewports from one link — and that
stage 3 deletes without touching anything the client keeps.

```
src/pages/preview.astro                     the shell page
src/components/_preview/PreviewShell.astro  the bar, the frame, the script
src/data/variants.ts                        the directions, and the bar's words
```

The underscore on `_preview/` is the marker: everything under it is ours. Put
nothing in there that the client's site needs.

## How it works

`/preview/?v=<variant>&vp=<desktop|tablet|mobile>&accent=<hex>`

The shell renders the bar and one `<iframe>` pointing at `/v/<variant>/`. The
frame is 390px, 834px, or the full width of the window. Because the iframe is
genuinely that wide, the variant's own `@media` queries fire exactly as they
would on the device — no `data-vp` mirror, no second activation point, no rule
that has to be changed in two places forever.

Every address in it goes through `under()` (`src/lib/under.ts`), in the markup
and in the script, because the platform's preview serves the build under
`/p/<slug>/`: `/v/noir/` written from the root would frame a 404.

The variant pages contain no preview code at all, and no annotations — see the
skill, *Shared spine*.

## On the platform

The shell is part of the build, so it is on the preview the moment the site is
built: send the client the preview link (`get_preview_link`) and tell them to
open `preview/` under it. It is not linked from any page, and nothing the
platform does lists it — the sitemap and `llms.txt` are built from `PAGES`.

The preview itself is private and kept out of search engines by the platform,
so the shell needs no robots tag of its own; it carries `noindex` anyway,
because it is a tool and not a page. That is allowed on any page but the front
page — the platform refuses a front page that says `noindex`
(`JTK_E_NOINDEX`), which is why the shell is never `/`.

## The four things the bar does

**Variant tabs.** Plain `<a href>` with the current query preserved, so any
single variant's URL can be sent on its own and the client's chosen viewport
and colour survive the switch.

**Viewport buttons.** Write `vp` into the query with `history.replaceState`, so
the address bar always matches what is on screen and a forwarded link opens the
same way. No reload — resizing the frame is a style change.

**Accent picker.** Same-origin, so the shell reaches into the frame and sets the
custom property directly:

```js
frame.contentDocument.documentElement.style.setProperty('--accent', value);
```

Re-applied on the frame's `load`, because navigating inside it (or switching
variants) gives a fresh document. This is why the picker leaves no trace in the
client's code: nothing in the variant listens for anything.

The variant's palette must therefore route its brand colour through `--accent`,
defined on `:root` — the scaffold's `global.css` already does. Everything
derived from it — hovers, tints, shadows — should be derived in CSS
(`color-mix`, `oklch` adjustments) rather than hard-coded, or the picker moves
one colour and leaves five behind.

**Device gate.** A blocking inline script in the shell's `<head>`, before first
paint. Touch-only *and* a short screen side ≤ 1024px means a real phone or
tablet: the shell replaces itself with the raw variant URL and no bar is drawn.
Touch alone is not enough — a touchscreen laptop, a pen display and DevTools
emulation all report coarse pointer and no hover, and would be locked into a
tablet frame with no way out.

## Rules

- **The bar is visibly ours.** Black, small neutral type, none of the landing's
  typefaces, labelled as a preview in the client's language. The client must
  never wonder whether it is part of their design.
- **The frame is not a device mock.** A thin outline and a centred column. A
  drawn phone bezel makes the client evaluate the bezel.
- **The shell is never linked from a variant.** The client gets its address from
  us; the variants link only to themselves.
- **The `/v/` pages canonicalise to `/`.** N near-identical pages competing in
  search is a self-inflicted duplicate-content problem, and it is the setting
  everybody forgets on the day it starts to matter.

## When the client picks

`variants.chosen` goes into the state file. Then, in stage 3 and not before:

- the chosen variant's sections become the home page's, annotations and all;
- the other variants' components and stylesheets, and every `/v/` page, are
  **deleted**, not commented out and not left building;
- the shell is deleted with them.

Keeping the losers alive means every later change has to be made three times,
and it means the client can still reach a design they did not buy.
