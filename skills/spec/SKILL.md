---
name: spec
description: Stage 1 of the outbound track — build one speculative landing page from the prospect's portrait, on their own photographs and in their own voice, with @jtakeit/astro, and put it on jtakeit as a private preview the pitch video is recorded from. Load after the portrait is written, when the user says build the spec site, make the mock, or is editing an outbound project before the pitch. The site never launches and never states an unconfirmed fact.
---

# Stage 1 (outbound) · The spec build

One page. Theirs enough that they recognise themselves in it within three
seconds of the video starting. Built from `PORTRAIT.md`, written in the
repository `jt-init` made, and put on jtakeit as a **private preview** — a link,
not an indexed address, and never launched until they say yes.

The scaffold's own documentation is the construction manual for everything
below: `node_modules/@jtakeit/astro/docs/` once `npm ci` has run — `kit.md`
first, then `shapes.md`, `photos.md`, `hero-motion.md`, `surface.md`,
`catalogue.md`, `pages.md`.

## One page, not three

Stage 1 of the inbound track builds N variants because a paying client chooses.
There is no client here. Build the single best answer to the portrait — the
video shows one page, and a prospect offered three directions has been given
homework instead of a gift.

Use the `frontend-design` skill once, with the portrait as the brief. Its
material is unusually good here: the palette comes off their own photographs,
the voice off their own captions, and the hero off whatever they photograph
most. A page that could be any salon is a wasted afternoon — the portrait
exists to prevent exactly that.

**Choose the shape before writing any of it**, from the catalogues in
`docs/shapes.md`: one hero anatomy of seven, one page form of six, one type
pairing of six. This is not a formality. Measured across three consecutive spec
builds for three unrelated businesses — the same hero markup class for class,
the same stack of full-bleed bands, the same serif-over-sans pairing; what
differed was the palette and one component. Nobody chose that; it is what
happens when the shape is never a decision.

```bash
node "$JT/scripts/jt-state.mjs" set design.hero portrait-led
node "$JT/scripts/jt-state.mjs" set design.form letter
node "$JT/scripts/jt-state.mjs" set design.type "all serif"
node "$JT/scripts/jt-state.mjs" set design.pattern construction
node "$JT/scripts/jt-state.mjs" set design.edge corners
node "$JT/scripts/jt-state.mjs" set design.reveal draw
```

And the part a catalogue cannot supply: **one element that could not be moved to
another site.** Their handwriting off a caption, their price card photographed,
the colour of their actual wall, their sign as the wordmark. Seven anatomies over
fifty projects is still eight sites that resemble each other; the material is
what makes a page theirs. Record it as `design.signature`.

Everything the scaffold's docs say applies: the words in `jtk/content/`,
declared as fields in `src/content/blocks.ts` so the owner can edit them later;
facts in `src/data/site.ts`; photos through `astro:assets`; works with
JavaScript off; `npm run check` at zero. This is a real site, built the way a
jtakeit site is built. It has to be, because it is the one they will get.

## Take the voice, write the text

The profile decides how the page *sounds*. It is not a source of finished
sentences, and this is the fault that has to be watched hardest on this track,
because pasting captions feels like the safe, faithful thing to do.

It is not. A caption is written to people who already follow them; a landing
page is read by a stranger who has not, arriving from a search, deciding in five
seconds. What carries over is register, vocabulary, the subject they cannot stop
explaining, and above all **what they believe about their own work** — the
values are almost always sitting in the captions unrecognised, and they are the
thing that makes the page unmistakably theirs.

What does not carry over is the text. Every sentence on the page is written — by
us, in their voice, better than anything they have published about themselves.
That is the product. **Two quoted lines at most**, set as quotations because
they are genuinely better than what we would write; nothing else lifted whole.
`jt-check` measures the page against the scraped captions and fails the stage on
a run of ten words carried over outside a `<blockquote>`.

Quality wins over fidelity of wording every time: the copy has to say what the
business is worth, be specific enough to be false, read out loud without
wincing, and survive a search result and an assistant's summary. The rules, with
the SEO half included, are in [references/copy.md](references/copy.md).

