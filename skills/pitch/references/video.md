# How the video is made

`scripts/jt-pitch.mjs`. Playwright records the scroll, ffmpeg does the rest.
ffmpeg is yours to install (`brew install ffmpeg` on macOS); the `playwright` package installs itself
into `scripts/.deps` on first run, and so does chromium — a second, separate
download into the shared browser cache (`~/Library/Caches/ms-playwright` on
macOS, `~/.cache/ms-playwright` on Linux, `%LOCALAPPDATA%\ms-playwright` on
Windows). `/jt-doctor` says whether both are there before a stage needs them.

```bash
node "$JT/scripts/jt-pitch.mjs" --url "<preview link>" --lang de-CH --out pitch.mp4
node "$JT/scripts/jt-pitch.mjs" --url "<preview link>" --lang de --pace 3
node "$JT/scripts/jt-pitch.mjs" --dist ./dist --only phone      # local, while iterating
```

`--out pitch.mp4` names the pair: `pitch-phone.mp4` and `pitch-desktop.mp4`.

**The preview link.** `get_preview_link` answers with a link on the panel
(`/e/<token>`); opened, it goes to the panel's look page, which sends the
browser on through the preview host's ticket exchange to `/p/<slug>/` and
leaves a session cookie behind. The script follows that once, in a browser
context of its own, keeps the cookie, and starts every recording context from
it at the address it landed on — so both formats record the same page under the
same session. A link that has expired or been reset stops at the panel, and the
script says so rather than recording the panel. The edge appends a «Preview»
badge (`[data-jtk-preview]`) to every page under `/p/<slug>/`; the recording
hides it.

With `--dist` the script serves a local build itself on port 4488, so there is
no second terminal and no chance of recording yesterday's dev server. That is
for iterating; the video that is sent is the preview's.

## Two frames, one run

```
pitch-phone.mp4     360×800 at 3×  →  1080×2400 → 864×1920, column on a dark ground
pitch-desktop.mp4   1440×810 at 2× →  2880×1620 → 1920×1080, full-bleed
```

**The phone file is the pitch.** Nearly everyone who ever sees the prospect's
business online sees it on a phone, so the phone layout is the honest thing to
show — and it is the layout the spec site should have been designed for anyway.
Its column sits on a near-black ground rather than inside a drawn device: a bezel
makes the viewer look at the bezel.

**The desktop file is for everywhere a landscape frame is what fits** — a reply
on a laptop, a message that carries a link, a reel of your own work. It also shows
the layout the phone video never does, which is worth having when the page has a
two-column hero or a wide gallery.

Each is recorded separately, at its own viewport. A page is not the same page at
360 and at 1440: different reveals fire and a different image comes out of the
same `srcset`, so reusing one recording for both would be showing a layout nobody
has.

**360×800, not the phone in our pocket.** It is the commonest viewport on the
internet — the Android median — and the honest thing to design the spec site
against. It is also the sharper choice: at 3× the frame is 1080×2400 and reaches
1920 as a *downscale*, where the old 393×852 at 2× had to be stretched from 786
to 886 wide. Both formats now only ever resample downwards, the desktop one by
exactly 1.5. `unsharp` is mild in both; anything stronger rings on the
photographs, and the photographs are the point.

`--only phone` or `--only desktop` records one of them.

## The pass

**Nothing is filmed and nothing is panned. Every frame is synthesised.**

Three approaches, in the order they were tried, because the third only makes
sense against the first two.

**Recording the scroll** is the obvious one and it juddered. Playwright writes a
variable-rate webm at roughly 25fps whose frames are not synchronised to the
page's own animation frames; forcing that to a constant rate duplicates and drops
frames irregularly. Measured on a real spec build: one frame in six was a repeat
during the scroll, which is exactly what an eye reads as lag. Raising the output
rate cannot repair it — the information was never captured.

