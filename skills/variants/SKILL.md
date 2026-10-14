---
name: variants
description: Stage 1 of the jtakeit pipeline — build N clickable design directions on the site's @jtakeit/astro project, each reading correctly on desktop, tablet and phone, plus the preview shell that switches between them. Load when the brief is approved and it is time to design, when the user asks for design directions, options or variants, or when a variant needs rebuilding. Recommends the frontend-design plugin for direction; construction follows the @jtakeit/astro docs.
---

# Stage 1 · The variants

N complete landing pages, each a different answer to the same brief, each
clickable from the first screen to the form on a phone. Not mockups, not one
design with three colour schemes. The client picks a direction by using it.

`variants.count` comes from the state file and was agreed at stage 0. Read it
before starting; do not ask again and do not decide it here.

The project is the one `npx @jtakeit/astro create` made at the brief, and the
site already exists on the platform. Keep the dev server running and the dev
session open (`open_dev_session`) while you work: the developer watches the
pages appear on localhost, and the panel frames the same pages with the
owner's editor on them. How the scaffold is built — the contract, photos, the
hero field, surfaces, shapes, CSS — is in `node_modules/@jtakeit/astro/docs/`
once the project is installed (`kit.md` first), and at
<https://github.com/jtakeit/jtakeit-kit>. Read it; this skill does not repeat it.

## Shared spine, separate skins

Everything factual is shared. Everything expressive is per variant.

```
src/data/site.ts          the business's facts               shared
jtk/content/*.json        the words the owner edits          shared
src/copy/<locale>.ts      the home page's vocabulary         shared
src/content/blocks.ts     what the owner may edit            shared
src/lib/photos.ts         slot → file registry               shared
src/components/LeadForm.astro, BookingForm.astro             shared
src/components/<name>/    that variant's sections            its own
src/styles/<name>.css     that variant's tokens              its own
src/pages/v/<name>.astro  that variant, framed by the shell  its own
```

Routing:

- **`count: 1`** — the home page is the variant. No `/v/`, no shell.
- **`count > 1`** — the home page `/` stays the site's front page and shows the
  leading direction, because the platform judges the build by it (its
  canonical, its robots tag, its annotations) and the owner's editor opens on
  it. Every direction, the leading one included, also gets a page at
  `/v/<name>/` that renders the same content through its own sections.
  **The `/v/` pages carry no `data-jtk-path`**: a page with annotations and no
  content document of its own is refused by `npx @jtakeit/astro catalogue`,
  because a tap there would edit the wrong page. Let each direction's sections
  take the path function as a prop, and pass one that returns `undefined` on
  the `/v/` pages — Astro then writes no attribute at all. Leave them out of
  `PAGES` in `src/data/site.ts`, so the sitemap and `llms.txt` do not list
  them, and canonicalise them to `/`.

Every address the build writes by hand goes through `under()`: the platform's
preview serves the build under `/p/<slug>/`, where a root-absolute link leaves
the site (`docs/pages.md`).

The one query is shared too — `SEARCH` in `src/data/site.ts`, decided at stage
0 and serving every variant, because three directions competing for three
different queries cannot be compared and only one of them can be launched. See
`jtakeit-sites:seo-geo`.

Copy is shared on purpose: three variants that also say three different things
cannot be compared, and the client ends up choosing between sentences while
believing they chose a design. If a direction genuinely needs its own headline,
give the copy module a per-variant override for that one string and leave the
rest alone.

## The spine sells, and that is more than one block

A page that opens with a hero and then goes straight to a service list describes
a business to nobody in particular. Between the hero and the form there is work
to do, and it is not one fixed block.

**How many and in what order is decided once, in the spine, from the brief.**
There is no section budget: a page with nine bands that each earn their place is
better than six that do not.

Three blocks have a fixed job — the hero, the form and the questions. **Everything
between them is chosen from the thirteen angles in `jtakeit-sites:spec` →
[references/copy.md](../spec/references/copy.md): at least two, from the material
rather than from the list, recorded in `design.angles`.** None of the thirteen is
mandatory and the list is deliberately longer than any page needs, so that
picking four is visibly a decision rather than a checklist worked through.

An angle is a job rather than a band — one sentence across the full width, a
photograph with three words on it, a price list — and each block is named after
what it is on *this* page rather than after a template. Each block is also a
block type in `src/content/blocks.ts`, so the owner can change its words later.

Because it lives in the shared content the selling is identical across variants,
which is the point: the client compares how three designs *handle* the same
argument, not three different pitches. Where each block sits and how it is drawn
is each direction's own decision — second on one, after a full-bleed photograph
on another.