## The page has to sell, and that is more than one block

A page that opens with a hero and then goes straight to a service list describes
a business to nobody in particular. Between the hero and the form there is work
to do, and it is not one fixed block — a good landing page does it three times
before it shows a price, each time from a different angle.

**How many, in what order, and what each one is called is yours to decide from
the portrait.** There is no required shape and no section budget: a page with
nine sections that each earn their place is better than six that do not.

Three blocks have a fixed job — the hero, the form and the questions — because
each one is the page failing without it. **Everything between them is chosen
from the thirteen angles in [references/copy.md](references/copy.md): at least
two, from the material rather than from the list, recorded in `design.angles`.**
The list is long so that it cannot be completed; a page carrying all of it is a
page carrying none of it.

An angle is a job rather than a band, and the block is named after what it is on
*this* page — `conviction`, `plates`, `letter`, not `features`.

On the outbound track these blocks are the easiest place to drift in the
dishonest direction, so be exact about where the material comes from. Recognition
copy is about the *visitor*, not a claim about the business, which is what makes
it safe to write — but each situation still has to be something the portrait
shows this business actually treating. Fine, flat hair that will not hold a
shape, yes, when the captions are about cutting for fine hair. Hair loss because
it reads well, no.

And a recognised problem is not a promised outcome: «by lunchtime the blow-dry
has given up» is the reader's own experience, «this cut lasts eight weeks» is a
claim nobody confirmed. The first belongs on the page, the second never does.

**Below the form, a block of real questions.** It is what an assistant lifts a
paragraph out of, and what a hesitating visitor reads last. On a spec build every
answer comes from their own captions and the `FAQPage` markup waits until a human
confirms them — see `jtakeit-sites:seo-geo` for what the block has to do.

## The hero

Two decisions, and on this track they are the two cheapest things on the page to
get right.

**The photograph is the person, wherever the business is one person.** It is
their business, they are what a customer is actually choosing, and a stranger
opening a video of a site about themselves recognises their own face before they
read a word of it. Hands, a room and a product are the fallback, not the target
— go back through the feed for a frame of *them* before settling. The portrait
says whether one exists (`jtakeit-sites:prospect`).

And the picture is measured before it is placed: `shape()` first, the frame
chosen from the photograph's own proportions, `focus` set so a wide crop does
not take the face off at the chin (`docs/photos.md`). A stretched photograph is
the fault a prospect cannot name and will not book after. `jt-check` fails on
it, which means it is not a matter of opinion.

**Then they are printed the same way.** A scraped feed is twenty pictures in
twenty lights, and cropping them well leaves them still disagreeing — which is
what makes a page read as assembled. One treatment for the site, out of
`docs/photos.md` → *Treatment*, is the cheapest thing on this list and the one a
prospect sees first. Register their own face as `person` before you pick it: the
two strong treatments are refused on it, and on the outbound track that face is
the whole argument.

**The ground moves, unless there is a reason it does not.** `HeroField` is the
scaffold's set of hero animations — ten fields, painted in *their* colours, with
every failure path ending at a still CSS ground. On a spec build this is the
default rather than an option: the page is competing with the last agency's
template, and the first second of the video decides whether the rest is watched.

Not using one is a decision, and decisions get said out loud. A hero that is a
single strong photograph edge to edge is a good reason; forgetting is not, and
the two are indistinguishable in a finished page — which is why `jt-check`
reports whether the hero moves and the review gate asks about it every time,
not only when there is something to look at.

Two rules, and neither is negotiable. **The palette comes out of the portrait's
Colour and material section** — their room, their work, their photographs; the
component will not build without four colours and a ground, precisely so that
this decision cannot be skipped. And **it must look right stopped**: a visitor
who asks for reduced motion, the preview's phone shot and the video's thumbnail
all see one frame of it. See `docs/hero-motion.md`.

