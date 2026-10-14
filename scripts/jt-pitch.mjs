#!/usr/bin/env node
/**
 * jt-pitch — record the pitch video for a spec build.
 *
 * A phone-shaped scroll through the site, a quiet music bed, and one spoken
 * line in the prospect's own language: «this is what your site could look
 * like», plus the ask. Vertical, short, and made to be sent in an Instagram DM.
 *
 *   jt-pitch --url "<the link get_preview_link gave>" --lang de-CH
 *   jt-pitch --url "<link>" --lang de-CH --music warm --out pitch.mp4
 *   jt-pitch --dist ./dist --only phone --pace 2.6      # a local build, while iterating
 *
 * **The pitch is recorded off the jtakeit preview**, the site as the platform
 * built it. A preview link opens through the panel, which sends the browser on
 * to the site and leaves a session cookie behind; the script follows it once,
 * keeps the cookie, and records the page it landed on. The edge's «Preview»
 * badge is hidden for the recording — it is chrome around the site, and the
 * voice-over is what says this is a proposal. `--url` also takes a dev server,
 * and `--dist` serves a local build, which is quicker while iterating and is
 * not the build the prospect would get.
 *
 * **Two files come out of one run**: `pitch-phone.mp4` and
 * `pitch-desktop.mp4`. The phone one is what goes in a DM — nearly everyone who
 * sees the prospect's business online sees it on a phone — and the desktop one
 * is for everywhere a landscape frame is what fits: a reply on a laptop, a
 * message with a link, a reel of your own work.
 *
 *   phone    360×800 at 3× — the commonest phone on the internet, not the one in
 *            our pocket — 1080×2400 scaled down to 864×1920 on a dark ground
 *   desktop  1440×810 at 2×, scaled by exactly 1.5 to 1920×1080, full-bleed
 *
 * Both frames are only ever resampled downwards, which is where their sharpness
 * comes from.
 *
 * **The pace is fixed and the length is not.** The frame moves at one screenful
 * every `--pace` seconds (2.4 by default) whatever the page is, so a long page
 * makes a long video rather than a fast one. Tying the scroll to a target
 * duration is how a page ends up flying past at a speed nobody can read, which
 * is a worse outcome than a video somebody stops watching at second twenty.
 *
 * **Nothing is filmed and nothing is panned.** Every frame is synthesised: the
 * page is scrolled, its clock is advanced by exactly one frame, and the viewport
 * is photographed. The page cannot move between those steps because the page's
 * clock is ours — `performance.now` and `requestAnimationFrame` are replaced
 * before any of its own script runs. So the motion is uniform by construction,
 * exactly as it was when this script panned a still, and the hero animates,
 * which it could not before: a shader photographed once is one frozen frame, and
 * the first second of the video is the whole stage.
 *
 * Needs ffmpeg on PATH and the playwright package, which is installed into
 * scripts/.deps on first run. The browsers themselves come from the shared
 * ~/Library/Caches/ms-playwright cache.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadChromium } from './lib/browser.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(HERE, '..');
/**
 * Where the voice and the music are. They are the user's own files, never in
 * the plugin's repository: `assets/pitch/` in the plugin, or — because a plugin
 * update can replace the plugin's directory — a folder of your own named by
 * `--assets <dir>` or `JT_PITCH_ASSETS`, laid out the same way (`voice/`,
 * `music/`).
 */
const ASSETS = resolve(
  (() => {
    const i = process.argv.indexOf('--assets');
    return i === -1 ? process.env.JT_PITCH_ASSETS || join(PLUGIN_ROOT, 'assets', 'pitch') : process.argv[i + 1];
  })(),
);

const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const flag = (n, d = undefined) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};

function die(message) {
  console.error(`jt-pitch: ${message}`);
  process.exit(1);
}

// --- options ---------------------------------------------------------------

const lang = flag('lang', 'en');
const out = resolve(flag('out', 'pitch.mp4'));
/**
 * Three seconds on the hero before anything moves. The hero is now alive in the
 * video rather than frozen, and three seconds is what it takes to register that
 * — it is the single most valuable stretch of the file.
 */
