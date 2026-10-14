#!/usr/bin/env node
/**
 * jt-photos — turn a scraped feed into a library somebody can choose from.
 *
 * Stage 0's other half. `jtakeit-sites:prospect` decides who the business is by
 * reading; this decides what we can build with by measuring — and the two jobs
 * were being done in one pass, badly, by looking at a hundred and fifty
 * thumbnails one at a time.
 *
 * The split is the point. A model cannot tell 640px from 1440px in a preview,
 * cannot see focus in a downscale, and cannot remember that it has already seen
 * this shelf eleven times — those are arithmetic. What it can do, and what
 * nothing else can, is say whose face that is, whether the room is the room
 * they work in now, and which single frame belongs at the top of the page. So:
 *
 *   the script      downloads, measures, de-duplicates, ranks, contact-sheets
 *   the model       looks at the first sheet, opens five files, writes the portrait
 *
 *   jt-photos                       # everything, from .jtakeit/instagram-posts.json
 *   jt-photos --frames              # also cut stills out of the reels
 *   jt-photos --sheet               # re-draw the contact sheets, measure nothing
 *   jt-photos --per-sheet 60        # cells per sheet (default 40)
 *   jt-photos --limit 120           # stop sheeting below this rank (default 400)
 *   jt-photos --force               # download again, ignoring what is on disk
 *
 * Writes `.jtakeit/photos/`, `.jtakeit/photos.json`, `.jtakeit/captions.md`
 * and `.jtakeit/contact-sheet-N.png`. All of it inside `.jtakeit/`, which never
 * reaches the build; the photographs themselves are kept out of git.
 *
 * **Instagram's media URLs are signed and they expire**, usually within a day
 * or two of the scrape. This runs immediately after the scrape or not at all;
 * a wall of 403s means re-run the Actor, not retry harder.
 *
 * Needs the playwright package, which lives in scripts/.deps alongside
 * jt-pitch, and ffmpeg only for --frames.
 */

import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadChromium } from './lib/browser.mjs';
import { STATE_DIR, findRoot } from './lib/state.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const flag = (n, d = undefined) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};

function die(message) {
  console.error(`jt-photos: ${message}`);
  process.exit(1);
}

const root = findRoot() ?? process.cwd();
const dir = join(root, STATE_DIR);
const photosDir = join(dir, 'photos');
const postsPath = flag('posts', join(dir, 'instagram-posts.json'));

if (!existsSync(postsPath)) {
  die(
    `no ${postsPath}.\nRun apify/instagram-post-scraper first — see jtakeit-sites:prospect → references/apify.md.`,
  );
}

let posts;
try {
  posts = JSON.parse(readFileSync(postsPath, 'utf8'));
} catch (e) {
  die(`${postsPath} is not readable JSON — ${e.message}`);
}
if (!Array.isArray(posts) || !posts.length) die('the scrape holds no posts');

mkdirSync(photosDir, { recursive: true });

// --- what is in the feed ----------------------------------------------------
//
// A carousel's frames live in childPosts and a carousel can mix stills with
// video, so the children are filtered by type as well. The file name carries
// the date and the shortcode: a photograph in this directory can always be
// traced back to the post it came from, which is what the portrait's source
// lines are made of.

const iso = (post) => (post.timestamp ?? '').slice(0, 10) || 'undated';
const slug = (post, index) => `${iso(post)}_${post.shortCode ?? post.id ?? 'x'}_${index}`;

const stills = [];
const reels = [];

for (const post of posts) {
  const common = {
    shortCode: post.shortCode ?? post.id ?? '',
    date: iso(post),
    url: post.url ?? '',
    likes: Number(post.likesCount) || 0,
    comments: Number(post.commentsCount) || 0,
    location: post.locationName ?? '',
    caption: (post.caption ?? '').replace(/\s+/g, ' ').trim(),
  };

  if (post.type === 'Video') {
    if (post.videoUrl) reels.push({ ...common, videoUrl: post.videoUrl, views: Number(post.videoViewCount) || 0 });
    continue;
  }

  const children = Array.isArray(post.childPosts) ? post.childPosts.filter((c) => c.type !== 'Video') : [];
  const sources = children.length
    ? children.map((c) => c.displayUrl).filter(Boolean)
    : [post.displayUrl].filter(Boolean);

  sources.forEach((src, i) => {
    stills.push({
      ...common,
      name: `${slug(post, i)}.jpg`,
      src,
      kind: 'photo',
      // What the feed claims. Kept because the measured value sometimes differs
      // — a re-uploaded picture reports the original's dimensions.
      declared: [Number(post.originalWidth) || Number(post.dimensionsWidth) || 0, Number(post.originalHeight) || Number(post.dimensionsHeight) || 0],
    });
  });
}