A field and a photograph can share a hero; they must not compete for it. The
field goes quiet where the picture lands, or the picture stands alone.

**Under the hero, the page is printed on something.** A spec build with no field
and no ground is a white page with words on it, which is the look the prospect
already has. `docs/surface.md` is the still catalogue — six grounds, in their
colours, no canvas and no script. Pick a ground, an edge and an entrance, or say
why none.

## The rule that makes this honest

**The site may not state a fact nobody confirmed.**

Everything in the portrait's claims table came off a caption. Putting it on a
page turns it into an assertion made on a real business's behalf — a wrong
opening hour in a pitch video is not a typo, it is us telling their customers
something untrue about them.

So:

- **No address, no hours, no prices, no phone number** unless the video is going
  to say where it came from, which it will not. Design the page so it does not
  need them: a contact section can be the enquiry form and an invitation without
  a printed timetable.
- **Except what they published themselves.** When the portrait's «Published by
  them» is filled (`jt-booking` read their booking page), those facts are the
  business's own, on a page it controls, and the page may state them exactly as
  written there: the services with their prices and lengths, the hours, the
  address, the phone. `jt-check` passes each one that matches
  `.jtakeit/booking.json` and still fails anything else. A rating goes in as
  words with its source — «5/5 from 189 reviews on Fresha» — never as stars, and
  never in structured data. Reviews are quoted only by their words, never with
  the reviewer's name.
- **Where the structure needs one**, use the shape without the number — «Termine
  nach Vereinbarung» rather than an invented Tuesday-to-Saturday.
- **No claims of results**, no invented testimonials, no review stars, no client
  counts, no «10 years of experience» read off a bio. Nothing that a competitor
  could screenshot.
- **The city is the one exception**, because the page is built for the query
  `[service] [city]` and without it the page is for nobody
  (`jtakeit-sites:seo-geo`). It goes in only where the portrait actually sourced
  it — a location tag, the bio, a caption — and it names the city, never the
  street.
- **No facts in the structured data.** The layout's JSON-LD carries only what
  `BUSINESS` in `src/data/site.ts` holds: leave the street, the phone, the email
  and the price range empty and they stay out of it, and give no page a
  `schema` of its own — no `FAQPage`, no `Service`, no `Offer`. JSON-LD is the
  machine-readable assertion of facts, and we have none to assert.
- **No booking diary — unless they publish their services.** A kit (`--kit
  salon`) lays out services, prices and hours that are the brief's to fill,
  and a preview's diary takes test bookings. With nothing published, there is
  nothing confirmed to put in it: the one action is the enquiry form, and the
  kit is laid out after the brief. When `.jtakeit/booking.json` holds their
  services with prices and lengths and their hours, ask the developer once
  whether the spec shows booking on the business's own site: if yes, lay out
  the kit with exactly those services, those hours and their team's first
  names, paid **on the spot** (a preview charges nobody, and how they take
  money is the brief's question). It is the strongest thing the pitch can show
  a business that pays a platform today — their own booking, on their own
  page.

What the page *can* say freely is everything the business said about itself, in
their own words, arranged well. That turns out to be plenty — the reason their
current situation is bad is usually presentation, not a lack of material.

## Build it where the developer can watch

**Before a line of the page**, the platform's order (`jtakeit:///guides/start.md`,
step 2) — not after it:

1. `create_site` with the slug and the name — `atelier-nord`, «Atelier Nord»,
   `locale` `de-CH`; record its id with
   `node "$JT/scripts/jt-state.mjs" set site.id <id>`. It is a demo row in the
   developer's list, nothing public. «That slug is taken» with no id is another
   account's site (`JTK_E_SLUG_TAKEN`) — choose another.
2. `npm ci`, and `npm run dev` in the background.
3. `open_dev_session` on the site with the dev server's address, and run the
   command its answer gives.
4. **Give the developer the localhost address** (`http://localhost:4321/`) in
   one line: the page appears there as you write it, and the corner says where
   the site is on the platform. A developer who learns of the page only from
   the preview link has watched nothing for half an hour.