const holdTop = Number(flag('hold-top', 3));
const holdBottom = Number(flag('hold-bottom', 1.6));
const fps = Number(flag('fps', 60));
/**
 * Seconds per screenful — the only speed control, and it is a *pace*, not a
 * duration.
 *
 * Expressed per screen rather than in pixels per second because that is what
 * the eye actually experiences: at 2.4 a band the height of the viewport takes
 * two and a half seconds to cross, which is enough to see what it is and read
 * its heading. The page's length then decides how long the video is, and
 * nothing decides how fast it moves.
 */
const pace = Number(flag('pace', 2.4));
/**
 * When the spoken line starts. It lands *on* the hero rather than after it: with
 * a three-second hold, delaying the voice until the scroll begins opens the file
 * with three seconds of silence.
 */
const voiceAt = Number(flag('voice-at', 1));

/**
 * Multiplier on the page's own clock. 1 is honest. Above it, a field that moves
 * too slowly to read in half a minute can be made visible — at the cost of
 * showing motion the visitor will not see.
 */
const fieldSpeed = Number(flag('field-speed', 1));

/**
 * The two frames. Nothing else in the script knows a number about either.
 *
 * The desktop viewport is 1440×810 because 2× of it is exactly 1.5× of
 * 1920×1080: the crop lands on the output size without a fractional resample
 * and without padding, which is why the desktop file looks sharper than the
 * phone one despite being a wider layout.
 */
const FORMATS = {
  phone: {
    // 360×800, which is what most phones on the internet actually are — an
    // Android median rather than the iPhone in our own pocket. At 3× the frame
    // is 1080×2400 and lands on 864×1920 as a downscale; the rest of the width
    // is ground, not a bezel, because a drawn device makes the viewer look at
    // the device.
    viewport: { width: 360, height: 800 },
    dpr: 3,
    filter: 'scale=-2:1920:flags=lanczos,unsharp=5:5:0.3:5:5:0.0,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x111111',
    size: '1080×1920',
  },
  desktop: {
    // 2× of this is exactly 1.5× of the output, so the crop resamples cleanly
    // and needs almost no sharpening.
    viewport: { width: 1440, height: 810 },
    dpr: 2,
    filter: 'scale=1920:1080:flags=lanczos,unsharp=5:5:0.2:5:5:0.0',
    size: '1920×1080',
  },
};

const only = flag('only');
if (only && !FORMATS[only]) die(`--only takes ${Object.keys(FORMATS).join(' or ')}`);
const wanted = only ? [only] : Object.keys(FORMATS);

if (!Number.isFinite(pace) || pace < 0.8 || pace > 12) die('--pace is seconds per screenful, between 0.8 and 12');
if (!Number.isFinite(holdTop) || holdTop < 0) die('--hold-top must be a number of seconds');
if (!Number.isFinite(voiceAt) || voiceAt < 0) die('--voice-at must be a number of seconds');
if (!Number.isFinite(fieldSpeed) || fieldSpeed <= 0) die('--field-speed must be greater than zero');
if (!Number.isFinite(fps) || fps < 24 || fps > 120) die('--fps must be between 24 and 120');
if (has('scroll')) {
  die(
    '--scroll is gone. It fixed the duration and therefore varied the speed, so a long page\n' +
      'scrolled fast enough to be unreadable. Use --pace <seconds per screenful> instead.',
  );
}

// --- tools -----------------------------------------------------------------

