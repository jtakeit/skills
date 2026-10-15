---
description: Open the showroom — every hero field, ground, edge, entrance and gallery, live on localhost, in this project's colours and on its photographs
argument-hint: "[--photos <dir>]"
---

Open the showroom for this project: $ARGUMENTS

The showroom is the scaffold's own: `@jtakeit/astro` lays out a scratch copy of
itself, outside this project, and shows every piece it ships on one page — the
ten hero fields, the grounds, the edges, the entrances and every gallery
arrangement, live. Run here it uses this project's `jtk/design.json` for the
colours and its scraped photographs (`.jtakeit/photos`, else `src/assets`) for
the galleries; nothing in the project changes.

```bash
npx --yes @jtakeit/astro@latest showroom $ARGUMENTS
```

Run it in the background — it is a dev server — and wait for the line with the
address. The first run of a version installs the scratch site, about a minute;
later runs start at once. Then give the developer one line:

- the address, `http://localhost:4330/showroom/`;
- what it is in: this project's colours and how many of its photographs, or a
  sample palette when there is no `jtk/design.json` yet.

Use it to choose with the developer rather than for them: the name under each
piece is what goes in `jtk/design.json` (`field`, `surface.pattern`,
`surface.edge`, `surface.reveal`) or on `<Gallery arrangement="…">`. Say which
two or three you would pick for this business and why — from the portrait or
the brief, not from taste — and let them answer.
