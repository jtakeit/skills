#!/usr/bin/env node
/**
 * jt-source — turn one Instagram keyword sweep into a reviewed lead list.
 *
 * The mechanical half of sourcing. It does the part that must be identical
 * every time — dedupe, drop the dead, score the obvious, emit the columns —
 * and refuses to do the part that needs eyes: deciding whether an account is
 * one person or a room full of them. Rules propose, a human or Claude disposes.
 *
 *   jt-source --sweep sweep.json --dataset 5q6Zz2kMSuFGmn77p
 *   jt-source --sweep sweep.json --in raw.json
 *
 * --dataset pulls the Actor's dataset over the Apify API: a run's dataset is
 * read by its id, and APIFY_TOKEN, when it is in the environment, is sent for
 * an account whose storages are restricted. --in reads a file that was already
 * saved — the Apify MCP server's dataset output, written to raw.json. Either
 * way the raw dump is written next to the outputs, because re-reading it is
 * free and re-running the Actor is not.
 *
 * Writes, beside sweep.json:
 *   raw.json    the scrape, untouched            (with --dataset)
 *   leads.json  every survivor, every field
 *   leads.csv   the same, for the archive
 *   sheet.csv   the columns that go to the Sheet, emoji stripped
 *
 * Exit code is the number of rows still labelled "unclear" — that is the size
 * of the reading job, not an error.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { personalName } from './lib/names.mjs';

const argv = process.argv.slice(2);
const flag = (name, fallback = undefined) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const sweepPath = resolve(flag('sweep', 'sweep.json'));
const outDir = dirname(sweepPath);
const datasetId = flag('dataset');
const inPath = flag('in');

let sweep;
try {
  sweep = JSON.parse(readFileSync(sweepPath, 'utf8'));
} catch {
  console.error(`jt-source: cannot read ${sweepPath} — see skills/sourcing/references/sweep.md`);
  process.exit(1);
}

const need = (key) => {
  const value = sweep[key];
  if (!Array.isArray(value) || value.length === 0) {
    console.error(`jt-source: sweep.json needs a non-empty "${key}" list`);
    process.exit(1);
  }
  return value.map((s) => s.toLowerCase());
};

const SERVICE = need('service');
const GEO = need('geo');
const SOLO = (sweep.solo ?? []).map((s) => s.toLowerCase());
const TEAM = (sweep.team ?? []).map((s) => s.toLowerCase());
const TEACH = (sweep.teach ?? []).map((s) => s.toLowerCase());

// Words that name a house rather than a person, in any of these markets. They
// are the same everywhere, so they are built in rather than retyped per sweep.
const HOUSE = ['studio', 'salon', 'clinic', 'centre', 'center', 'academy', 'institut'];

// Default cutoff: six months. An account that has not posted since then is not
// running a business we can sell a website to this month.
const since =
  flag('since') ??
  sweep.since ??
  new Date(Date.now() - 183 * 864e5).toISOString().slice(0, 10);

// ─── the scrape ──────────────────────────────────────────────────────────────

let raw;
if (datasetId) {
  const token = process.env.APIFY_TOKEN;
  const url = `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true`;
  const response = await fetch(url, token ? { headers: { authorization: `Bearer ${token}` } } : {});
  if (!response.ok) {
    console.error(`jt-source: dataset ${datasetId} → HTTP ${response.status}`);
    if ((response.status === 401 || response.status === 403) && !token)
      console.error('  this account\'s storages are restricted: save the dataset through the Apify MCP server into raw.json and pass --in raw.json,\n  or put an Apify token (console.apify.com/settings/integrations) in APIFY_TOKEN');
    process.exit(1);
  }
  raw = await response.json();
  writeFileSync(join(outDir, 'raw.json'), JSON.stringify(raw));
} else if (inPath) {
  raw = JSON.parse(readFileSync(resolve(inPath), 'utf8'));
} else {
  console.error('jt-source: needs --dataset <id> or --in raw.json');
  process.exit(1);
}
if (!Array.isArray(raw)) {
  console.error('jt-source: expected an array of profile records');
  process.exit(1);
}

// ─── the filters ─────────────────────────────────────────────────────────────

const lower = (v) => (v ?? '').toString().toLowerCase();
const hits = (haystack, needles) => needles.filter((n) => haystack.includes(n));
const flatten = (bio) =>
  (bio ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' / ');

// Google Sheets' CSV import mangles astral-plane characters, so the sheet copy
// loses the emoji. The archive copy keeps them.
const deEmoji = (s) => (s ?? '').replace(/[\u{10000}-\u{10FFFF}]/gu, '').replace(/\s{2,}/g, ' ').trim();

// A number written into the bio by hand, in whatever format the country uses:
// +41 44 123 45 67, 044 123 45 67, (067) 123-45-67. Nine to fifteen digits once
// the spacing is gone — fewer is a year or a price, more is not a phone.
const phoneOf = (text) => {
  for (const m of (text ?? '').matchAll(/\+?\(?\d[\d\s\-().\/]{7,20}\d/g)) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length >= 9 && digits.length <= 15) return `${m[0].trim().startsWith('+') ? '+' : ''}${digits}`;
  }
  return '';
};

const funnel = { raw: raw.length, dupe: 0, broken: 0, private: 0, offTopic: 0, dormant: 0 };
const seen = new Set();
const rows = [];

for (const rec of raw) {
  const username = rec.username;
  if (!username) {
    funnel.broken += 1;
    continue;
  }
  if (seen.has(username)) {
    funnel.dupe += 1;
    continue;
  }
  seen.add(username);

  if (rec.error) {
    funnel.broken += 1;
    continue;
  }
  if (rec.private) {
    funnel.private += 1;
    continue;
  }

  const posts = Array.isArray(rec.latestPosts) ? rec.latestPosts : [];
  const bio = rec.biography ?? '';
  const identity = [bio, rec.fullName, username, rec.businessCategoryName].map(lower).join(' ');
  const captions = posts.slice(0, 6).map((p) => lower(p.caption).slice(0, 400)).join(' ');
  const places = posts.map((p) => lower(p.locationName)).join(' ');
  const address = rec.businessAddress
    ? [rec.businessAddress.city_name, rec.businessAddress.street_address].map(lower).join(' ')
    : '';

  const service = hits(identity, SERVICE).length > 0 || hits(captions, SERVICE).length > 0;
  const geo = hits(identity, GEO).length > 0 || hits(`${places} ${address}`, GEO).length > 0;
  if (!service || !geo) {
    funnel.offTopic += 1;
    continue;
  }

  const stamps = posts.map((p) => p.timestamp).filter(Boolean).sort();
  const lastPost = stamps.length ? stamps[stamps.length - 1].slice(0, 10) : '';
  if (!lastPost || lastPost < since) {
    funnel.dormant += 1;
    continue;
  }

  // The proposal. Two families of evidence — one person speaking, or a house
  // speaking. Agreement decides; disagreement and silence both mean "read it".
  const voice = `${lower(bio)} ${lower(rec.fullName)}`;
  const named = personalName(rec.fullName ?? '', [...SERVICE, ...GEO]);
  const soloHits = hits(voice, SOLO);
  const teamHits = hits(`${voice} ${lower(username)}`, [...TEAM, ...HOUSE]);
  const soloSaid = [...(named ? [named] : []), ...soloHits];
  let label = 'unclear';
  if (soloSaid.length && !teamHits.length) label = 'solo';
  else if (teamHits.length && !soloSaid.length) label = 'studio';

  rows.push({
    label,
    username,
    url: `https://instagram.com/${username}`,
    name: rec.fullName ?? '',
    followers: rec.followersCount ?? '',
    posts: rec.postsCount ?? '',
    lastPost,
    igCategory: rec.businessCategoryName ?? '',
    site: rec.externalUrl ? new URL(rec.externalUrl).hostname.replace(/^www\./, '') : '',
    phone: phoneOf(bio),
    teaches: hits(voice, TEACH).length ? 'yes' : '',
    evidence: (label === 'studio' ? teamHits : soloSaid).slice(0, 3).join(', '),
    note: '',
    bio: flatten(bio),
    term: rec.searchTerm ?? '',
    source: rec.searchSource ?? '',
  });
}

const order = { unclear: 0, solo: 1, studio: 2 };
rows.sort((a, b) => (order[a.label] - order[b.label]) || (b.followers - a.followers));

// ─── the outputs ─────────────────────────────────────────────────────────────

const csv = (table) =>
  table
    .map((line) =>
      line
        .map((cell) => {
          const s = `${cell ?? ''}`;
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\n') + '\n';

const FULL = [
  ['type', 'account', 'link', 'profile name', 'followers', 'posts', 'last post',
   'IG category', 'site', 'phone', 'teaches', 'evidence', 'note', 'bio', 'found by term', 'source'],
  ...rows.map((r) => [r.label, r.username, r.url, r.name, r.followers, r.posts, r.lastPost,
    r.igCategory, r.site, r.phone, r.teaches, r.evidence, r.note, r.bio, r.term, r.source]),
];

// The Sheet is a work queue, so it opens with an empty status column and drops
// the fields nobody sorts by.
const SHEET = [
  ['status', 'type', 'account', 'link', 'profile name', 'followers', 'last post',
   'site', 'phone', 'teaches', 'evidence', 'note'],
  ...rows.map((r) => ['', r.label, r.username, r.url, deEmoji(r.name), r.followers, r.lastPost,
    r.site, r.phone, r.teaches, r.evidence, deEmoji(r.note)]),
];

writeFileSync(join(outDir, 'leads.json'), JSON.stringify(rows, null, 1));
writeFileSync(join(outDir, 'leads.csv'), csv(FULL));
writeFileSync(join(outDir, 'sheet.csv'), csv(SHEET));

const counts = rows.reduce((acc, r) => ((acc[r.label] = (acc[r.label] ?? 0) + 1), acc), {});
const unclear = counts['unclear'] ?? 0;

console.log(`sweep       ${sweep.market ?? sweep.slug ?? sweepPath}`);
console.log(`terms       ${(sweep.terms ?? []).length}`);
console.log(`scraped     ${funnel.raw}`);
console.log(`  duplicate ${funnel.dupe}`);
console.log(`  broken    ${funnel.broken}`);
console.log(`  private   ${funnel.private}`);
console.log(`  off topic ${funnel.offTopic}`);
console.log(`  dormant   ${funnel.dormant}  (no post since ${since})`);
console.log(`kept        ${rows.length}`);
console.log(`  solo      ${counts['solo'] ?? 0}    proposed`);
console.log(`  studio    ${counts['studio'] ?? 0}    proposed`);
console.log(`  unclear   ${unclear}    to read`);
console.log('');
console.log(`Every label is a proposal. Read the bios before the sheet ships —`);
console.log(`the "unclear" rows first, then spot-check the rest.`);

process.exit(Math.min(unclear, 100));
