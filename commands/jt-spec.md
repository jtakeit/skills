---
description: Outbound stage 1 — build the speculative site from the portrait and put it on jtakeit as a private preview
argument-hint: "[direction notes]"
---

Build the spec site. Extra direction: $ARGUMENTS

Load `jtakeit-sites:spec`. How the site is built — blocks, pages, photographs,
the enquiry form — is in `node_modules/@jtakeit/astro/docs/`, `kit.md` first.
Use `frontend-design` once, with `PORTRAIT.md` as the brief — one direction,
not variants, because there is no client yet to choose between them. Ask once
which pages beside the landing (the team, the price list, the work, a journal),
recommending from what the portrait found.

Three rules that are not style preferences:

- The design is **redone**, always. The scaffold is an example in the design
  system of Brumy (brumy.ch), jtakeit's maker; a spec is a pitch to a business
  with a look of its own, so neither Brumy's palette and type nor any of the
  example's words or photographs survive into it. `jt-check` fails on either.

- The page states **no unconfirmed fact**. No address, hours, prices or phone
  number read off a caption. Design around their absence.
- It is a **private preview**, never public. It goes to jtakeit the usual way —
  `create_site` with the currency, push, `attach_repo`, `commit_and_build`,
  `get_build` — and the link from `get_preview_link` is the only way to see
  it. Nobody launches a spec site.

Run `jt-check` on the build before calling it done:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-check.mjs" --dist ./dist
```

Design it to be watched: it will be recorded as a phone-width scroll before
anyone ever visits it.
