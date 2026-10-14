---
name: clips
description: Turn the client's own video into the short silent loops a page uses — the process of the work, moving. Load when a video file has been put in _video/, when the user says cut the video, make the loops, add the clips, or when a hero or a section wants motion that is theirs rather than a shader. The human supplies the video; the model chooses the moments; jt-clips does the mechanics.
---

# Their own video, cut into loops

A shader is a beautiful ground and it is nobody's. Four seconds of their hands
doing the thing is the only motion on a page that could not be on anybody else's
site — and on a one-person business it is the argument.

This is not a pipeline stage. It runs whenever there is a video and a page that
wants one, on either track.

## The division, and why it is this one

```
the human      drops their video into `_video/`. One reel, one session,
               whatever they have. It is theirs, it is given rather than
               scraped, and nobody asks a script to find it.
the model      watches it and decides which seconds are worth a card, in what
               order, and what each one is called.
jt-clips       cuts, loops, strips the sound, sizes, posters and measures.
```

**The middle row is the work.** "Cut something interesting out of this" is not
something a script can be asked, so `jt-clips` with no `--clip` prints the
source's measurements and stops.

## Ask for the video like this

The client has it and will not think of it as material. Ask for the raw file
rather than the published reel — no captions burned in, no music, no cover
frame:

> Könnten Sie mir ein Video von der Arbeit schicken — so, wie es aufgenommen
> wurde, ohne Bearbeitung und ohne Text? Eine Minute reicht. Auf der Website
> werden daraus ein paar kurze Ausschnitte ohne Ton; ganz sieht es niemand.

(In their language, always: «Could you send one video of the work, as it was
filmed, unedited and without captions? A minute is enough. It goes on the site
as a few short silent pieces; nobody sees it whole.»)

Where the only thing that exists is a published reel, it still works — the
burned-in caption is what has to be cropped away, and that is what `--ratio`
and the crop are for.

## Choosing the moments

Watch it once through before cutting anything. What earns a card:

- **the material before it is touched** — the drawing, the dough, the empty room;
- **the hands doing the thing**, close;
- **the moment it changes** — the first cut, the pour, the stencil going on;
- **the finished thing**, held or worn;
- **one frame of them**, if they are the business.

What does not: a face pulled for the camera, a logo animation, anything a
stranger's phone recorded of a customer.

**The set is a process, and its order is an argument.** Drawing, stencil,
needle, finished is a sentence about how the work is done; the same four shuffled
is a mood board. Name each clip for what it *is* — `sketch`, `stencil`,
`needle`, `done` — because the name becomes a file, a content key and something
the owner will read in the admin.

Four or five is a set. Two is not a process and eight is a video.

## Cutting

```bash
node "$JT/scripts/jt-clips.mjs" --from _video/session.mp4            # measure, decide
node "$JT/scripts/jt-clips.mjs" --from _video/session.mp4 \
  --clip sketch@3.2 --clip stencil@11 --clip needle@24.5 --clip done@40
```

What comes out: `public/clips/<name>.mp4`, `public/clips/<name>.jpg` — the
loop's own first frame — and `.jtakeit/clips.json`, which records where each
clip came from. Not under `jtk/`: that directory is the platform's contract,
and a publish writes it back.

`clips/` rather than `media/`, and it is worth knowing why: **`/media/` is
jtakeit's own prefix on the hosting edge**, where an owner's uploads are served
from. A site file under it was once taken for a bucket key and answered 404 — and
only on the client's own domain, because a preview is served under `/p/<slug>/`
and never reaches that branch. The site works right up until it goes live.

Every clip is **silent by construction**: the audio track is absent, not muted.
A muted track is bytes nobody hears, and a browser that unmutes on a gesture
would play a stranger's room.

Every clip is a **palindrome** unless `--no-boomerang`: forward, then backwards,
so the loop has no seam anywhere. It is what lets a clip be under a second and
still not read as a stutter. Where the motion already returns to where it
started — a wheel, a wave, a hand going back and forth — cut the boomerang off
and halve the bytes.

Knobs worth knowing, in the order to reach for them when a clip is over budget:
`--len 0.7` (shorter is cheapest and nobody notices), `--crf 32` (watch skin and
gradients for mush), `--width 360`. A hero of five should come in around 300KB
all in.

## The owner replaces one without us

A clip declared in the catalogue can be swapped in the admin, which is most of
the value — "can you change the third video" is otherwise a message and a
commit. Two things follow from that, and both are in the scaffold's
`node_modules/@jtakeit/astro/docs/catalogue.md`:

- the field is `kind: 'media'`, `accept: 'video'`, `multiple: true` — always
  multiple, even for one clip, because a clip is stored with its poster and a
  plain key has nowhere to keep one;
- what the owner uploads is served from `/media/…`, not from `public/clips/`.
  A page that reads its clips from the content document gets whichever is
  current; one that hard-codes `clips/needle.mp4` is showing ours forever.

## Putting them on the page

`<Clip>` in the scaffold (`src/components/Clip.astro`) carries every rule below — it is a component so that a page
gets all of them rather than the four somebody remembered:

```astro
<Clip src={loop.name} poster={loop.poster} path={loop.path} />
```

**This skill does not decide what the clips look like.** They are cards in a
`<Pile>` on one site, a single full-bleed loop behind a heading on another, a
strip of four beside the text on a third — the shape comes from
`node_modules/@jtakeit/astro/docs/shapes.md` like every other decision, and
copying the last project's arrangement is the thing to avoid.

What every use has to carry, whatever it looks like:

- **`poster` is the clip's own first frame.** Autoplay refused, Low Power Mode,
  a missing codec, JavaScript off — every failure lands on that picture, so it
  has to be the frame the loop starts from and it has to look deliberate on its
  own. `jt-clips` writes exactly that frame.
- **`autoplay muted loop playsinline`**, and nothing to press. These are moving
  photographs, not something to watch, and a play button in a hero is an
  invitation to do something other than the one action.
- **Reduced motion stops them at frame one**, which is the poster. There is no
  CSS property that pauses a video, so it is a few lines of script — and with
  JavaScript off the markup's own `autoplay` runs, which is the right way round.
- **One label for the set, not one per clip.** Five clips in a pile are visually
  one thing; five labels read out in a row are worse than one sentence. Describe
  the group on its container with `role="img"` and an `aria-label`.
- **`data-motion` on the region that owns them.** A hero of five loops is one
  decision, and `jt-check` counts regions rather than elements — see the
  Motion section of `node_modules/@jtakeit/astro/docs/kit.md`.

## Before the stage ends

- [ ] the video came from the client, not from a scrape
- [ ] every loop watched once at full size: no visible seam
- [ ] every poster worth looking at on its own — it is what a blocked autoplay shows
- [ ] nobody in any clip who did not agree to be on a website
- [ ] the set reads as one process, in an order that makes sense
- [ ] the clips total roughly what a photograph costs, not what a video costs
- [ ] `_video/` in `.gitignore`; `public/clips/` committed
- [ ] `jt-check` at zero — including what moves forever
