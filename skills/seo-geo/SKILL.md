---
name: seo-geo
description: Search and generative-engine optimisation for a site on jtakeit — the part the platform cannot do for it: the one query, the words, the confirmed facts and structured data built from them, local (geo) signals, the questions block, and copy an AI assistant can quote. Load when writing page copy for search, adding structured data, preparing the launch, or whenever the user mentions SEO, GEO, schema, local search, Search Console, Google Business Profile or AI search.
---

# SEO and GEO

Two audiences read this page without eyes: a search crawler and an assistant
answering somebody's question. Both want the same thing — a page that states
plainly what this business is, where it is, and what it does — and neither will
guess on the business's behalf.

## What the platform already does

Most of what used to be SEO groundwork is not the site's to get right any more,
because the platform will not build a site that gets it wrong, and the scaffold
writes the rest:

| | |
| --- | --- |
| Indexing | One build serves the preview and, after the launch, the address. The platform keeps every preview out of search engines with its own header, and refuses a front page that says `noindex` (`JTK_E_NOINDEX`). There is no switch to flip at the launch, and none should be added. |
| `robots.txt` | Refused if it keeps every crawler out (`JTK_E_ROBOTS_DISALLOW`). The scaffold's names the sitemap and excludes no AI crawler; leave it that way. |
| Sitemap | Refused if empty or on another host (`JTK_E_SITEMAP_EMPTY`). The scaffold builds it from `PAGES` and the collections. |
| Canonicals | Refused if the front page's canonical is on another host (`JTK_E_CANONICAL_ELSEWHERE`). The scaffold derives every canonical from `SITE_URL`, which the platform passes to each build. |
| Languages | The scaffold writes `hreflang` for every language a page exists in, with `x-default` (`docs/languages.md`). |
| The head | `Layout.astro` writes the title, description, canonical, Open Graph, `geo.placename`, `format-detection` and the business's JSON-LD from `src/data/site.ts`. |
| `llms.txt` | A route built from the same data as the page. |
| The icon, the prices | `preflight` checks the icon and that every price shown is in the site's currency. |

So this skill is about what a build cannot check: **whether the words are the
right ones, and whether the facts are true.**

## The one query

Every landing page we build is for **one query**: `[service] [city]`.
«Coiffeur Zürich», «Balayage Kreis 4», «Zahnarzt Winterthur». It is written down
in `SEARCH` in `src/data/site.ts` before the copy is written, and `jt-check`
reads it back off the built page.

**One, not six.** A page that tries to rank for cuts, colour, extensions and
brows ranks for none of them: every additional target dilutes the same sentences
and the same links. A business with four services earns four pages — later, as a
second package. The landing page picks the service they actually want more of,
which is a question for the client, not for us.

The service is named **as a customer says it**, which is often not what the
trade says. A salon says «Colorationstechnik», a customer types "Haare färben
Zürich"; both belong on the page, but the one in the title is the one being
searched for.

Where it has to appear, and that is all:

- **The `<title>`**, as part of a sentence a person would read in a result list.
  `Haare färben in Zürich — Atelier Nord` is a title; `Haare färben Zürich |
  Coiffeur günstig | Friseur Zürich` is a listing.
- **The meta description**, once, in the ~155 characters that have to make
  somebody click rather than satisfy a checklist.
- **The `h1` carries the service.** The city may sit one line below it, in the
  lead — a headline forced to contain both usually stops sounding like a
  sentence.
- **Two or three times in the body**, in sentences that were going to be written
  anyway: where the room is, what the area is, who comes. Once inside the
  questions block, where somebody asks it in their own words.

And where it must not: not in every heading, not in the alt text of six photos,
not in a footer line of neighbouring districts. **Past four repetitions of the
exact phrase `jt-check` fails the page**, and it is right to: a page written for
the crawler reads as one to a person.

The test that matters more than the count: **the page is still about the person
and the business.** The query is the door; what is behind it is who they are,
what they do, what it is like to be their customer. Conversion is what the
client is buying.

The title and description are the owner's to edit after the launch — they live
in each page's `seo` in `jtk/content/`. Write them well enough that nobody
wants to.

On the outbound track the city is the one geographic fact a spec build states,
and only when the portrait sourced it. If it is not there, the page runs without
a city rather than guessing one; see `jtakeit-sites:spec`.

## Structured data: the facts, asserted

The scaffold emits one business entity on every page, with a stable `@id`, from
`src/data/site.ts`. What it cannot do is know whether the facts are true — so
**only confirmed fields go into `site.ts`**. A wrong opening hour or an invented
rating is worse than a missing one, and it is the client's name on it.

Pick the narrowest type that is true for `SCHEMA_TYPE`: `HairSalon`,
`Restaurant`, `Dentist`, `LegalService` — all under `LocalBusiness`. Per-page
additions — `FAQPage`, `Service`, `Offer` — go through the layout's `schema`
prop. [references/schema.md](references/schema.md) has the per-vertical shapes,
the fields worth adding, and the ones to leave out.

Never a `Review` or an `AggregateRating` the client did not earn: that is the
one piece of structured data with a manual penalty attached, and it is also just
a lie.

## Local — the geo half

