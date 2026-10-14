# Structured data by vertical

One business entity, one stable `@id`, on every page. Only confirmed fields.

The scaffold's `Layout.astro` already writes the base below from
`src/data/site.ts`, leaving out every field that is empty — so the work is
filling `BUSINESS` with confirmed facts and choosing `SCHEMA_TYPE`, not writing
JSON-LD. Per-page additions go through the layout's `schema` prop.

## The base

```js
{
  '@context': 'https://schema.org',
  '@type': '<narrowest true type>',
  '@id': `${canonicalFor('/')}#business`,
  name, description,
  url: canonicalFor('/'),
  image: ogImage,
  telephone: BUSINESS.phoneDial,
  email,
  priceRange,                 // the coarse bucket: '€€', 'CHF 40–180'
  inLanguage: LOCALE,
  sameAs: [instagram, facebook, ...],
  address: {
    '@type': 'PostalAddress',
    streetAddress, postalCode, addressLocality, addressRegion, addressCountry
  },
  hasMap: BUSINESS.mapsUrl,
}
```

Add only when confirmed:

- `geo: { '@type': 'GeoCoordinates', latitude, longitude }` — from the client's
  Google Business Profile, not from a geocoder guess at the street.
- `openingHours: ['Tu-Sa 09:00-19:00']` — the field Google surfaces most and the
  one most damaging to get wrong. On a site with a diary, it says what the owner
  published under **Diary → Opening hours** and nothing else; the scaffold's
  `OpeningHours.astro` reads `jtk/bookings.json` for the same reason. If the
  business only takes appointments by phone, there are no opening hours; say
  that in prose instead.
- `areaServed` — for a business that travels to the customer.
- `founder: { '@type': 'Person', name }` — where the person *is* the brand.

Never: `aggregateRating`, `review`, or any award the client cannot point at.

## Types

| Vertical | `@type` | Notes |
| --- | --- | --- |
| Restaurant, café | `Restaurant` | `servesCuisine`, `acceptsReservations`, `menu` |
| Nail / beauty studio | `NailSalon` | under `HealthAndBeautyBusiness` |
| Hair | `HairSalon` | |
| Dentist, clinic | `Dentist` / `MedicalClinic` | `medicalSpecialty`; be conservative — medical claims are regulated |
| Lawyer | `LegalService` (or `Attorney`) | `areaServed` matters more than address |
| Builder, renovation | `HomeAndConstructionBusiness` | `areaServed` as the region, not one street |
| Trainer, coach, consultant | `ProfessionalService` | often no public address at all |
| Shop | `Store` + the narrow subtype | only if there is a real storefront |

If none fits, `LocalBusiness` is correct and honest. A wrong narrow type is
worse than a right broad one.

## Per-page additions

**`FAQPage`** — only for questions that are really on the page, with the answers
that are really there. Emitted from the same data the `<details>` elements
render from, so the two cannot drift.

**`Service`** — one per service page, with `provider` pointing at the business
`@id`:

```js
{ '@type': 'Service', name, description, provider: { '@id': '…#business' },
  areaServed, serviceType }
```

**`Offer`** — where there is a real, named price:

```js
{ '@type': 'Offer', price: 180, priceCurrency: siteCurrency,
  availability: 'https://schema.org/InStock', url: canonical }
```

`price` is the number, no separators and no currency symbol, converted from the
minor units the platform stores (18000 is CHF 180 — `digitsOf` in
`src/lib/money.ts` says how many digits the currency has); `priceCurrency` is
`siteCurrency` from `src/lib/site.ts`, never a code typed here. The price itself
comes from the entry or the block that holds it — the one the owner edits in the
panel — so the markup cannot go stale when they change it.

**`BreadcrumbList`** — on a multi-page site with real hierarchy. Not on a
one-pager.

## Multi-locale

The scaffold writes each page's canonical and the full `hreflang` set, given the
page's `alternates` (`docs/languages.md`). What it cannot do is notice a page
that exists in one language and not the other: pass `alternates` on every page
that has a translation, or the two compete with each other in search.

## Checking

Paste the rendered JSON-LD into Google's Rich Results Test before launch. It is
the only way to catch a type that does not accept a field you gave it — the
markup stays valid JSON and is silently ignored.

Nothing on the platform checks the markup's meaning. Correctness is a human's
job, once.
