#!/usr/bin/env node
/**
 * jt-booking — how the business takes bookings today, read off its own link.
 *
 *   jt-booking                     the link in .jtakeit/instagram.json (externalUrl)
 *   jt-booking <url>               any link: a bio link, a booking page, a site
 *
 * A bio link is usually wrapped (l.instagram.com/?u=…), sometimes a link hub
 * (Linktree and its kind), and often a booking page on Fresha, Treatwell,
 * Booksy and the like. This unwraps the link, follows a hub to the booking or
 * site links on it, names the platform, and reads the page's schema.org
 * JSON-LD: the services with their prices and lengths, the hours, the address,
 * the phone, the team's first names, the rating — what the business published
 * there itself, which is why the spec build may state it (jtakeit-sites:spec).
 *
 * Writes .jtakeit/booking.json and prints a summary. A page with no JSON-LD
 * still gets its platform named: that alone says how they book today.
 *
 * Reviewers' names are not kept — they are the platform's customers, not the
 * business's facts. A review's words and date are.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { findRoot } from './lib/state.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

/** Booking platforms by host. `marketplace`: it also sends the business new clients. */
const PLATFORMS = [
  // The booking flow (/<locale>/a/<slug>/booking) carries no JSON-LD; the listing does.
  { host: /(^|\.)fresha\.com$/, name: 'Fresha', marketplace: true, listing: (u) => {
    const m = /\/a\/([^/]+)/.exec(u.pathname);
    return m ? new URL(`https://www.fresha.com/a/${m[1]}`) : null;
  } },
  { host: /(^|\.)treatwell\.[a-z.]+$/, name: 'Treatwell', marketplace: true },
  { host: /(^|\.)booksy\.com$/, name: 'Booksy', marketplace: true },
  { host: /(^|\.)planity\.com$/, name: 'Planity', marketplace: true },
  { host: /(^|\.)timify\.com$/, name: 'Timify', marketplace: false },
  { host: /(^|\.)shore\.com$|(^|\.)connect\.shore\.com$/, name: 'Shore', marketplace: false },
  { host: /(^|\.)salonized\.com$/, name: 'Salonized', marketplace: false },
  { host: /(^|\.)setmore\.com$/, name: 'Setmore', marketplace: false },
  { host: /(^|\.)calendly\.com$/, name: 'Calendly', marketplace: false },
  { host: /(^|\.)simplybook\.(me|it)$/, name: 'SimplyBook.me', marketplace: false },
  { host: /(^|\.)squareup\.com$|(^|\.)square\.site$/, name: 'Square Appointments', marketplace: false },
];
const HUBS = /(^|\.)(linktr\.ee|beacons\.ai|taplink\.(cc|at)|lnk\.bio|bio\.link|linkin\.bio|campsite\.bio|msha\.ke)$/;
const MESSENGERS = /(^|\.)(wa\.me|api\.whatsapp\.com|t\.me|m\.me)$/;
const SOCIAL = /(^|\.)(instagram\.com|facebook\.com|tiktok\.com|youtube\.com|x\.com|twitter\.com|google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)$/;

const die = (m) => {
  console.error(`jt-booking: ${m}`);
  process.exit(1);
};

/** l.instagram.com/?u=…, and the tracking off whatever is underneath. */
function unwrap(raw) {
  let url = new URL(raw);
  for (let i = 0; i < 3; i++) {
    const inner = url.searchParams.get('u');
    if (/(^|\.)l\.instagram\.com$|(^|\.)l\.facebook\.com$/.test(url.hostname) && inner) url = new URL(inner);
    else break;
  }
  for (const key of [...url.searchParams.keys()])
    if (/^(utm_|fbclid|igsh|igshid|dppub|share$|e$)/.test(key)) url.searchParams.delete(key);
  return url;
}

const platformOf = (url) => PLATFORMS.find((p) => p.host.test(url.hostname)) ?? null;

/** A platform that is busy, or wary of a script, says 429 or 503: twice more, slower. */
async function get(url) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en,de;q=0.8' }, redirect: 'follow' });
    if (response.ok) return { url: new URL(response.url), html: await response.text() };
    if (![429, 503].includes(response.status) || attempt === 2)
      throw new Error(`${url} → HTTP ${response.status}${response.status === 503 || response.status === 429 ? ' — the platform is refusing a script; open the page in the browser (Playwright) and read it there' : ''}`);
    await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
  }
}

