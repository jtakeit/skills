---
name: pitch
description: Stage 2 of the outbound track — record the vertical pitch video of the spec site's jtakeit preview with Playwright, mix in the quiet music bed and the one-line voice-over in the prospect's language, and hand the file to the human to send on Instagram. Load when the user says record the video, make the pitch, or the spec site is ready to show. Claude records and reviews it; a person sends it.
---

# Stage 2 (outbound) · The pitch

A vertical video: their business, as a website, scrolling on a
phone, with one spoken line in their language saying this is what it could look
like — and one question worth answering.

Then a person sends it. Not us.

## Record it

From the preview link `jtakeit-sites:spec` recorded — the site as the platform
built it, which is the site they would get:

```bash
node "$JT/scripts/jt-state.mjs" show          # prospect.previewUrl
node "$JT/scripts/jt-pitch.mjs" --url "<preview link>" --lang de-CH --out pitch.mp4
```

The files land in the project, and the scaffold's `.gitignore` does not know
about video: add `*.mp4` to it once, so a sales asset never ends up in the
repository a client may one day be handed.

The link opens through the panel and lands on the preview; the script follows it
once, keeps the session it leaves, and records the page. If it stops short of
the site, the link has expired or been reset — ask `get_preview_link` for a new
one. The edge's small «Preview» badge is left out of the frames: it belongs to
the preview, not to the site, and the voice-over is what says this is a
proposal.

While iterating, `--dist ./dist` records a local build and `--url
http://localhost:4321` the dev server — quicker, and not the build the prospect
would get. The one that is sent is recorded off the preview, after the last
`commit_and_build` has settled.

What the script does, and why it is shaped that way, is in
[references/video.md](references/video.md). The short version: **every frame is
synthesised.** Scroll, advance the page's clock by exactly one frame, photograph
the viewport, repeat — a hold at the top, one linear pass, a hold at the bottom,
with the audio mixed in.

Nothing is filmed and nothing is panned. The page's clock belongs to the script,
so one screenshot is exactly one animation frame: the motion is uniform the way a
pan over a still was, and the hero *moves*, which it could not when the page was
photographed once. Sticky elements stick and a hidden skip link stays hidden,
because what is photographed is the viewport rather than the whole document.

**One run produces two files.** `pitch-phone.mp4` at 1080×1920 is the pitch, and
what goes in a DM. `pitch-desktop.mp4` at 1920×1080 is for everywhere a landscape
frame is what fits, and it is the only place the desktop layout is ever seen.
Each is photographed at its own viewport, because a page at 1440 is not the page
at 393.

**The pace is fixed; the length is whatever the page needs.** One screenful every
2.4 seconds, so a band takes about that long to cross and a person can see what
it is. There is no cap: a page that takes half a minute to pass has too many
sections for a pitch, and the fix is the page, not the scroll.

**The first three seconds are the hero, alive.** `--hold-top` is 3 seconds and
the voice starts at 1 second, over it — a three-second hold with the old
"speak when the scroll starts" rule would have opened the file with silence.
If the hero does not move during that hold, the script says so and exits
non-zero: a still field is indistinguishable by eye from a calm one, and this
is the stretch the whole stage is for.

Useful flags:

- `--pace 2.4` — seconds per screenful, the only speed control. Higher is
  slower. `--scroll` is gone: fixing the duration is what made a long page
  scroll unreadably fast.
- `--hold-top 3` — seconds on the hero before the scroll starts.
- `--voice-at 1` — when the spoken line begins, in seconds.
- `--only phone` / `--only desktop` — record one of the two.
- `--field-speed 1` — multiplier on the page's own clock, for a field too slow
  to read in half a minute. Above 1 it shows motion the visitor will not see.
- `--fps 30` — halves the recording time, and the frames stay exact.
- `--fps 60` — output rate. Raising it costs nothing here, because the frames
  are synthesised rather than captured.
- `--lang de-CH` — picks `voice/de-CH.mp3`, falling back to `de.mp3`.
- `--music warm` — picks a bed by name from `music/`.
- `--assets <dir>` — where `voice/` and `music/` are; `JT_PITCH_ASSETS` in the
  environment does the same, and the plugin's own `assets/pitch/` is the
  default.
- `--no-music` / `--no-voice` — for checking one layer at a time.

## The audio

**Both are yours to supply** — the plugin ships no music and no voice. A bed you
hold a licence for, and one sentence recorded by a person, per language. Put them
in the plugin's `assets/pitch/music/` and `assets/pitch/voice/`, or — so a plugin
update cannot replace them — in a folder of your own with the same two
subfolders, named by `JT_PITCH_ASSETS`. `assets/pitch/README.md` has the naming,
the levels and the licensing. Two things that are this skill's business rather
than the script's:

