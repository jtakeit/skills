---
name: sourcing
description: Build the outbound list — sweep Instagram for one trade in one city through the Apify search Actor, filter it down to living businesses, mark the ones run by a single person, and ship a Google Sheet that feeds /jt-prospect for weeks. Load when the user names a market rather than a handle ("Friseur Zürich", "hair salons in Zürich", "nail studios in Basel"), says build the list, find prospects, who can we write to, or asks to refresh an existing sweep. Not a pipeline stage — it runs once per market, for dozens of prospects.
---

# Sourcing · The list

`jtakeit-sites:prospect` starts with a handle. This is where the handles come from.

One sweep covers one trade in one city and yields a few hundred accounts, of
which a hundred-odd are worth writing to. That is a month of outbound from
twenty minutes and about half a dollar — so it is not a stage in a client's
pipeline, and it never writes to `.jtakeit/state.json`. It runs beside the
pipeline and fills the queue the pipeline eats from.

The measured run this was built from — a massage sweep in a large city: twelve
search terms, **346 unique accounts, $0.52, two and a half minutes**, and 154
solo practitioners at the end of it.

## What you need

**Your own Apify account.** Every Actor here runs on it and is billed to it;
the plugin carries no account and no credit. Create a token at
[console.apify.com/settings/integrations](https://console.apify.com/settings/integrations)
and put it in the environment as `APIFY_TOKEN` (`~/.zshenv` or your shell's
equivalent, so non-interactive shells get it too). The plugin's `.mcp.json`
sends it to Apify's MCP server as a bearer token, and `jt-source --dataset`
reads the same variable. Never the token itself in a file that gets committed.

## What it produces

A directory per sweep, named for the market and the month, holding the
reproducible record of it:

```
hair-zurich-2026-10/
  sweep.json   the terms and the vocabularies — the whole configuration
  raw.json     the scrape, untouched
  leads.csv    every survivor, every field, emoji intact
  sheet.csv    the columns that go to the Sheet
```

A sweep is per market, not per site, so it lives in a directory of its own
rather than in a project's `.jtakeit/`.

And one Google Sheet, which is the working artifact: sorted by type, opening
with an empty **status** column, one row per business. It outlives the sweep —
the developer writes in it for weeks, and the next sweep of the same market is
diffed against it rather than replacing it.

## Step 1 — the terms, which are the whole game

Search types do not widen a sweep. **Terms do.** Twelve terms found 346
accounts where one term finds twenty, and the Actor deduplicates across them
for free, so there is no cost to overlap and a real cost to being narrow.

A term set is built along three axes at once — read
[references/sweep.md](references/sweep.md) for the template and a full example:

- **Language.** A city where businesses write in more than one language is
  several markets: in Zürich, `coiffeur zürich`, `friseur zürich`,
  `hairdresser zurich`, and the city spelled with and without its umlaut.
  Missing one of those is missing part of the market.
- **The trade's own vocabulary.** Not the category — the services people
  advertise. `balayage`, `herrenschnitt`, `haarverlängerung`, `colorist`.
- **The neighbouring trade.** `barber`, `hair stylist`, `brautfrisur` — same
  buyer, same problem, and often single practitioners.

Put the terms in `sweep.json` before running anything. The sweep that is not
written down cannot be repeated next quarter, and repeating it is the point.

## Step 2 — the sweep

One Actor, `apify/instagram-search-scraper`, `searchType: "user"`. It reaches
Instagram through Facebook's ad index and Threads rather than the app's
typeahead, so it returns **whole profiles** — bio, followers, category,
external link, latest posts — not the four fields the search box gives.
[references/search-actor.md](references/search-actor.md) has the input, the
output and what it costs.

```json
{
  "search": "coiffeur zürich, friseur zürich, hairdresser zurich, ...",
  "searchType": "user",
  "searchLimit": 100
}
```

Terms are comma-separated in one string; `searchLimit` is **per term**. Cap the
run with `maxTotalChargeUsd` — it is pay-per-event and a fat term list is easy
to underestimate.

**Do not run `searchType: "place"` for a service trade.** It was tried: ten
results, one of them relevant, the rest dress shops and a park. Google's index
of Instagram locations matches the word "salon", not the work.

## Step 3 — the machine pass

```bash
node "$JT/scripts/jt-source.mjs" --sweep sweep.json --dataset <datasetId>
```

It dedupes, drops the broken and the private, keeps only accounts that match
both a service word and a place word, drops everything dormant, proposes a
label from the evidence, and writes the three files. It prints the funnel:

```
scraped     347
  duplicate   0
  broken     14      deleted, restricted, headless
  private    11
  off topic  10
  dormant    99      no post since 2026-02-01
kept        213
```

**A third of a live-looking sweep is dormant accounts**, and that — not
irrelevance — is the real noise in this channel. The Actor's relevance is
excellent: in the measured run 312 of 322 reachable accounts were genuinely the
trade in the city. What kills a lead is that nobody has posted since spring.

The exit code is the number of rows it refused to label. That is the size of
the reading job, not a failure.

## Step 4 — the reading pass, which is not optional

The script proposes `solo` or `studio` where the evidence is one-sided, and
`unclear` where it is mixed or absent. Measured against a hand-labelled sweep it
was right on **90 of the 100** it was confident about — and it left 113 of 213
unlabelled, because most bios say nothing either way.

So read them. Sorted output puts `unclear` first; the whole job is twenty
minutes and it is the part that makes the list worth having.

**What one person sounds like** — first person, singular, and a name (invented
examples, in the shape real bios take):

> «Ich bin Lea — ich schneide seit zwölf Jahren, jetzt im eigenen kleinen Atelier»
> «Hi, I'm Marco. One chair, one client at a time»
> «Coiffeuse indépendante · sur rendez-vous»

**What a house sounds like** — plural, staff, a second discipline, a branch:

> «Unser Team aus acht Stylistinnen», cosmetics on a separate account
> «Diplomierte Fachkräfte», «our stylists trained at …»
> three addresses in the bio, «Filiale» in the name

Four labels come out of the reading, and only the first is a prospect:

| | |
| --- | --- |
| `solo` | one person doing the work. **The list exists for these.** |
| `studio` | a team, a salon, a clinic, a chain. Different buyer, different sale — keep the row, do not pitch it from here. |
| `school` | courses are the product. Often *is* one person, and still wants a different page than a practitioner does. The script flags candidates in the **teaches** column — in the measured sweep 24 rows carried it and 7 of them were schools. |
| `off-profile` | wrong city (there is more than one Zurich), wrong trade, empty account, anything you would not put your name to. Say which, in the note. |

Write what reading found into the **note** column, because it is what the sheet
is for: *rents a chair in someone else's salon*, *booking closed*, *splits the
year between two cities*, *co-owns another account*. A lead that looks perfect
and turns out to be an employee wastes an afternoon at the spec stage.

## Step 5 — the sheet

Upload `sheet.csv` to Drive as a Google Sheet — the CSV converts on upload, and
the script has already stripped the emoji, because Drive's importer mangles
four-byte characters into `ð`. Name it for the market and the date. Then hand
over the link and stop: **nothing in this skill sends anything to anyone.**

The sheet is a queue, not a report. The developer works down it, and each row
that gets picked up starts the real work:

```
/jt-prospect <handle>
```

## What this never does

- **No followers, no commenters, no DMs.** We are looking for businesses in
  public search results. Harvesting somebody's audience is a different activity
  with a different name, and this Actor does not do it either.
- **No login, no session, no working around a block.** Same rule as
  `jtakeit-sites:prospect` — the reading account would have to be a person's.
- **No bulk anything downstream.** The list is long so that a human can choose
  from it, one at a time. Mass-identical outreach is what gets an account
  restricted, and the pitch is a short video a person sends by hand.
- **No storing what we did not use.** A sweep directory is working material.
  When a market is exhausted, keep the sheet and delete the dumps.

## Exit checklist

- [ ] `APIFY_TOKEN` set from the developer's own Apify account
- [ ] `sweep.json` holds the terms, in every language the market writes in
- [ ] the Actor run is capped, and its cost is known
- [ ] `jt-source` ran clean and the funnel numbers look sane for the market
- [ ] the dormancy cutoff matches the trade — six months for a service, less for retail
- [ ] every `unclear` row read, every **teaches** row read
- [ ] `studio`, `school` and `off-profile` rows marked with *why*, not just excluded
- [ ] notes written where reading found something the columns cannot hold
- [ ] the sheet is in Drive, sorted, with an empty **status** column and a date in its name
- [ ] nobody has been contacted by this skill
