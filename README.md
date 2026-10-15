# jtakeit-sites

A Claude Code plugin for freelance web developers who build sites for local
businesses. It finds them, builds a site from a business's own Instagram, records
a short video of it for you to send, and runs the site on
[jtakeit](https://jtakeit.com) once they say yes — one skill per stage, with the
stage written down in the site's repository.

jtakeit is the backend: the agent writes the site into a git repository, and the
platform runs the owner's panel (they edit by tapping the text on their own page),
enquiries, bookings with payments to the business's own Stripe, hosting, the
domain, private previews and the SEO checks. A site goes public only when a person
launches it in the panel.

## Install

```
/plugin marketplace add jtakeit/skills
/plugin install jtakeit-sites@jtakeit
/jt-setup
```

`/jt-setup` goes through everything below once: what the machine is missing,
the two sign-ins, the GitHub account the sites go to, and the GitHub App on it.
It fixes what it can and says which steps are yours. Then:

```
/jt-from-instagram <handle>
```

The skills then load themselves when the work matches, in any project. The
`frontend-design` plugin (from `claude-plugins-official`) is used once per design
variant and is expected alongside it.

## What you need

- **Claude Code.**
- **Node ≥ 22.12** and **git**.
- **`gh`**, logged in (`gh auth login`) — the site's repository lives on your
  GitHub, and jtakeit builds from it.
- **A jtakeit account** — free until a site goes live. The plugin configures the
  jtakeit MCP server; it signs in through your browser the first time a tool is
  used. Install the jtakeit GitHub App
  ([jtakeit-connect](https://github.com/apps/jtakeit-connect)) on the account the
  repositories go to; for the outbound track, on all its repositories, once.
- **An Apify account**, for the Instagram part. The plugin configures Apify's
  MCP server too, and it signs in the same way, through your browser the first
  time; every run is billed to your account. A typical profile costs about 20
  cents to read.
- **ffmpeg** and **Playwright** for the videos and the page checks. Playwright
  installs itself on first use; its browser is a separate download the scripts
  fetch when it is missing.
- **Your own pitch audio**: a short voice-over, and music if you want it, in
  `assets/pitch/` — see [assets/pitch/README.md](assets/pitch/README.md). None
  ships with the plugin.

`/jt-setup` walks through all of it; `/jt-doctor` checks it again later, and
says what the current stage still needs.

On Windows, work inside WSL2: the scripts are portable Node, but the commands in
the skills are written for a POSIX shell.

## Two tracks, and a fast path

```
outbound   prospect → spec → pitch → brief → variants → preview → revisions → launch
inbound                          brief → variants → preview → revisions → launch
sourcing   beside the pipeline: one trade in one city → a list of handles
```

**Inbound** — a business asked you for a site. The brief, a few design
directions, a private preview for them to comment on, revisions, and the launch.

**Outbound** — you found them. `sourcing` sweeps one trade in one city into a
sheet of Instagram handles. For one handle, `prospect` reads the profile into a
portrait where every claim carries its source — and reads the bio link: which
booking platform they pay today, and the services, prices and hours they
published there themselves; `spec` builds a site from it and
puts it on jtakeit as a private preview; `pitch` records a short video of that
preview, which you send yourself. If they say yes, the brief confirms everything
the profile only suggested, and the inbound track takes over.

**The fast path** — `/jt-from-instagram <handle>` runs prospect, spec and a
preview link in one go and prints the link. It is what answers "do mine" under a
post. Private, empty and non-business accounts are declined politely before
anything is built.

The launch is a person's: `preflight` says what is missing and whose step each
thing is, and you launch in the panel — keeping the client, and billing them
through jtakeit on your own Stripe or your own way, or handing the site over with
the panel's link, which moves the site and its repository to them.

## Commands

| Command | |
| --- | --- |
| `/jt-setup [github-owner]` | first run: the machine, the sign-ins, the GitHub account and App |
| `/jt-status` | which stage this project is in, and what is blocking it |
| `/jt-doctor [stage]` | what this machine is missing, and which skills are running |
| `/jt-start <slug>` | start a client project: `@jtakeit/astro` scaffold and pipeline state |
| `/jt-source <trade and city>` | the outbound list for one market |
| `/jt-from-instagram <handle>` | the fast path: one handle to a private preview link |
| `/jt-prospect <handle>` | outbound — read a profile into a sourced portrait |
| `/jt-spec` | outbound — the speculative site, as a private preview |
| `/jt-pitch` | outbound — record the pitch video of the preview |
| `/jt-clips` | cut the business's own video into short loops for the page |
| `/jt-brief [url or @handle]` | the brief |
| `/jt-variants` | N clickable design directions |
| `/jt-preview` | build on jtakeit and send the client a preview link |
| `/jt-revise` | the client's review, tracked and applied |
| `/jt-launch keep\|handover` | preflight, then the launch in the panel |

## What is in here

```
skills/       one per stage, plus pipeline (load first), sourcing, clips, seo-geo
commands/     the slash commands above
scripts/
  jt-setup    the GitHub account the sites go to, the App on it, the browser
  jt-doctor   what this machine is missing, and which skills are running
  jt-init     @jtakeit/astro create, then the pipeline state
  jt-state    read and advance the stage; rewrites STATUS.md
  jt-source   one Instagram sweep → a filtered, marked list
  jt-booking  the bio link → how they book today, and what they published there
  jt-photos   a scraped feed → measured photographs and a contact sheet
  jt-check    what no platform can check: unconfirmed facts, lifted copy,
              the one query, and whether the page composes
  jt-pitch    record the pitch video, phone and desktop
  jt-clips    cut a video into short silent loops
  jt-clean    take the working files out of the tree before a handover
templates/    the variant switcher used while directions are compared
assets/pitch/ where your own voice-over and music go
```

How the sites themselves are built is `@jtakeit/astro`'s documentation, in each
project's `node_modules/@jtakeit/astro/docs/`.

## Using a business's own material

The outbound track builds a site from photographs and words a business published
on Instagram, before they have asked for anything. That is only fair if the site
stays between you and them until they say yes, so the plugin holds to it:

- the speculative site is a **private preview** on jtakeit — not indexed, reached
  only by a link that expires, and never launched;
- it states **no fact nobody confirmed**: no address, hours, prices or phone
  number read off a caption, and `jt-check` fails a page that does. What the
  business published on its own booking page — services, prices, hours — it
  may state, exactly as published there, and `jt-check` matches each one;
- the words are written, not copied — `jt-check` fails a paragraph lifted whole
  from their captions;
- the pitch says what their site **could look like**, never "here is your new
  website", and **you** send it, from your own account, to a business you chose.
  Nothing in the plugin contacts anybody;
- sourcing reads public search results for businesses; followers, commenters and
  direct messages are out of scope.

If they say no, or nothing, archive the project and the preview with it. If they
say yes, ask which photographs they want used, and for the originals.

## Licence

MIT — see [LICENSE](LICENSE). Your voice-over and music in `assets/pitch/` are
yours and are not part of it.
