# The search Actor

`apify/instagram-search-scraper` — the third Actor this plugin calls, and the
only one that answers "who is out there" rather than "who is this".

| | |
| --- | --- |
| Cost | **$1.50 / 1000 results**, pay-per-event |
| Limit | 250 results **per term**, terms comma-separated in one string |
| Speed | 346 results in 2m26s |
| Health | ~2 500 users/month, 88% of runs succeed |

It is named in the plugin's `.mcp.json`, beside the prospect Actors, and runs
on your own Apify account through `APIFY_TOKEN` — see
[apify.md](../../prospect/references/apify.md) for the setup:

```
https://mcp.apify.com/?tools=actors,docs,khadinakbar/instagram-profile-scraper,apify/instagram-post-scraper,apify/instagram-search-scraper,goat255/instagram-stories-highlights-scraper
```

## Why this one

Instagram's own people-search matches usernames and display names and returns
almost nothing per hit. This Actor does not use it. Its records come back
tagged `searchSource`, and in the real sweep they were:

```
threads        251
google          58
facebook-ads    28
```

Facebook's ad index and Threads both hold **whole profiles**, so one call
returns everything the filtering and the marking need — no enrichment pass, no
second Actor, at a seventh of a cent per account:

```
username  url  fullName  biography  followersCount  followsCount  postsCount
isBusinessAccount  businessCategoryName  externalUrl  private  verified
businessAddress{city_name,street_address,…}  facebookPage{…}
latestPosts[{caption,type,displayUrl,timestamp,locationName,likesCount,…}]
```

The fields that carry the work:

- **`biography`** — the only field that says whether this is one person or a
  team, and it says it in the grammar rather than in a flag.
- **`fullName`** — usually "Name | trade | district | city", which is a
  business card. `scripts/lib/names.mjs` reads the name half.
- **`latestPosts[].timestamp`** — how the dormant third gets dropped.
- **`latestPosts[].locationName`** — the geographic signal for accounts whose
  bio never names the city.
- **`businessCategoryName`** — `Hair Salon`, `Health/beauty`, `None`.
  Useful, unreliable, never decisive.
- **`externalUrl`** — a messenger link or a booking widget means no website; a real
  domain means they already bought one from somebody. Both are worth knowing
  before writing.

## The input

```json
{
  "search": "coiffeur zürich, friseur zürich, hairdresser zurich",
  "searchType": "user",
  "searchLimit": 100
}
```

- **`search`** — one string, terms separated by commas. The schema's `pattern`
  rejects most punctuation (`. ! ? : ; - + = * & % $ # @ / ~ ^ | < > ( ) [ ] { }`),
  so a term cannot contain any of it. Umlauts, accents and Cyrillic pass fine.
- **`searchType`** — `user` for this job. Also accepts `place`, `hashtag`,
  `popular`.
- **`searchLimit`** — per term, up to 250.

Cap the spend at call time: `callOptions: { maxTotalChargeUsd: 4 }`. Twelve
terms × 100 is a dollar-ish; twelve × 250 is not.

## What was tried and rejected

**`searchType: "place"`** — ten results for a massage-and-city term, of which
one was a massage studio. The rest: a wedding-dress salon, a coffee shop, a hair stylist,
a park. Those records come from `searchSource: "google"`, which matches the
Instagram *location page* title, and location pages are named after buildings
rather than trades. Skip it for services.

**`data-slayer/instagram-search-users`** ($2.50/1k basic, $12/1k enriched) and
**`patient_discovery/instagram-search-users`** ($2.50/1k) — both sell as
enrichment what the official Actor includes, at two to eight times the price,
with a fiftieth of the usage.

## Known rough edges

- **Emoji die in transit to Google Sheets.** Four-byte characters arrive as
  `ð`. `jt-source` strips them from `sheet.csv` and keeps them in `leads.csv`.
- **`error: "Restricted profile"`** appears on live accounts whose fields are
  withheld — a handful per sweep. Treated as broken, not as a stop worth
  investigating.
- **Item counts lag the run.** The tool result reports fewer items than the
  dataset finally holds; read the dataset, not the summary.
- **No email or phone field**, unlike the place records. Phone numbers are
  usually written into the bio by hand, so `jt-source` pulls them out with a
  regular expression instead.

## Cost, in context

| | |
| --- | --- |
| One sweep, 12 terms × 100 | **~$0.52** |
| Profile scrape, per prospect (`jtakeit-sites:prospect`) | $0.0045 |
| Post scrape, per prospect | ~$0.19 |

All of it is billed to your Apify account, at Apify's prices on the day —
check the Actor's page before a large run. Sourcing is the cheapest thing in
the outbound track by an order of magnitude.
Sweep wider than feels necessary; the expensive step is the afternoon spent
building a spec site for a business that stopped trading in spring.