console.log(`Project · ${root}`);
console.log(
  `${posts.length} posts · ${stills.length} still frame(s) in ${posts.filter((p) => p.type !== 'Video').length} photo post(s) · ${reels.length} reel(s)`,
);

// --- download ---------------------------------------------------------------

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

async function download(items) {
  let saved = 0;
  let skipped = 0;
  const failed = [];
  const queue = [...items];

  const worker = async () => {
    while (queue.length) {
      const item = queue.shift();
      const file = join(photosDir, item.name);
      if (!has('force') && existsSync(file) && statSync(file).size > 1024) {
        skipped++;
        continue;
      }
      try {
        const res = await fetch(item.src, { headers: { 'user-agent': UA } });
        if (!res.ok) {
          failed.push(`${item.name} — HTTP ${res.status}`);
          continue;
        }
        writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        saved++;
      } catch (e) {
        failed.push(`${item.name} — ${e.message}`);
      }
    }
  };

  // Six at a time: enough to saturate the link, few enough that the CDN does
  // not start refusing.
  await Promise.all(Array.from({ length: 6 }, worker));
  return { saved, skipped, failed };
}

if (!has('sheet')) {
  const { saved, skipped, failed } = await download(stills);
  console.log(`downloaded ${saved}, already had ${skipped}${failed.length ? `, failed ${failed.length}` : ''}`);
  // Signed URLs expire together, so a handful of failures is the network and a
  // wall of them is the scrape being too old to use.
  if (failed.length && failed.length > stills.length * 0.5) {
    console.error('');
    failed.slice(0, 3).forEach((f) => console.error(`  ${f}`));
    die(
      'most downloads failed — the media URLs in this scrape have expired.\nRe-run apify/instagram-post-scraper and run this straight afterwards.',
    );
  }
}

// --- frames out of the reels ------------------------------------------------
//
// A feed that moved to video years ago still has to yield a hero. The Actor's
// own thumbnail is a 640px auto-frame, usually mid-motion; ffmpeg's `thumbnail`
// filter picks representative frames out of the real file instead.
//
// **Reel URLs go stale faster than photo URLs** — measured on a two-day-old
// scrape whose every `displayUrl` still served and whose every `videoUrl`
// returned 403. So this is the part that has to run within the hour, and two
// refusals in a row are taken as the answer rather than as a reason to try the
// other six.

const usableSoFar = () => readdirSync(photosDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).length;

if (has('frames') || (!has('sheet') && usableSoFar() < 12 && reels.length)) {
  const perReel = Number(flag('per-reel', 4)) || 4;
  const take = reels.sort((a, b) => b.views + b.likes - (a.views + a.likes)).slice(0, Number(flag('reels', 8)) || 8);
  console.log(`cutting ${perReel} frame(s) out of each of ${take.length} reel(s) — this is the slow part`);
  let refused = 0;
  for (const reel of take) {
    const pattern = join(photosDir, `${reel.date}_${reel.shortCode}_v%d.jpg`);
    if (!has('force') && existsSync(join(photosDir, `${reel.date}_${reel.shortCode}_v1.jpg`))) continue;
    try {
      execFileSync(
        'ffmpeg',
        [
          '-loglevel', 'error',
          '-user_agent', UA,
          '-y',
          '-i', reel.videoUrl,
          '-vf', 'thumbnail=100,scale=1080:-1',
          '-frames:v', String(perReel),
          '-vsync', '0',
          pattern,
        ],
        { stdio: ['ignore', 'ignore', 'pipe'] },
      );
      refused = 0;
    } catch (e) {
      const why = String(e.stderr || e.message).trim().split('\n').slice(-1)[0];
      if (/403|Forbidden/.test(why)) {
        if (++refused >= 2) {
          console.error('  the reel URLs in this scrape have expired — re-run the Actor and cut frames straight after.');
          break;
        }
      } else {
        console.error(`  ${reel.shortCode}: ${why}`);
      }
    }
  }
}

// --- measure ----------------------------------------------------------------


const files = readdirSync(photosDir)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort();
if (!files.length) die('no photographs on disk. Nothing downloaded, and no --frames run.');

