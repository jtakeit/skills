# PORTRAIT.md template

Copy to the project root. It stands in for `BRIEF.md` on the outbound track —
the scaffold writes a `BRIEF.md` too, and it stays empty until the prospect
converts, when `jtakeit-sites:brief` fills it by putting a human in front of
every line here marked unconfirmed.

The source line is the whole discipline: it is the difference between «they open
at nine» and «a caption in March said they open at nine».

```markdown
# @<handle> — portrait

Scraped <date> via khadinakbar/instagram-profile-scraper and
apify/instagram-post-scraper.
Raw: `.jtakeit/instagram.json`, `.jtakeit/instagram-posts.json`.
Followers <n>. Posts <n>, of which <n> carry stills. Feed spans <date> → <date>.

## The business, in one sentence

<What they are, where, for whom — written from the bio and the captions, in our
words, in the language the site will be in.>

## The one action

<What a visitor to their site should do. Call, book, order, come in. One thing.
Chosen from what the business actually needs, not from what is easy to build.>

## Who runs it

One person or a team, and how that was decided — «ich» or «wir», whose hands are in
the photographs, whether anyone else is ever named. It decides the hero and half
the copy.

## The one query

`[service] [city]` — what a customer would type to find a business like this,
read off what they actually do and where they actually are. The city comes from
a location tag, the bio or a caption, and it is the one geographic fact the spec
site states; if none of the three has it, the page runs without a city rather
than guessing. See `jtakeit-sites:seo-geo`.

| | |
| --- | --- |
| Service, as a customer says it | |
| City | | 
| Where the city came from | location tag / bio / caption <date> |

## Voice

How they write. Language, register, emoji, what they call their customers, what
they call their own services. Two or three real phrases quoted from captions —
those set the tone the copy is written *in*, and at most two of them ever appear
on the page as quotations. Everything else is written, not pasted
(`jtakeit-sites:spec` → references/copy.md).

> «<a caption line worth stealing the tone of>» — post <date>

## What they believe about the work

Why they do it their way, what they refuse to do, who they turn away, what they
think the rest of the trade gets wrong. Usually scattered across the captions
and never stated as a value. This is the material the page's strongest section
is written from, and it is what makes the copy unmistakably theirs.

## What they photograph

The recurring subject, in order of how often it appears. The thing that appears
most is usually the hero.

## Who answers

Who comments and in what language, what they ask about, what they book.

## Colour and material

The palette of their work and their room. `jt-photos` prints it off their twelve
best frames as hex; check the values against the pictures — a shelf that fills
half the frame will dominate the count without being what the business looks
like — and then write down what each colour actually is.

This is the design direction's starting point, it is theirs rather than ours,
and it is the required argument `HeroField` will not build without.

| Hex | What it is in the photographs |
| --- | --- |
| | |

## Rhythm

Seasonal posts, weekly specials, closures, launches — each one is a candidate
section.

## Highlights

Pulled or not, and why. Where they were pulled: what each reel is called, what is
actually in the ones that matter, and which frames were read.

This is where a price list usually lives, and reading one off a highlight does
not make it a fact — every number goes in the table below with the date of the
frame it came from.

| Reel | What is in it | Frame date |
| --- | --- | --- |
| | | |

## Claims — ALL UNCONFIRMED

Nothing in this table may be stated as fact by the site. See `jtakeit-sites:spec`.

| Claim | Value | Where it came from |
| --- | --- | --- |
| Address | | bio, read <date> |
| Hours | | caption <date> |
| Phone | | bio field |
| Prices | | caption <date> |
| Services | | captions |

## Photographs

The counts come from `.jtakeit/photos.json` — measured, not estimated. The
judgement underneath them comes from the contact sheet and the handful of frames
opened at full size.

```
<n> frames, <n> distinct, <n> hero-capable (≥1200px and in focus)
spanning <date> → <date>; <n> portrait, <n> landscape
```

Then what only a person can say: whose face is in them, what is missing
entirely, and whether the room in the good pictures is the room they work in
now. An archive that stops three years ago is a gap, not a library, and it goes
here rather than being quietly designed around.

**The owner, for the hero.** Where the business is one person, name the best
frame of that person and its size and shape — a 4:5 portrait and a 16:9 band are
not the same picture, and the frame gets chosen from the photograph. If there is
no usable one, say so here: that is the gap the pitch works around and the first
thing asked for the moment they say yes.

| | |
| --- | --- |
| Best frame of the owner | post <date>, <w>×<h>, <what is in it> |
| Fallback if none | <the work, the room, the product> |
| Customers' faces | <which posts, and therefore not used> |

## Why them

One honest line on why this business is worth an afternoon. If it cannot be
written, archive the prospect.

## The pitch

- Language of the site and of the voice-over: <tag>
- What the video should open on: <the strongest thing they have>
- What the spec site deliberately leaves out, because we do not know it
```