The material comes from `BRIEF.md`, in the client's words. A situation the client
did not describe is a situation the page is inventing on their behalf, and they
will notice before their customers do.

**In the client's words is not the same as in the client's sentences.** Their
register, vocabulary and values decide how the page sounds; the text itself is
written — for a stranger arriving from a search, to be better than anything the
client has published about themselves, and to survive a result list and an
assistant's summary. A brief pasted onto a page is the commonest way a variant
ends up looking designed and reading unfinished. The rules are in
`jtakeit-sites:spec` → [references/copy.md](../spec/references/copy.md); they are
not outbound-only, the outbound track is only where they are enforced by a script.

**Below the form, a block of real questions** — the client's actual FAQ, each
answer standing on its own. It carries the `FAQPage` markup and most of the
page's generative-search weight; `jtakeit-sites:seo-geo` has the rules it must
meet.

A business that takes bookings has its booking page from the kit (the services'
listing, `docs/booking.md`). It is shared like the form: each direction styles
it, none of them rebuilds it.

## Directions, not variations

Before writing any code, decide what the N directions *are* and write one line
each into `BRIEF.md` under *Decisions*. They must be far enough apart that a
client can say "that one" without hesitating.

**Far apart means a different shape, not a different skin.**
`docs/shapes.md` carries three catalogues — seven hero anatomies, six page
forms, six type pairings — and directions that share all three are one direction
in three colourways. `docs/surface.md` carries three more, cheaper to vary and
just as visible from across the room: the ground the page is printed on, the
edge its blocks are drawn with, how they arrive. A direction that differs only
in its surface is still one direction; a direction that shares its surface with
the other two has thrown away the cheapest difference it had. Three variants
built in one sitting tend to ship with an identical section sequence; take a
different hero anatomy per variant at minimum, and record what the chosen one
was in `design.*` when the client picks. For Atelier Nord that might be a quiet
Scandinavian print shop, a black salon at night, and a Kreis 4 street poster.
Three fonts of the same layout is not three variants; it is one variant and two
wasted days.

Then, **for each variant separately**, design it. The `frontend-design` plugin
is the recommended tool for this pass — invoke its skill once per variant, not
once for all of them: a single design pass produces one point of view with three
finishes. Without it, do the same pass by hand.

Give it: the business, the audience, the page's single job, the direction's
one-line thesis, the real copy, the actual photographs. Take from it: the token
system, the type pairing, the layout concept and the one signature element. Then
build it here, on the scaffold's rules, which the design pass does not know
about — the annotations, `under()`, the photo pipeline, the shared form.

Guardrails that survive the design pass:

- **The signature element is one per variant.** Spend the boldness in one place
  and keep everything around it disciplined. A moving hero is a legitimate way
  to spend it: `HeroField` is the scaffold's set of ten hero animations,
  degrading to a still ground on every path (`docs/hero-motion.md`). Its
  palette is a required argument and it comes out of `BRIEF.md`'s colour and
  material, not out of the shader it came from. One variant using it and
  another not is a real difference between directions; all three using it is
  one variant three times.
- **The surface is chosen too, and `none` counts.** Ground, edge, entrance —
  three values in `jtk/design.json`, recorded in `design.*` when the client
  picks (`docs/surface.md`).
- **Animation is restrained and always optional.** Scroll reveals, hover states,
  at most one orchestrated moment. Everything must be readable and usable with
  JavaScript off and with `prefers-reduced-motion: reduce`. Over-animation is
  the loudest tell that a page was generated.
- **Nothing scrolls sideways on its own.** A rail that moves while it is being
  read is a bug the client will report as "it's jumping". Reflow instead:
  4 → 2 → 1.
- **Photographs are cropped, never stretched**, and the frame is chosen from the
  picture rather than the picture squeezed into the frame. Where the business is
  one person, the hero is that person (`docs/photos.md`).
- **The phone layout is designed.** Not the desktop layout at 40%. Decide what
  each viewport drops rather than shrinking everything uniformly, and leave a
  comment at each rule saying why that piece stopped earning its space.
- **So is the big screen.** A direction built at 1440 and never widened becomes
  a small island in an empty field at 2560 — a capped shell, fixed type and a
  full-height hero that is four-fifths air. On a large monitor the design gets
  bigger, not more centred; `jt-check` measures it.
- **The brand colour goes through `--accent`** on `:root`, with everything
  derived from it in CSS, so the shell's picker moves the whole palette.

## Clickable means clickable

