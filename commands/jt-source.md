---
description: Build the outbound list for one trade in one city — sweep Instagram, filter, mark the soloists, ship a Google Sheet
argument-hint: "<trade and city, e.g. coiffeur zürich>"
---

Build the outbound list for: $ARGUMENTS

Load the `jtakeit-sites:sourcing` skill and follow it.

This is not a pipeline stage and it does not touch `.jtakeit/state.json`. It
runs once per market and fills the queue that `/jt-prospect` and
`/jt-from-instagram` take from, one handle at a time.

Write `sweep.json` first — the terms in every language the market writes in,
plus the five vocabularies — then run `apify/instagram-search-scraper` with
`searchType: "user"` and a spend cap, then `scripts/jt-source.mjs` over the
dataset it produced.

Then read the bios. The script proposes a label where the evidence is
one-sided and refuses where it is not; the refusals sort to the top and reading
them is the job. Do not ship a sheet whose unclear rows are still unread.

Upload the result to Drive as a Google Sheet, hand over the link, and stop.
Nothing here contacts anybody — a person picks a row and sends the pitch by
hand, from their own account.

If the Apify tools are missing, the Apify server has not been signed in: point
at `/mcp`, `plugin:jtakeit-sites:apify`, Authenticate, sign in in the browser.
