---
description: The fast path — one Instagram handle to a private preview of a site built from it, in one go; prints the link
argument-hint: "<instagram-handle>"
---

Build a speculative site for: $ARGUMENTS

This is the short way through the outbound track — prospect, spec, and a
preview link — for the moment somebody says "do mine" under a post, or the
developer wants to see what one business would look like. It stops at the link:
no video, nothing sent. Load `jtakeit-sites:pipeline`, then
`jtakeit-sites:prospect` and `jtakeit-sites:spec`, and follow them; this
command only sets the order and the stopping points.

**Say what it costs before starting**, in one line: the Instagram scrape is
paid from the developer's Apify account — about 20 cents for a typical profile,
capped near 55 cents for a long feed — and the site on jtakeit costs nothing
while it is a preview; a site is paid for only once a person launches it.

## 0. Both servers, before anything is paid for

Look for the Apify profile-scraper tool and the jtakeit tools (`create_site`)
among the tools you have. A server that has not been signed in yet has none. If
either is missing, stop before the scrape and say, in one message, which one
and how: `/mcp`, choose `plugin:jtakeit-sites:apify` or `plugin:jtakeit-sites:jtakeit`, then Authenticate, and sign in in the browser that opens (before the sign-in Apify's line can read «connected · tools fetch failed» — it is the same step)
— an Apify account is the developer's own and every run is billed to it; a
jtakeit account is free until a site goes live. The tools appear in the same
session; then run the command again. Do not scrape with jtakeit missing: the
material would have nowhere to go. If more than a sign-in is missing, or this is
the first run on this machine, send them to `/jt-setup` instead.

## 1. Look before building

Scrape the profile header first (Actor 1 in `jtakeit-sites:prospect`). Stop
here, politely, and build nothing if the account is:

- **private** — it has told us what it wants;
- **empty or abandoned** — a handful of posts, nothing for a year;
- **not a business** — a personal account, a reseller, a fan page.

Stopping is one line to the developer — what was found and why there is no
site — and, if they want something to say back to the person who asked, one
friendly sentence they could send (for a private account: the site is built
from public posts, so there is nothing to build from yet). No project is
created for a handle that stops here.

## 2. The portrait

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-init.mjs" --slug <slug> --name "<name from the profile>" \
  --locale <the language they write in> --track outbound --handle <handle>
```

The slug is the handle made legal: `atelier.nord.zh` → `atelier-nord-zh`. Then
the posts, `jt-photos` in the same sitting (the media links expire), and
`PORTRAIT.md`, every claim with its source. Advance to `spec`.

## 3. The site

Build one page per `jtakeit-sites:spec`, from the portrait, with
`node_modules/@jtakeit/astro/docs/` for construction. It states **no
unconfirmed fact** — no address, hours, prices or phone number read off a
caption — and it says "could look like", never "your new website". Build it
and run `jt-check --dist ./dist --spec` until it has no failures.

## 4. On jtakeit, privately

`create_site` (record the id: `jt-state set site.id <id>`), then the
repository: `gh repo create <owner>/<slug> --private --source . --push`. The
owner is the one `/jt-setup` saved — `node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-setup.mjs" owner`;
if none is saved, ask once and save it with `jt-setup owner <name>`. The jtakeit GitHub App has to
be installed on that owner; for this track, install it once on the whole
account (all repositories) so no demo waits on a person — if `attach_repo`
refuses with the App's link, that is the step, and it is theirs.

Then `attach_repo`, `commit_and_build`, `get_build` until it settles
(`get_build_log` if not), and `get_built_page` with `shot: "phone"` — look at
it before anybody else does.

## 5. The link

`get_preview_link`, and print it with one line on what it is: a private
preview, not indexed, that expires; mint a fresh one when it is needed again.
Advance to `pitch` and stop. The next steps are the developer's choice:
`/jt-pitch` for the video, or the link itself, sent by a person from their own
account.