**The spoken line is conditional, always.** «This is what your site could look
like.» Never «here is your new website». The site in the video is a proposal
about their business made without asking them; the sentence has to say so, or
the video reads as a scam and gets reported rather than answered.

**The ask costs them nothing.** Whether they would like to see it properly.
Whether it is worth a conversation. Not a price, not a deadline, not a discount
that expires — a stranger who opens with a countdown is a stranger who gets
blocked.

If there is no voice file for the language, the script warns and makes the video
anyway. Ship that only if the developer decides to; a silent scroll is a much
weaker pitch, and the fix is one recording that then serves every prospect in
that language.

## Watch it before it goes anywhere

The script prints this and it is not a formality. Look for:

- **The first second.** It is the whole thumbnail. If the hero has not finished
  painting, or the page opens on a placeholder, re-record.
- **A placeholder frame in shot** — `<Shot>` renders a labelled grey box for a
  missing photo. Fine while building, fatal in a pitch.
- **Scroll speed.** If the eye cannot land on a section before it leaves, raise
  `--pace` — and if that makes the video too long, the answer is a section fewer,
  not a faster scroll.
- **Both files.** Look at the desktop one too. It is the only place the desktop
  layout is ever seen, and a hero that works as a phone column can be half an
  empty screen at 1920.
- **The bed under the voice.** If the music is noticeable, it is too loud.
- **Anything unconfirmed that crept onto the page** — an address, an opening
  time, a price. `jtakeit-sites:spec` says why this matters; the video is the moment
  it stops being theoretical.

Re-recording costs a minute. Sending the wrong video costs the prospect.

## A person sends it

Claude does not open Instagram, does not send DMs, and does not automate
outreach. The video is a file; the developer sends it, from their own account,
in their own words, to a business they chose. That boundary is not squeamishness
— unattended messaging at volume is what gets an account banned and a name
attached to spam.

Worth saying in the message alongside the video, and worth keeping short:

- who we are, in one clause;
- that we made this because of something specific about *their* profile — name
  the thing, it is the reason the message gets read;
- the same ask as the voice-over, not a second one;
- where the portrait's «What it costs them» has an argument, it in one line, in
  their prices — «Fresha keeps CHF 8 of every new client's CHF 40 cut; booked on
  your own page, it keeps nothing» — and never a guess at their monthly total.
  Where the platform has no commission, no money line at all.

**The preview link waits for their answer.** The video goes in the first
message; the link goes when they want to see it properly — it is the answer to
the ask, and a link sent cold to a stranger is a link forwarded to anyone. It
works until the date `get_preview_link` gave; a new one is one call.

One message. If there is no answer, one follow-up, days later, and then the
prospect is archived. A third message is not persistence.

## Record what happened

```bash
node "$JT/scripts/jt-state.mjs" set prospect.pitchVideo pitch-phone.mp4
node "$JT/scripts/jt-state.mjs" set prospect.sentAt 2026-10-14
```

Then it waits. Three ways out:

**They said yes** — the tracks merge:

```bash
node "$JT/scripts/jt-state.mjs" advance brief --note "replied, wants to talk"
```

Every fact in the site is still unconfirmed, and the brief is where they get
confirmed. Load `jtakeit-sites:brief` — it is a short brief, because the
portrait did most of it, but it is not skippable. What exists is a guess that
looked good. The site on jtakeit, its repository and its preview carry on as
they are; nothing is rebuilt from scratch.

**No answer** — after the one follow-up:

```bash
node "$JT/scripts/jt-state.mjs" archive --reason "no reply, 2 messages, 11 days"
```

and ask the developer to archive the site in the panel (Sites → the row's menu →
Archive): it takes the preview off the internet and revokes its links, which a
proposal nobody answered should not outlive.

**Later, they come back** — `jt-state revive` puts the project back exactly
where it stopped, with the site still in the repository; the panel's Restore
brings the site back as a draft, and `get_preview_link` makes a new link.

## Exit checklist

- [ ] recorded off the preview link, after the last build settled — not a local
      `dist/`
- [ ] both files recorded — `pitch-phone.mp4` 1080×1920 and
      `pitch-desktop.mp4` 1920×1080
- [ ] the script did not report a frozen hero: the field moves through the whole
      three-second hold, which is the part of the video that does the work
- [ ] watched end to end by a human — both of them
- [ ] no placeholder frames, no unconfirmed facts on screen
- [ ] voice-over in the prospect's language, conditional, with one cheap ask
- [ ] music present and unnoticeable, yours, and licensed for commercial use
- [ ] `prospect.pitchVideo` and `prospect.sentAt` recorded once it goes out
- [ ] the video file itself is **not** committed — `*.mp4` in `.gitignore`; the
      repository is for the site, not for sales assets
- [ ] the preview link kept back for their answer, not sent cold
