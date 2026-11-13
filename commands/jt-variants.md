---
description: Build the N clickable design variants
argument-hint: "[direction notes]"
---

Build the variants. Extra direction from the developer: $ARGUMENTS

Load `jtakeit-sites:variants`, and `jtakeit-sites:seo-geo` for the words and
the facts. How the site is built is in `node_modules/@jtakeit/astro/docs/`.
Read `variants.count` from the state file — it was agreed in the brief; do not
ask again.

The scaffold is an example in the design system of Brumy (brumy.ch), jtakeit's
maker. Every variant adapts it — its own tokens and fonts at least, from
`BRIEF.md` — and `count: 1` is one adapted direction, never the untouched
example. The Brumy look is kept only on the developer's explicit word, recorded
as `jt-state set design.look "brumy (kept: <who, when>)"`.

Name the N directions in one line each and get them agreed before writing code.
Then invoke the `frontend-design` skill once per direction, separately, and
build each variant from what it returns. A dev server with `open_dev_session`
lets the developer watch them take shape.

Each variant passes `jt-check` before anybody is asked to look:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-check.mjs" --url http://localhost:4321/<variant path>
```
