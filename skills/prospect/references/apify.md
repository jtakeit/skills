# The Instagram scrapers

Two Actors, and the split matters: one describes the account, the other hands us
the material we build from. Neither does the other's job.

| Actor | Answers | Cost |
| --- | --- | --- |
| `khadinakbar/instagram-profile-scraper` | who is this, are they private, are they alive | ~$0.0045 per profile |
| `apify/instagram-post-scraper` | what do they say, what do they photograph | ~$0.0027 per post |
| `goat255/instagram-stories-highlights-scraper` | what they pinned: prices, services, before-and-after — **only when asked** | ~$0.008 per profile |

A fourth Actor, `goat255/instagram-stories-highlights-scraper`, reads the
**highlights** — and is called only when a person asks for it. See below.

A third Actor, `apify/instagram-search-scraper`, answers "who is out there" and
belongs to `jtakeit-sites:sourcing` rather than to this stage — it is how the handle
that starts a prospect is found in the first place. It is in the same server
URL, and documented in
[skills/sourcing/references/search-actor.md](../../sourcing/references/search-actor.md).

All of them are reached through Apify's MCP server, which this plugin names in
`.mcp.json`:

```json
{
  "mcpServers": {
    "apify": {
      "type": "http",
      "url": "https://mcp.apify.com/?tools=actors,docs,khadinakbar/instagram-profile-scraper,apify/instagram-post-scraper,apify/instagram-search-scraper,goat255/instagram-stories-highlights-scraper"
    }
  }
}
```

**The query string is not decoration** — it decides which tools the server
exposes. `actors` brings the generic ones (`search-actors`, `call-actor`,
`fetch-actor-details`), `docs` brings documentation search, and each Actor named
after them becomes a tool of its own.

That means the server can reach Apify's whole Store, not just the ones we named.
The discipline is therefore ours to keep rather than the URL's to enforce: the
pipeline calls four Actors — three of them here, and the search one in
`jtakeit-sites:sourcing`. A fifth goes into the URL by name and into a file like
this one before it is ever called, so that what your account spends money on is
written down somewhere.

## Setup, once

**You need your own Apify account**, and every run is billed to it — the plugin
carries the server's address and nothing else. There is no token to set: the
server signs in with OAuth, the way the jtakeit server does. The first time an
Apify tool is needed, `/mcp` lists `apify` as needing authentication; choose
it, sign in to Apify in the browser that opens, approve access, and the tools
appear in the same session.

Check with `/mcp`: `apify` should be listed and Connected. If it is listed but
not connected, it has not been signed in yet, or the sign-in expired — sign in
again from there.