**Panning a still** fixed the judder and cost everything that moves. The page was
photographed once, tall, and a window travelled down the picture: uniform by
construction, but a hero shader arrived as a single frozen frame, `fixed` and
`sticky` elements were baked in wherever they happened to sit — including a skip
link that hides itself by translating past the top of the viewport, which in a
full-page photograph has nothing to hide behind — and the reveals were all long
since finished, because the page had to be walked before it could be shot.

**Synthesising each frame** has neither problem. The loop is: scroll, advance the
page's clock by exactly one frame, photograph the viewport.

```js
await page.evaluate((to) => window.scrollTo(0, to), y);
await page.evaluate((ms) => window.__clock.step(ms), 1000 / fps);
const frame = await page.screenshot({ type: 'jpeg', quality: 92 });
```

There is no capture rate to be out of step with, because **the page's clock is
ours**. A shim installed with `addInitScript` — before any of the page's own
script — replaces `performance.now` and `requestAnimationFrame`, queues the
callbacks, and runs them only when told:

```js
let t = 0, queue = [];
performance.now = () => t;
window.requestAnimationFrame = (cb) => queue.push(cb);
window.__clock = { step(ms) { t += ms; const due = queue; queue = []; for (const cb of due) cb(t); } };
```

One screenshot is therefore exactly one animation frame, and the motion is as
uniform as the pan ever was. The hero animates. And because what is photographed
is the *viewport* rather than the document, everything positioned against the
viewport behaves as it does for a visitor: sticky sticks, and the skip link stays
off screen where it belongs. The old warning about `fixed` and `sticky` elements
is gone along with the reason for it.

Two supporting details that the walk used to provide:

- **Images are decoded up front** — `loading = 'eager'` and `img.decode()` on
  every image before the first frame. The walk cannot do this job any more: it
  would spend the scroll reveals before the camera ever saw them.
- **Smooth scrolling is switched off for the recording.** `scroll-behavior:
  smooth` makes `scrollTo` animate on the compositor's clock, which this script
  does not own, so every frame would be photographed somewhere behind where it
  should be. Measured while writing this: without the override, `scrollY` was
  still 0 immediately after a `scrollTo(0, 3000)`.

Then: **hold at the top** (3s by default — long enough to see the hero move,
which is the point of the first screen), **one linear pass** (linear on purpose,
an eased scroll reads as camerawork and the thing being sold is the site), and a
**hold at the bottom** so the last thing on screen is whatever the page ends on
rather than a cut.

`locale` is set to the prospect's language, so anything locale-aware renders the
way they would see it.

### What the shim does not own

CSS transitions run on the compositor's clock, not on `performance.now`, and real
time here is tens of milliseconds per frame — so a 0.7s reveal would finish
within a handful of frames and look like a glitch rather than a reveal. Reveals
are therefore pinned to their finished state for the recording:

```js
await page.addStyleTag({ content: '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}' });
```

This is exactly what the walk-then-photograph pipeline did in effect, so nothing
is lost. Making reveals actually animate needs CDP virtual time
(`Emulation.setVirtualTimePolicy`), which advances timers, rAF and CSS together.
That is the next version of this script, and it wants testing against WebGL
before it replaces the shim.

### Hardware WebGL, with a fallback

The software renderer costs six to twelve times as much per frame — the
difference between a minute and a quarter of an hour over a whole video — and it
is only needed where headless Chromium cannot do WebGL at all. So the browser is
launched normally, the page is asked whether its hero field went live
(`[data-hero-field]` carries `data-state="live"` once it has painted), and only
if it did not is the browser relaunched with `--use-angle=swiftshader`.

### A frozen hero fails the stage

While the page is standing still during the top hold, the only thing that can
change is the hero. So identical consecutive frames there mean the field is not
animating — and that is indistinguishable by eye from a field that is simply
calm, which is why it is measured: the frames are hashed, and more than a tenth
of the hold repeating exits non-zero with the reason. On a page with no
`[data-hero-field]` at all the check does not apply.

