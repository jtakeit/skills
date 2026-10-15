---
name: pipeline
description: The delivery pipeline for a client site on jtakeit — which stage a project is in, what its package includes, and which skill runs next. Load this first on any client project, whenever the user asks "what's the status", "what's next", starts a new client, hands over an Instagram handle, or names a stage (prospect, spec, pitch, brief, variants, preview, revisions, launch). It owns .jtakeit/state.json and STATUS.md, and says where the platform takes over.
---

# The pipeline

Every project moves through the same stages, in order, and the stage it is in is
written down in the repository rather than remembered. That is the whole point
of this skill: a project someone picks up cold — another developer, another
machine, a new session — must be able to answer "where is this?" from the files
alone.

`$JT` in every command below is this plugin's root — `${CLAUDE_PLUGIN_ROOT}`
when it runs as a plugin, or a clone of the repository otherwise. The scripts
are `$JT/scripts/jt-*.mjs` and run on a bare `node`.

There are two ways in and one way through.

```
inbound    the business asked
                    brief → variants → preview → revisions → launch → delivered
                      0        1          2          3          4         5

outbound   the developer found them
 prospect → spec → pitch → brief → variants → preview → revisions → launch → delivered
    0        1       2       3         4          5          6         7         8

sourcing   beside the pipeline: one trade in one city → a list of handles
```

**Inbound** is a business that came to the developer. **Outbound** starts three
stages earlier: one Instagram handle, a portrait scraped from it, a speculative
site built on the business's own material and put on jtakeit as a private
preview, and a short video of it sent by a person. If they say yes, the tracks
merge at `brief` — the same brief, now with a real conversation behind it and a
site that already partly exists.

`track` is set when the project starts and never changes. Stage numbers are per
track, so "stage 3" means Brief on an outbound project and Revisions on an
inbound one — `STATUS.md` names the track at the top for exactly that reason.

A stage is not finished because the work looks done. It is finished when its
skill's exit checklist passes, the state file has been advanced and the result
is pushed. Nothing else counts as progress.

## The fast path

`/jt-from-instagram <handle>` runs prospect → spec → a preview link in one go
and prints the link. It is what answers "do mine" under a post, or a developer
who wants to see what one business would look like before deciding anything.
It looks before it builds — a private, empty or non-business account is
declined politely and costs one profile scrape — and it stops at the link: no
video, nothing sent. The project it leaves is an ordinary outbound project at
`pitch`, and the rest of the ladder carries on from there.

## Read the state first

Before doing anything else on a client project:

```bash
node "$JT/scripts/jt-state.mjs" show
```

The script prints the current stage, the site on jtakeit if there is one, and
the skill that owns the stage. If there is no `.jtakeit/state.json`, this is not
a pipeline project yet: start one with `jt-init` (below), or adopt an existing
site with `jt-state init`.

Never edit `.jtakeit/state.json` by hand. Every write goes through the script,
because the script also regenerates `STATUS.md`, the human-readable copy that
shows up on the repository's front page. The file's shape and the rules its
fields carry are in [references/state.md](references/state.md).

## Where the platform takes over

jtakeit is the backend: the site is written into a git repository, and the
platform runs the owner's panel (the owner edits by tapping text on their own
page), enquiries, bookings with payments to the business's own Stripe,
hosting, the domain, previews and the SEO refusals. The agent drives it through
the `jtakeit` MCP server this plugin configures; the order of its tools and what
each stage uses is in [references/platform.md](references/platform.md).

Three things only a person does, and no stage pretends otherwise: installing
the jtakeit GitHub App on the repository, launching a site in the panel, and
anything to do with people and money there — who the site belongs to, the plan,
where enquiries go, the domain, the handover. `preflight` says whose each
remaining step is.

## Which skills are actually running, and on what

Two people running "the same" pipeline are not necessarily running the same
skills, and the difference is invisible from inside a client project. **A
plugin installed from a marketplace is a copy pinned to a commit** and stays
pinned until it is updated in `/plugin`; pulling the repository changes nothing.
A directory install follows the working copy.

So the state file records the skill set that last wrote it, `jt-state show`
says so when it differs from what is running, and everything else about the
machine is one command:

```bash
node "$JT/scripts/jt-doctor.mjs"
```

