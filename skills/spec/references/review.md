# The review gate

The questions Claude puts to the developer before stage 1 can end.

This exists because "the developer has looked at it" is not a check. Somebody
who has been staring at a page for an hour looks at it and sees what they meant
to build. Somebody who has never seen it scrolls once and says "looks
fine". Neither of those is a review, and both of them ship.

So the stage ends with a small set of questions that **cannot be answered
without actually looking at the page**, asked one screen at a time, with the
developer free to ignore the question and describe what they want instead.

## What is not in here, and why

Nothing measurable. The hero fitting the first screen, orphans in a wrapping
row, anchors landing on content, autofill keeping the palette, placeholder
frames, unconfirmed facts in the HTML, a stretched photograph, a paragraph
carried over verbatim from a caption, the query missing from the title, a band
with one empty half, a form floating in a third of the screen, the first screen
with JavaScript off — a person asked about any of those will answer "fine", and
be honestly wrong.

Those are `jt-check`, and on the built preview, `get_built_page` with
`shot: "phone"`:

```bash
node "$JT/scripts/jt-check.mjs" --dist ./dist
```

**It runs first, and the gate does not open until it is at zero.** Asking a
developer to review a page that still has its call to action below the fold
wastes the one attention span this stage gets.

A review gate made of things a machine can check is a review gate that trains
people to click through it.

## How to ask

- **One question at a time**, as a question with options, not as a document.
  A wall of eight questions is read as a wall.
- **Lead with a recommendation** where there is one, and say what it is based
  on. "I would add a block naming what it costs to do nothing, because his
  captions are full of it" is answerable; "does the page sell?" is not.
- **Always leave the free answer open.** The most useful reply this gate ever
  gets is not one of the options — it is the developer describing the page they
  actually want. Take it and rebuild; do not argue it back into the options.
- **Silence is not approval.** The stage does not advance because nobody
  objected.

## The questions

**1 — Recognition.** Open the preview link on a phone, or the top of the page at
phone width. Within three
seconds, is it obvious that this is *his* business rather than a template with
his photographs in it? If not, which is wrong — the photograph or the sentence?

**2 — The selling.** Between the hero and the form, name the blocks that are
trying to sell and the angle each one takes. If there is only one, or if two of
them do the same job, say which angle the portrait supports that the page is not
using — the thirteen are in [copy.md](copy.md), and the question is which of
them *this* material earns, not which four are usual.

**3 — The hero photograph.** Of everything on the contact sheet — and
`photos.json` says which frames can carry a hero at all — is this the one? It is the thumbnail of the video and the first second of the pitch, and it
is the single cheapest thing on the page to change. Where the business is one
person: is the person in it? If not, is that because there is genuinely no
usable frame of them in the whole feed, or because nobody went looking?

**3b — The hero's motion. Asked every time, including when there is none.**
Does the hero move? If it does not, say which it is: a decision — the photograph
carries the screen alone — or an omission. `jt-check` prints the answer to the
first half, so this cannot be answered from memory.

Where it does move: watch the first screen for twenty seconds rather than
glancing at it. Are those colours from their photographs — name where each one
came from — or are they a shader's? Does the heading hold its contrast in every
frame, not just this one? And freeze it: the video's thumbnail, the phone shot
and a visitor who asks for reduced motion all get one frame, so a field that is
only beautiful in motion is a flat gradient to them.

**3c — The shape, against the last one we shipped.** `jt-check` prints what this
page actually is: the hero's anatomy, how many sections are full-bleed, the type
pairing. Put it beside the previous project's line. If both say *overlay hero,
every section full-bleed, serif over sans*, the two sites are siblings and the
client's competitor down the street is getting the other one. And the question
the catalogue cannot answer: what is on this page that could not be moved to
another site tomorrow?

**4 — Voice, and whether the text is any good.** Two halves and both matter.
Does it read like them, or like us — point at one sentence that does not sound
like something they would say. Then the other direction: is any of this simply
pasted? A paragraph that reads like a caption on a landing page is a caption on
a landing page, and the page is supposed to be better written than anything they
have ever published about themselves. Which sentence here is the one they could
not have got from a template — and is what they *believe* about their work
anywhere on the page, or only what they do?

**4b — Optimised, or written for a crawler.** The page is built for one query,
`[service] [city]`. Read the first screen and the section headings aloud. Does
it sound like somebody describing their work, or like somebody trying to be
found? The machine counts repetitions; this question is the one it cannot ask —
whether the page is still about this person and this business.

**4c — The headings, read aloud, in order.** `jt-check` prints them as a list
for exactly this. A heading is a plain label or a full statement; two abstract
words («Why hands») is a note-to-self, and the «not X, but Y» antithesis («The
difference is not the cream. The difference is whose hands apply it») is the
most recognisable shape of machine-written copy there is. Which of these would this person actually say to
somebody standing in front of them?

And any pulled quotation: does it carry a source? It must not. Everything on the
page is them speaking, and «— Lea, on her Instagram» under one of their own
lines announces that we went through their Instagram.

**5 — Honesty.** Open `PORTRAIT.md`'s claims table beside the page. Is there
anything asserted here that nobody confirmed — and is there any photograph he
would not want used, a client's face, a room he no longer works in?

**6 — The one action.** What is the page asking a visitor to do, and is that
the thing this business actually needs? A booking form is not automatically the
answer for a business that lives on gift certificates.

**7 — Language**, only where the country and the customers do not settle it —
a bilingual city, a business whose customers read a language it does not post
in. Where they do, the question is not asked. See `jtakeit-sites:prospect`.

**8 — The open one.** If this were your business, what would you want on this
page that is not on it?

## After the answers

Apply them, then say what changed and what you deliberately did not change, and
why. A developer who cannot see which of their notes were taken stops writing
notes.

If the answers rebuild the page — that is the gate working, not the gate
failing. The afternoon it costs is cheaper than the prospect it saves.