For a business with an address, most of the ranking is this:

- **NAP consistency.** Name, address, phone identical here, on Google Business
  Profile, and on every directory. Character for character. `src/data/site.ts`
  is the source, so the site cannot contradict itself; the client's other
  listings are their homework, and it belongs in the launch message.
- **The address is on the page**, in text, in the footer and on the contact
  page. Not only inside JSON-LD, and never only in an image.
- **The address in parts** — street, postal code, city, region, country — in
  `BUSINESS`. A single string is not parseable.
- **Both phone forms.** What a visitor reads and what a phone dials are
  different strings; both live in `BUSINESS` and are rendered from there.
- **`areaServed`** where the business travels to its customers.
- **The city is in the page's own sentences** — the `<title>`, the h1's
  neighbourhood, the description. Written as a person would say it, not
  "Coiffeur Zürich Kreis 4 Langstrasse günstig Schweiz".
- **The neighbourhood, the landmark, the tram stop**, where they are genuinely
  part of how somebody finds the place. Local signal and useful sentence at the
  same time; a list of twelve districts nobody works in is neither.

## Generative engines — the other geo

Assistants quote pages that answer a question in a self-contained paragraph.
What that changes:

- **Answer in the open.** The service, the price bracket, the area, the how-long
  and the what-happens-next, each in a paragraph that makes sense lifted out of
  the page. A fact that only exists inside an image or a script is a fact that
  will not be quoted.
- **State the boundaries too.** What the business does *not* do, who it is not
  for, what it does not accept. Assistants recommend from constraints as much as
  from claims, and this is also the honest half of the page.
- **Structured data is the machine-readable version of the same sentences.**
  They must agree. Where they disagree, the crawler believes the markup and the
  reader believes the page, and one of them is being misled.
- **Dates and freshness.** A page claiming "since 2019, over 500 clients" had
  better still be true next year.
- **`llms.txt`** is built for you; the words in it are not. It is
  `BUSINESS.description` and one `summary` per entry in `PAGES` —
  [references/llms-txt.md](references/llms-txt.md) says what to write there.

## The questions block

"Answer in the open" needs somewhere to happen, and on a landing page that place
is a block of real questions **below the form**. It is the part an assistant can
lift a paragraph out of, and the part a visitor reads when they are almost
convinced and looking for the reason not to be.

- **Under the form, not above it.** Someone ready to book should not have to
  scroll past six questions to reach the field. Someone hesitating will scroll.
- **Real questions, in their words.** The ones the business actually gets asked
  — in the DMs, on the phone, at the door. A question nobody asks is a heading
  with no traffic behind it.
- **Each answer stands alone.** Forty to eighty words that still make sense
  quoted with no page around them. An answer that begins "as mentioned above" is
  an answer that will never be quoted.
- **Boundaries belong here.** A visitor who rules themselves out early was never
  a lead.
- **The text is in the HTML.** `<details>` or a CSS toggle — never a fetch. It is
  also a block the owner edits in the panel, so it is content, annotated like
  any other.
- **`FAQPage` markup says the same words**, built from the same content the page
  renders, so the two cannot drift.

On a spec build the questions come from the prospect's own captions, they carry
no unconfirmed fact, and the `FAQPage` JSON-LD waits: an answer nobody has
confirmed is exactly the kind of thing that must not be asserted to a machine on
a real business's behalf. See `jtakeit-sites:spec`.

## Copy that ranks

The one query decides the title, the description and the h1. The rest of the
page is written for the person, and these are the parts of that which also
happen to rank:

- **Both vocabularies.** The professional term because it is what the service
  is, the plain one because it is what is searched.
- **Headings that say something.** «Über uns» tells a reader and a crawler the
  same nothing; «Ein Stuhl, eine Person, eine Stunde» tells both something.
- **Answers that stand alone** — what gets quoted, by an assistant and by a
  featured snippet alike.

How the copy itself is written — voice, values, what may be quoted — is
`jtakeit-sites:spec` → [references/copy.md](../spec/references/copy.md).

## Redirects

If there was an old site, every indexed old URL lands on its replacement, with a
301 — in the build's `_meta.json` `redirects`, which the scaffold writes (see
`jtakeit-sites:launch`). A ranked page dropped onto `/` throws away everything it
earned. Percent-encoded and raw forms both, for paths with non-ASCII characters.
Never a rule whose pattern also matches its own target: that is a loop, which
takes the page down rather than degrading it.

## At the launch

The platform checks the indexing, the sitemap and the canonical on every build,
and `preflight` checks that search engines are not told to stay away. What is
left is a person's, after the launch:

- **Search Console**: the property on the real domain, verified (the scaffold
  leaves the tag as a `TODO(prod)` in `Layout.astro`), the sitemap submitted,
  the coverage report read a few days later.
- **Google Business Profile**: exists, matches the site's NAP exactly, links to
  the new address.
- **The rendered OG card**, looked at, on a real share.
- **Rich Results Test** on the JSON-LD, once — a type that does not accept a
  field you gave it stays valid JSON and is silently ignored.
- **A search for the business's own name**, to see what is already ranking
  under it.
- **`get_stats`** a month later: visits by source, AI answers among them,
  counted without cookies.
