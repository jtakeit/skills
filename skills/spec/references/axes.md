# The axes — a catalogue of what the studio has built

An **axis** is a choice every site makes, whether anybody decides it or not:
what the first screen is, what the page is printed on, how the header behaves.
A **variant** is one way a site of ours made it, with the site it came from.
This file lists thirteen axes and every variant we have built on each, so that
whoever designs the next site — the studio, or an agent with a person in a
chat — chooses per axis from the client's material instead of arriving, by
habit, at the last site's answer.

It was read on 18 November 2026 (jtakeit-core wiki/115) from eleven sites of
the studio's portfolio. Every one had a strong idea of its own and none of them
looks like another; the catalogue exists to keep that true when the author is
an agent rather than the studio.

**Nothing here is a rule about being different.** A person makes the sites
they like, similar ones included. Similarity is *shown* — `jt-studio` lists the
studio's last sites and the critic sets them beside the new one — and never
refused. The catalogue is a base to choose from and to extend, not a list of
what is taken.

What the catalogue is not: the **floor** ([floor.md](floor.md)) — how a site is
built, the same on every site, never compared — and the kit's construction
catalogues (`docs/shapes.md`, `docs/surface.md`, `docs/compositions.md`), which
say *how to build* a hero anatomy, a ground or a section. Those record into
`design.*` in the state as before. The axes record which of the studio's
variants the site takes, in `jtk/design.json`, where the critic and later the
platform can read them.

## The sites

| Site | What we read |
| --- | --- |
| **Brumy** | the studio's own site (`brumy-www`), its portfolio in `src/data/work.ts` |
| **jtakeit** | jtakeit.com (`jtakeit-www`) |
| **Strupler** | Strupler Holzbauplanung, the published site |
| **Rail-tec** | `railtec`, the direction `gleis` |
| **KAIF** | `kaif-zurich` |
| **Maserung** | a concept |
| **Lacqué** | a concept |
| **Kurve** | Fahrschule Kurve, a concept |
| **wohlfühl-Raum** | a sessions studio, built against production |
| **Secret Tumb** | its portfolio film only |
| **Natshalee** | its portfolio film only |

## How a design stage uses this

1. **Read the floor first** ([floor.md](floor.md)). It is not chosen; it is
   there on every direction.
2. **See what the studio did lately**, so a choice that repeats it is made
   knowingly:

   ```bash
   node "$JT/scripts/jt-studio.mjs"          # the last three sites, their axes and hero shots
   ```

   It reads the studio index on this machine (below). Nothing in it is a rule:
   a variant the last site used is still right when this client's material
   asks for it.
3. **Per axis, answer its question from the client's material** — the
   portrait, the brief, the photographs, their room, their sign — and take the
   variant that answers it. The question is the *chosen from* line under each
   axis. Where none of the variants answers it, **make a new one** (below).
4. **Write the choice to `jtk/design.json` under `axes`** — fourteen keys,
   string values, beside the kit's own settings in the same file:

   ```json
   {
     "v": 2,
     "paper": "#f6f1ea", "ink": "#2e2620", "accent": "#7f5233",
     "axes": {
       "hero": "portrait-dissolve",
       "ground": "light",
       "measures": "38/76/88",
       "shape": "soft",
       "header": "strip-to-capsule",
       "phone_menu": "popover",
       "overlap": "sheet-stands-up",
       "surfaces": "linen, walnut, cork, sage — their room",
       "mark": "the ring off her logo, drawn",
       "motion": "rise · 1",
       "fonts": "serif+serif: Cormorant + Newsreader",
       "hook": "free-slots",
       "proof": "quote-band",
       "contact": "diary-in-page"
     }
   }
   ```

   A value is the variant's **id** from the tables below, optionally followed
   by `: ` and a note (`"fonts": "serif+sans: Fraunces + Inter"`). The id is
   what gets compared; the note is for people. `measures`, `surfaces` and
   `mark` are written out, not chosen from ids.
