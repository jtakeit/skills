# What they pay for bookings today

The platforms a hair or beauty business in Switzerland, Germany and Austria
most often books through, and what each one costs it. **Read on 15 October
2026** from the platforms' own pricing pages and help centres; every figure has
its source. Prices change — when a page says otherwise, the page wins, and this
file is updated with the new date.

Fresha prices by the visitor's IP: the figures below are what a Swiss visitor
is shown (CHF). Its EUR prices were not read.

## The short version

| Platform | Subscription | New client from its marketplace | Booked through their own link | Returning clients |
| --- | --- | --- | --- | --- |
| **Fresha** (CH) | solo CHF 18.95/month; team CHF 12.95 per bookable member | **20%** of the first visit, min CHF 5, max CHF 150 | free — **unless the client saw their Fresha profile first** | free |
| **Treatwell** (CH) | CHF 49/month (or 499/year), + CHF 199 setup if monthly | **35%** + VAT of the first booking | 0% (2.5% only on a prepayment) | 0% |
| **Treatwell** (DE/AT) | €39/month (or 399/year); with POS €49 + TSE | **35%** + VAT | 0% (2% on a prepayment) | 0% |
| **Booksy** (DE only) | €35/month + €7 per extra member | none | none | none |
| Timify | free (1 resource) · €25–31/month | none | none | none |
| Shore (DE) | €49.90–59.90/month (Booking) + VAT | none | none | none |
| Salonized (CH) | CHF 59/month | 35% only on Treatwell bookings, if connected | none | none |
| Planity (DE) | no public price | "keine Provisionen" | — | — |
| Setmore | free to 4 users · $5/user | none | none | none |

Booksy is not offered in Switzerland or Austria (its CH and AT pages redirect
or 404).

## The fine print that decides the pitch

**Fresha**
- **Who counts as new:** not on the business's client list when they book,
  found the business on the marketplace, and does not confirm a previous visit.
  No time window. Charged on the value of the first completed appointment as
  booked online; add-ons at checkout, tips and products are not.
  — fresha.com/help-center/knowledge-base/billing-and-fees/188-marketplace-new-client-fees
- **The own-link exception has an exception:** "This includes those who … view
  your Fresha marketplace profile first and then choose to book through another
  online channel including your website or social media pages." — same article.
- **Online booking cannot be had without the marketplace:** "To take bookings
  online through Fresha via your website and social media pages, your profile
  must be listed on the Marketplace … unlist … will disable all your online
  booking channels." — same article.
- The fee stays if the business cancels the appointment for the client; no fee
  for a no-show marked the same day.
- No free plan; cancelling unlists the marketplace profile.
  — help-center/knowledge-base/billing-and-fees/101626-manage-your-fresha-plan
- Card payments 1.29% + CHF 0.21; TWINT 3.19% + 0.30. Paying online is not
  mandatory. SMS: 20 free a month, then CHF 0.05. — fresha.com/pricing

**Treatwell**
- **Who counts as new:** never booked with them, **or not in the last 12
  months** (a «win-back»); every booking counts as new until the first
  appointment is completed.
  — partnercare.treatwell.com, «Wie funktionieren die Provisionen bei
  Treatwell?»; treatwell.de/info/vertragsbestimmungen/ (Stand: September 2026)
- Bookings through Reserve with Google count as marketplace bookings since
  April 2024. — Vertragsbestimmungen
- Commission is charged if the business cancels after midnight the day before.
- Own «Jetzt buchen» buttons: "Sie zahlen nur die Bearbeitungsgebühr von 2.5 %
  (+MwSt.) für Vorauszahlungen oder gar nichts." — partnercare

**Booksy (DE):** "Wir berechnen weder Provisionen noch Buchungsgebühren für
neue Termine oder neue Kundschaft." — biz.booksy.com/de-de/preise

## The sum, said honestly

We never know their volume, so the portrait carries the **rule and one worked
example**, not a bill:

- **Per marketplace new client**, Fresha takes 20% of the first visit: CHF 8 on
  a CHF 40 haircut; the CHF 5 minimum makes it 25% on a CHF 20 trim. Treatwell
  takes 35% + VAT: CHF 14 + VAT on the same haircut.
- **An example, labelled as one**: 100 bookings a month at CHF 40, 40 of them
  marketplace first visits — Fresha CHF 320 + 18.95 ≈ **CHF 339 a month**, about
  8.5% of turnover; Treatwell CHF 560 + 49 ≈ **CHF 609**, about 15%.
- **The other side, from the same pages:** with no marketplace clients, Fresha
  costs CHF 18.95 a month and Treatwell CHF 49 — the platform is cheap for the
  clients the business already has, and it *finds* new ones. jtakeit does not.

And jtakeit, which costs the business what the **developer** charges, not what
jtakeit charges the developer: `get_prices` gives the developer's cost per live
site and for bookings; the business's price is the developer's to set — ask,
never assume. Bookings made on the business's own site on jtakeit carry no
commission at all, from anybody.

So the argument is rarely «leave Fresha». It is:

- **«Your Instagram clients are yours — book them on your own page, at no
  commission.»** On Fresha, a follower who taps the bio link, looks at the
  Fresha profile and books is a marketplace new client at 20%. On their own
  site they are not anybody's.
- **Keep the marketplace if it brings you people** — and know what each one
  costs.
- On Booksy, Timify, Shore or Setmore there is no commission to save; the case
  is the site itself — their own address, their own page in search, not a
  profile on somebody else's.

Never state the business's own monthly bill as a fact: we see their prices,
not their volume. Say the rule, and let them do the multiplication — or do it
with them once they answer.

## Recognising the platform from the link

| Platform | Listing URL | Structured data on the listing |
| --- | --- | --- |
| Fresha | `fresha.com/[<locale>/]a/<name>-<city>-<street>-<id>`; the `/booking` flow under it has none — `jt-booking` reads the listing | JSON-LD: services with price and length, hours, address, phone, rating, team, reviews |
| Treatwell | `treatwell.{ch,de,at}/ort/<slug>/` | JSON-LD: the same, with ratings and reviews |
| Booksy | `booksy.com/de-de/<id>_<slug>_<category>_<city-id>_<city>` | JSON-LD: services and prices, **no lengths, no rating** (those are in `window.__NUXT__`) |
| Planity | `planity.com/de-DE/<slug>-<postcode>-<city>` | JSON-LD: address, phone, rating — **no services or hours** (in `window._planity_localStates`) |
| Setmore | `<slug>.setmore.com` | JSON-LD: address, phone, rating; services in `__NEXT_DATA__` |
| Shore | `connect.shore.com/bookings/<slug>/…` | none; services in `window.__PREFETCHED_DATA__` |
| Timify | `timify.com/de-de/profile/<slug>/`, widget `book.timify.com` | none; hours and address in the HTML, services in the widget |
| Salonized | `<slug>.salonized.com`, widget `widget.salonized.com` | none; hours, address, phone in the HTML |

A listed price can be the lowest of a range — Treatwell's structured data
carries one number for a service the page shows as «ab CHF 10». Before a price
goes on the spec page, look at the listing once and write it the way the
listing writes it.

Where `jt-booking` finds no structured data, it still names the platform; open
the page with Playwright and read the services off it if the spec needs them.