A variant is done when, on a 390px viewport, a visitor can reach every section,
open everything that looks openable, and submit the form and see the success
state. Placeholder blocks are allowed only where the brief says a photo or a
price is missing, and they must look deliberate — `<Shot>` renders a labelled
placeholder rather than breaking the build.

The form posts to the platform's `/api/lead`, through `under()`. Locally, under
`astro dev`, nothing answers it and a 404 is expected; on the preview it
delivers to wherever the panel says, and `preflight` proves it. A form that does
nothing during a client demo is the thing they remember — so the demo is the
preview, not localhost.

## The preview shell

With `count: 1` there is no shell. The variant lives at `/` and stage 1 is just
the page.

With `count > 1`, install the shell from `$JT/templates/preview/` — the studio
bar that switches variants and viewports. Read
[references/preview-shell.md](references/preview-shell.md) before installing it.

The short version: the variant pages themselves know nothing about the preview.
The shell is a separate page at `/preview/` that frames a variant in an
`<iframe>` sized to 390 / 834 / full. Real media queries apply, because the
iframe genuinely is that wide — so a breakpoint has one activation point
instead of two, and the whole harness is three files that stage 3 deletes
without touching a line of the client's CSS.

The shell carries what the client actually needs:

- variant tabs, as plain links, so a single variant's URL can be sent on its own;
- desktop / tablet / phone, with the current mode in the query so a link
  forwards exactly as seen;
- the accent-colour picker, applied into the frame from the shell — the client
  changing the brand colour live is the demo moment;
- a neutral black bar that is visibly ours, labelled as a preview, using none of
  the landing's typography. It must never be mistaken for part of the design.

On a real phone or tablet the shell does not frame anything: it sends the
visitor straight to the raw variant.

## Before calling it done

```bash
npm run check                    # 0 errors / 0 warnings / 0 hints — not "only warnings"
npx @jtakeit/astro catalogue     # writes jtk/catalogue.json, builds, checks it against dist/

node "$JT/scripts/jt-check.mjs" --dist ./dist                    # and once per variant
node "$JT/scripts/jt-check.mjs" --url http://localhost:4321/v/noir/
```

Then `validate_catalogue` with the catalogue and the `jtk/` files, before any
push: the platform's judge, and the one the build will apply.

`jt-check` covers what `npm run check` cannot: the first screen at three
viewports, orphans swept across widths, anchors landing on their headings,
placeholder frames, alt text, stretched photographs, the first screen on a
27-inch monitor and with JavaScript switched off, the one query in the title, h1
and description, and autofill. Run it against **each** variant, not only the
default one — a direction can break the fold while its neighbour holds it. It
exits non-zero, and it runs before the developer is asked anything.

Then walk each variant at 1440, 834 and 390, in the shell, and click everything.

And put the review gate to the developer before the client ever sees a link.
The question set lives in `jtakeit-sites:spec`
([references/review.md](../spec/references/review.md)) and transfers here almost
unchanged — recognition in the first three seconds, which blocks sell and from
which angle, the hero photograph, voice, the one action — with two differences.
It is asked **per variant**, because a direction can fail at recognition while
its neighbour passes. And the honesty question changes target: not a portrait's
claims table but `BRIEF.md`, and the answer «the client did not say this» is the
same defect wearing different clothes.

Silence does not advance the stage. Nobody objecting is not somebody approving,
and the next person to see these is paying.

## Exit checklist

- [ ] N variants, each a distinct direction, each complete top to bottom
- [ ] the same content and the same facts in all of them
- [ ] the spine sells between hero and form — at least two angles, chosen from
      the catalogue for this client's material, recorded in `design.angles`, and
      every variant carries all of them
- [ ] the blocks named after what they are on this page, not after a template
- [ ] a questions block below the form, answers standing on their own, `FAQPage`
      markup saying the same words as the page
- [ ] every variant works at 360px with no horizontal scroll anywhere
- [ ] `jt-check` at zero failures against every variant, not only the default
- [ ] the page is readable and the form submittable with JavaScript off
- [ ] `prefers-reduced-motion` is honoured by every animation
- [ ] visible keyboard focus; images have real alt text, not file names
- [ ] `npm run check` clean; `npx @jtakeit/astro catalogue` and
      `validate_catalogue` find nothing
- [ ] the `/v/` pages carry no annotations and are not in `PAGES`
- [ ] preview shell installed (or `count: 1` and no shell)
- [ ] the review gate put to the developer per variant, answered, applied

Then:

```bash
node "$JT/scripts/jt-state.mjs" advance preview --note "3 variants ready"
git add src jtk public && git commit -m "variants: paper, noir, poster" && git push
```
