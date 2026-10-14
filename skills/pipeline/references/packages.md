# Service packages

A package is what the client bought. It decides what the stages produce, never
how many stages there are. Adding a package means adding its row here and its
entry in `PACKAGES` in `scripts/lib/state.mjs`; both, or `jt-init` and the
state file will disagree about what the project is.

What the developer charges is theirs to set. jtakeit's own price is per live
site, paid by whoever runs it — nothing before a launch (`get_prices` says what
it is today). A developer who keeps the client can bill them through jtakeit on
their own Stripe account, or invoice them their own way; one who hands the site
over moves it, and its bill, to the client.

## `landing` — the entry package

One page, built to be believed.

**Included**

- Structure chosen for the vertical — a hair salon's page and a lawyer's page
  are not the same page with different photos.
- N design variants (agreed in the brief, usually 3), each clickable end to end
  on desktop, tablet and phone.
- Responsive down to 360px. The phone layout is designed, not shrunk.
- The words: one query the page is for, the business's facts stated so an
  assistant can quote them, local signals. See `jtakeit-sites:seo-geo`. The
  machinery — sitemap, robots, canonicals, structured data, `llms.txt` — is the
  scaffold's, and the platform refuses a build that gets the indexing wrong.
- One enquiry form, answered by the platform; where the enquiries go is set in
  the panel.
- The owner edits the text and the photographs in the panel, by tapping them on
  their own page — every field the catalogue declares.
- The launch: preflight clean, a person launches in the panel, on jtakeit's
  address or the business's own domain.

**Not included** — quote separately, do not absorb:

- An online shop or any checkout.
- Book-length copywriting. The page is written; the blog is not.
- Logo and brand identity.
- Social media management.

**Stage shape**

| Stage | What `landing` does |
| --- | --- |
| brief | one vertical, one language, one primary action; variant count agreed |
| variants | N × one page, each a distinct direction, sharing content and data |
| preview | built on jtakeit; a private preview link with the client |
| revisions | edits inside the chosen variant; the other variants are deleted, not maintained |
| launch | preflight, then a person launches — kept, or handed over with the panel's link |

## `bookings` — the landing, with the diary

The landing, and the platform's diary: services, the people or rooms that are
booked, opening hours, confirmation and cancellation, and — if the business
wants it — payment online to its own Stripe account.

A site that takes bookings starts from its kind's **kit**, whole
(`jt-init --kit <kind>`, which passes it to `@jtakeit/astro create`). What the
kit chose for the business — confirmation, cancellation, payment, hold times —
is said back to the developer and confirmed in the brief; whether bookings are
paid online or on the spot is asked, never assumed.

**Adds, per stage**

| Stage | What `bookings` adds |
| --- | --- |
| brief | the kit's questions; services, prices in the site's one currency, who is booked |
| variants | the booking page is the services' listing, in each direction |
| preview | `preflight` with `try_booking` books and cancels a slot |
| launch | the owner publishes the hours in the panel; payments are the owner's to switch on |

## Planned

Sketches, not commitments. Each lands as work bolted onto existing stages
rather than as a new pipeline.

- **`multipage`** — service pages, a price list, legal pages, an old-URL
  redirect map. Adds work at brief (an inventory of the old site) and at
  variants (page templates, not one page).
- **`i18n`** — several languages, each with its own route and a complete
  hreflang cluster; the scaffold's `locales` carry it.
- **`care`** — a monthly plan: content edits the owner does not want to make,
  dependency updates, a look at the numbers. It has no stages of its own; it
  starts where the pipeline ends.