function tool(name) {
  const r = spawnSync('which', [name], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

if (!tool('ffmpeg')) die('ffmpeg is needed. `brew install ffmpeg`');

/**
 * Playwright, kept in the plugin rather than in the client project — the client
 * project must not gain a dependency because we made a sales video from it.
 */

// --- the page to record ----------------------------------------------------

let url = flag('url');
let server = null;

if (!url) {
  const dist = resolve(flag('dist', 'dist'));
  if (!existsSync(dist)) {
    die('give me the preview link with --url (get_preview_link), or a local build with --dist ./dist (run `npm run build` first)');
  }
  const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml',
  };
  const port = Number(flag('port', 4488));
  server = createServer((req, res) => {
    let file = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
    } catch {
      if (existsSync(`${file}.html`)) file = `${file}.html`;
    }
    try {
      const body = readFileSync(file);
      const type = TYPES[extname(file)] ?? 'application/octet-stream';

      /*
       * Range requests, because a <video> cannot be seeked without them.
       *
       * A server that only ever answers 200 with the whole file gives Chromium
       * an empty `seekable` range, and every `currentTime` assignment then
       * clamps to nearly zero. The clip still *plays* — that is sequential —
       * so nothing looks wrong until something tries to drive it, which is
       * exactly what the clock shim does. Diagnosed as `seekable: [0, 0]` after
       * a recording came back with the hero's loops apparently frozen.
       *
       * This is a test server for one page for a minute, so the whole file is
       * already in memory and a range is a slice of it.
       */
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
      if (range) {
        const last = body.length - 1;
        const from = range[1] === '' ? Math.max(0, last + 1 - Number(range[2])) : Number(range[1]);
        const to = range[1] === '' || range[2] === '' ? last : Math.min(Number(range[2]), last);
        if (Number.isFinite(from) && from <= to) {
          res.writeHead(206, {
            'content-type': type,
            'accept-ranges': 'bytes',
            'content-range': `bytes ${from}-${to}/${body.length}`,
            'content-length': to - from + 1,
          });
          return res.end(body.subarray(from, to + 1));
        }
      }

      res.writeHead(200, {
        'content-type': type,
        'accept-ranges': 'bytes',
        'content-length': body.length,
      });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((ok) => server.listen(port, ok));
  url = `http://localhost:${port}/`;
  console.log(`Serving ${dist} on ${url}`);
}

// --- audio -----------------------------------------------------------------

/**
 * `de-CH` falls back to `de`: the spoken line is the same sentence, and one
 * recording per language is enough until somebody records the regional one.
 */
function pickVoice() {
  if (has('no-voice')) return null;
  const explicit = flag('voice');
  if (explicit) {
    const p = resolve(explicit);
    return existsSync(p) ? p : die(`no voice file at ${p}`);
  }
  const dir = join(ASSETS, 'voice');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => /\.(mp3|m4a|wav|aac|ogg)$/i.test(f));
  const stem = (f) => f.replace(/\.[^.]+$/, '').toLowerCase();
  const wanted = [lang.toLowerCase(), lang.split('-')[0].toLowerCase()];
  for (const w of wanted) {
    const hit = files.find((f) => stem(f) === w);
    if (hit) return join(dir, hit);
  }
  return null;
}

function pickMusic() {
  if (has('no-music')) return null;
  const explicit = flag('music');
  const dir = join(ASSETS, 'music');
  if (explicit) {
    const direct = resolve(explicit);
    if (existsSync(direct)) return direct;
    if (existsSync(dir)) {
      const hit = readdirSync(dir).find((f) => f.replace(/\.[^.]+$/, '') === explicit);
      if (hit) return join(dir, hit);
    }
    die(`no music file matching "${explicit}"`);
  }
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => /\.(mp3|m4a|wav|aac|ogg)$/i.test(f))
    .sort();
  return files.length ? join(dir, files[0]) : null;
}

const voice = pickVoice();
const music = pickMusic();

if (!voice) {
  console.warn(
    `No voice-over for "${lang}". Drop a file at assets/pitch/voice/${lang}.mp3 — a silent video is a much weaker pitch.`,
  );
}
if (!music) console.warn('No music bed found in assets/pitch/music/.');

// --- capture ---------------------------------------------------------------
//
// Every frame is synthesised, not recorded: scroll, advance the page's clock by
// exactly one frame, photograph the viewport. Repeat.
//
// Recording a live scroll is what this script did first and it juddered — the
// capture ran at its own rate, unsynchronised to the page's animation frames, so
// one frame in six came out a repeat. The answer then was to photograph the page
// once and pan a window down the still, which is uniform by construction but
// cannot show anything that moves: the hero shader arrived as one frozen frame,
// and `position: fixed` and `sticky` elements — including a skip link that hides
// itself by translating past the top of the viewport — were baked into the
// picture wherever they happened to sit.
//
// This is the third way, and it has neither problem. There is no capture rate to
// be out of step with, because the page's clock only moves when we move it:
// `performance.now` and `requestAnimationFrame` are replaced before any of the
// page's own script runs, so one screenshot is exactly one animation frame. And
// because what is photographed is the viewport rather than the whole document,
// everything positioned against the viewport behaves as it does for a visitor.
//
// What the shim does not own is the compositor's clock: CSS transitions run on
// real time, which here is tens of milliseconds per frame, so a 0.7s reveal
// would finish in a few frames. Reveals are therefore pinned to their finished
// state for the recording — which is what the old walk-then-photograph pipeline
// effectively did too, so nothing is lost. Making them animate needs CDP virtual
// time (`Emulation.setVirtualTimePolicy`), which moves timers, rAF and CSS
// together; that is the next version of this, not this one.

/**
 * The clock shim. Installed with addInitScript, so it is in place before the
 * page's own scripts and any rAF loop they start is ours to drive.
 *
 * ── a <video> has a clock of its own, and it is not this one ────────────────
 *
 * A media element does not ask `performance.now` and does not run on `rAF`: it
 * plays against the media clock, in real time. So while this loop scrolls,
 * steps and photographs — tens of milliseconds of real time per frame — an
 * autoplaying loop in the hero keeps running underneath, and every photographed
 * frame catches it further along than it should be. The finished video shows
 * the clips at several times their real speed, which is not a rendering fault
 * anybody can see in a still and is obvious the moment it is watched.
 *
 * It was invisible until a site put clips in its hero. Reveals had the same
 * problem and are pinned to their finished state; a clip cannot be pinned,
 * because the whole reason it is there is that it moves.
 *
 * So the videos are driven rather than left alone: paused, and advanced by
 * exactly the same slice of time the page's clock is advanced by. One
 * photographed frame is then one frame of the clip, the same way it is already
 * one frame of the shader.
 */
const CLOCK = () => {
  let t = 0;
  let queue = [];
  performance.now = () => t;
  window.requestAnimationFrame = (cb) => {
    queue.push(cb);
    return queue.length;
  };
  window.cancelAnimationFrame = () => {};

  /*
   * A seek is asynchronous, and photographing before it lands would show the
   * frame before the one this step asked for. `seeked` is the signal; the
   * timeout is the escape for a decoder that never answers, on a real clock
   * because this one is stopped.
   */
  const landed = (video) =>
    new Promise((done) => {
      let over = false;
      const finish = () => {
        if (over) return;
        over = true;
        video.removeEventListener('seeked', finish);
        done();
      };
      video.addEventListener('seeked', finish, { once: true });
      setTimeout(finish, 80);
    });

  const stepMedia = (seconds) =>
    Promise.all(
      [...document.querySelectorAll('video')].map(async (video) => {
        // The page's own script autoplays these; the first step is what takes
        // them off the media clock and onto ours.
        if (!video.paused) video.pause();
        if (video.readyState < 2) return;
        const span = video.duration;
        if (!Number.isFinite(span) || span <= 0) return;
        const next = video.currentTime + seconds;
        video.currentTime = video.loop ? next % span : Math.min(next, span);
        await landed(video);
      }),
    );

  window.__clock = {
    async step(ms) {
      t += ms;
      const due = queue;
      queue = [];
      for (const cb of due) cb(t);
      await stepMedia(ms / 1000);
    },
    /** Every clip paused and wound back, so the first frame is frame one. */
    async rewind() {
      await Promise.all(
        [...document.querySelectorAll('video')].map(async (video) => {
          video.pause();
          if (video.readyState < 2) return;
          video.currentTime = 0;
          await landed(video);
        }),
      );
    },
  };
};

/** Does the hero field say it painted? No field at all is not our business. */
const heroIsLive = (page) =>
  page.evaluate(() => {
    const field = document.querySelector('[data-hero-field]');
    return !field || field.dataset.state === 'live';
  });

const hasField = (page) => page.evaluate(() => Boolean(document.querySelector('[data-hero-field]')));

const chromium = await loadChromium(die);
const work = mkdtempSync(join(tmpdir(), 'jt-pitch-'));

/**
 * Where the link lands, and the cookie it leaves.
 *
 * A jtakeit preview link is `/e/<token>` on the panel: it redirects to the
 * panel's look page, which sends the browser on — by script — through the
 * preview host's ticket exchange to `/p/<slug>/`, setting the session cookie
 * the preview needs. Followed once, in a context of its own; every recording
 * context then starts from that cookie and goes straight to the page. A local
 * address lands where it was pointed and nothing changes.
 */
let landing = null;
async function land(browser) {
  if (landing) return landing;
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page
    .waitForURL((u) => !/^\/(e|look)\//.test(u.pathname) && !u.pathname.startsWith('/__jtk/'), { timeout: 60_000 })
    .catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});
  const at = new URL(page.url());
  if (/^\/(e|look)\//.test(at.pathname)) {
    await context.close();
    die(`the link stopped at ${at.origin}${at.pathname} instead of the site — it may have expired or been reset; ask get_preview_link for a new one`);
  }
  landing = { url: page.url(), state: await context.storageState() };
  await context.close();
  if (landing.url !== url) console.log(`Recording ${landing.url}`);
  return landing;
}

