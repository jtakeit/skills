---
name: brief
description: Stage 0 of the jtakeit pipeline — gather everything about the client before a line of design is written, in one conversation, and build on the developer's yes. Load when starting a new client, when the developer says "here is the client", pastes an existing site or an Instagram handle, or when BRIEF.md is still the scaffold's empty one. Produces BRIEF.md, the facts in src/data/site.ts and jtk/site.json, the site on the platform (create_site), and the agreed variant count.
---

# Stage 0 · The brief

The output of this stage is a document that lets somebody who has never spoken
to the client design the page. Everything downstream is an argument from this
file: if the hero is wrong, it is because the brief was wrong.

The platform has its own guide to the brief — `jtakeit:///guides/the-brief.md`,
handed to every agent by the MCP server — and this skill is that guide plus
what a design studio needs on top of it. Where the two would say different
things, the platform's guide wins: it is what the panel and `preflight` read.

Three rules decide the quality of everything after:

- **Nothing is invented.** Every fact in `BRIEF.md` carries where it came from —
  the client said it, the developer said it, the old site said it, Instagram
  said it, or we asked and did not get an answer. A guessed opening hour ends up
  in the diary and in structured data, which is the platform offering a time the
  business never kept and us asserting it to Google as fact.
- **What is missing is written down as missing.** A brief with holes is
  workable. A brief with plausible filler is not, because nobody can tell which
  half to check. Mark gaps `NEEDS CLIENT` and carry them to the launch as open
  items — never a placeholder price, never «9:00–18:00» because most places are.
- **One conversation, before the work.** Read what already exists first, then
  ask everything else in one message, not one question at a time as each file
  needs its answer. The brief is done when the developer has read it and said
  yes.

## If this prospect converted

An outbound project arrives here with `PORTRAIT.md`, a site already on the
platform as a private preview, and a `BRIEF.md` the scaffold wrote and nobody
filled. The brief is shorter but it is not optional, and it has one job the
inbound version does not: **turning guesses into facts.**

- Walk the portrait's claims table with them, line by line. Address, hours,
  prices, phone, services. Every one of those was read off a caption, and every
  one of them is about to go into structured data — and, for a business that
  takes bookings, into the diary.
- Ask for real photographs. What is on the site came off their feed at 1080px,
  compressed twice, and it is why the site will not be as good as it could be.
  Where the business is one person, the specific ask is **a good photograph of
  them** — the hero is their face, and the feed's best frame of it is nearly
  always the weakest picture on the page
  (`node_modules/@jtakeit/astro/docs/photos.md`).
- Ask what the page got wrong. They have already seen it, which is a better
  starting point than any questionnaire.
- Then the ordinary questions below that the portrait could not answer.

Move the portrait's claims into `BRIEF.md` as they are confirmed, then delete
`PORTRAIT.md`: from here it is one document, and it is the inbound one. The
site on the platform stays the same site — same slug, same repository.

## Where the material comes from

In this order. Stop when the picture is complete enough to design against; do
not run all four out of thoroughness.

### 1. An existing site

If the client has one, read it before asking anything — half the brief is
already written and the client will be pleased not to repeat it.

```
WebFetch the home page, then every page in the navigation.
```

Take: the services and their real names, the price list verbatim, addresses,
phone numbers in both the printed and the dialable form, opening hours, legal
entity, every claim they make about themselves, and their tone of voice. Take
**how people book and pay today** — at the till, by phone, through a widget —
because the money question below starts from it. Take the URL of every page: an
old URL that is indexed and printed on business cards must land somewhere after
the relaunch, and that redirect map belongs in the brief.

Also record what is *wrong* with it, concretely: no mobile layout, fourteen
links in the header, prices in an image, no phone above the fold. This is the
list the client will compare the new site against.

### 2. Instagram

Often the only place a small business has ever described itself. See
[references/instagram.md](references/instagram.md) for how to pull a portrait
out of a profile and what may be taken from it.

### 3. The developer, or the client — every question at once

Ask for what only they have. Keep it short — a fifteen-minute conversation, not
a form — and send it as one message.

**The business**

