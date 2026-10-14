---
description: Cut the business's own video into the short silent loops a page uses — measure the source, choose the moments, cut, poster and weigh
---

Load the `jtakeit-sites:clips` skill, then measure the source before cutting
anything:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-clips.mjs" --from _video/<file>
```

That prints what the video is and stops. Which seconds are worth a card is the
judgement this skill exists for — watch it, pick four or five moments that show
the *work*, name each one for what it is, and cut:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-clips.mjs" --from _video/<file> \
  --clip wash@3.2 --clip cut@11 --clip blowdry@24.5 --clip done@40
```

If there is no video in `_video/` yet, the business has to send one — the skill
has the message to send them. Nothing here scrapes it.