async function openPage(browser, format) {
  const { url: address, state } = await land(browser);
  const context = await browser.newContext({
    storageState: state,
    viewport: format.viewport,
    deviceScaleFactor: format.dpr,
    // The prospect's own language, so anything locale-aware renders the way they
    // would see it.
    locale: lang,
    // The page's own motion has to run: it is the thing being photographed.
    reducedMotion: 'no-preference',
  });
  await context.addInitScript(CLOCK);
  const page = await context.newPage();
  await page.goto(address, { waitUntil: 'networkidle', timeout: 60_000 });
  return page;
}

/**
 * One format, frame by frame. Returns the directory of frames and the timing.
 */
async function capture(name) {
  const format = FORMATS[name];
  const dir = join(work, name);
  mkdirSync(dir, { recursive: true });

  /*
   * Hardware WebGL first. The software renderer costs six to twelve times as
   * much per frame — the difference between a minute and a quarter of an hour
   * over a whole video — and it is only needed on a machine whose headless
   * Chromium cannot do WebGL at all. Which of the two we are on is not worth
   * guessing: ask the page whether its field went live.
   */
  let browser = await chromium.launch().catch((e) => die(`could not launch chromium — ${e.message}`));
  let page = await openPage(browser, format);
  let live = await heroIsLive(page);
  if (!live) {
    await browser.close();
    browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    page = await openPage(browser, format);
    live = await heroIsLive(page);
    if (!live) console.warn(`${name}: the hero field never went live — the ground will be flat in the video.`);
  }

  /*
   * Everything decoded before the first frame.
   *
   * The old pipeline got this from walking the page before photographing it.
   * A frame-by-frame scroll cannot: the walk would spend the scroll reveals
   * before the camera ever saw them, and it would show as a page that is already
   * fully revealed at the top.
   */
  await page.evaluate(async () => {
    const images = [...document.images];
    for (const img of images) img.loading = 'eager';
    await Promise.all(images.map((img) => img.decode().catch(() => {})));
    await (document.fonts?.ready ?? Promise.resolve());
  });

  /*
   * The clips, before the first photograph.
   *
   * Enough of each one has to be decoded for a seek to land, or the opening
   * frames step a video that answers nothing and the hero holds on a poster for
   * the part of the video that does all the work. Then every clip is wound back
   * to zero, so they start together and the first frame photographed is the
   * frame each poster shows.
   */
  await page.evaluate(async () => {
    const clips = [...document.querySelectorAll('video')];
    await Promise.all(
      clips.map(
        (video) =>
          new Promise((done) => {
            if (video.readyState >= 2) return done();
            video.addEventListener('loadeddata', done, { once: true });
            video.load();
            setTimeout(done, 3000);
          }),
      ),
    );
    await window.__clock.rewind();
  });

  await page.addStyleTag({
    content:
      // Reveals: pinned, because CSS transitions run on real time and this
      // recording does not. See the note above.
      '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}' +
      // Smooth scrolling would animate every step of the pan on the compositor's
      // clock, so each frame would be photographed somewhere behind where it
      // should be.
      'html{scroll-behavior:auto!important}' +
      // The edge's «Preview» badge, on every page served under /p/<slug>/: it
      // belongs to the preview, not to the site being pitched.
      '[data-jtk-preview]{display:none!important}',
  });

  const geometry = await page.evaluate(() => ({
    height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    view: window.innerHeight,
  }));
  const travel = Math.max(0, geometry.height - geometry.view);
  const screens = travel / geometry.view;
  const scrollSeconds = Number((screens * pace).toFixed(2));
  const duration = Number((holdTop + scrollSeconds + holdBottom).toFixed(2));
  const frames = Math.round(duration * fps);
  const holdFrames = Math.round(holdTop * fps);

  if (travel === 0) console.warn(`${name}: the page is no taller than the frame — the video will not move.`);

  /**
   * A thumbprint of the hero field itself, not of the frame.
   *
   * Hashing the whole picture was the first attempt and it does not work: CSS
   * animations and transitions run on real time, which does advance between
   * screenshots, so anything else moving anywhere in the viewport reports a
   * dead field as a live one. Reading the canvas directly answers the actual
   * question. `drawImage` from a WebGL canvas needs `preserveDrawingBuffer`,
   * which HeroField sets for the sake of this kind of capture.
   */
  const fieldPrint = () =>
    page.evaluate(() => {
      const canvas = document.querySelector('[data-hero-field] canvas');
      if (!canvas) return null;
      const small = document.createElement('canvas');
      small.width = 16;
      small.height = 16;
      small.getContext('2d').drawImage(canvas, 0, 0, 16, 16);
      return small.toDataURL();
    });

  const prints = [];
  for (let i = 0; i < frames; i++) {
    const t = i / fps;
    const y =
      t < holdTop
        ? 0
        : t < holdTop + scrollSeconds
          ? ((t - holdTop) / scrollSeconds) * travel
          : travel;

    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.evaluate((ms) => window.__clock.step(ms), (1000 / fps) * fieldSpeed);
    // JPEG rather than PNG: 2.3× faster per frame, and q92 losses do not survive
    // x264 anyway. These files exist for about a minute.
    const shot = await page.screenshot({ type: 'jpeg', quality: 92 });
    writeFileSync(join(dir, `${String(i).padStart(5, '0')}.jpg`), shot);
    // Only through the hold: past it the hero leaves the viewport and its loop
    // honestly stops, so repeats down there mean nothing.
    if (i < holdFrames) prints.push(createHash('md5').update(String(await fieldPrint())).digest('hex'));
  }
  // Asked before the browser goes away: a page with no field at all is allowed
  // to be still, and must not be reported as broken.
  const field = await hasField(page);
  await browser.close();

  /*
   * While the page is standing still, the only thing that can change is the
   * hero. Identical frames through the hold therefore mean the field is not
   * animating — which is indistinguishable by eye from a field that is simply
   * calm, and is exactly the thing this stage exists to get right.
   */
  let frozen = 0;
  for (let i = 1; i < prints.length; i++) if (prints[i] === prints[i - 1]) frozen++;
  const dead = field && prints.length > 1 && frozen > (prints.length - 1) * 0.1;

  console.log(
    `${name}: ${geometry.height}px · ${screens.toFixed(1)} screenful(s) · ` +
      `${duration.toFixed(1)}s · ${frames} frames · ${format.size}`,
  );
  return { name, format, dir, duration, frames, screens, frozen, holdFrames, dead };
}