- Who the business is, where it is, what it sells, in one sentence each.
- Who walks in the door. Not a persona — the last three real customers.
- The one thing a visitor should do on the page: call, book, order, write.
- **Which service they want more of.** That answer plus the city is the query
  the page is built for — one, not six (`jtakeit-sites:seo-geo`). Ask it as
  "what would you like the phone to ring about", not as a keyword question.
- What makes them different, in their own words; why they work the way they
  do, and who they turn away. The values answer is the one the page's strongest
  section gets written from, and it is never volunteered.
- What they dislike on competitors' sites. Usually the most useful answer.

**What the platform needs to know** — each of these is read by something, and a
wrong guess is a refusal or a wrong page later:

- **The stack**, when the developer has not named one. Offer Astro, with the
  reason: the platform ships its scaffold (`npx @jtakeit/astro create`, with a
  bookings kit laid out in one command), so the site is standing in minutes.
  Another static generator is taken too and is laid out by hand
  (`jtakeit:///guides/connecting-a-site.md`, *On another generator*); this
  plugin's design stages assume Astro. Never a server-rendered site.
- **The currency**, three letters — `chf` for Atelier Nord. One currency a
  site: it goes into `jtk/site.json` as `"business": {"currency": "chf"}` and
  nowhere else; prices are whole minor units (18000 is CHF 180), and a page
  prints them with `siteCurrency`, never with a code or a sign of its own —
  `preflight` fails a price in another currency.
- **For a business that takes bookings: paid online or on the spot.** Ask,
  never assume. Say back what the current site does («people book online and
  pay at the salon») and ask whether paying online is something the developer
  wants added. A rate without `costs` is bookable and not payable, which is the
  ordinary state for a business that takes its money on arrival. Online
  payment, when chosen, is set up by the business itself in the panel, on its
  own Stripe account — not by us.
- **Where the enquiries go** — a Telegram chat or an email address, which a
  person links in the panel (**The site → Notifications**). An agent cannot
  link one; ask which, and say it is theirs to do before the launch.
- **The languages.** One, unless the developer names a second — a second
  language is a second site to keep written, every page and every post, for
  ever. A blog only where somebody will write it; an empty one says the
  business stopped caring.
- **The photographs** — what exists, at what quality, who can shoot more, and
  whether anyone recognisable has agreed to appear. Where the business is one
  person, a photograph of that person good enough for a hero.
- **The mark** — a logo or the sign over the door, as a file (SVG best, or a
  square picture of 180px or more). It is the icon in every tab, on a phone's
  home screen and beside the site in search results, and nobody gives it unless
  asked. Until it comes the scaffold's stand-in is the business's initials;
  say that back, and `preflight` will keep saying it until the mark arrives.
- **The slug** — the site's name on the platform, so `create_site` can be the
  first call (below).
