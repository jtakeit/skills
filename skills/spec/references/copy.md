# The copy

Where the sentences on the page come from, and where they do not.

The profile decides **how the page sounds**. It does not decide what the page
says, and it is not a source of finished text. Those are two different jobs and
collapsing them is the most common way one of these builds goes wrong.

## Two ways to get it wrong, and they are opposites

**Transcription.** The captions are pasted onto the page, lightly rearranged.
It feels safe — every word is theirs, nothing is invented — and it produces a
page that reads like a feed: no headline that works cold, emoji mid-sentence,
hashtags, a register written for people who already follow them, and references
to things that happened last Tuesday. A caption is written *to an audience that
already chose you*. A landing page is read by a stranger who has not.

**Erasure.** The other failure: correct, professional, keyword-clean copy that
could belong to any of four hundred businesses in the same trade. Nothing in it
is wrong and nothing in it is theirs. This is what a template produces, and a
prospect recognises it in about two seconds — it is the reason the pitch gets no
reply.

The line between them: **take the voice, write the text.**

## What is taken

Read the whole feed, not the last five posts, and take:

- **Register.** Formal or familiar, `du` or `Sie`, warm or clinical, short lines
  or paragraphs. This is the single biggest decision and it is theirs.
- **Vocabulary.** What they call their own services, their customers, their
  room, their tools. Use their word, not the industry's, wherever the two
  differ — and keep the professional term too where a customer searches for it.
- **What they keep coming back to.** The subject they cannot stop explaining is
  what they actually care about, and it is usually the strongest section on the
  page.
- **Their values, stated as they state them.** Why they work the way they do,
  what they refuse to do, who they turn away, what they think everyone else in
  the trade gets wrong. This is what makes a page belong to a person, and it is
  almost always sitting in the captions unrecognised.
- **Concrete detail.** The one chair, the hour booked for every cut, the four
  years spent learning one technique. One real detail is worth a paragraph
  of adjectives.

## What is quoted

Very little, and deliberately.

**Two lines at most**, and only where the sentence is genuinely better than
anything we would write — the one that lands, that a person would repeat.

**A quotation on their own site is not a citation.** This is the part that goes
wrong, and it goes wrong in the same way every time:

```
    Every head of hair already knows the shape it wants to be.
    — Lea, on her Instagram             ← no
```

Whose site does the reader think they are on? Everything on the page is Lea
speaking; attributing a line to her is like signing your own letter twice, and
it turns a strong sentence into a screenshot of somebody else's words. Worse on
the outbound track, where it says out loud that we went through their Instagram
— the prospect is supposed to see a site about their business, not our research.

So a pulled line is set as a pulled line — bigger, apart, in their voice — with
**no source, no name, no "on her Instagram", no post date, no handle**. If it
needs an attribution to make sense, it is not a quotation, it is a sentence that
belongs in the body copy without the quote marks. The only attributions a page
ever carries belong to *other* people: a real, confirmed customer, with their
consent — which on a spec build means none at all.

**Nothing else is lifted whole.** No paragraph pasted, no caption "cleaned up"
into a section, no headline that is a caption with the emoji removed. A run of
ten or more words carried over verbatim outside a marked quote is transcription,
and on a spec build `jt-check` measures it against the scraped captions and
fails the stage.

Everything else is written — by us, in their voice, to do a job the caption was
never doing.

## Headings, which is where the writing usually collapses

Body copy tends to survive; headings are where a page starts sounding like it
was generated, because a heading is the one place the temptation to be clever is
strongest and the space to be clear is smallest.

Two real ones from past builds, in translation:

```
    Why hands
    The difference is not the cream. The difference is whose hands apply it
```

The first is a fragment — a note-to-self, not a heading; a reader cannot tell
whether it introduces a service, an argument or a photograph. The second is the
aphorism trap: the *«не X, а Y»* antithesis is the single most recognisable
shape of machine-written copy, and once inside it the sentence stops being
checked for whether anyone would say it. Nobody says «whose hands apply it».

The rules that catch both:

- **A heading is a plain label or a full statement.** «Preise», «Wie ein
  Termin abläuft», «Für wen es nicht passt» are labels and do their job. «Bring
  the photo you saved; we will tell you honestly if your hair can do it» is a
  statement. Two abstract words are neither.