// --- render ----------------------------------------------------------------

/** pitch.mp4 → pitch-phone.mp4, pitch-desktop.mp4. */
const fileFor = (name) => {
  const ext = extname(out) || '.mp4';
  return join(dirname(out), `${out.slice(0, -ext.length || undefined).split('/').pop()}-${name}${ext}`);
};

function render({ name, format, dir, duration }) {
  const inputs = ['-y', '-framerate', String(fps), '-i', join(dir, '%05d.jpg')];
  if (music) inputs.push('-stream_loop', '-1', '-i', music);
  if (voice) inputs.push('-i', voice);

  const musicIdx = music ? 1 : null;
  const voiceIdx = voice ? (music ? 2 : 1) : null;
  const fadeStart = Math.max(0, duration - 1.4).toFixed(2);

  const chains = [`[0:v]${format.filter},format=yuv420p[v]`];
  const mixIn = [];

  if (musicIdx !== null) {
    // Quiet enough to sit under a spoken line without anyone reaching for the
    // volume: this is a message in someone's inbox, not a showreel.
    chains.push(`[${musicIdx}:a]volume=0.08,afade=t=out:st=${fadeStart}:d=1.4[m]`);
    mixIn.push('[m]');
  }
  if (voiceIdx !== null) {
    // On the hero, not after it.
    const at = Math.round(voiceAt * 1000);
    chains.push(`[${voiceIdx}:a]adelay=${at}|${at},volume=1.0[s]`);
    mixIn.push('[s]');
  }

  const file = fileFor(name);
  const args = [...inputs];
  if (mixIn.length) {
    chains.push(
      mixIn.length === 2
        ? `${mixIn.join('')}amix=inputs=2:duration=first:normalize=0[a]`
        : `${mixIn[0]}anull[a]`,
    );
    args.push('-filter_complex', chains.join(';'), '-map', '[v]', '-map', '[a]');
    args.push('-c:a', 'aac', '-b:a', '128k');
  } else {
    args.push('-filter_complex', chains.join(';'), '-map', '[v]', '-an');
  }

  args.push(
    '-t', duration.toFixed(2),
    '-r', String(fps),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    file,
  );

  mkdirSync(dirname(file), { recursive: true });
  const enc = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (enc.status !== 0) {
    console.error(enc.stderr?.split('\n').slice(-25).join('\n'));
    die(`ffmpeg failed on the ${name} pass`);
  }
  return { name, file, duration, size: statSync(file).size, frame: format.size };
}

