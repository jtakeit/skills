---
description: Outbound stage 0 — scrape an Instagram profile and turn it into a portrait to build from
argument-hint: "<instagram-handle>"
---

Start an outbound prospect: $ARGUMENTS

Load the `jtakeit-sites:prospect` skill and follow it.

If there is no project for this handle yet, start one first:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-init.mjs" --slug <slug> --name "<name>" \
  --locale <tag> --track outbound --handle <handle>
```

Pull the profile through the Apify MCP scraper, save the raw JSON to
`.jtakeit/instagram.json`, run `jt-photos` in the same sitting, and write
`PORTRAIT.md` — every claim carrying the post and date it came from.

Stop and archive the prospect if the account is private, abandoned, or not a
business (`jt-state archive --reason "…"`). Say so plainly rather than building
something on nothing.

If the Apify tools are not available, the Apify server has not been signed in:
point at `/mcp`, `plugin:jtakeit-sites:apify`, Authenticate, sign in in the browser. Offer the
alternative meanwhile — the developer pastes the bio, highlights and last dozen
captions in by hand, which is often faster anyway.
