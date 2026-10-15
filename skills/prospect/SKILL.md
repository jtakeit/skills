---
name: prospect
description: Stage 0 of the outbound track — take one Instagram handle, pull the profile through the Apify MCP scraper, and turn it into a sourced portrait we can build a site from. Load when the user gives an Instagram username to work from, says "let's do outreach", "scrape this profile", "find out about this business", or starts an outbound project. Produces PORTRAIT.md and the initial src/data/site.ts.
---

# Stage 0 (outbound) · The prospect

One handle in. A portrait out — enough to build a page that makes a stranger
think *someone actually looked at my business*.

This is the whole difference between outreach that works and outreach that gets
blocked. The site we build next is the pitch; this file is what makes it theirs
rather than a template with their logo dropped in.

## Setting up the project

Before the first scrape, because the scrapes are written into it:

```bash
node "$JT/scripts/jt-init.mjs" --slug atelier-nord --name "Atelier Nord" \
  --locale de-CH --vertical salon --track outbound --handle atelier.nord.zh
cd atelier-nord
```

It runs `npx @jtakeit/astro create` — the site's repository, laid out to the
platform's contract — and writes `.jtakeit/state.json` and `STATUS.md` into it.
On the outbound track the project is one page rather than N variants, and
nothing about it goes anywhere yet: the site on jtakeit, the GitHub repository
and the preview are `jtakeit-sites:spec`'s, after the page exists.

Fill `src/data/site.ts` with what is *confirmed*, which at this stage is close
to nothing: the name and the handle. Everything else stays empty until a human
says it out loud.

## The scrape

**You need your own Apify account.** The Actors below run on it and are billed
to it. The plugin's `.mcp.json` names Apify's MCP server, which signs in
through the browser the first time, as jtakeit's does. If the Apify tools are
missing, the server has not been signed in: ask the developer to open `/mcp`,
choose `plugin:jtakeit-sites:apify`, then Authenticate, and sign in — the tools appear in the same
session. Before the sign-in its line can read «connected · tools fetch failed»;
it is the same step.

The server exposes Apify's generic Actor tools alongside ours, so it *can* reach
the whole Store. This pipeline calls two Actors, in this order. Read
[references/apify.md](references/apify.md) for the setup, the input shapes, the
fields that come back and what a run costs.

**First, who they are** — `khadinakbar/instagram-profile-scraper`, half a cent:

```
usernames: ["atelier.nord.zh"]      the handle, no @
```

This is a header reader: bio, name, followers, `isPrivate`, `postsCount`. It is
what the stop conditions are made of, and it is cheap enough to run before
deciding anything. It does **not** return captions or usable images — do not ask
it for material. Save it to `.jtakeit/instagram.json`.

**Then, what they are like** — `apify/instagram-post-scraper`, about a quarter of
a cent per post:

```
username: ["atelier.nord.zh"]          an array, despite the name
resultsLimit: min(postsCount, 200)     the whole feed, up to a ceiling
```

Captions, `type`, full-size `displayUrl`, carousel `childPosts`, comments,
`locationName`, `videoUrl`. This is what the portrait is written from. Save it to
`.jtakeit/instagram-posts.json`.

**Sweep the whole feed, not the last dozen.** A recent feed made entirely of
reels is normal — service businesses moved to video years ago — and it says
nothing about whether the account has photographs. The stills are usually a year
or two further back. Capping the pull at twelve posts is how you conclude "they
have no photos" about an account with forty good ones.

**And not more than 200.** `resultsLimit` is `min(postsCount, 200)`: two hundred
posts is years of a small business's feed, more voice than anybody can read and
more photographs than one page can use, and everything past it is paid for twice
— once to the Actor and once to the attention it takes to go through. An account
with nine hundred posts is not nine hundred posts of material; it is a business
that has been posting for a decade, and the last two hundred describe it.

Where the ceiling actually bites — the whole recent stretch is reels and the good
stills are older than post two hundred — that is a finding, not a reason to pull
the rest. It means this business publishes video now, and the honest answers are
`jt-photos --frames` for stills cut out of the reels, or writing the gap into the
portrait as something to ask for the moment they say yes.

Everything in the portrait cites these two files, and re-reading them is free
while re-running the Actors is not.

**Then ask about the highlights.** They are not part of the standard scrape and
they are the one part of a profile that holds what captions never repeat: the
price list, the service menu, the before-and-after set, the address card, the
holiday hours. A portrait is usually thinnest on exactly those.

So put it to the developer, once, as a question with a recommendation — «this
account has 14 highlights, one of them is called «Preise»; shall I pull them?
About a cent» — and let them say no. It is another charge on every prospect, most
of which are archived without a site, and on plenty of accounts the highlights
are three reposted memes. `references/apify.md` has the Actor, its input and what
comes back.

Two things about what arrives. **The live 24-hour stories stay off**: they expire
tomorrow, and a page built on something nobody can look at later cannot be
checked. And **the text is in the pixels** — a price list in a highlight is an
image of a price list, so it has to be looked at rather than parsed, and
everything read off it lands in the claims table with the date of the frame. A
highlight is a better source than a caption from 2023 and it is still nobody
confirming anything.