Then write it, and check it:

```bash
npm run check
npx @jtakeit/astro catalogue      # jtk/catalogue.json from blocks.ts, checked against dist/

node "$JT/scripts/jt-check.mjs" --dist ./dist
```

`npm run check` says the code is sound and says nothing about whether the page
composes or whether it is honest. `jt-check` is the other half: the facts audit,
the copy measured against the captions, the one query, the first screen at
three viewports and on a 27-inch monitor, orphans swept from 320 to 1600,
anchors landing on their headings, placeholder frames, stretched photographs,
the first screen with JavaScript off, alt text, autofill. It exits non-zero,
and it runs **before** the page goes anywhere and before the developer is asked
anything — see the review gate below.

## Put it on jtakeit, as a private preview

The pitch video is recorded off the site as the platform built it, so the spec
site goes on jtakeit — and goes no further than a preview. Nothing in these
steps makes it public: a site is launched only by a person, in the panel.

**The GitHub App, once.** The platform reads the repository through its GitHub
App, which a person installs: <https://github.com/apps/jtakeit-connect>. On the
outbound track, where every prospect is a new repository, tell the developer to
install it **on their whole account or organisation, all repositories**, once —
then each new demo repository needs no manual step. Installed on selected
repositories only, every new one has to be added by hand, and `attach_repo`
refuses with the link until it is. You cannot install it; ask. `/jt-setup`
saved which account the repositories go to — `jt-setup owner` prints it — and
`jt-setup app` says what GitHub can tell about the App there.

Then, through the jtakeit MCP server:

1. The site exists since the build began (`site.id` in the state). If it does
   not — a project started before this order — `create_site` now.
2. `validate_catalogue` with `jtk/catalogue.json` and the `jtk/` files — the
   platform's judge, before the push.
3. The repository, private, under the developer's account or organisation —
   asked of the developer first, never assumed, because it puts a business's
   name on their account:

   ```bash
   gh repo create <owner>/atelier-nord --private --source . --push
   ```

4. `attach_repo` with `owner/atelier-nord`. It imports the default branch.
5. `commit_and_build`, then `get_build` until it settles; `get_build_log` when
   it does not. A commit moves the branch — `git pull` before your next one.
6. `get_built_page` with `shot: "phone"` — look at it: the fold, an empty
   block, a cut line, a placeholder frame, the form. This is the page the video
   will record.
7. `get_preview_link` with a `label` («pitch — Atelier Nord») and `days` (up to
   30; the outreach takes time). Record it:
   `node "$JT/scripts/jt-state.mjs" set prospect.previewUrl "<url>"`.

The link is a credential: whoever opens it sees the preview, and only the
preview — it cannot take the site. The platform keeps the preview out of search
engines itself; the build must not say `noindex` (it is refused,
`JTK_E_NOINDEX`). The link goes into the pitch recording and, later, to the
prospect — nobody else. A prospect who finds a copy of their business on the
open internet that they did not make has been given a reason to be angry rather
than interested; a link sent to them alone is a proposal.

If they say no, a person archives the site in the panel (Sites → the row's menu
→ Archive), which takes it off the internet and revokes its links.

Later changes are the ordinary loop: `git pull`, commit, `import_branch`,
`commit_and_build`, look again.

## The review gate

This stage does not end because the page builds. It ends when a human has
actually looked at it — and "looked at it" has to be forced, because it is the
one step that silently degrades. The developer who has been watching the page
take shape sees what they meant to build; the one seeing it for the first time
scrolls once and says it looks fine. Neither has reviewed anything.

**So Claude asks. A short set of questions that cannot be answered without
opening the page** — the preview link on a phone is the right way to open it —
one at a time, with a recommendation attached where there is one, and the
developer free to ignore the question and describe the page they actually want
instead. The set is in [references/review.md](references/review.md) —
recognition in the first three seconds, which blocks are selling and from which
angle, the hero photograph, voice, honesty against the claims table, and the one
action.