- **Where the repository lives** — which GitHub account or organisation, and
  who administers it. The platform reads the repository through its GitHub App
  (<https://github.com/apps/jtakeit-connect>), which **a person installs**; it
  reads `Contents` and nothing else. It is the one step you cannot do, so ask
  for it now rather than when the build is waiting on it. A developer who makes
  many sites should install it once on the whole account or organisation, all
  repositories, so each new repository needs nothing more.
- **The domain** — whether they own one, and who holds the registrar login. It
  is attached by a person in the panel, at the launch or later.

**For this studio's own process**

- **How many design variants.** Ask it explicitly, here, and write the number
  into the state file. It changes the shape of stage 1
  (`jtakeit-sites:variants`) and cannot be answered later without wasted work.
- Who writes the copy (below).

### 4. The market

Two or three direct competitors in the same city and the same trade: what
everybody in this vertical says, so we can decide what to say instead. Read
`jtakeit-sites:seo-geo` for what to collect on the search side — the queries a
real customer types, which is not the vocabulary the business uses about itself.

## Bookings take their kind's kit, whole

If the business takes bookings, the platform has a kit for its kind — salon,
clinic, restaurant, hotel, car rental and the rest
(`jtakeit:///reference/kits.md`). **Take it whole**: every collection, every
rate, every setting, with the client's facts put into it. A salon is not «a
service and a master». Taking something out of a kit is a **decision**: name
it to the developer, say what the visitor loses by it, and write it under
*Decisions*.

Each kit has two lists, and the platform's brief guide prints both per kind:

- **Ask** — the facts only the business has (the hours, each service's length
  and price, the people and what each one does). What is not answered is
  `NEEDS CLIENT`.
- **Taken by default** — confirmation, cancellation, payment, how far ahead.
  Say each back as a sentence and get a yes; a «no» is a new value in
  `jtk/bookings.json`, a yes is a fact with a source.

`npx @jtakeit/astro create … --kit <kind>` lays the kit out and seeds its asks
into `BRIEF.md`'s *Done when* list.

## Make the site, and show it

As soon as the first answer gives the slug and the name — not after the last:

1. **`create_site`** with the slug and the name. The studio sees the row in the
   panel from this minute, and the panel's *Setting up* starts taking the steps
   that are a person's — the GitHub App, where enquiries go, whose the site is —
   while you work.
2. **The project**: `node "$JT/scripts/jt-init.mjs" --slug atelier-nord --name
   "Atelier Nord" --locale de-CH --kit salon --variants 3` — a thin wrapper
   around `npx @jtakeit/astro create` that also writes the state file. Then
   `npm ci && npm run dev`, and the site's id from step 1 into the state:
   `node "$JT/scripts/jt-state.mjs" set site.id <id>`.
3. **`open_dev_session`** on the site with the dev server's address, run the
   command its answer gives, and tell the developer the localhost address: the
   pages appear there as they are written, and the corner card says what they
   can do in the panel meanwhile.

`npx @jtakeit/astro create` writes `BRIEF.md` in the platform's shape. Fill
that file — do not start a second one.

## The output

**`BRIEF.md`** at the project root: the scaffold's file, filled, with the
studio's sections added — [references/brief-template.md](references/brief-template.md)
says which and where. It is the argument, in prose, with sources. It is the
client's repository too — the panel shows its *Done when* list to the owner, and
a handover mirrors the repository to them — so nothing goes in it that you
would not show them.

**`src/data/site.ts`** — the facts, as code. Name, address in parts, both forms
of the phone number, email, socials, price range, map link. Everything that
appears in structured data, in the footer and in a `tel:` link lives here and
is rendered from here, so the same phone number cannot appear in two shapes on
one page. Confirmed facts only; anything not confirmed is absent, with a
comment saying it was asked for.

**`jtk/site.json`** — the currency. The business's country, currency and time
zone end up on the panel's **The site → The business**; the import puts the
currency there, and the rest is typed in the panel from what the brief says.

**The state file** — variant count, locale, vertical, slug, the site's id.

## The copy question

Decide now, and write the decision into the brief: whose words are on the page.

- Client supplies copy → we edit for length and structure only, and we say what
  we changed.
- We write it → it is written from the brief's material, and every claim in it
  must be traceable to something the client actually said. A landing page that
  invents credentials is a liability with the client's name on it.

Either way, the sentences live in the content (`jtk/content/*.json`, which the
owner edits in the panel) and the copy module (`src/copy/<locale>.ts`) — never
inside a component. After the launch the owner changes the words themselves by
tapping them on their page; a sentence typed into a component is one they
cannot reach.

## Exit checklist

- [ ] `BRIEF.md` filled: every fact has a source, every gap is `NEEDS CLIENT`
- [ ] the stack, the currency, the languages, where enquiries go — answered
- [ ] bookings: paid online or on the spot asked and answered; the kit taken
      whole, or each thing taken out under *Decisions*; every default said back
- [ ] the mark in hand, or the monogram said back and accepted
- [ ] the GitHub App's installation asked for, from the person who can do it
- [ ] `create_site` done; the site's id in the state file; a dev session open
- [ ] `src/data/site.ts` holds only confirmed facts
- [ ] variant count agreed and written to the state file
- [ ] the one query agreed — `[service] [city]` — and written into `SEARCH`
- [ ] photos in hand, or their absence a known open item
- [ ] if there is an old site: every old URL listed with its replacement
- [ ] the developer has read the brief and said yes — and the *Done when* list
      in `BRIEF.md` says so

Then:

```bash
node "$JT/scripts/jt-state.mjs" advance variants --note "brief approved"
git add BRIEF.md src/data/site.ts jtk/site.json
git commit -m "brief: Atelier Nord" && git push
```