A token is still accepted, for a machine with no browser: add
`"headers": { "Authorization": "Bearer ${APIFY_TOKEN}" }` to the server in your
own MCP configuration, with the token from
[console.apify.com/settings/integrations](https://console.apify.com/settings/integrations)
in the environment before Claude Code starts. Never the token itself in a file
that gets committed, and never pasted into a chat.

## Actor 1 — the profile

`khadinakbar/instagram-profile-scraper`. This is a header reader. Use it first,
because it costs half a cent and it is what the stop conditions are made of.

```json
{ "usernames": ["atelier.nord.zh"] }
```

Leave `scrapeRecentPosts` off. Its post records carry eight fields —
`postId, shortCode, postUrl, commentCount, isVideo, videoViewCount,
thumbnailUrl, postedAt` — and **no `caption`, no `likeCount`, no media URL**.
The thumbnails are 640px auto-selected frames. Asking this Actor for material is
how you end up writing a portrait out of nothing.

What it does give, and why each matters:

- **`biography`** — the business's own one-sentence description of itself.
  Usually the best raw material for the hero on the whole profile.
- **`fullName`** — the business's own name for itself, for `jt-init --name` —
  checked against the bio, because it is often «Name | trade | city».
- **`isPrivate`** — if true, stop.
- **`postsCount`** — tells you how deep the feed goes, which sets `resultsLimit`
  (at `min(postsCount, 200)`)
  below.
- **`isBusinessAccount` / `businessCategory` / `email` / `phone` /
  `externalUrl`** — present only if they filled in the business fields. Plenty of
  real businesses have not; an empty `isBusinessAccount` is not a stop condition
  on its own.
- **`followersCount`** — for deciding whether to spend the afternoon, and for
  nothing else. It never goes on the site.

Save it to `.jtakeit/instagram.json`.

## Actor 2 — the posts

`apify/instagram-post-scraper`. This is the one the portrait is actually written
from.

```json
{
  "username": ["atelier.nord.zh"],
  "resultsLimit": 72
}
```

- `username` — an array, despite the singular name. Handles, profile URLs or
  post URLs.
- `resultsLimit` — **the cost dial and the quality dial at once.** Per profile,
  not total. Set it to `min(postsCount, 200)`: the whole feed where the feed is
  smaller than that, and two hundred where it is not. Do not set it to 12 — see
  the photo hunt below — and do not lift the ceiling because an account has more.
  Two hundred posts is years of a small business, and the marginal post is paid
  for twice: once to the Actor, once to the attention it takes to read it.
- `onlyPostsNewerThan`, `skipPinnedPosts` — situational, usually leave alone.

Per post you get:

```
id  shortCode  url  type  caption  hashtags  mentions  alt
displayUrl  images  childPosts[]  videoUrl  videoViewCount
likesCount  commentsCount  latestComments[]  firstComment
timestamp  locationName  locationId  ownerUsername  ownerFullName
dimensionsWidth  dimensionsHeight  originalWidth  originalHeight
productType  paidPartnership  isCommentsDisabled
```

The ones that carry the portrait:

- **`caption`** — the voice. Read them all before writing a line of copy. Expect
  a third of posts to have none.
- **`type`** — `Image`, `Video` or `Sidecar` (a carousel). This is the field the
  whole photo hunt turns on.
- **`displayUrl` / `childPosts[].displayUrl`** — the actual photographs, at the
  size they were uploaded: commonly 1440×1800, sometimes 1080×1080. A carousel's
  frames live in `childPosts`, and a carousel can mix stills and video, so filter
  the children by `type` too.
- **`latestComments[]`** — who answers, in what language, asking what. Read for
  the audience; never quote one on the site.
- **`locationName`** — the city, in their own spelling, repeated across dozens of
  posts. The most reliable geographic signal on the profile, and still
  unconfirmed.
- **`hashtags`** — what they think they sell and to whom.
- **`videoUrl`** — the reel itself, which is how you get stills out of a
  video-only feed.

Save it to `.jtakeit/instagram-posts.json`.

## Actor 3 — the highlights, on request only

`goat255/instagram-stories-highlights-scraper`. **Not part of the standard
scrape.** It runs when the developer says so, and `jtakeit-sites:prospect` asks them
at the point where the portrait is being written.

Why it is worth asking: a small business's highlights are where the things a
caption never repeats end up pinned — **the price list**, the service menu, the
before-and-after set, the address card, "how to find me", the holiday hours.
Those are precisely the facts a portrait is thinnest on. Why it is not automatic:
it is another Actor and another charge on every prospect, most of which are
archived without a site, and on plenty of accounts the highlights are three
reposted memes.

```json
{
  "usernames": ["atelier.nord.zh"],
  "includeHighlights": true,
  "includeStories": false,
  "expandHighlightItems": true,
  "maxHighlightsPerUser": 20
}
```

- `includeStories` — the live 24-hour tray. **Leave it off.** It expires
  tomorrow, so nothing built on it can be checked later, and a page built from
  something that no longer exists is a page nobody can verify.
- `expandHighlightItems` — the inner frames of each reel rather than just its
  cover. On, or the answer is a list of titles.
- `maxHighlightsPerUser` — 20 is the default and is plenty.
- No login, no cookies, no session. That is why this Actor and not the several
  others that ask for `sessionCookie`: borrowing somebody's session is the one
  thing `jtakeit-sites:prospect` refuses outright.

What comes back, per profile:

```
username  isAccessible  isPrivate  highlightCount  storyCount
highlights[] → title  coverImageUrl  highlightId
                items[] → imageUrl  videoUrl  mediaType  takenAt  originalWidth/Height
```

**The text is in the pixels.** `accessibilityCaption` comes back empty, so a
price list in a highlight is an image of a price list: it has to be looked at,
not parsed. Download the frames of the interesting reels — the titles say which
ones — and read them.

And read them as *claims*. A highlight is more current than a caption from 2023
and it is still not a person confirming anything: every price, hour and address
found there goes into the portrait's claims table with the date the frame was
taken, and none of it goes on the page. `jtakeit-sites:spec` does not soften for a
better source.

Cost: about **$0.008 per profile**, flat — the per-user event covers stories,
highlights and every expanded item, so a profile with twenty reels costs the
same as one with two.

## The photo hunt, which is a script

**A recent feed with no photographs in it is normal, not a dead end.** Service
businesses moved to reels years ago; the last twelve posts being twelve videos
says nothing about whether the account has good pictures. The stills are usually
a year or two further back, from when the same business was posting shot-on-a-
camera photographs. So never cap the pull at a dozen and never conclude "no
photos" from the top of the feed.

Once the whole feed is on disk, `jt-photos` takes it from there:

```bash
node "$JT/scripts/jt-photos.mjs"            # download, measure, sheet
node "$JT/scripts/jt-photos.mjs" --frames   # also cut stills out of reels
node "$JT/scripts/jt-photos.mjs" --sheet    # re-measure what is on disk
```

**Run it in the same sitting as the scrape.** The media URLs are signed and they
expire; measured on a two-day-old scrape, every `displayUrl` still served and
every `videoUrl` was already 403. A wall of refusals means re-run the Actor, not
retry harder — and reel frames in particular are an hours-not-days affair, which
is why the script stops after the second refusal instead of walking through the
other six.

What comes out, all inside `.jtakeit/` — which never reaches the build — with
the photographs and the sheets kept out of git:

| | |
| --- | --- |
| `photos/date_shortcode_n.jpg` | every still, traceable to its post |
| `photos.json` | per frame: true pixels, focus, tone, palette, hash, likes, date, the post URL, why the ranking distrusts it |
| `captions.md` | the feed as readable text — the voice, without a megabyte of ids around every sentence |
| `contact-sheet-N.png` | every distinct frame, 40 per sheet, best first — numbered, with size, date, likes and the file name under each |

Two of the measurements are worth understanding, because they are the ones that
cannot be eyeballed:

- **Focus is measured on a native-resolution centre crop**, never on the
  thumbnail. Sharpness lives in the high frequencies and a downscale is exactly
  the operation that removes them: shrink a blurred 1440px photo far enough and
  it looks crisp.
- **Near-duplicates are folded by perceptual hash.** A feed will repeat the same
  shelf eleven times, and a contact sheet that spends eleven of its forty cells
  on it is a contact sheet that hid the good frames.

The ranking — resolution, focus, engagement, age — decides sheet **order** and
nothing else. It deletes nothing, it hides nothing, and every frame it distrusts
carries its reason in `photos.json` so a person can overrule it.

That has to stay literally true, and for a while it was not: the sheets were
capped at the best eighty, so on a feed of two hundred the score was not
ordering the sheets, it was deciding which frames anybody would ever see — and
the escape, "a person can overrule it", meant reading a three-hundred-entry
JSON. Sheet 1 is still the best forty, so stopping there costs nothing; the
tail exists for the afternoon you need the one frame of their treatment room and
it ranked ninety-first because it had four likes in 2021.

Sheets stop below rank 400, and when that bites the script says so rather than
letting a cap read as "that was everything". `--limit` moves it.

The script also prints **their palette, taken off the twelve best frames**. That
is the honest source for `HeroField`'s required colours and for the portrait's
Colour and material section, both of which were previously filled in by
squinting at a preview.

## Cost

Measured, not estimated:

- profile scrape — **$0.0045** per profile
- post scrape — **$0.189** for 70 posts, so about **$0.0027** each
- highlights — **~$0.008** per profile, flat, and only when asked for

All of it on your Apify account, at Apify's prices on the day. A full prospect
is therefore around **20 cents**, and the 200-post ceiling caps
it at about **55 cents** — against an afternoon of build time. The scrape is
never the expensive part; a portrait written from too little data is. Sweep the
whole feed, up to two hundred.

Because `tools=actors` is enabled, other Actors in the Store are callable too,
and they are not all this cheap. Check `fetch-actor-details` before calling
anything that was not asked for.

## When it fails

- **Empty result** — the handle is wrong, or the account was renamed or deleted.
  Check the handle in a browser before re-running.
- **Only header fields from Actor 1** — private account. Stop.
- **No captions and no media anywhere** — you called Actor 1 and expected Actor
  2's job of it. Check which tool you used.
- **Rate limited or blocked** — the Actor is being throttled upstream. Wait,
  do not retry in a loop, and do not go looking for another way in.

Docs: <https://docs.apify.com/platform/integrations/mcp>