5. **N directions** (`jtakeit-sites:variants`) differ on several axes on
   purpose — the visible ones: hero, ground, shape, header, overlap, motion,
   fonts, hook. Each direction's axes go on its line in `BRIEF.md` under
   *Decisions*; `jtk/design.json` holds the leading direction's, and the
   chosen one's once the client picks.

### A new variant

The catalogue grows by the rule it started with: **a variant enters when a
site has built it.** When the material asks for something none of the rows
does, make it:

- give it an id in the same form — two or three words, what it *is*
  (`menu-on-the-wall`, not `hero-v2`) — and write it in `axes`;
- write one line in `BRIEF.md` under *Decisions*: what it is, and what in the
  client's material asked for it;
- once the site is built and the client has seen it, offer it back: a row in
  this file with the site's name, in a pull request to jtakeit/skills. A
  client's site enters a shared catalogue only with that business's consent;
  the studio's own sites and concepts are ours to list.

## A1 · Hero anatomy — `hero`

*Chosen from:* is there a strong picture of a person, a thing they make, or
neither?

| id | Variant | Site |
| --- | --- | --- |
| `portrait-dissolve` | a portrait dissolving into the words | wohlfühl-Raum |
| `split-framed` | split: the words and a framed photograph | Kurve; Natshalee's gold arch |
| `type-over-film` | typography as the image, over their own film | Rail-tec |
| `live-window` | the words over a live product window | jtakeit |
| `reel` | a reel of their work, turned to the viewer | Brumy |
| `model-explode` | their own 3D model, exploded by scroll | Strupler |
| `model-turn` | their own 3D model, turning and opening | Secret Tumb |
| `data-object` | an object that is data — the next night as a ticket | KAIF |
| `bleed-after-intro` | a full-bleed photograph after an intro that draws the monogram | Maserung |
| `material-field` | a live material field, no photograph | Lacqué |

A person worth a screen → `portrait-dissolve` or `split-framed`; a thing they
make → `model-*`, `reel`, `bleed-after-intro`; neither → `type-over-film`,
`material-field`, `data-object`. The kit's anatomy that builds it
(`docs/shapes.md`: split, overlay, typographic, portrait-led, masthead, object,
pile) still goes to `design.hero` in the state.

## A2 · Ground and pacing — `ground`

*Chosen from:* the hour of the business, and its room.

| id | Variant | Site |
| --- | --- | --- |
| `light` | all light | wohlfühl-Raum, jtakeit, Brumy, Strupler |
| `light-one-dark` | light, with one dark band — the ending, the booking, or one band | Maserung (the ending), Kurve (the booking), Rail-tec (one band) |
| `dark-hero-light` | a dark hero, then light | Secret Tumb, Natshalee |
| `night` | night through the hero and the middle | Lacqué |
| `dark-room` | a dark room with one light object | KAIF |

For `light-one-dark`, say which band: `"light-one-dark: the booking"`.

## A3 · Measures — `measures`

*Chosen from:* how many objects the business has — a calendar, a menu, a
configurator want the wider object measure; a page of prose and photographs
lives on the reading one.

Written as `read/object/shell` in rem. What we built: reading 30–44rem, shell
72–94rem; wohlfühl-Raum 76/88 for the object measure and the shell. The tokens
are the floor's (F4); the numbers are this axis.

## A4 · Shape — `shape`

*Chosen from:* the material — wood and cloth softer, steel and concrete
stricter.

| id | Variant | Site |
| --- | --- | --- |
| `square` | 0–2px | Rail-tec, Maserung |
| `small` | 3–12px | Strupler |
| `scale` | a stepped scale, 6–34px | Kurve |
| `soft` | 10–28px | wohlfühl-Raum, jtakeit, Lacqué |

Pills on top, or not: `"soft+pills"`. Whichever, one family from one base
(F5).

## A5 · Header — `header`

*Chosen from:* the mark, and the number of menu items.

