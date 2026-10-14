# The platform, stage by stage

Every site in this pipeline runs on jtakeit. The agent writes it into a git
repository; the platform builds it, serves it, gives the owner a panel to edit
it in, and answers its forms and its diary. This page is which tool each stage
uses and in what order. The platform's own guides are the authority — the MCP
server hands them over on `initialize`, starting with
`jtakeit:///guides/start.md`, and every other guide is a `jtakeit:///`
resource the agent can read — and where this page and they disagree, they are
right.

## Connecting

The plugin's `.mcp.json` configures the server:

```json
"jtakeit": { "type": "http", "url": "https://mcp.jtakeit.com/mcp" }
```

It signs in over OAuth the first time a tool is used, in the browser, and a
person approves the agent in the panel. If the tools are missing, that is the
step: point at `/mcp`, and do not try to sign in on anybody's behalf. A jtakeit
account is free until a site goes live.

## The tools, by stage

| stage | what to use |
| --- | --- |
| spec, or the first build of an inbound site | `create_site` first (the developer's list shows it from that minute); the dev server and `open_dev_session` so the pages appear as they are written; `npx @jtakeit/astro catalogue`; `validate_catalogue` with the `jtk/` files; push; `attach_repo`; `commit_and_build`; `get_build` until it settles |
| any build | `get_build_log` when it does not settle. Every refusal carries a `JTK_E_` code; look the code up rather than reading the prose around it |
| reading what was built | `get_built_page` — the HTML the runner wrote; with `shot: "phone"` the page as a visitor's browser draws it, whole |
| pitch, preview | `get_preview_link` — a ticket with a short life, for a person |
| any later change | `git pull` first — every version the owner saves is a commit on the branch; `get_site`, whose panel half says what is unsaved; then commit, `import_branch`, `commit_and_build`. Never import over unsaved work: the platform refuses with `JTK_E_DRAFT_AHEAD` |
| revisions | `get_content` to see what the platform holds, then rebuild and mint a fresh link |
| launch | `preflight`, with `try_booking` on a site that takes bookings; it says what is missing and whose step each thing is |

`trigger_build` rebuilds a site that has been built once; `rollback` serves an
earlier build again; `get_stats`, `list_sites`, `list_entries`, `get_registry`,
`get_prices` and `get_allowance` are for reading.

## The GitHub App

The platform reads the repository through its App,
https://github.com/apps/jtakeit-connect, which **a person installs** — it reads
`Contents` and nothing else. `attach_repo` refuses with that link until it is
done. For the outbound track, where many speculative sites are made, the App
belongs on the developer's whole account or organisation, all repositories,
once — so a new demo repository needs nothing from anybody.

## What the platform already does, so the skills do not

- **The scaffold.** `npx @jtakeit/astro create` writes the layout, the hero,
  the enquiry form, the booking form, opening hours, robots, the sitemap,
  canonicals, hreflang, structured data and `llms.txt`.
- **Indexing.** A build that is noindex, has a blocked `robots.txt`, an empty
  sitemap or a foreign canonical is refused. Previews are never indexed; a site
  is public only once a person launches it.
- **The catalogue.** `npx @jtakeit/astro catalogue` checks the declaration
  against the built pages in both directions; `validate_catalogue` is the
  judge.
- **Enquiries and bookings.** The form posts to the platform's `/api/lead`;
  the diary is the platform's. Where enquiries go — a chat, an email address —
  is set in the panel and verified there.

What is left to the skills is what no platform can know: whether the page
states a fact nobody confirmed, whether its words were written or lifted,
whether it composes. That is `jt-check`.

## What a person does, in the panel

The agent cannot launch a site, attach a domain, invite anybody, connect
another agent, read the business's customers, or touch money. Each has its
place in the panel:

- **Who the site belongs to** — the developer's own client, under terms they
  set (billed through jtakeit on the developer's own Stripe, or invoiced their
  own way, zero included), or handed over.
- **The plan** — one line per live site, paid only from the launch.
- **Where enquiries and bookings go** — a verified channel for each kind the
  site collects, or a recorded decision to do without.
- **Launch**, and the business's own domain, at launch or later.
- **Payments for bookings** — the owner's own Stripe account, opened from the
  panel; never the developer's.
- **Handover** — a link the client opens; the site and its repository move to
  them, mirrored.

When somebody asks *how do I launch this, bill this, hand this over*, the
answer is the screen and the person, not *I can't*.
