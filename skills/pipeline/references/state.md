# The state file

`.jtakeit/state.json` is the project's memory. It is written only by
`scripts/jt-state.mjs` (and created by `jt-init`), and every write regenerates
`STATUS.md` beside it. It is committed; the rest of `.jtakeit/` — the scrape,
the photographs, the fingerprint — is ignored and stays on the machine it was
made on.

```json
{
  "version": 2,
  "track": "outbound",
  "client": {
    "name": "Atelier Nord",
    "slug": "atelier-nord",
    "locale": "de-CH",
    "vertical": "salon",
    "domain": null
  },
  "package": "landing",
  "stage": "pitch",
  "stageStartedAt": "2026-10-14",
  "prospect": {
    "handle": "atelier.nord.zh",
    "scrapedAt": "2026-10-13",
    "pitchVideo": null,
    "sentAt": null,
    "repliedAt": null
  },
  "variants": { "count": 1, "names": [], "chosen": null },
  "site": {
    "id": "<what create_site answered>",
    "repo": "<owner>/atelier-nord",
    "kit": null,
    "lastBuild": null
  },
  "preview": { "sentAt": null },
  "launch": { "mode": null, "launchedAt": null, "deliveredAt": null },
  "log": [
    { "stage": "spec", "at": "2026-10-13T09:41:00Z", "note": "portrait from @atelier.nord.zh" }
  ]
}
```

`design`, `skills` and `archivedFrom` are there too: the shape the project took,
which skill set last wrote the file, and where an archived project stopped.

## Fields that carry rules

- **`client.slug`** — lowercase, `[a-z0-9-]`. It is the directory, the
  repository name and the site's slug on jtakeit. Choosing it is a one-way
  decision in practice: a renamed repository has to be attached again.
- **`client.locale`** — a BCP 47 tag (`de-CH`, `fr-CH`, `en`). It is the site's
  `<html lang>` and the language every visitor-facing sentence is written in.
  Code and comments stay English regardless.
- **`client.domain`** — `null` until the business has a domain and a person has
  attached it in the panel. Every site also has jtakeit's own address, which
  keeps working.
- **`site.id`** — what `create_site` answered; set it the moment it exists
  (`jt-state set site.id <id>`), because every later tool takes it.
- **`site.repo`** — `<owner>/<name>` on GitHub, the one `attach_repo` was given.
- **The preview link is not stored.** It is a ticket with a short life: mint a
  fresh one with `get_preview_link` when a person needs it. `preview.sentAt`
  records when one went to the client.
- **`variants.count`** — decided in the brief, not at the variants stage.
  Asked, not assumed. An outbound project starts at 1: there is no client yet
  to choose between directions.
- **`variants.chosen`** — set the moment the client picks. Everything from then
  on happens inside that variant.
- **`launch.mode`** — `keep` or `handover`. Two endings with two checklists;
  see `jtakeit-sites:launch`.

## The log

Append-only. One line per stage transition, plus any entry worth explaining to
whoever opens the project in three months. It is not a changelog — git is the
changelog. It is the record of what the client agreed to and when, which is the
thing git does not hold.

## Commands

```bash
node "$JT/scripts/jt-state.mjs" show                   # stage, site, next skill
node "$JT/scripts/jt-state.mjs" init --slug … --name … # create the file in an existing site
node "$JT/scripts/jt-state.mjs" set site.id <id>
node "$JT/scripts/jt-state.mjs" set variants.chosen linen
node "$JT/scripts/jt-state.mjs" advance preview --note "link sent to the owner"
node "$JT/scripts/jt-state.mjs" archive --reason "no reply, 2 messages, 11 days"
node "$JT/scripts/jt-state.mjs" revive
node "$JT/scripts/jt-state.mjs" status                 # regenerate STATUS.md only
```

`advance` moves exactly one stage forward. It will not skip and it will not
reverse. A stage that has to be redone is not a state change — it is work, done
again, in the stage the project is already in.