Two rules about it. **Silence does not advance the stage**: nobody objecting is
not the same as somebody approving. And **nothing measurable goes in the
questions** — hero fit, orphans, anchors, autofill, placeholders, unconfirmed
facts in the HTML are checked by machine before the gate opens, because a person
asked about any of them answers "fine" and is honestly wrong.

Once the answers are in, apply them and then say what changed and what you
deliberately did not, and why. A developer who cannot tell which of their notes
were taken stops writing notes.

What the questions usually surface, and what is worth pre-empting before asking:

- **The hero is generic.** Nearly always the fix is a photograph of the person
  rather than of the work, and a headline written closer to their own register.
- **It looks like our other spec sites.** The portrait had colour and material
  in it; if the page did not use them, it was ignored.
- **Sections that do not earn their place.** Not the count — length is not the
  fault, and a page is not improved by deleting a block that was working. The
  fault is a band that repeats what the one above it already said, or that says
  nothing the visitor needed. Cut those and keep the rest, however many that is.
- **Text too small to survive the video.** It will be seen at phone size inside
  a phone-shaped column. Anything under 15px is decoration.

Design for that scroll deliberately: the page is going to be *watched*, not
read, before it is ever visited. That is an argument for each band reading at a
glance, not for having fewer of them — the video shows the top of the page and
the pitch is the whole page, and those are different jobs.

## Exit checklist

- [ ] `create_site`, the dev server and `open_dev_session` before the first line,
      and the localhost address given to the developer
- [ ] one page, built from the portrait, recognisably theirs
- [ ] the page sells between the hero and the form — at least two angles chosen
      from the catalogue, each doing a different job, all of them drawn from the
      portrait, and recorded in `design.angles`
- [ ] the blocks named after what they are on this page, not after a template
- [ ] a questions block below the form, every answer from their own captions,
      each one readable lifted out of the page, no `FAQPage` markup yet
- [ ] their photographs in `src/assets/`, registered with alt text, no customer's face
- [ ] the hero shows the person, where the business is one person — measured,
      framed to its own proportions, focused so the face survives the crop
- [ ] copy in their language and their register, **written rather than lifted** —
      at most two marked quotations, nothing else carried over whole
- [ ] the values on the page, in sentences that could only be about this business
- [ ] `SEARCH` filled in `src/data/site.ts`, and the title, h1 and description
      written for that one query — carried by sentences, not by repetition
- [ ] the hero moves, in their colours — or it does not and the reason is
      written down, not forgotten
- [ ] the shape chosen from the catalogues and recorded in `design.*` — and not
      the shape the last project used
- [ ] one element on the page that could not be moved to another site
- [ ] every heading read aloud in order: labels or statements, no «not X, but Y»
- [ ] any pulled quotation stands unattributed — no name, no «on her profile»
- [ ] **no unconfirmed fact anywhere on the page** — no address, hours, prices,
      phone — and none in `BUSINESS`, so none in the JSON-LD
- [ ] no invented testimonials, ratings, or claims of results
- [ ] no booking diary on the spec build
- [ ] `npm run check` clean, `npm run build` clean
- [ ] `jt-check --dist ./dist` at zero failures — the composition floor and the
      facts audit measured rather than eyeballed
- [ ] reads well at 360px, which is what the video records — and at 2560, where
      a page built at 1440 turns into an island in an empty field
- [ ] `validate_catalogue` clean; the repository private; the site attached
      and built; `get_built_page` with `shot: "phone"` looked at
- [ ] a preview link, labelled, recorded in `prospect.previewUrl` — and the
      site not launched
- [ ] the review gate put to the developer as questions, answered, and the
      answers applied — with what was not applied said out loud

Then:

```bash
node "$JT/scripts/jt-state.mjs" advance pitch --note "spec site on a private preview"
git add src jtk public STATUS.md .jtakeit/state.json
git commit -m "spec: landing for @atelier.nord.zh"
git pull && git push
```

and `import_branch`, `commit_and_build` if the push moved anything since the
last build.
