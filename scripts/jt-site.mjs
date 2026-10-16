#!/usr/bin/env node
/**
 * jt-site — the business's own website as it is today, read.
 *
 *   jt-site [<url>]        the site in .jtakeit/booking.json (the bio link, or
 *                          the booking page's «also»), or any url given
 *
 * A business with a site of its own has already written half the portrait:
 * the price list in its own words, the team with their photographs, the hours,
 * the address, how it takes bookings. The outbound track used to read the
 * bio link's structured data and stop (Schorem, Pall Mall: a full price list
 * and a team page one click away, and a spec built on samples instead).
 *
 * In a real browser, because half of these sites draw themselves with a
 * script: the home page, then the pages its menu links to on the same site,
 * at most twelve. From each: the headings and the words, the prices as rows,
 * the phone numbers and addresses, the hours, the structured data, the links
 * to a booking platform, and the photographs large enough to use.
 *
 * Writes .jtakeit/site-today.json, and prints what it found. The facts in it
 * are the business's own — published on its own site — and jt-check passes
 * them on a spec page as it passes the booking page's.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadChromium } from './lib/browser.mjs';
import { findRoot } from './lib/state.mjs';

const die = (m) => {
  console.error(`jt-site: ${m}`);
  process.exit(1);
};
const root = findRoot() ?? process.cwd();
const MOST = 12;
const PLATFORMS = /fresha\.com|treatwell\.|booksy\.com|planity\.com|timify\.com|shore\.com|salonized\.com|setmore\.com|calendly\.com|simplybook\.|squareup\.com|square\.site|vagaro\.com|mindbodyonline\.com|schedulista|acuityscheduling\.com|setster|zenoti\.com/;
const SOCIAL = /instagram\.com|facebook\.com|tiktok\.com|youtube\.com|x\.com|twitter\.com|linkedin\.com|pinterest\./;

/** The site to read: the argument, or the own site the booking step found. */
function target() {
  if (process.argv[2]) return process.argv[2];
  const file = join(root, '.jtakeit', 'booking.json');
  if (!existsSync(file)) die('no url given and no .jtakeit/booking.json — run jt-booking first, or jt-site <url>');
  const found = JSON.parse(readFileSync(file, 'utf8'));
  if (found.kind === 'site' && found.link) return found.link;
  for (const page of found.pages ?? []) {
    for (const other of page.business?.elsewhere ?? []) if (!SOCIAL.test(other) && !PLATFORMS.test(other)) return other;
  }
  for (const link of found.hub ?? []) if (!SOCIAL.test(link) && !PLATFORMS.test(link)) return link;
  console.log('site     none — the bio link is a booking platform or a messenger, and it names no site of its own');
  process.exit(0);
}

const start = new URL(target());
const chromium = await loadChromium(die);
const browser = await chromium.launch();
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  locale: 'en-US',
});

