# The floor — what every site stands on

The floor is *how* a site is built, never *what it looks like*. It is the same
on every site, it is never compared between sites, and it never makes two of
them alike. Each item is something a visitor feels whatever the design: a page
that jumps in Instagram's browser, text that reflows when the font arrives,
prices that do not line up.

It was written down on 18 November 2026 (jtakeit-core wiki/115) after reading
eleven of the studio's sites: every one of them had a strong idea of its own,
and the floor was what failed — on nearly all of them. Taste was never the
problem; these were.

They are **the kit's tokens and defaults**: the scaffold of `@jtakeit/astro`
lays out `--screen`, `--measure-read`, `--measure-object` and `--radius` in
both looks (Brumy's and the bare one), and the kit draws money and booking
times with the right figures itself. A project scaffolded before a token
existed gets the same rule by hand. None of it is a gate: the kit's lint and
`jt-check` warn, the design stages build to it, and the site critic names what
it sees missing.

## The checklist

- [ ] **F1 · Screen height is `--screen`.** Every full-height or
      first-screen height reads `var(--screen)`, set from `innerHeight` before
      paint, with `100svh` as the fallback — never `vh`, `svh` or `dvh` in a
      height. The in-app browsers of Telegram, Instagram and WhatsApp resize the
      viewport under `vh`, and that is where most of a local business's visitors
      open the link.
- [ ] **F2 · Fonts do not jump.** Own `woff2` files, served with the site —
      not from a third-party host; the faces the first screen uses preloaded;
      each fallback given `size-adjust` and `ascent-override` measured for the
      pair, with the kit's font measurer (`jtk fonts`, kit ≥ next release).
      And never a family named in CSS that is not loaded: Brumy's headings named
      Instrument Sans, which no page ever downloaded.
- [ ] **F3 · Numbers line up.** Tabular lining figures
      (`font-variant-numeric: tabular-nums lining-nums`) wherever money, times
      and durations are drawn — a price list, a timetable, a booking's slots.
      `site.money()` and the booking form's times carry it already; a price
      typed into a section by hand does not.
- [ ] **F4 · Three measures.** Reading text and photographs on paper sit on
      `--measure-read`; filled surfaces — a calendar, a form, a card — on
      `--measure-object`, the same width as the header's capsule; the
      beginning and the end of a page may go full bleed. Sections use the
      tokens, not a literal `38rem` here and `42rem` there.
- [ ] **F5 · One radius family.** One base, `--radius`; the other steps
      derived from it; a nested corner is the outer one minus the padding
      between them (Strupler's header already does this). A page with nine
      unrelated radii reads as assembled even when nobody can say why.
- [ ] **F6 · Phones by rule.** A row of up to seven things becomes a swipe
      with a peek of the next; a long list stays a list; thumbnails share the
      width and are never cropped to fit; a tablet is a large phone, not a
      narrow desktop. Stacking everything is a choice nobody made.
      `docs/compositions.md` carries the rule; `jt-check` looks at 393, 768,
      1032 and 1440.
- [ ] **F7 · Data shows only an action.** Only the days with free time, the
      calendar from the first free week, a lone choice chosen by itself. This is
      the kit's booking form's own behaviour — use it, do not rebuild it.

## What can be seen, and what has to be looked up

From the screenshots: prices in a column whose digits do not line up (F3), a
paragraph running 90 characters to a line or a form stretched across the
screen (F4), corners of four different roundnesses on one screen (F5), a row
of cards stacked into a long column on a phone, or thumbnails cut off (F6).

From the build, in seconds — not visible in a picture:

```bash
# F1: a height in vh, svh or dvh (a `var(--screen, 100svh)` fallback is the rule, not a fault)
grep -rohE 'height:[^;}]*[0-9.]+(s|d|l)?vh' dist --include='*.css' --include='*.html' | sort | uniq -c
# F2: a font from someone else's host, and which faces are preloaded
grep -rohE '(fonts\.googleapis|fonts\.gstatic|use\.typekit|fonts\.bunny)\.[a-z]+' dist | sort -u
grep -oE '<link[^>]+as="font"[^>]*>' dist/index.html
# F5: how many distinct radii the built CSS uses
grep -rohE 'border-radius:[^;}]+' dist --include='*.css' --include='*.html' | sort | uniq -c | sort -rn | head -20
```