| id | Variant | Site |
| --- | --- | --- |
| `strip-to-capsule` | a strip that becomes a capsule as you scroll | Brumy, wohlfühl-Raum, Natshalee |
| `capsule` | a floating capsule throughout | Strupler, Lacqué |
| `hide-on-scroll` | a strip that hides going down and returns going up | Rail-tec, Maserung, Kurve |
| `mega-menu` | a bar with mega-menu panels | jtakeit |
| `wordmark-only` | the wordmark only, no navigation | KAIF |
| `strip` | a plain strip | Secret Tumb |

## A5′ · Phone menu — `phone_menu`

*Chosen from:* the header it belongs to — how many items it carries, and how
much of the brand a phone's menu can hold. The survey wrote down no rule of its
own here yet; choose it with the header, not after it.

| id | Variant | Site |
| --- | --- | --- |
| `wipe` | a full-screen wipe | Maserung |
| `circle` | a circle opening from the button, in the accent | Kurve |
| `dropdown-card` | a dropdown card | Lacqué |
| `popover` | a popover | wohlfühl-Raum |
| `accordion-fab` | an accordion, with a floating action | jtakeit |

## A6 · The overlap — `overlap`

*Chosen from:* what the main action is — the thing that crosses the hero's
edge is the thing the page wants touched.

| id | Variant | Site |
| --- | --- | --- |
| `sheet-stands-up` | a sheet over the hero's foot that stands up on scroll | wohlfühl-Raum |
| `card-over-edge` | a card over the photograph's edge | Rail-tec |
| `chips-break-frame` | chips breaking the photograph's frame | Kurve |
| `object-over-poster` | the object over their own poster | KAIF |
| `caption-over-object` | a caption over the turning object | Secret Tumb |
| `arch-over-band` | the arch over the band's edge | Natshalee |
| `stacked-windows` | stacked windows | Brumy, jtakeit |
| `none` | none — the header over the hero only | Strupler, Maserung, Lacqué |

## A7 · Surfaces — `surfaces`

*Chosen from:* always their photographs or their place — **never the
template's palette**.

Written out: the materials and where they came from. What we built:

- the room's own materials — linen, walnut, cork, sage (wohlfühl-Raum)
- drafting paper and a millimetre grid (Strupler)
- paper and the blue of their tiles (Rail-tec)
- violet-black grain and paper stock (KAIF)
- lime plaster and walnut (Maserung)
- blush paper and night (Lacqué)
- paper and lime blocks (Kurve)
- chocolate, cream and gold (Natshalee)

## A8 · The mark — `mark`

*Chosen from:* this client, always. **Required on every site, and never
compared**: it is what could not be moved to another site, so two sites can
never share it and nobody should look for a match. It is the line
`design.signature` in the state points at.

Written out. What we built:

- the ring off her logo, drawn (wohlfühl-Raum)
- plan annotation and dimension lines (Strupler)
- a rail with sleepers, and a train (Rail-tec)
- the ticket stub, barrier tape (KAIF)
- wood grain (Maserung)
- a gloss sheen (Lacqué)
- the road (Kurve)
- the drawer tray (Secret Tumb)
- the arch and the lotus (Natshalee)
- the browser window (jtakeit)

## A9 · Motion — `motion`

*Chosen from:* the tempo of the business.

| id | Variant | Site |
| --- | --- | --- |
| `rise` | rises and stands up on scroll | wohlfühl-Raum |
| `scrub` | scrubbed by scroll | Strupler (the explode) |
| `draw` | draws itself | Maserung (the grain), Kurve (the road), Strupler (the chain) |
| `sheen` | a sheen | Lacqué |
| `cycles` | timed cycles | KAIF, Secret Tumb |
| `pointer` | follows the pointer | Brumy |
| `types` | types | jtakeit |

And a **budget of regions that move on their own**, written after the id:
`"motion": "draw · 2"`. What we built: Rail-tec 2, KAIF 3. Everything still
readable with `prefers-reduced-motion: reduce`.

## A10 · Font pair — `fonts`

*Chosen from:* their voice and their sign. The kit's pairings are in
`docs/shapes.md` → *Type pairings*; these are the ones we set.

