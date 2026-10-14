# sweep.json — the terms and the vocabularies

One file configures a sweep, and it is also the record of it. Written before
the run, kept after it, diffed when the market is swept again.

```json
{
  "slug": "hair-zurich",
  "market": "hairdressers, Zürich",
  "since": "2026-04-01",

  "terms": ["coiffeur zürich", "friseur zürich", "hairdresser zurich", "..."],

  "service": ["coiff", "friseur", "frisur", "hair", "..."],
  "geo":     ["zürich", "zurich", "zuerich", "oerlikon", "..."],
  "solo":    ["ich bin", "mein atelier", "i'm", "..."],
  "team":    ["unser team", "wir sind", "filiale", "..."],
  "teach":   ["kurs", "workshop", "academy", "..."]
}
```

`terms` is what the Actor searches. The five vocabularies below it are what
`jt-source` filters and proposes with; they are **stems, matched anywhere in the
text**, so `coiff` catches `coiffeur`, `coiffeuse` and `coiffure` at once.

`since` is the dormancy cutoff. Six months suits a service trade. Retail and
food post daily — three is closer. There is no right answer, only a decision
that belongs in the file rather than in someone's head.

## Building `terms`

Three axes, multiplied, then trimmed to what a person would actually type:

**Language.** Every language the city's businesses write in is a separate
market in the same streets — in Zürich, German, English and some French. The
city itself needs all its spellings: Zürich, Zurich, Zuerich.

**The trade's vocabulary.** Not the category: the service line from a bio.
People do not advertise "hair services", they advertise `balayage`,
`herrenschnitt`, `haarverlängerung`, `colorist`, `brautfrisur`.

**The neighbouring trade.** Whoever solves the same problem for the same
person. For hair: `barber`, `hair stylist`, `make-up artist` for the wedding
work. This is where the single practitioners are often densest.

Twelve terms is a good sweep. Overlap costs nothing — the Actor deduplicates
across terms, and the measured run returned 346 accounts with not one repeat.

## Building `solo` and `team`

These decide the proposal, and they are the two halves of one observation:
**a single practitioner writes in the first person, a house writes in the
first person plural, or the third.**

`solo` — verbs and phrases only one person says:

```
ich bin · mein name ist · mein atelier · bei mir · ich schneide · ich färbe
i'm · my chair · my studio · one client at a time · je suis · indépendante
```

`team` — plurals, staff, premises, branches:

```
unser team · wir sind · wir freuen uns · unsere stylisten · filiale
standorte · our team · our stylists · notre équipe
```

Latin house words — `studio`, `salon`, `clinic`, `centre`, `center`,
`academy`, `institut` — are built into the script and need not be repeated.

**Check every word against the city's own geography and the trade's own
words before adding it.** In the measured sweep, the local word for "centre"
was a district: it appeared in a dozen solo bios as an address and turned five
one-person practices into "studios" until it was removed. Whatever the city
calls its middle, its old town or its station is not a business type there.
The same trap the other way: a word that is a *service* in the trade — `spa`
in massage, `salon` in a bio that says «salon-quality colour at home» — is not
a house, and matching it mislabels soloists.

## Building `teach`

Course words do not produce a label, only the **teaches** flag, because they
are genuinely ambiguous: half the good practitioners in any trade also teach.
In the measured sweep the flag fired on 24 rows and seven of them were schools.
It sorts a small reading job, and that is all it is meant to do.

## A full example

Hairdressers in Zürich — a template to adapt, not a measured run. Check every
stem against the city before running it.

```json
{
  "slug": "hair-zurich",
  "market": "hairdressers, Zürich",
  "since": "2026-04-01",
  "terms": [
    "coiffeur zürich", "friseur zürich", "hairdresser zurich",
    "coiffeuse zürich", "friseurin zürich",
    "balayage zürich", "herrenschnitt zürich", "colorist zurich",
    "haarverlängerung zürich", "brautfrisur zürich",
    "barber zürich", "hair stylist zurich"
  ],
  "service": [
    "coiff", "friseur", "frisur", "hair", "haar", "balayage", "color",
    "farbe", "färb", "schnitt", "cut", "barber", "styl", "brautfris"
  ],
  "geo": [
    "zürich", "zurich", "zuerich", "oerlikon", "wiedikon", "altstetten",
    "seefeld", "wipkingen", "hottingen", "enge", "kreis "
  ],
  "solo": [
    "ich bin", "mein name", "mein atelier", "mein salon", "bei mir",
    "ich schneide", "ich färbe", "selbstständig", "i'm ", "i am ",
    "my chair", "my studio", "one client at a time", "je suis", "indépendant"
  ],
  "team": [
    "unser team", "wir sind", "wir freuen", "unsere", "stylistinnen",
    "filiale", "standorte", "our team", "our stylists", "notre équipe"
  ],
  "teach": [
    "kurs", "workshop", "schulung", "seminar", "ausbildung", "academy",
    "masterclass", "course"
  ]
}
```

Note what a careless list would put in `team` and this one leaves out: the
city's word for its centre. That is the finding of every first sweep, and it
will be a different word in every city.

## Adapting it to another trade

The five vocabularies are the whole adaptation. `service` and `terms` are
rewritten, `geo` is rewritten per city, and `solo`/`team`/`teach` mostly
survive within a language — because how a single person writes about their own
hands does not depend on what those hands do.

Trades where this works the same way: nails, brow and lash, hairdressing,
massage, tattoo, photography, confectionery, repair, tutoring, physiotherapy,
dog grooming. Anywhere the work is done by one pair of hands and the business
is the person.