const results = [];
for (const name of wanted) {
  const shot = await capture(name);
  results.push({ ...shot, ...render(shot) });
}

if (server) server.close();
rmSync(work, { recursive: true, force: true });

// --- report ----------------------------------------------------------------

console.log('');
for (const r of results) {
  console.log(`${r.name.padEnd(8)} ${r.file}`);
  console.log(
    `         ${r.duration.toFixed(1)}s · ${r.frame} · ${fps}fps · ` +
      `${r.screens.toFixed(1)} screenful(s) at ${pace}s each · ${(r.size / 1024 / 1024).toFixed(1)} MB`,
  );
}
console.log('');
console.log(`  voice: ${voice ? voice.replace(ASSETS, 'assets/pitch') : 'none'}  (starts at ${voiceAt}s)`);
console.log(`  music: ${music ? music.replace(ASSETS, 'assets/pitch') : 'none'}`);
console.log('');

const dead = results.filter((r) => r.dead);
if (dead.length) {
  for (const r of dead) {
    console.error(
      `${r.name}: ${r.frozen} of ${r.holdFrames} frames identical during the ${holdTop}s hold — ` +
        'the hero is not animating.',
    );
  }
  console.error('The first three seconds are the pitch. Check the field, its colours and WebGL, then re-record.');
  process.exitCode = 1;
} else {
  console.log('Watch them before either goes anywhere. They are the only thing the prospect will see.');
  console.log('If the scroll feels hurried, raise --pace; nothing about the length is a target to hit.');
}