/** Every JSON-LD node on a page, @graph flattened. */
function ldNodes(html) {
  const nodes = [];
  for (const [, body] of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const doc = JSON.parse(body.trim());
      for (const item of [doc].flat()) nodes.push(...(item['@graph'] ?? [item]));
    } catch {
      /* a broken block on somebody's page is theirs to fix, not ours to die on */
    }
  }
  return nodes;
}

const typesOf = (node) => [node['@type']].flat().filter(Boolean);
const BUSINESS = /LocalBusiness|HealthAndBeautyBusiness|HairSalon|BeautySalon|NailSalon|DaySpa|Barber|Store|Organization|ProfessionalService|MedicalBusiness|SportsActivityLocation|ExerciseGym/;

/** PT1H15M → 75. */
const minutes = (iso) => {
  const m = /^P(?:T(?:(\d+)H)?(?:(\d+)M)?)$/.exec(iso ?? '');
  return m ? Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0) : null;
};

function services(business) {
  const out = [];
  const offers = [business.hasOfferCatalog, business.makesOffer].flat().filter(Boolean);
  const walk = (node, category) => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach((n) => walk(n, category));
    if (node.itemListElement) return walk(node.itemListElement, node.name ?? category);
    const item = node.itemOffered ?? node;
    if (!item.name) return;
    const duration = [item.additionalProperty].flat().find((p) => /duration/i.test(p?.name ?? ''))?.value ?? item.duration;
    out.push({
      name: item.name,
      category: node.category ?? category ?? null,
      price: node.price ?? node.priceSpecification?.price ?? null,
      currency: node.priceCurrency ?? node.priceSpecification?.priceCurrency ?? null,
      minutes: minutes(duration),
      description: item.description ?? null,
    });
  };
  walk(offers);
  return out;
}

