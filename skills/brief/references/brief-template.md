# BRIEF.md — the scaffold's file, and what the studio adds to it

`npx @jtakeit/astro create` writes `BRIEF.md` at the project root in the
platform's shape (`jtakeit:///guides/the-brief.md`, *Where it is written*):

```
# <Business> — brief
Read on <date>. Sources: …
## In one sentence
## The one action
## Facts
## Bookings            (only when a kit was laid out)
## Decisions
## Open — NEEDS CLIENT
## Done when            a task list the panel shows the owner as the agent's own
```

**Keep those headings and their order.** The panel reads the file's fill as
progress and shows *Done when* to the owner; `jtkit progress` reads it too. A
second brief beside it, or the headings renamed, is a brief nobody else can see.

The studio's sections go **between `Facts` and `Decisions`**. Delete one only
when it genuinely does not apply; an empty heading with `NEEDS CLIENT` under it
is more useful than a missing one. Keep the source on every fact — that is what
makes the file usable by somebody who was not in the conversation.

```markdown
# Atelier Nord — brief

Read on <date>, by <who>. Sources: developer <date>, client call <date>,
<old site URL>, instagram @atelier.nord.zh, <competitor URLs>.

## In one sentence

<What the business is, where, for whom. The sentence the page's <title> and the
meta description are both derived from.>

## The one action

<What a visitor should do. One thing. "Book a cut online", not "get in touch
or browse the prices or follow us".>

## Facts

| Fact | Value | Source |
| --- | --- | --- |
| Legal / trading name | | |
| Address | | |
| Phone (printed) | | |
| Phone (dialable) | | |
| Email | | |
| Hours | | |
| Price range | | |
| Socials | | |
| Currency | chf | |
| Languages | de-CH | |
| Paid online or on the spot | | |
| Where enquiries go (linked in the panel by a person) | | |
| The mark (logo file) | | |
| Stack | Astro (@jtakeit/astro) | |
| Slug on the platform | | |
| Repository (GitHub owner) — App installed? | | |
| Domain — who holds the registrar login | | |

Anything not confirmed: leave the value empty and write `NEEDS CLIENT` in the
source column. It carries to the launch as an open item.

## Bookings

<Written by the scaffold when a kit was laid out: the kit's asks with their
answers, and its defaults said back with confirmed / changed to. Leave its
tables as they are and fill them.>

## Portrait

Voice, subject matter, who the customer is, what the client is proud of, what
their material and colour actually look like. Sourced. See
[instagram.md](instagram.md) for what may be taken and what must be confirmed.

## The one query

`[service] [city]`, in the words a customer types. One — the service the client
wants the phone to ring about. What the page's title, description and h1 are
written for, and what goes into `SEARCH` in `src/data/site.ts`.
See `jtakeit-sites:seo-geo`.

| | |
| --- | --- |
| Service, as a customer says it | |
| Service, as the trade says it | |
| City | |
| Other forms used in the copy | e.g. «in Zürich», «Zürcher» |

## What they sell

The services in the client's own words, with prices where they have them. Not
our vocabulary — theirs. If the old site and the client disagree, record both
and ask.

## What they are not

The things that get mistaken for them. A colour studio that is not a walk-in
barber, a restaurant that is not a takeaway. Half of a good landing page is
refusing the adjacent category.

## Competitors

Two or three, with URLs. One line each on what they do and what everybody in
this trade says, so we can decide what to say instead.

## Search

Queries a real customer types, from `jtakeit-sites:seo-geo`. The city and the
trade in the words the market uses, not the words the business uses about
itself.

## Photos

What we have, at what quality, and what is missing. Whether anyone recognisable
has agreed to appear. Whether the client can shoot more.

## The old site

Only if there is one.

| Old URL | Replaced by | Note |
| --- | --- | --- |

Every indexed path lands somewhere. `/` is not an answer for a page that ranked.

## Copy

Who writes it. If the client supplies it, what we are allowed to change.

## Decisions

- Variants: <n>
- Locale: <tag>, one language unless stated
- Anything taken out of the bookings kit, with what the visitor loses by it
- Anything the client explicitly declined

## Open — NEEDS CLIENT

A flat list, so the launch has somewhere to start.

## Done when

<The scaffold's task list, kept true: tick each line when it is.>
```