/** One page, read in the browser. */
async function read(url) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
    return await page.evaluate(() => {
      const text = (el) => (el?.innerText || '').replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((s) => {
          try {
            return JSON.parse(s.textContent);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      // Prices as rows: the smallest element whose text holds an amount, read
      // with the words around it — «Haircut 45 min € 48».
      const MONEY = /(?:€|£|\$|CHF|EUR|USD|GBP|Fr\.)\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?(?:€|£|CHF|EUR|USD|GBP|Fr\.|,-)/;
      const rows = [];
      for (const el of document.querySelectorAll('li, tr, p, div, dd, span')) {
        const t = text(el);
        if (!t || t.length > 160 || !MONEY.test(t) || /(€|£|\$|CHF)\s?0[.,]00/.test(t)) continue;
        if ([...el.children].some((c) => MONEY.test(text(c)) && text(c).length < t.length)) continue;
        const row = t.replace(/\n+/g, ' · ');
        if (!rows.includes(row)) rows.push(row);
      }
      const DAYS = /\b(?:(?:mon|tue|wed|thu|fri|sat|sun)(?:day|\.|\b)|tues|thurs|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i;
      const hours = text(document.body)
        .split('\n')
        .filter((l) => DAYS.test(l) && /\d{1,2}[:.]\d{2}|closed|gesloten|geschlossen|fermé/i.test(l) && l.length < 120);
      const links = [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, label: text(a).slice(0, 60), nav: Boolean(a.closest('header, nav, footer')) }));
      const pictures = [...document.querySelectorAll('img')]
        .filter((img) => img.naturalWidth >= 600 && img.naturalHeight >= 400)
        .map((img) => ({ src: img.currentSrc || img.src, width: img.naturalWidth, height: img.naturalHeight, alt: img.alt || '' }));
      return {
        title: document.title,
        headings: [...document.querySelectorAll('h1, h2, h3')].map(text).filter(Boolean).slice(0, 40),
        words: text(document.querySelector('main') || document.body).slice(0, 6000),
        prices: rows.slice(0, 60),
        hours: [...new Set(hours)].slice(0, 14),
        phones: [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href').slice(4).trim()))],
        emails: [...new Set([...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href').slice(7).split('?')[0]))],
        ld,
        links,
        pictures,
      };
    });
  } catch (e) {
    return { error: String(e).slice(0, 160) };
  } finally {
    await page.close();
  }
}

const pages = [];
const queue = [start.href];
const seen = new Set();
while (queue.length && pages.length < MOST) {
  const url = queue.shift();
  const key = url.replace(/#.*$/, '').replace(/\/$/, '');
  if (seen.has(key)) continue;
  seen.add(key);
  const page = await read(url);
  pages.push({ url, ...page });
  if (pages.length === 1 && page.links) {
    // The menu: links in the header, the nav and the footer, on this site, not a file.
    for (const link of page.links) {
      try {
        const u = new URL(link.href);
        if (u.host.replace(/^www\./, '') !== start.host.replace(/^www\./, '') || !link.nav) continue;
        if (/\.(pdf|jpe?g|png|zip)$/i.test(u.pathname) || /^(mailto|tel):/.test(link.href)) continue;
        // A shop's machinery and the legal pages say nothing about the business.
        if (/(cart|checkout|basket|my-account|account|login|wishlist|terms|privacy|gdpr|cookie|imprint|impressum|legal|agb|datenschutz)/i.test(u.pathname)) continue;
        queue.push(u.href.replace(/#.*$/, ''));
      } catch {
        /* not a link */
      }
    }
  }
}
await browser.close();

// ---- what the business published, across every page -----------------------
const all = (f) => [...new Set(pages.flatMap((p) => p[f] ?? []))];
const nodes = pages.flatMap((p) => (p.ld ?? []).flatMap((d) => [d].flat().flatMap((x) => x['@graph'] ?? [x])));
const business = nodes.find((n) => /LocalBusiness|HairSalon|BeautySalon|Barber|HealthAndBeauty|Store|Restaurant|Bakery|CafeOrCoffeeShop|TattooParlor|Organization/.test([n['@type']].flat().join(' ')));
const address = business?.address ?? {};
const booking = [...new Set(pages.flatMap((p) => (p.links ?? []).map((l) => l.href)).filter((h) => PLATFORMS.test(h)))];

const facts = {
  phones: [...new Set([...all('phones'), business?.telephone].filter(Boolean))],
  prices: [...new Set(all('prices').flatMap((row) => [...row.matchAll(/(\d+)(?:[.,](\d{1,2}))?/g)].map((m) => Number(m[1]))).filter((n) => n > 0 && n < 2000))],
  // «8:15am – 5:15pm» is 08:15 and 17:15.
  times: [...new Set(all('hours').flatMap((l) => [...l.matchAll(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/gi)].map(([, h, m, half]) => {
    let hour = Number(h) % (half ? 12 : 24);
    if (half && half.toLowerCase() === 'pm') hour += 12;
    return `${String(hour).padStart(2, '0')}:${m}`;
  })))],
  streets: [address.streetAddress].filter(Boolean).map((s) => String(s).toLowerCase()),
  postcodes: [address.postalCode].filter(Boolean).map(String),
};

const out = {
  site: start.href,
  read_at: new Date().toISOString(),
  pages: pages.map(({ links, ld, ...p }) => ({ ...p, structured: Boolean(ld?.length) })),
  booking,
  business: business ? { name: business.name ?? null, address, telephone: business.telephone ?? null, hours: business.openingHoursSpecification ?? business.openingHours ?? null } : null,
  facts,
  pictures: [...new Map(pages.flatMap((p) => p.pictures ?? []).map((pic) => [pic.src, pic])).values()].slice(0, 80),
};
mkdirSync(join(root, '.jtakeit'), { recursive: true });
writeFileSync(join(root, '.jtakeit', 'site-today.json'), `${JSON.stringify(out, null, 2)}\n`);

console.log(`site     ${start.href} — ${pages.length} page(s) read`);
for (const p of pages) console.log(`page     ${p.url}${p.error ? ` — could not be read: ${p.error}` : ` — ${p.title?.slice(0, 60) ?? ''}`}`);
console.log(`prices   ${all('prices').length} row(s)${all('prices').length ? `: ${all('prices').slice(0, 4).join(' | ')}${all('prices').length > 4 ? ' …' : ''}` : ''}`);
if (all('hours').length) console.log(`hours    ${all('hours').slice(0, 3).join(' | ')}`);
if (facts.phones.length) console.log(`phone    ${facts.phones.join(', ')}`);
if (all('emails').length) console.log(`email    ${all('emails').join(', ')}`);
if (business?.address?.streetAddress) console.log(`address  ${[address.streetAddress, address.postalCode, address.addressLocality].filter(Boolean).join(', ')}`);
if (booking.length) console.log(`books on ${booking.slice(0, 3).join(', ')}`);
console.log(`pictures ${out.pictures.length} large enough to use (600 px and up)`);
console.log(`\nwritten  .jtakeit/site-today.json — the facts in it are published by the business, and jt-check passes them`);