It reports how the plugin is installed and at what commit, and checks node,
git, `gh` and its login, ffmpeg, the playwright **package and its browser** —
two separate installs, only the first automatic — whether the `jtakeit` and
`apify` MCP servers are configured, the `frontend-design` plugin whose absence
the variants stage does not otherwise notice, and the pitch audio, which is
the developer's own and missing from every fresh install. What the current
stage needs fails; what a later stage needs is printed and does not.

**Run it on a machine that has not run this pipeline before, and whenever two
people compare results.**

There is a second, quieter cause of the same symptom: a project scaffolded
*inside* another project. `.jtakeit/` belongs to one business, the scripts find
the nearest one by walking up, and the walk stops at a repository boundary —
`jt-init` refuses to scaffold inside another project for the same reason.

## The stages and who owns them

| Stage | Skill | Ends when |
| --- | --- | --- |
| prospect *(outbound)* | `jtakeit-sites:prospect` | `PORTRAIT.md` is written from the scrape, every claim carrying its source |
| spec *(outbound)* | `jtakeit-sites:spec` | one site that is recognisably theirs, states no unconfirmed fact, passes `jt-check`, and is built on jtakeit as a private preview |
| pitch *(outbound)* | `jtakeit-sites:pitch` | the video of the preview is recorded, watched, and with the person who will send it |
| brief | `jtakeit-sites:brief` | `BRIEF.md` is approved by the developer and the facts are in `src/data/site.ts` |
| variants | `jtakeit-sites:variants` | N clickable variants build clean, pass `jt-check`, and read correctly on all three viewports |
| preview | `jtakeit-sites:preview` | the build has settled on jtakeit and a preview link has been sent to the client |
| revisions | `jtakeit-sites:revisions` | every item of the client's review is either done or explicitly declined in writing |
| launch | `jtakeit-sites:launch` | `preflight` passes for everything that is the agent's, and a person has launched in the panel — or handed the site over |

The launch has a gate the other stages do not: `preflight`. A site goes public
only after the platform has said what is still missing and whose it is, and
only by a person's hand in the panel. Before that, every address the site has
is a private preview that nothing indexes.

An outbound project that goes nowhere is **archived**, not left at `pitch`
forever: `jt-state archive --reason "no reply, 2 messages, 11 days"`. It is
reversible — `jt-state revive` puts it back exactly where it stopped, which is
what happens when a business answers three months later and the site is still
there. The site on jtakeit stays a draft until somebody archives it in the
panel.

Stages do not overlap and they do not run backwards. A client who asks for a
fourth variant during revisions has not sent the project back to variants —
that is a scope change, and it is priced, not silently absorbed. Say so.

## Service packages

The package decides which stages do extra work, not which stages exist. Read
[references/packages.md](references/packages.md) for the catalogue:

- **`landing`** — one Astro page on jtakeit: the business's own words and
  photographs, an enquiry form the platform answers.
- **`bookings`** — the landing, plus the platform's diary, laid out from the
  kit for the business's kind.

When you add a package, add it to `references/packages.md` and to `PACKAGES` in
`scripts/lib/state.mjs` — those two are the contract.

## Starting a project

```bash
# inbound — a business asked for a site
node "$JT/scripts/jt-init.mjs" --slug atelier-nord --name "Atelier Nord" \
     --locale de-CH --vertical salon --variants 3

# outbound — found on Instagram
node "$JT/scripts/jt-init.mjs" --slug atelier-nord --name "Atelier Nord" \
     --locale de-CH --track outbound --handle atelier.nord.zh

# a business that takes bookings starts from its kind's kit
node "$JT/scripts/jt-init.mjs" --slug atelier-nord --name "Atelier Nord" \
     --locale de-CH --kit <kind>
```

It runs `npx @jtakeit/astro create` — the platform's scaffold, which makes the
repository and its first commit and writes `BRIEF.md` — then writes the state
and `STATUS.md` and commits them. `.jtakeit/` is ignored in the new repository
except `state.json`: the scrape and the photographs are working material and
stay on the developer's machine.

Nothing reaches outside the machine. The next steps are printed, in the
platform's order: `create_site`, the dev server and `open_dev_session`, the
GitHub repository (`gh repo create <owner>/<slug> --private --source . --push`,
asked of the developer first, because it puts a business's name on their
account), and the GitHub App on it.

