---
description: Outbound stage 2 — record the pitch video of the spec site's preview
argument-hint: "[--pace seconds-per-screen] [--only phone|desktop]"
---

Record the pitch video. Options: $ARGUMENTS

Load `jtakeit-sites:pitch` and follow it. Mint a fresh preview link with
`get_preview_link` and record that:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-pitch.mjs" --url "<preview link>" --lang <locale> --out pitch.mp4
```

That writes **two** files — `pitch-phone.mp4` and `pitch-desktop.mp4` — and the
run takes a couple of minutes. The voice-over and the music are the
developer's own files in `assets/pitch/`; `/jt-doctor pitch` says whether they
are there.

Then check the result before handing it over — pull a few frames out of **each**
with ffmpeg and actually look at them. The first second is the thumbnail and
decides whether the rest is watched. Look for placeholder frames, anything
unconfirmed on screen, and whether a person could read a band as it passes. If
it feels hurried, raise `--pace`; do not shorten the video by speeding it up.

Report what you checked and hand the file paths to the developer. Do not send
anything: a person sends it, from their own account.