function hours(business) {
  return [business.openingHoursSpecification]
    .flat()
    .filter((h) => h?.opens && h?.closes) // a day with neither is a closed day
    .map((h) => ({ days: [h.dayOfWeek].flat().map((d) => String(d).replace(/^https?:\/\/schema\.org\//, '')), opens: h.opens, closes: h.closes }));
}

function read(page, platform) {
  const nodes = ldNodes(page.html);
  const business = nodes.find((n) => typesOf(n).some((t) => BUSINESS.test(t)));
  const out = {
    source: { url: page.url.href, platform: platform?.name ?? null, marketplace: platform?.marketplace ?? null, read_at: new Date().toISOString() },
    structured: Boolean(business),
  };
  if (!business) return out;
  const address = business.address ?? {};
  const rating = business.aggregateRating;
  return {
    ...out,
    business: {
      // «8001 BARBER ZURICH - Neumühlequai 10 - Zürich | Fresha»: the platform's
      // title, not the business's name; the part before the address is.
      name: (platform && business.name?.endsWith(`| ${platform.name}`)
        ? business.name.replace(/\s*\|[^|]+$/, '').replace(/\s+-\s+.*$/, '')
        : business.name) ?? null,
      phone: business.telephone ?? null,
      email: business.email ?? null,
      address: {
        street: address.streetAddress ?? null,
        postcode: address.postalCode ?? null,
        town: address.addressLocality ?? null,
        country: address.addressCountry?.name ?? address.addressCountry ?? null,
      },
      geo: business.geo ? { lat: business.geo.latitude, lng: business.geo.longitude } : null,
      currency: business.currenciesAccepted ?? null,
      price_range: business.priceRange ?? null,
      payment: business.paymentAccepted ?? null,
      languages: [business.knowsLanguage].flat().filter(Boolean),
      team: [business.employee].flat().filter(Boolean).map((e) => e.name).filter(Boolean),
      rating: rating ? { value: Number(rating.ratingValue), count: Number(rating.reviewCount ?? rating.ratingCount) } : null,
      elsewhere: [business.sameAs].flat().filter(Boolean),
    },
    hours: hours(business),
    services: services(business),
    reviews: [business.review].flat().filter(Boolean).map((r) => ({ date: r.datePublished?.slice(0, 10) ?? null, rating: r.reviewRating?.ratingValue ?? null, text: r.reviewBody ?? '' })),
  };
}

/** The links on a hub page, unwrapped, sorted booking-first. */
function hubLinks(html, base) {
  const links = [];
  for (const [, href] of html.matchAll(/href=["'](https?:\/\/[^"'#]+)["']/gi)) {
    try {
      const url = unwrap(new URL(href, base).href);
      if (HUBS.test(url.hostname) || /linktr\.ee|cdn|static|assets/.test(url.hostname)) continue;
      if (!links.some((l) => l.href === url.href)) links.push(url);
    } catch {
      /* not a link */
    }
  }
  return links.sort((a, b) => Number(Boolean(platformOf(b))) - Number(Boolean(platformOf(a))));
}

// --- the link ----------------------------------------------------------------

const root = findRoot() ?? process.cwd();
let raw = process.argv[2];
if (!raw) {
  const profile = join(root, '.jtakeit', 'instagram.json');
  if (!existsSync(profile)) die('no link given and no .jtakeit/instagram.json — jt-booking <url>');
  const record = [JSON.parse(readFileSync(profile, 'utf8'))].flat()[0] ?? {};
  raw = record.externalUrl ?? record.externalUrls?.[0]?.url ?? record.bioLinks?.[0]?.url;
  if (!raw) {
    console.log('link     none in the profile — they take bookings by message, by phone, or not online at all');
    process.exit(0);
  }
}

let start;
try {
  start = unwrap(raw);
} catch {
  die(`not a link: ${raw}`);
}

const found = { link: start.href, kind: null, pages: [] };

if (MESSENGERS.test(start.hostname)) {
  found.kind = 'messenger';
  console.log(`link     ${start.href} — a messenger: bookings by message, no booking system`);
} else if (SOCIAL.test(start.hostname)) {
  found.kind = 'social';
  console.log(`link     ${start.href} — another social profile, not a booking page or a site`);
} else {
  let first;
  try {
    first = await get(start.href);
  } catch (e) {
    die(e.message);
  }
  const targets = [];
  if (HUBS.test(first.url.hostname)) {
    found.kind = 'hub';
    const links = hubLinks(first.html, first.url);
    found.hub = links.map((l) => l.href);
    console.log(`link     ${first.url.href} — a link hub, ${links.length} link(s):`);
    for (const l of links) console.log(`         ${platformOf(l) ? `${platformOf(l).name.padEnd(10)}` : ''.padEnd(10)} ${l.href}`);
    targets.push(...links.filter((l) => !SOCIAL.test(l.hostname) && !MESSENGERS.test(l.hostname)).slice(0, 3).map((l) => platformOf(l)?.listing?.(l) ?? l));
  } else {
    found.kind = platformOf(first.url) ? 'booking' : 'site';
    targets.push(platformOf(first.url)?.listing?.(first.url) ?? first.url);
  }
  for (const target of targets) {
    let page;
    try {
      page = target.href === first.url.href ? first : await get(target.href);
    } catch (e) {
      console.log(`         ${target.href} — could not be read: ${e.message}`);
      continue;
    }
    found.pages.push(read(page, platformOf(page.url)));
  }
}

for (const page of found.pages) {
  const head = page.source.platform ? `${page.source.platform}${page.source.marketplace ? ' (a marketplace: it also sends them new clients)' : ''}` : 'their own site';
  console.log(`\npage     ${page.source.url}\n         ${head}`);
  if (!page.structured) {
    console.log('         no structured data — read it in the browser if it matters');
    continue;
  }
  const b = page.business;
  const a = b.address;
  console.log(`name     ${b.name ?? '—'}`);
  if (a.street || a.town) console.log(`address  ${[a.street, [a.postcode, a.town].filter(Boolean).join(' '), a.country].filter(Boolean).join(', ')}`);
  if (b.phone) console.log(`phone    ${b.phone}`);
  for (const h of page.hours) console.log(`hours    ${h.days.join(', ')} ${h.opens}–${h.closes}`);
  if (b.team.length) console.log(`team     ${b.team.join(', ')}`);
  if (b.rating) console.log(`rating   ${b.rating.value}/5 from ${b.rating.count} reviews`);
  for (const s of page.services) console.log(`service  ${s.name}${s.price != null ? ` — ${s.currency ?? ''} ${s.price}` : ''}${s.minutes ? `, ${s.minutes} min` : ''}`);
  for (const e of b.elsewhere) console.log(`also     ${e}`);
}

mkdirSync(join(root, '.jtakeit'), { recursive: true });
writeFileSync(join(root, '.jtakeit', 'booking.json'), `${JSON.stringify(found, null, 2)}\n`);
console.log(`\nwritten  .jtakeit/booking.json`);
