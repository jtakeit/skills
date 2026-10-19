---
name: revisions
description: Stage 3 of the jtakeit pipeline — turn the client's review into a tracked list, apply what the client cannot change themselves in the panel, rebuild the preview and get sign-off. Load when the client has sent comments, feedback, corrections or a chosen variant, or when the user says fix the review, apply the client's notes, or they picked one.
---

# Stage 3 · Revisions

The client has seen it. Now the loose material they sent back — a voice note, a
list, a forwarded message from their partner — becomes a list that can be
finished, and the page becomes the one they will actually launch.

## Before any edit: pull, and read the panel

The client may already have been in the panel. Every version they save there is
a commit on the site's branch, so a checkout from this morning is behind them by
lunch; what they typed and have not saved is in no commit at all.

```bash
git pull
```

```
get_site      site_id    → `panel`: the saved and published commits, and `unsaved_changes`
get_content   site_id    → the words, including what is unsaved
```

Applying a review on top of them without looking is how somebody's afternoon
gets overwritten. The platform refuses `import_branch` over an unsaved draft
(`JTK_E_DRAFT_AHEAD`) for exactly that reason; `overwrite_draft` exists, and is
used only with the owner's say-so, because what it discards is in no commit and
nothing brings it back. See `jtakeit:///guides/working-locally.md`.

Do this before every round, not only the first.

## Then: the variant is chosen

Before any edit, get the answer to "which direction". Then:

```bash
node "$JT/scripts/jt-state.mjs" set variants.chosen noir
```

And collapse the project onto it, in one commit:

- the chosen variant's sections become the home page's, with their
  `data-jtk-path` annotations — the owner's editor opens on the home page;
- the other variants' sections and stylesheets, and every `/v/` page, are
  **deleted**;
- `src/components/_preview/`, `src/pages/preview.astro` and
  `src/data/variants.ts` are deleted.

This is not tidying — it is what makes every subsequent edit cost one change
instead of three, and it stops the client reaching a design they did not buy.
The deleted variants are in git if anyone ever asks.

If the client cannot choose, the answer is not to keep all of them alive. Ask
one question: which of these would you be embarrassed to show your best
customer? What is left is the shortlist.

## What the client can do themselves, and what is ours

The client edits the words on their own page in the panel: they tap a heading
or a paragraph and type. Photographs and lists the catalogue declares as
editable are theirs to change the same way. So a review is sorted first:

- **The client's** — a sentence, a price in the text, a photo in a declared
  slot, an entry in a collection. Tell them where, once, and let them: it is
  faster for both sides, and it is how they learn the panel before the launch.
  If they would rather we did it, it is still a content change — in
  `jtk/content/`, never in a component.
- **Ours** — anything that changes what the site *is*: the layout, a new
  section, a new block type, a new page, a new field the owner should be able
  to edit, the design. The panel cannot do these by design, and no tool can
  either: they are a commit and an import.

A new block or field is also a new entry in `src/content/blocks.ts`; without it
the owner sees the section and cannot type into it.

## The review list

Write `REVIEW.md` at the project root. One numbered item per change, grouped by
section, each with a verdict:

```markdown
## Hero
1. «Der Hintergrund ist zu dunkel» — done. Hero ground is now --paper.
2. Logo bigger — done, 1.4× on desktop, unchanged on phone (it already fills
   the width there).
3. New opening line — CLIENT, changed it themselves in the panel on 2026-08-20.
4. Add a second phone number — DECLINED, one number is the whole point of the
   call strip. Client agreed on the call 2026-08-20.

## Prices
5. New price list — BLOCKED, waiting on the client's PDF.
```

Five verdicts and no others: **done**, **client** (theirs, done in the panel),
**declined** (with the reason and the agreement), **blocked** (with what is
being waited for and from whom), **open**. An item without a verdict is an item
that will be argued about at the launch.

Keep `REVIEW.md` out of git — `echo REVIEW.md >> .git/info/exclude`. A handover
mirrors the repository to the client with its history, and `jt-clean` can take a
file out of the tree but not out of the commits before it.

Vague feedback gets converted before it gets worked on. "Make it more premium"
is not an instruction; it is a symptom. Go back with two concrete readings —
"more white space and a smaller type scale" or "darker ground and metallic
accents" — and let them point. Guessing costs a full round trip.

## Applying edits

Words go in the content and the copy module. Facts go in `src/data/site.ts`.
Nothing user-facing gets typed into a component — that rule is why this stage
is cheap, and after the launch it is the difference between a sentence the
owner can change and one they have to ask us for.

The scaffold's rules still apply (`node_modules/@jtakeit/astro/docs/kit.md`):
`npm run check` stays at zero, the page still works with JavaScript off, no rule
gets a bare `150ms ease` when there is a motion token, every editable field
keeps its `data-jtk-path`.

Watch for the changes that quietly move the project:

- **Scope.** A fourth variant, a second page, bookings, a shop. These are not
  revisions. Say so plainly, price them, and keep them out of this stage.
  Absorbing them is how a fixed-price package stops being one. Bookings, when
  they are taken on, take their kind's kit whole and go back through the brief.
- **Facts.** A new opening hour or a new price is also a change to structured
  data — and, on a site with a diary, to the hours the owner publishes in the
  panel. Reload `jtakeit-sites:seo-geo` when the facts move.
- **Photos.** Real photos arriving late usually change the layout they sit in.
  Budget for that rather than dropping them into a frame sized for placeholders.
- **A file browsers keep.** On a site with an address, a photograph or a clip
  under a `cache` directory of `_meta.json` is held to its contents: new
  bytes take a new name (`scene-1.v2.webp`) and the page points at it, or the
  build is refused — `JTK_E_CACHED_FILE_CHANGED`. `get_build` lists what is
  `held` and until when; lowering `maxAge` frees nothing sooner.

## The loop

Batch. Apply a group of edits, then once:

```bash
npm run check && npx @jtakeit/astro catalogue
git add <the paths you changed> && git commit -m "revisions: round 1" && git push
```

```
import_branch      site_id        → the panel and the repository say the same thing
commit_and_build   site_id        → a build; nothing goes public
get_build          site_id        → until it settles
get_built_page     site_id, shot: "phone"
get_preview_link   site_id, label: "Atelier Nord — round 1"
```

`git pull` again before the next commit: `commit_and_build` writes the draft into
the repository as a commit of its own.

A build per comment trains the client to review continuously, and the stage
never closes. Two or three rounds is normal; more than four means the brief was
wrong and the honest move is to say so.

## Sign-off

The stage ends with the client saying yes, in writing, in whatever channel they
use. Paste it into `REVIEW.md` under **Sign-off**, with the date. Then the
`NEEDS CLIENT` list from `BRIEF.md` gets its last pass — placeholder prices,
unconfirmed hours, missing photos. Anything still open at this point either gets
resolved now or is carried into the launch as a known gap. It does not get
quietly shipped as fact.

## Exit checklist

- [ ] `git pull` and `get_site` before every round; no unsaved panel work lost
- [ ] `variants.chosen` set; the losing variants, the `/v/` pages and the shell
      deleted
- [ ] every item in `REVIEW.md` has a verdict; nothing is `open`
- [ ] the client's yes is recorded with a date
- [ ] `BRIEF.md`'s `NEEDS CLIENT` list is resolved or explicitly carried as a gap
- [ ] structured data still matches the facts after the edits
- [ ] `npm run check` clean; the last commit imported and built; the preview
      matches the repository

Then:

```bash
node "$JT/scripts/jt-state.mjs" advance launch --note "signed off"
git push   # the last round's commits, if any are still local
```