For the outbound track, where many speculative sites are made, tell the
developer once to install the jtakeit GitHub App
(https://github.com/apps/jtakeit-connect) on their whole account or
organisation, all repositories — so each new demo repository needs no manual
step.

Do not run `jt-init` in an existing project. To adopt one that already has a
site, run `jt-state init --slug … --name …` alone.

## The repository rule

**Every stage ends with a push.** Not a stash, not a local branch, not "I'll
push when it's finished". A client project that lives on one laptop is a client
project that can be lost — and from the spec or the preview stage on, the
platform builds from the repository, so an unpushed change is a change nobody
sees.

Work happens on `main`. Before every change on a site that exists on jtakeit,
`git pull` first: every version the owner saves in the panel is a commit on the
branch, and `get_site` says what the panel holds unsaved.

Commits are ordinary one-liners describing the change — `hero: tighten the type
scale on mobile`, not `stage 1 progress`. Stage the paths you changed.

At each stage boundary:

```bash
node "$JT/scripts/jt-state.mjs" advance <stage> --note "three variants shown"
git add .jtakeit/state.json STATUS.md <what changed> && git commit -m "…" && git push
```

`advance` refuses to skip a stage and refuses to move backwards. If it says no,
the answer is not to force it; it is that one of the stages did not actually
finish.

## Which skill to load

Load the stage's skill, not this one, once you know the stage. This skill hands
off; it does not do the work.

- A market rather than a handle — "hair salons in Zürich", "build the list"
  → `jtakeit-sites:sourcing`
- An Instagram handle, "let's do outreach", "scrape this profile" →
  `jtakeit-sites:prospect` (or `/jt-from-instagram` for the whole fast path)
- "build the mock", "make the spec site" → `jtakeit-sites:spec`
- "record the video", "make the pitch" → `jtakeit-sites:pitch`
- "new client", "start a project", "let's do the brief" → `jtakeit-sites:brief`
- "make the variants", "three designs", "show me the options" →
  `jtakeit-sites:variants`
- "send it to the client", "get a preview link" → `jtakeit-sites:preview`
- "the client sent comments", "fix the review" → `jtakeit-sites:revisions`
- "launch it", "put it on their domain", "hand it over" →
  `jtakeit-sites:launch`

Two skills are not stages. `jtakeit-sites:seo-geo` (the words, the facts, local
SEO — what the platform does not do) loads whenever the work touches them, and
`jtakeit-sites:clips` when the business's own video is cut into loops.
`jtakeit-sites:sourcing` sits before the whole outbound track: it sweeps one
trade in one city once per market rather than once per client, and never
touches `.jtakeit/state.json`. How the site itself is built — blocks, pages,
photographs, the forms, motion — is `@jtakeit/astro`'s documentation, in
`node_modules/@jtakeit/astro/docs/` once the project is installed, `kit.md`
first. Design direction comes from the `frontend-design` plugin, which
`variants` invokes per variant.

## What this pipeline will not do

- **It will not make a spec site public.** A page assembled from scraped claims
  and someone else's photographs, for a business that has not said yes, lives
  on jtakeit as a private preview — not indexed, reachable only by a ticketed
  link that expires — and nobody launches it. See `jtakeit-sites:spec`.
- **It will not send anything to a prospect.** Claude records the video; a
  person sends it, from their own account, to a business they chose. The pitch
  says what the site *could look like*, never "here is your new website". See
  `jtakeit-sites:pitch`.
- **It will not harvest an audience.** Sourcing reads public search results for
  businesses. Followers, commenters and direct messages are all out of scope,
  at every stage. See `jtakeit-sites:sourcing`.
- **It will not launch, invite or bill on anybody's behalf.** The launch, the
  domain, who the site belongs to, the plan, payments and the handover are a
  person's, in the panel. The agent prepares, runs `preflight`, and says which
  step is whose.
- **It will not leave its working material in a handed-over repository.** A
  handover mirrors the repository to the client; `jt-clean` takes `.jtakeit/`,
  `STATUS.md`, `PORTRAIT.md`, `REVIEW.md`, agent instructions, the `/v/` pages
  and the preview shell out of the tree first, and its scan is not advisory.


## A stage that builds is left only checked

`jt-state advance` out of `spec`, `variants` or `revisions` refuses unless
`jt-check` passed on the files as they are now — it records its result, with a
fingerprint of `src/`, `jtk/` and `public/`, in the state. Change a file after
it passed and it has to pass again. The check covers every page the build
wrote, not only the home page: the first screen in real browser windows
(1440×780, 1280×680, 393×720), the header the same on every page, every menu
item to a place of its own, text off the edges and off the frames it sits in,
no empty boxes, no two neighbouring sections built alike. A person can
override with `--unchecked "<why>"`; the reason is logged. An agent does not.