| id | Variant | Site |
| --- | --- | --- |
| `serif+serif` | serif over serif — Cormorant and Newsreader | wohlfühl-Raum |
| `serif+sans` | serif over sans | Lacqué, Maserung, Natshalee |
| `grotesk+grotesk` | grotesk with grotesk | Kurve, jtakeit, Brumy |
| `wide-sans+mono` | a wide variable sans with a mono | Strupler |
| `condensed-caps+sans` | condensed capitals over a sans | Rail-tec |
| `heavy-display+sans` | a heavy display over a sans | KAIF, Secret Tumb |

Name the faces after the id: `"serif+sans: Fraunces + Inter"`. The files are
the floor's (F2).

## A11 · The hook — `hook`

*Chosen from:* the one question a visitor arrives with. The hook is the thing
on the page that answers it by being used, not read.

| id | Variant | Site |
| --- | --- | --- |
| `tap-where-it-hurts` | tap where it hurts — a neck gauge | Natshalee |
| `turn-and-quiz` | a turning product, its colours, a quiz | Secret Tumb |
| `configurator-price` | a configurator whose price carries into the booking | Maserung |
| `shade-studio` | a shade studio and a price list that sums | Lacqué |
| `road-next-slot` | a road of steps and a live next-slot chip | Kurve |
| `scrub-model` | scrub the model | Strupler |
| `train-on-rail` | a train on the rail | Rail-tec |
| `spotlight-tear-countdown` | a spotlight, a tear-off, a countdown | KAIF |
| `free-slots` | free slots on the home page | wohlfühl-Raum |
| `before-after` | before and after | Brumy |
| `live-panel` | a live panel | jtakeit |

## A12 · Proof — `proof`

*Chosen from:* what the business must prove. It also decides the order of the
home page's sections (below).

| id | Variant | Site |
| --- | --- | --- |
| `references` | references with places and credentials | Strupler |
| `client-belt-plates` | a belt of clients, and approvals as plates with their validity | Rail-tec |
| `poster-wall` | a wall of their own posters | KAIF |
| `stars-in-hero` | stars in the hero | Maserung, Lacqué |
| `rate-bar` | a pass-rate bar | Kurve |
| `tradition-figures` | big lining figures of the tradition | Natshalee |
| `work-films` | films of the work | Brumy |
| `named-sites` | a line of named sites | jtakeit |
| `quote-band` | a band with a client's quote | wohlfühl-Raum |

Proof is a fact, so the honesty rules hold whatever the variant: on a spec
build a rating is words with their source, never stars (`jtakeit-sites:spec`),
and a quote, a figure or a client's name is one somebody confirmed.

## A13 · Who answers, and the one action — `contact`

*Chosen from:* how they work with a customer.

| id | Variant | Site |
| --- | --- | --- |
| `portrait-form-phone` | one portrait, a form and a phone | Strupler |
| `two-people-lines` | two people with direct lines, beside the form | Rail-tec |
| `brand-ticket` | the brand only, the ticket to Eventfrog | KAIF |
| `one-whatsapp` | one WhatsApp message | Natshalee |
| `telegram-form` | Telegram and a form | Secret Tumb |
| `diary-in-page` | the platform's diary in the page | wohlfühl-Raum, Kurve |

## Recorded, not chosen

Two things every site has that are not picked from a list. Record them all the
same, so the record of the site is whole:

- **The order of the home page's sections.** It follows from what the
  business must prove (A12) and has been different on every site. It is
  `design.sections` in the state, as before.
- **The page-to-page transition.** Only wohlfühl-Raum dissolves between pages;
  it becomes a kit default once it is proven. Record it with
  `jt-state set design.transition none` (or `dissolve`).

## Live data in the hero

Across A1 and A11, the strongest heroes we built show something live: KAIF's
ticket reads the next event, Kurve's chip the next free lesson, wohlfühl-Raum's
calendar the free slots. That is jtakeit's own advantage over a page builder —
the platform holds the diary and the events, and the kit draws them. Where a
hero or a hook can answer the visitor's question with the business's own live
data, prefer that over a picture of the same thing; it is drawn from what the
platform holds, or from a field the owner edits — never a constant in a script.
It will be a catalogue entry of its own once the booking engine settles.