There is no height limit any more, and no slicing: the viewport is what is
photographed, so a page of any length is just more frames.

## The mix

```
music  ×0.08, looped to length, fading out over the last 1.4s
voice  at full level, starting 1.0s in (--voice-at) — on the hero, not after it
```

Music at 8% is under the threshold of being noticed, which is the correct level:
it is there so the video does not feel like a screen recording. If a viewer can
describe the music, it is too loud or too busy.

The voice used to start when the scroll did. With a three-second hold that would
open the file with three seconds of silence, so it now lands **on** the hero — one
second in, over the thing being sold, while the field is moving. `--voice-at`
moves it; `--hold-top` moves the scroll.

Output is H.264 / yuv420p / AAC with `+faststart`, at 60fps by default
(`--fps`) — the combination that plays inline everywhere. Instagram re-encodes
most uploads to 30fps anyway, which is fine: halving a uniform 60 is itself
uniform, whereas the irregular capture this replaced stayed irregular at every
rate.

**`--fps 30` is the honest lever when a run takes too long.** Every frame is
photographed one at a time, so the recording costs about a minute and a half per
format on a machine with working WebGL and several times that without it. Halving
the rate halves the work, and the frames are still exact — unlike a screen
recording, where dropping to 30 also drops the smoothness.

## Pace, not length

**The speed is fixed and the length is whatever the page needs.** One screenful
every `--pace` seconds — 2.4 by default — so a band the height of the viewport
takes two and a half seconds to cross, which is enough to see what it is and read
its heading.

This used to be the other way round: `--scroll 13` fixed the duration, so the
speed came out as page-height divided by thirteen and a long page flew past at a
rate nobody could read. That is the worse failure of the two. A viewer who stops
at second twenty saw twenty seconds of the site; a viewer who watched all sixteen
of a blur saw none of it.

So there is no cap, and the arithmetic is honest: a 9700px phone page is about
ten screenfuls, which is twenty-five seconds of scroll plus the holds. If that
feels too long, **the fix is a shorter page, not a faster scroll** — and a page
that needs half a minute to pass has more sections than a pitch can carry, which
is a finding about the build rather than about the video.

`--pace 3` for a dense page with a lot of reading in it, `--pace 1.8` for a page
that is mostly photographs.

## When it goes wrong

- **It is longer than you expected** — that is the page's length at a readable
  pace, and the number of screenfuls is printed with the file. Cut sections, or
  raise `--pace` deliberately knowing it is now slower still.
- **`the hero is not animating`, and the script exits non-zero** — the field
  never went live. Check that `[data-hero-field]` is on the page, that WebGL
  works (the script says when it fell back to software rendering), and that the
  field's colours are not four shades of the same thing, which animates
  invisibly. See `node_modules/@jtakeit/astro/docs/hero-motion.md` in the site.
- **The scroll judders** — you are looking at a video made the old way, by
  recording a live scroll. Re-record. To check a suspect file rather than guess,
  count its repeated frames: `ffmpeg -i pitch.mp4 -vf mpdecimate -f null -` and
  compare the frames it keeps against `ffprobe -count_packets`. Repeats inside
  the bottom hold are expected — the hero has left the viewport by then and its
  loop honestly stops. Repeats *during the scroll* are the fault.
- **A reveal flickers past instead of revealing** — reveals are pinned to their
  finished state on purpose, because CSS transitions do not run on the clock
  this script controls. If one is animating anyway, it is not hung on
  `[data-reveal]`.
- **Blurry text** — both formats resample downwards now, so this should not
  happen. Do not chase it by enlarging the viewport, which would switch the site
  to another layout.
- **`could not launch chromium`** — `npx playwright install chromium`.
- **`ffmpeg failed`** — the last 25 lines of its stderr are printed. Usually a
  music or voice file that is not actually audio.