const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const port = Number(flag('port', 4487));
const server = createServer((req, res) => {
  const file = join(photosDir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  // Read before writing the header: a directory or a missing file throws, and
  // the 404 cannot be sent once a 200 has gone out.
  let body;
  try {
    body = readFileSync(file);
  } catch {
    res.writeHead(404).end('');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream' });
  res.end(body);
}).listen(port);

const chromium = await loadChromium(die);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' }).catch(() => {});

/**
 * Everything a script can know about a photograph, in one pass over its pixels.
 *
 * Sharpness is measured on a **native-resolution centre crop**, not on the
 * thumbnail: focus lives in the high frequencies, and a downscale is exactly
 * the operation that throws them away. Measure a blurred 1440px photo small
 * enough and it looks as crisp as anything.
 */
const measurements = [];
for (const name of files) {
  const m = await page
    .evaluate(async (file) => {
      const img = new Image();
      img.src = `/${file}`;
      await img.decode();
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      const grey = (data) => {
        const g = new Float64Array(data.length / 4);
        for (let i = 0; i < g.length; i++) {
          g[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
        }
        return g;
      };

      // 1. Focus, off a 1:1 centre crop.
      const crop = Math.min(256, W, H);
      const cc = document.createElement('canvas');
      cc.width = crop;
      cc.height = crop;
      const cctx = cc.getContext('2d', { willReadFrequently: true });
      cctx.drawImage(img, Math.round((W - crop) / 2), Math.round((H - crop) / 2), crop, crop, 0, 0, crop, crop);
      const cg = grey(cctx.getImageData(0, 0, crop, crop).data);
      let sum = 0;
      let sumSq = 0;
      let n = 0;
      for (let y = 1; y < crop - 1; y++) {
        for (let x = 1; x < crop - 1; x++) {
          const i = y * crop + x;
          const lap = 4 * cg[i] - cg[i - 1] - cg[i + 1] - cg[i - crop] - cg[i + crop];
          sum += lap;
          sumSq += lap * lap;
          n++;
        }
      }
      const sharpness = n ? sumSq / n - (sum / n) ** 2 : 0;

      // 2. Tone and palette, off a small copy — colour is a low-frequency
      //    property and a 96px version answers it as well as the original.
      const tw = 96;
      const th = Math.max(1, Math.round((tw * H) / W));
      const tc = document.createElement('canvas');
      tc.width = tw;
      tc.height = th;
      const tctx = tc.getContext('2d', { willReadFrequently: true });
      tctx.drawImage(img, 0, 0, tw, th);
      const data = tctx.getImageData(0, 0, tw, th).data;
      const tg = grey(data);
      let lum = 0;
      for (const v of tg) lum += v;
      lum /= tg.length;
      let variance = 0;
      for (const v of tg) variance += (v - lum) ** 2;
      const contrast = Math.sqrt(variance / tg.length);

      // Buckets of 32 per channel: coarse enough that a gradient collapses into
      // one entry, fine enough to keep two nearby browns apart.
      const buckets = new Map();
      for (let i = 0; i < data.length; i += 4) {
        const key = `${data[i] >> 5}_${data[i + 1] >> 5}_${data[i + 2] >> 5}`;
        const b = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
        b.n++;
        b.r += data[i];
        b.g += data[i + 1];
        b.b += data[i + 2];
        buckets.set(key, b);
      }
      const hex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
      const palette = [...buckets.values()]
        .sort((a, b) => b.n - a.n)
        .slice(0, 5)
        .map((b) => ({
          hex: `#${hex(b.r / b.n)}${hex(b.g / b.n)}${hex(b.b / b.n)}`,
          share: Math.round((b.n / (tw * th)) * 100),
        }));

      // 3. Average hash, for "we have seen this shelf eleven times".
      const hc = document.createElement('canvas');
      hc.width = 8;
      hc.height = 8;
      const hctx = hc.getContext('2d', { willReadFrequently: true });
      hctx.drawImage(img, 0, 0, 8, 8);
      const hg = grey(hctx.getImageData(0, 0, 8, 8).data);
      const mean = hg.reduce((a, b) => a + b, 0) / hg.length;
      let bits = '';
      for (const v of hg) bits += v > mean ? '1' : '0';
      const hash = bits
        .match(/.{8}/g)
        .map((byte) => parseInt(byte, 2).toString(16).padStart(2, '0'))
        .join('');

      return { width: W, height: H, sharpness, luminance: lum, contrast, palette, hash };
    }, name)
    .catch((e) => ({ error: e.message.split('\n')[0] }));

  measurements.push({ name, ...m });
}

await page.close();

// --- rank -------------------------------------------------------------------
//
// The score decides what goes on the contact sheet and in what order. It is
// deliberately explainable — four terms, no tuning beyond what is written here
// — because its job is to put the good frames in front of a person, not to
// decide anything on its own. Nothing is deleted: a frame the score dislikes
// stays in photos.json with its numbers, so a human can overrule it.

const byName = new Map(stills.map((s) => [s.name, s]));
const now = Date.now();
const sharpValues = measurements.map((m) => m.sharpness ?? 0).sort((a, b) => a - b);
const sharpAt = (v) => {
  const i = sharpValues.findIndex((s) => s >= v);
  return sharpValues.length ? (i === -1 ? 1 : i / sharpValues.length) : 0;
};
const maxEngagement = Math.max(1, ...stills.map((s) => s.likes + s.comments * 3));

const frames = measurements.map((m) => {
  const meta = byName.get(m.name) ?? {};
  const video = /_v\d+\.jpe?g$/i.test(m.name);
  const date = meta.date ?? m.name.slice(0, 10);
  const long = Math.max(m.width ?? 0, m.height ?? 0);
  const ageDays = Number.isNaN(Date.parse(date)) ? 999 : (now - Date.parse(date)) / 86_400_000;
  const engagement = (meta.likes ?? 0) + (meta.comments ?? 0) * 3;

  const score =
    Math.min(long / 1600, 1) * 40 +
    sharpAt(m.sharpness ?? 0) * 30 +
    (engagement / maxEngagement) * 20 +
    Math.max(0, 1 - ageDays / 1095) * 10;

  const reasons = [];
  if (long < 1000) reasons.push(`only ${long}px on its long side`);
  if ((m.sharpness ?? 0) < 30) reasons.push('soft — blurred, or shot through motion');
  if ((m.luminance ?? 128) < 40) reasons.push('very dark');
  if ((m.luminance ?? 128) > 225) reasons.push('blown out');

  return {
    ...m,
    date,
    video,
    shortCode: meta.shortCode ?? '',
    url: meta.url ?? '',
    likes: meta.likes ?? 0,
    comments: meta.comments ?? 0,
    location: meta.location ?? '',
    caption: (meta.caption ?? '').slice(0, 300),
    orientation: !m.width ? 'unknown' : m.width / m.height > 1.05 ? 'landscape' : m.width / m.height < 0.95 ? 'portrait' : 'square',
    heroCapable: long >= 1200 && (m.sharpness ?? 0) >= 30,
    concerns: reasons,
    score: Math.round(score),
  };
});

frames.sort((a, b) => b.score - a.score);

// Near-duplicates. Kept, not dropped — but marked, so the sheet does not spend
// eleven of its forty cells on the same shelf.
const distance = (a, b) => {
  if (!a || !b || a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i += 2) {
    let x = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
};
const kept = [];
for (const frame of frames) {
  const twin = kept.find((k) => distance(k.hash, frame.hash) <= 5);
  frame.duplicateOf = twin ? twin.name : null;
  if (!twin) kept.push(frame);
}

// --- what comes out ---------------------------------------------------------

const usable = frames.filter((f) => !f.duplicateOf && f.heroCapable);
const dates = frames.map((f) => f.date).filter((d) => !Number.isNaN(Date.parse(d))).sort();

writeFileSync(
  join(dir, 'photos.json'),
  `${JSON.stringify(
    {
      scrapedFrom: postsPath,
      posts: posts.length,
      frames: frames.length,
      distinct: kept.length,
      heroCapable: usable.length,
      span: dates.length ? [dates[0], dates[dates.length - 1]] : [],
      photos: frames,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

// The captions, as one readable file. The portrait is written from these, and
// reading them here costs a fraction of reading the raw scrape — which carries
// a megabyte of ids, URLs and image variants around every sentence.
const digest = posts
  .filter((p) => (p.caption ?? '').trim())
  .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
  .map((p) => {
    const head = `### ${iso(p)} · ${p.type} · ♥ ${p.likesCount ?? 0} · ${p.commentsCount ?? 0} comment(s)${p.locationName ? ` · ${p.locationName}` : ''}`;
    const talk = (p.latestComments ?? [])
      .slice(0, 3)
      .map((c) => `- «${(c.text ?? '').replace(/\s+/g, ' ').trim()}»`)
      .filter((l) => l.length > 4);
    return [head, '', p.caption.trim(), talk.length ? `\n_Comments:_\n${talk.join('\n')}` : ''].join('\n');
  })
  .join('\n\n');

const locations = {};
for (const p of posts) if (p.locationName) locations[p.locationName] = (locations[p.locationName] ?? 0) + 1;
const places = Object.entries(locations).sort((a, b) => b[1] - a[1]);

writeFileSync(
  join(dir, 'captions.md'),
  `# @${posts[0]?.ownerUsername ?? ''} — captions\n\n` +
    `${posts.length} posts, ${digest.split('### ').length - 1} with a caption. ` +
    `Written for reading, generated from ${postsPath.split('/').pop()}.\n\n` +
    (places.length ? `Locations tagged: ${places.map(([n, c]) => `${n} (${c})`).join(', ')}\n\n` : '') +
    `${digest}\n`,
  'utf8',
);

// --- the contact sheet ------------------------------------------------------
//
// One image instead of a hundred and fifty. The number in the corner is what
// makes it usable: it is how a person says "open 7, 12 and 31" without anybody
// having to describe a photograph in words.

const PER_SHEET = Number(flag('per-sheet', 40)) || 40;

/*
 * Every distinct frame gets a cell.
 *
 * It used to be the best eighty, which is two sheets whether the account has
 * ninety posts or four hundred — and on a big feed that meant the ranking was
 * not ordering the sheets, it was deciding which frames a person was allowed to
 * see. That is precisely what the score is documented not to do, and the
 * "a human can overrule it" escape was a 300-entry JSON nobody opens.
 *
 * More sheets cost the reader nothing, because the order already puts the best
 * first: whoever stops after sheet 1 sees exactly what they saw before, and
 * whoever is hunting for the one frame of their treatment room can keep going.
 *
 * The ceiling is a guard against a pathological feed rather than an opinion,
 * and when it bites it says so — a cap nobody is told about reads as "that was
 * everything".
 */
const CEILING = Number(flag('limit', 400)) || 400;
const shortlist = kept.slice(0, CEILING);
const unsheeted = kept.length - shortlist.length;
const sheets = [];

for (let i = 0; i < shortlist.length; i += PER_SHEET) {
  const chunk = shortlist.slice(i, i + PER_SHEET);
  const cells = chunk
    .map((f, j) => {
      const index = i + j + 1;
      const facts = [
        `${f.width}×${f.height}`,
        f.date.slice(0, 7),
        f.likes ? `♥${f.likes}` : '',
        f.video ? 'reel frame' : '',
        f.concerns.length ? '⚠︎' : '',
      ]
        .filter(Boolean)
        .join(' · ');
      /*
       * Which file this cell is. The number is how a person *says* "open 7";
       * it was not how they could *find* it — the cells are the de-duplicated
       * frames and photos.json lists all of them, so the two do not line up and
       * the next step in this script's own instructions had no map. The date is
       * already in the facts line, so the rest of the name is enough.
       */
      const file = f.name.replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/\.jpe?g$/i, '');
      return `<figure><span class="n">${index}</span><img src="/${f.name}" /><figcaption>${facts}<br><span class="f">${file}</span></figcaption></figure>`;
    })
    .join('');

  await page.goto('about:blank').catch(() => {});
  const sheetPage = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await sheetPage.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await sheetPage.setContent(
    `<!doctype html><meta charset="utf-8"><style>
      body { margin:0; padding:12px; background:#111; color:#ddd;
             font:12px/1.3 -apple-system, system-ui, sans-serif;
             display:grid; grid-template-columns:repeat(5,1fr); gap:10px; }
      figure { margin:0; position:relative; }
      img { display:block; width:100%; height:190px; object-fit:cover; background:#222; border-radius:3px; }
      .n { position:absolute; top:4px; left:4px; padding:1px 6px; border-radius:3px;
           background:#000c; color:#fff; font-weight:700; font-size:13px; }
      figcaption { padding-top:4px; color:#9a9a9a; font-size:11px; white-space:nowrap; overflow:hidden; }
      .f { color:#6d6d6d; font-size:10px; }
    </style>${cells}`,
    { waitUntil: 'networkidle' },
  );
  const file = join(dir, `contact-sheet-${sheets.length + 1}.png`);
  await sheetPage.screenshot({ path: file, fullPage: true });
  await sheetPage.close();
  sheets.push(file);
}

await browser.close();
server.close();

// --- report -----------------------------------------------------------------

/*
 * `.jtakeit/` is committed — the stage is written down, not remembered — and
 * this script has just put tens of megabytes of someone else's photographs in
 * it. New projects ignore them by scaffold; an older one is told rather than
 * edited behind its back.
 */
{
  const ignorePath = join(root, '.gitignore');
  const rules = [`${STATE_DIR}/photos/`, `${STATE_DIR}/contact-sheet-*.png`];
  const current = existsSync(ignorePath) ? readFileSync(ignorePath, 'utf8') : '';
  const missing = rules.filter((r) => !current.includes(r));
  if (missing.length && existsSync(join(root, '.git'))) {
    console.log('');
    console.log('  The photo library is not ignored by git. Add to .gitignore:');
    missing.forEach((r) => console.log(`    ${r}`));
    console.log('  (photos.json and captions.md stay — they are small and they carry the sources)');
  }
}

const shape = { portrait: 0, landscape: 0, square: 0, unknown: 0 };
for (const f of kept) shape[f.orientation]++;

console.log('');
console.log(`  ${frames.length} frame(s) measured, ${frames.length - kept.length} near-duplicate(s) folded away`);
console.log(`  ${usable.length} hero-capable (≥1200px and in focus) · ${shape.portrait} portrait, ${shape.landscape} landscape, ${shape.square} square`);
if (dates.length) console.log(`  the pictures span ${dates[0]} → ${dates[dates.length - 1]}`);
if (usable.length < 8 && reels.length && !has('frames'))
  console.log(`  only ${usable.length} of them can carry a hero — run again with --frames to cut stills out of the ${reels.length} reel(s)`);
if (places.length) console.log(`  location tags: ${places.slice(0, 3).map(([n, c]) => `${n} (${c})`).join(', ')}`);

/*
 * Their palette, off their own photographs.
 *
 * This is the answer to `HeroField`'s required `colors`, and to the portrait's
 * Colour and material section — both of which were being filled in by squinting
 * at thumbnails. The colours are merged by distance rather than by exact value:
 * six shades of the same near-black is what the raw counts produce, and it is
 * not a palette.
 */
const weights = {};
for (const f of kept.slice(0, 12)) for (const c of f.palette ?? []) weights[c.hex] = (weights[c.hex] ?? 0) + c.share;
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const apart = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dominant = [];
for (const [hex] of Object.entries(weights).sort((a, b) => b[1] - a[1])) {
  const rgb = rgbOf(hex);
  if (dominant.some((d) => apart(rgbOf(d), rgb) < 40)) continue;
  dominant.push(hex);
  if (dominant.length === 5) break;
}
if (dominant.length) {
  console.log(`  their colours, off the twelve best frames: ${dominant.join(' ')}`);
  console.log('    (the starting point for HeroField\'s palette and the portrait — check them against the frames)');
}

console.log('');
console.log(`  ${STATE_DIR}/photos.json      every frame, measured`);
console.log(`  ${STATE_DIR}/captions.md      the feed as text, for the voice`);
sheets.forEach((file, i) => {
  const from = i * PER_SHEET + 1;
  const to = Math.min((i + 1) * PER_SHEET, shortlist.length);
  console.log(`  ${file.replace(`${root}/`, '')}   ranks ${from}–${to}${i ? '' : '  ← start here'}`);
});
console.log(
  `  ${shortlist.length} distinct frame(s) over ${sheets.length} sheet(s), best first. ` +
    'Sheet 1 is the best ' + PER_SHEET + '; the rest are the tail, in the same order.',
);
if (unsheeted)
  console.log(
    `  ⚠ ${unsheeted} distinct frame(s) rank below ${CEILING} and are on no sheet — ` +
      'run again with --limit to include them.',
  );
console.log('');
console.log('Now the half a script cannot do: open sheet 1, and for each number worth it,');
console.log(`open ${STATE_DIR}/photos/<date>_<name>.jpg at full size — the name is under the cell —`);
console.log('and answer —');
console.log('  · is the owner in this frame, or a customer?');
console.log('  · is that the room they work in now?');
console.log('  · is this picture about the work, or beside it?');
console.log('  · which single frame belongs at the top of the page?');
