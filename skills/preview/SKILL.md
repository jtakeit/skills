---
name: preview
description: Stage 2 of the jtakeit pipeline — put the site on the platform as a private preview and send the client one link. Load when the variants are ready to be shown, when the user says build the preview, push it, or send it to the client, or when a preview needs rebuilding after edits. Covers the repository, the GitHub App, attach_repo, commit_and_build, reading the build, and get_preview_link.
---

# Stage 2 · The preview

The client sees a real site on their own phone — which is the entire reason this
stage exists instead of a screenshot in a message. On jtakeit that is a preview
link: the site as the platform built it, with the form and the diary working,
behind a link that only the people it was sent to can open.

**A preview is private.** Nothing is public until a person launches the site in
the panel. The platform keeps every preview out of search engines with its own
header — there is nothing in the repository to switch, and nothing to switch
back at the launch. The link is a credential with a short life: send it, do not
store it, and mint a fresh one for each round.

The platform's own card for this is `jtakeit:///guides/start.md`, steps 6 to 9.

## Once per site: the repository

The site already exists on the platform — `create_site` was the first call at the
brief, and its id is `site.id` in the state file.

```bash
gh repo create <owner>/<slug> --private --source . --push
node "$JT/scripts/jt-state.mjs" set site.repo <owner>/<slug>
```

Private: the repository holds the brief and the business's facts before anybody
has agreed to publish them.

**The GitHub App.** The platform reads the repository through
<https://github.com/apps/jtakeit-connect>, and **a person installs it** — it
reads `Contents` and nothing else. You cannot do this step; it was asked for in
the brief. If it has not been done, `attach_repo` refuses with that link, and
the answer is to ask again, not to work around it. A developer who builds many
sites — the outbound track makes one per prospect — should install it once on
the whole account or organisation with *All repositories*, and never think about
it again.

Then:

```
attach_repo   site_id, repo: "<owner>/<slug>"
```

It saves the repository and imports the default branch in the same call. The
attachment stands even when the import fails — a catalogue with findings, a
settings file in the wrong shape — and `import_error` says why: fix it in a
commit, push, then `import_branch`. Run `validate_catalogue` by site and ref
before attaching and there is nothing to find out here.

## Every round: build, read, look

```
commit_and_build   site_id                    → the first build; nothing goes public
get_build          site_id                    → until it settles
get_build_log      site_id, build_id          → only if it failed; the JTK_E_ code is the page to read
get_built_page     site_id, path: "/"         → the HTML the runner wrote, annotations and all
get_built_page     site_id, shot: "phone"     → the page as a visitor's phone draws it
```

After the first round the order is: push the commit, `import_branch` (so the
panel and the repository say the same thing), then `commit_and_build`. A commit
moves the branch: `git pull` before the next one.

**Look at the phone shot before anybody else does.** It is the page whole, in
frames, at 390px: the fold, an empty block, a cut line, a form under the fold, a
photograph cropped through a face. With several variants, a shot of `/preview/` is
pointless — shoot each `/v/<name>/` and the home page. What the shot shows is
what the client will see; a fix now costs one build, a fix after they have seen
it costs a round.

A build that fails has a log with a `JTK_E_` code in it — the platform's error
reference names the fix for each. A build that succeeds and still looks wrong
is read with `get_built_page` without a shot: the HTML says which block is
empty and why.

## Live local work

While the client is waiting for a round, the work is faster on localhost than
through builds: the dev server, and `open_dev_session` on the site with its
address. The panel then frames the local pages with the owner's real text in
them; `send_dev_catalogue` when `jtk/catalogue.json` changes; `get_dev_files`
to take anything typed in the session back into the repository, as a commit
you read before making. Nothing in a session is visible to the client, and a
session cannot publish. See `jtakeit:///guides/working-locally.md`.

## The link

```
get_preview_link   site_id, label: "Atelier Nord — owner", days: 7
```

`label` is whom it is for, as the studio reads it in the panel's list of links,
which is where a link is reset. One link per person, so one can be taken back
without the other.

With several variants, the link opens the site; the shell is at `preview/` under
it — say so in the message.

## Enquiries and bookings during the preview

The form posts to the platform's `/api/lead` from the first build, and an
enquiry sent from the preview is kept in the panel whatever happens. Whether
somebody is *told* is the panel's **The site → Notifications** — a Telegram chat
or an email address that a person links; an agent cannot. Say so to the
developer if it is not done: a real enquiry arriving from a preview is not
hypothetical.

`preflight` proves the form delivers (a probe the edge accepts and drops), and
with `try_booking` books a free slot through the site's own booking form and
cancels it again — under your session, so the business never sees it as a
customer's. Run it before the link goes out; a form nobody has tested is a form
that does not work.

## What goes to the client

One message. The link, what to look at, and how to send comments back:

- the preview link, and the fact that it is a working site, not a picture;
- that they should open it on their phone too;
- what is deliberately unfinished (missing photos, placeholder prices), named
  explicitly, so they spend their attention on the design;
- how to comment: a numbered list, one line per item, section by section. Ask
  for it in whatever channel they already use. Free-form voice notes are fine —
  we turn them into the list ourselves in stage 3.

Do not ask the client to "choose a variant" in the same breath as "send
comments". They will do neither. Ask which direction feels like them; the edits
follow.

## Exit checklist

- [ ] the repository on GitHub, private; `site.repo` in the state file
- [ ] the GitHub App installed by a person; `attach_repo` imported the branch
- [ ] the build green; `get_built_page` read; the phone shot looked at, every
      variant
- [ ] `preflight` run — the form delivers, and with `try_booking` the diary
      takes a booking, where the site has one
- [ ] opened on a real phone through the link, not only in a narrow window
- [ ] the link is with the client; `preview.sentAt` written

Then:

```bash
node "$JT/scripts/jt-state.mjs" set preview.sentAt $(date +%F)
node "$JT/scripts/jt-state.mjs" advance revisions --note "preview sent"
```