**Then, immediately, `jt-photos`:**

```bash
node "$JT/scripts/jt-photos.mjs"
```

Instagram's media URLs are signed and they expire — a scrape two days old still
serves its photographs and has already lost every reel. So this runs in the same
sitting as the scrape, not on the next one, and it is the reason the stage is
two commands rather than one. What it does is in
[references/apify.md](references/apify.md); why the work is split the way it is
comes next.

**If the profile is private**, Actor 1 returns the header and nothing else. That
is a stop, not a challenge: a private account has told us what it wants. Archive
the prospect (`jt-state archive --reason "private account"`) and move on.

**If the profile is empty, abandoned, or clearly not a business** — three posts
from 2021, a personal account, a reseller page — archive it too. The scrape cost
twenty cents; building a site for it costs an afternoon.

Note what is *not* a stop condition: `isBusinessAccount: false`. Plenty of real
businesses never filled in Instagram's business fields. Judge by the bio, the
captions and the work in the photographs.

## The portrait

Write `PORTRAIT.md` from [references/portrait.md](references/portrait.md). Two
columns of material, and they are not interchangeable:

**What they are like** — take freely, this is what the site is built from.

- **Voice.** How they write: formal or familiar, which language, emoji or none,
  what they call their own customers and their own services. This decides the
  copy more than anything else on the page — how it *sounds*. It does not decide
  the sentences: the page is written, not transcribed, and the reason why is in
  `jtakeit-sites:spec` → references/copy.md. Record the two or three lines genuinely
  worth quoting, and record them as quotes.
- **What they believe about the work.** Why they do it their way, what they
  refuse to do, who they turn away, what they think the rest of the trade gets
  wrong. It is nearly always in the captions and nearly always unnoticed, and it
  is the material the strongest section on the page is written from.
- **What they photograph.** The most-repeated subject is what they are proudest
  of, and it is almost always what the hero should show.
- **Whether it is one person.** A soloist and a studio are two different pages,
  and the sheet from `jtakeit-sites:sourcing` already carries a guess. Confirm it
  from the captions — who says «ich», who says «wir», whose hands are in the pictures —
  and record it, because it decides the hero.
- **Who answers.** Who comments, in what language, asking what. That is the
  audience, observed rather than imagined.
- **Colour and material.** The actual palette of their work and their room. A
  direction taken from the client's own photographs is the fastest route to a
  page that looks like them and not like a template.
- **Rhythm.** Seasonal posts, weekly specials, holiday closures — each of those
  is a section that belongs on the page.

**What they claim** — record with the date of the post it came from, and treat
every one of it as unconfirmed.

Address, hours, prices, phone, the service list, «first in the city»,
«certified by». A caption from 2023 is not an opening hour. None of it may be
asserted as fact by the site we are about to build — see `jtakeit-sites:spec` for
what that means in practice.

## The language of the site

**The language of the site is decided by where the business is and who its
customers are — not by the language of its captions.**

The two often disagree, and the captions do not win. A Zürich salon may post in
English for the look of it and still serve customers who search in German; the
site is `de-CH`. Where a country has a rule about the language a business
publishes in, the site follows the rule, whatever the feed is written in — a
site is publishing. The portrait records what they *write* in: that is material
for the voice, the register, the phrases worth echoing, but not a vote on the
locale.

Where it genuinely is not obvious — a bilingual city, a business whose customers
read a language it does not post in — that is one of the questions put to the
developer rather than guessed, and it is decided before `jt-init`, because the
locale goes into the scaffold. A second language is a later decision, not a
spec one.

What still comes from the scrape either way: register, how they address people,
what they call their own services, and which of their phrases are worth keeping.
A German site written in her English cadence is right; a German site written in
ours is not.

## What not to do

- **Do not log in, borrow a session, or work around a block.** The account being
  read is theirs; the account doing the reading would be a person's.
- **Do not scrape their followers or their commenters.** We are researching one
  business, not harvesting an audience. The actor does not do it and neither do
  we.
- **Do not quote a customer's comment as a testimonial.** A comment is not
  consent, and a fabricated testimonial on a spec site is the fastest way to
  turn a pitch into a complaint.
- **Do not keep the raw dump longer than the project.** An archived prospect's
  `.jtakeit/` goes when the project does, and the scrapes never go into the
  repository a client is handed: delete `.jtakeit/instagram*.json` and the
  photo library once the site has its own photographs.

## Their photographs

**Do not go through the feed by eye. `jt-photos` has already been through it.**

A carousel-heavy feed is a hundred and fifty frames; opening them one at a time
costs a quarter of a million tokens, takes minutes, and answers the wrong
questions — because the decisions that actually matter here are resolution,
focus and repetition, and none of the three survives a downscale. A 640px video
thumbnail and a 1440×1800 photograph look identical in a preview.

So the mechanical half is measured and the judged half is judged:

