# Reading a client out of Instagram

For a small business with no website, Instagram is usually the only place they
have ever described themselves in public, and the only archive of what their
work looks like. It is the best source we have for a client portrait — and the
worst source we have for facts, because a caption from 2023 is not an opening
hour.

## How to get at it

Instagram is hostile to fetching and there is no official read API for a profile
you do not own. Try in this order and stop at the first that works; do not build
a scraper.

1. **Ask the developer to hand it over.** Fastest by far: the developer opens
   the profile, and pastes the bio, the highlight names, the pinned posts and
   the last ~20 captions into the session, plus the photos worth using. Two
   minutes of a human's time beats an hour of ours. Make this the default ask.

2. **Fetch the public profile.** `WebFetch https://www.instagram.com/<handle>/`
   sometimes returns the server-rendered bio, follower count and recent captions
   and often returns a login wall. If it returns the wall, go to 3. Do not
   retry with tricks: rate-limited or blocked means blocked.

3. **Search around it.** `WebSearch "<business name> <city> instagram"` finds
   aggregators, reposts, local directories and press that quote the profile.
   Also try the business name against Google Maps / local directories — the
   opening hours and the address there are more likely to be current than a
   caption.

If a real scraping capability is added later (a hosted API, an MCP server), it
plugs in here as step 2 and the rest of this file is unchanged. Whatever the
source, everything below still applies.

## What to take

**The portrait — use freely.**

- Voice. How they write: formal or familiar, emoji or none, which language,
  which words they use for their own services. This is the single most valuable
  thing on the profile, because it is how the page should *sound* — not what it
  says. The captions are not draft copy: the page is written for a stranger
  arriving cold, in their register, and at most a couple of their lines are ever
  quoted directly. See `jtakeit-sites:spec` → references/copy.md.
- What they believe about the work. Why they do it their way, what they refuse
  to do, who they turn away. Rarely stated as a value and nearly always there,
  and it is what the page's strongest section is written from.
- Subject matter. What they photograph most is what they are proudest of, and
  it is usually what the hero should show.
- The customer. Who is tagged, who comments, what they ask about.
- Rhythm and seasons. A studio that posts holiday closures, a restaurant that
  posts a weekly special — that is a section on the page.
- Colour and material. The actual palette of their work and their room. A
  design direction taken from the client's own photographs is the fastest way
  to a page that looks like them and not like a template.

**The facts — verify before use.**

Address, hours, prices, phone, service list, claims of "first in the city" or
"certified by". Take them into the brief as *candidates*, marked with the date
of the post they came from, and put them in front of the client before they
become structured data — or, for a business that takes bookings, the diary's
hours and prices. Nothing from Instagram goes into `src/data/site.ts` or
`jtk/bookings.json` unconfirmed.

**Photographs — ask before use.**

Where the business is one person, ask specifically for a photograph *of them*.
The hero is their face, and the best frame in a feed is usually a screenshot of
a story.

Screenshotting a client's own feed for their own site is normally fine and they
will usually say yes, but ask, and ask whether anyone recognisable in a photo
has agreed to appear on a website. A phone photo pulled off a feed is also
1080px on its long side and compressed twice; treat it as a placeholder and put
"real photos" on the open list. The rules the image pipeline expects are in
`node_modules/@jtakeit/astro/docs/photos.md`.

## What not to do

- Do not attempt to log in, use someone's session cookies, or work around a
  block. The account being fetched is the client's; the account doing the
  fetching would be a person's.
- Do not pull follower counts onto the page as social proof unless the client
  asks. A number that goes down is a claim that ages badly.
- Do not quote a customer's comment as a testimonial. A comment is not consent.
- Do not treat an empty or abandoned profile as a finding worth reporting to the
  client in those words. It is a gap in our material, not a criticism of them.

## Where it lands

In `BRIEF.md`, under **Portrait**, with a source line:

```
Voice — calm, first-person plural, Swiss German written as High German, no
  emoji, calls a cut «Schnitt» and never «Styling».
  Source: instagram @atelier.nord.zh, captions 2025-11 … 2026-08, read 2026-08-17.
Hours — «Di–Sa 9–19 Uhr». Source: bio, read 2026-08-17.
  NEEDS CLIENT: confirm before it goes into the diary and structured data.
```