- **No antithesis formulas.** «The difference is not… it is…», «It is not
  about… it is about…», «Not just… but…» — and their German twins, «Nicht
  nur… sondern…». One per site is already a mannerism; two is a template.
- **No metaphor a reader has to decode**, and nothing that turns the body into
  poetry — hands that listen, hands that know, the magic of touch. The trade has
  its own concrete nouns and they are better.
- **Say it out loud to an imaginary customer standing in the room.** If it would
  be strange to say, it is strange to read. This one test kills most of it.
- **Would it work on a competitor's page?** Then it says nothing about this
  business, and a heading that says nothing is worse than a plain label, because
  it also takes up the space where the real thing would have gone.

Read all of the headings in order, as a list, before the page is called done —
`jt-check` prints them for exactly that. A page's headings are the only part of
it most visitors read, and read together they either tell the story or reveal
that there isn't one.

## The bar the written text has to clear

The page has to be **better written than anything they have ever published about
themselves**. That is the whole product. A prospect who reads it should think
"this is what I have been trying to say", not "they copied my Instagram".

Concretely, for each sentence on the page:

- **It works cold.** No "as I wrote last week", no "friends", no reference to a post.
  A stranger arriving from a search understands it with no context at all.
- **It says one thing.** A caption can wander; a heading cannot.
- **It is specific enough to be false.** "Individuelle Beratung" is true of
  everyone and therefore says nothing. "One person, one chair, an hour for every
  cut" is a claim about this business — and on the outbound track it goes on
  the page only if the portrait actually shows it.
- **It reads out loud.** Read the hero aloud. If it makes you wince, it is copy
  written for a page rather than for a person.
- **No emoji, no hashtags, no shouting.** Those belong to the platform, not to
  the business. Their absence is not a loss of voice; the voice is in the words.

## What the page has to carry

Two things, and they are the two the page fails without:

- **What this is, for whom, where** — in the first screen, in one sentence a
  person would say out loud. Without it a stranger arriving from a search does
  not know what they are looking at.
- **One action**, named the same way everywhere on the page.

Everything else is chosen. That used to be a list of five with "nothing here is
optional" over it, and the result was five pages out of five carrying a
who-it-is-not-for band whether the material supported one or not — a checklist
in a document is a checklist, however it is worded. What replaced it is below.

## The angles

Between the hero and the form there is work to do, and it is not one block. A
good landing page does it three times before it shows a price, each time from a
different angle.

**Choose at least two, from the material rather than from this list, and record
which.** There is no section budget: nine blocks that each earn their place beat
six that do not. What is required is the choosing — not any particular angle,
and never all of them.

**The choosing is yours, not a question for the developer.** The material
decides it and the material is already on disk — the portrait, the brief, the
captions — so a page that arrives with its angles picked and its reasons stated
is the deliverable. What goes to a person is what a person knows and a machine
does not: whether that is their room, whether the owner is in that frame,
whether the sentence is true. The review gate is unchanged, and asking which
angles they would like is not a review question, it is the work.

| Angle | What it is | Wants |
| --- | --- | --- |
| **recognition** | The visitor's own situation, in sentences they could have said out loud. Their evening, their shoulder, their kitchen at seven. | A business whose customers arrive with a problem they can name. |
| **expert** | The person, explaining what they actually do and why. Trust rather than urgency. | Someone who has spent years explaining their craft in public — they have already written it. |
| **method** | How the work is done, in order. | A process that is unusual, or one whose ordinariness is reassuring. |
| **conviction** | One belief about the work, stated plainly — the kind a competitor could not paste onto their own page. | A client with an opinion. It is the shortest route to a page that could not be anyone else's. |
| **evidence** | The work itself, shown rather than described. | Photographs worth the space, which on the outbound track is the usual reason to pick it. |
| **letter** | The person in the first person, at length. | A client who can write, and a page form that can carry it. |
| **cost of doing nothing** | What it keeps costing them to leave it alone. | A problem that gets worse, honestly. Not one invented to get worse. |
| **boundaries** | Who it is not for, what is not offered. Reads as confidence, saves both sides a conversation, and assistants recommend from constraints as much as from claims. | A business that genuinely turns work away. Invented, it is the emptiest block on the page. |
| **before and after** | The contrast, where there is an honest one to draw. | Two states that can both be shown. |
| **the objection** | The one thing that stops people booking, named and answered. | Knowing what that thing actually is. |
| **what happens next** | The first visit, described, so that it stops being unknown. | Anywhere the first step is the frightening part. |
| **the price, plainly** | The number, and what decides it. | A business whose price is an argument rather than a secret. |
| **the room** | The place, as the argument. | Somewhere worth being. |