| `jt-photos` | you |
| --- | --- |
| downloads every still into `.jtakeit/photos/`, named `date_shortcode_n.jpg` | look at **contact sheet 1**, not a hundred and fifty frames — it is the best forty, and the later sheets are the tail in the same order |
| measures each: true pixels, focus off a native-resolution centre crop, tone, palette | name the numbers worth opening, and open those files at full size |
| folds away near-duplicates by perceptual hash | say whose face that is — theirs or a customer's |
| ranks by resolution, focus, engagement and age | say whether that is the room they work in now |
| writes `.jtakeit/photos.json`, `captions.md` and `contact-sheet-N.png` | pick the one frame that belongs at the top of the page |

Everything factual in the portrait's photograph section — how many frames, how
many usable, what sizes, what date range — is read out of `photos.json` rather
than estimated. The script also prints **their palette off their twelve best
frames**, which is where `HeroField`'s required colours come from and what the
Colour and material section is written against.

Nothing is deleted: a frame the ranking dislikes stays in `photos.json` with the
reason attached, so a picture the score misjudged — deliberate bokeh, a dark
room shot on purpose — can be overruled by the person looking at it.

The pitch site is built from their own pictures — that is the point, and for a
private one-to-one pitch it is fair use of material they published themselves.
Two limits that hold anyway:

- **Nothing goes public.** The spec site is a private preview on jtakeit —
  a link, not an indexed address — and its link goes to the prospect and
  nobody else. See `jtakeit-sites:spec`.
- **A customer's face is not ours to use.** It belongs to someone who never
  agreed to appear in anybody's sales material. Prefer the work, the room and
  the product, and where a client is unavoidably in the frame, use another shot.

**The owner's own face is the opposite case.** Where the business is one person,
the hero photograph should be that person: it is their business, they are what a
customer is choosing, and a page that opens on them is a page they recognise as
theirs in the first second of the video. They published those pictures on their
own business account, presenting themselves as the business.

So the feed is searched for one deliberately: a frame where they are the
subject, in focus, at a usable size, looking like the person a customer would
meet. The «ich bin …» post, the one where they introduce a new service, the
one taken by somebody else. Sweep for it rather than settling for the closest
crop — and record in the portrait what was found, at what size, how old it is,
and what the fallback is if there is nothing. Note the shape too: a 4:5 portrait
and a 16:9 hero band are not the same picture, and the frame is chosen from the
photograph rather than the other way round
(`node_modules/@jtakeit/astro/docs/photos.md`, *Measure the photograph before you
frame it*).

What the site still does not do is *claim* who they are. Alt text describes the
frame; it does not name a person nobody confirmed.

Photo posts come back at the size they were uploaded — commonly 1440×1800, which
is genuinely enough to build a pitch on. Video thumbnails are a different animal:
640px auto-selected frames, usually mid-motion and blurred. On a feed that is
all reels, `jt-photos --frames` cuts real stills out of the videos themselves —
but only while the URLs are alive, which for video is hours rather than days.

Either way these are placeholders good enough to sell with and not good enough
to launch with — that goes in the portrait as a known gap, and it becomes a real
ask the moment they say yes. So does an archive of good photographs that all
stop three years ago: if the room in the pictures is not the room they work in
now, say so rather than quietly designing around it.

## Exit checklist

- [ ] the project made with `jt-init`, the locale decided before it
- [ ] `.jtakeit/instagram.json` and `.jtakeit/instagram-posts.json` hold the raw scrapes
- [ ] the whole feed was swept, not the last dozen posts — and not more than 200
- [ ] `jt-photos` run in the same sitting as the scrape — `photos.json`,
      `captions.md` and the contact sheet exist
- [ ] the highlights offered to the developer, and pulled or declined on purpose
      — not skipped because nobody thought of it
- [ ] `PORTRAIT.md` written, every claim carrying its source and date
- [ ] voice, subject matter, audience and palette described well enough to design from
- [ ] unconfirmed claims listed separately and marked as such
- [ ] contact sheet 1 looked at, and the frames worth it opened at full size —
      whose face, which room, which one is the hero
- [ ] one person or a team, decided from the captions rather than from the bio
- [ ] the one query written down — `[service] [city]` — with the city's source,
      or noted as absent
- [ ] where it is one person: a usable photograph of them found for the hero, or
      its absence written down as a gap
- [ ] the lines worth quoting recorded as quotes, and what they believe about the
      work recorded as material — not as sentences to paste
- [ ] the language of the site set by the country and the customers, not by the captions
- [ ] not private, not abandoned, actually a business

Then:

```bash
node "$JT/scripts/jt-state.mjs" advance spec --note "portrait from @atelier.nord.zh"
git add PORTRAIT.md STATUS.md .jtakeit/state.json .jtakeit/photos.json .jtakeit/captions.md src/data/site.ts
git commit -m "prospect: @atelier.nord.zh portrait"
```

Nothing is pushed yet: the repository on GitHub is made in `jtakeit-sites:spec`,
private, when there is a page to put on it.