Thirteen is not a sequence to work through. A page carrying all of them is a
page carrying none of them — the list is long precisely so that it cannot be
completed, and so that picking four is visibly a decision.

**Pick the angles the material supports.** A colourist whose captions explain
undertones and lift earns `expert` outright; a barber whose captions are all
about the same twenty-minute ritual earns `method` and would look ridiculous explaining
anything. An angle the material does not support is a block written on the
business's behalf, and they notice before their customers do.

**An angle is a job, not a band.** It can be one sentence across the full width,
a photograph with three words on it, a pull quote, a list of prices. A heading, a
lead and a grid of three is one shape out of many — see
`node_modules/@jtakeit/astro/docs/shapes.md`.

**And the block is named after what it is on this page.** Not `features`,
`about`, `benefits`. A tattooist's page had `plates`, `letter`, `conviction`,
`process` and `artist`; a page whose block names could be pasted into another
site is a page that will look like it.

Record what was chosen, so the next project can be deliberately different:

```bash
node "$JT/scripts/jt-state.mjs" set design.angles "conviction · method · evidence"
```

`jt-check` writes the page's actual block sequence into
`.jtakeit/fingerprint.json`. Two clients with the same four angles in the same
order is a house style forming, and that is the only way anybody sees it.

## Written for search, not stuffed with it

The page has to survive a search result and an assistant's summary, which is
`jtakeit-sites:seo-geo`'s subject. What that asks of the copy itself:

- **One query, decided before the copy.** `[service] [city]`, written into
  `SEARCH` in `src/data/site.ts` — the service as a customer would say it, not
  as the trade says it. Everything below serves that one query rather than six.
- **The `<title>` and description are written**, not assembled: a sentence a
  person would read in a result list, carrying the service and the city because
  that is how people speak, not because a checklist said so. The `h1` carries
  the service; the city can sit in the line under it.
- **Two or three mentions in the body, in sentences that were going to exist
  anyway** — where the room is, who comes, what the area is. `jt-check` fails a
  page that repeats the exact phrase more than four times, and it is right to:
  the page has to stay about the person and the business, which is what the
  visitor is actually deciding about.
- **Both vocabularies.** The professional term because it is what the service
  is; the plain one because it is what a customer types. A studio says
  «Nagelprothetik», a customer types "kaputter Zehennagel", and both belong on
  the page.
- **Headings are sentences with meaning**, in order, one `h1`. A heading that
  says "Über uns" tells a crawler and a reader the same nothing.
- **Every answer stands alone.** Forty to eighty words that still make sense
  lifted out of the page with nothing around them — that is what gets quoted.
- **Nothing stuffed.** A page repeating the city and the trade reads as spam to
  a person, and has read that way to the crawler since about 2019.

## On the outbound track

Everything above holds, plus the rule that outranks it: **the site may not state
a fact nobody confirmed.** Voice is free; claims are not. A sentence written in
their register about a service the captions show them doing is fine; the same
sentence with an hour, a price or a guarantee in it is not. See the honesty
section of `jtakeit-sites:spec`.

Where the site's language is not the language of the captions — a German site
built from a feed written in English, because the customers search in German —
the voice still comes from them. Take the cadence, the register and the way they address people;
do not translate their sentences word for word, which produces something that
sounds like neither of you.

## Where it lives

In the content documents, `jtk/content/<page>.json`, as fields declared in
`src/content/blocks.ts` — the home page reads them through `src/copy/<locale>.ts`.
Nothing user-facing inside a component, nothing hardcoded in a script. That is
what makes a round of revisions a series of one-line edits, and what lets the
owner change a sentence in the panel once the site is theirs —
`node_modules/@jtakeit/astro/docs/catalogue.md` and `pages.md`.
