#!/usr/bin/env node
/**
 * jt-clips — cut a client's own video into the short silent loops a page uses.
 *
 * The division is the same one the rest of the pipeline uses: a person supplies
 * the material, a script does the mechanics, and the model does the half that
 * needs judgement. Here that means:
 *
 *   the human      drops their video into `_video/` — one reel, one session,
 *                  whatever they have. It is theirs and nobody scrapes it.
 *   the model      watches it and decides which seconds are worth a card, in
 *                  what order, and what each one is called.
 *   this script    cuts, loops, strips the sound, sizes, posters and measures.
 *
 *   jt-clips --from _video/session.mp4 --probe
 *   jt-clips --from _video/session.mp4 \
 *            --clip sketch@3.2 --clip stencil@11 --clip needle@24.5 \
 *            --len 0.9 --width 414 --ratio 9:16
 *
 * Writes `public/clips/<name>.mp4`, `public/clips/<name>.jpg` (the loop's first
 * frame, which is also its poster) and `.jtakeit/clips.json`, which is the
 * record of where each clip came from. Not under `jtk/`: that directory is the
 * platform's contract, and a publish writes it back.
 *
 * **Not `public/media/`, and that is not a preference.** `/media/` is
 * jtakeit's own prefix on the hosting edge: it is where an owner's uploads are
 * served from, and a site file under it was read as a bucket key, found not to
 * be one, and answered 404. In a preview it worked — a preview is served under
 * `/p/<slug>/` — so the first place it could break was the client's own domain
 * on launch day. The edge now looks at the shape of the key rather than the
 * prefix, and this stays out of the way regardless.
 *
 * **Nothing here decides what the clips are.** A run with no --clip prints the
 * source's measurements and stops, because "cut something interesting out of
 * this" is not a thing a script can be asked.
 *
 * Needs ffmpeg. `/jt-doctor` reports it; on macOS it is `brew install ffmpeg`.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { STATE_DIR, findRoot } from './lib/state.mjs';

const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const flag = (n, d = undefined) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};
const all = (n) => argv.reduce((out, a, i) => (a === `--${n}` ? [...out, argv[i + 1]] : out), []);

const die = (message) => {
  console.error(`jt-clips: ${message}`);
  process.exit(1);
};

const root = findRoot() ?? process.cwd();

if (!spawnSync('ffmpeg', ['-version']).stdout) {
  die('ffmpeg is not on PATH. macOS: `brew install ffmpeg`. It is the only dependency this has.');
}

const from = flag('from');
if (!from) die('--from <file> is required. Put the client\'s own video in _video/ first.');
const source = resolve(root, from);
if (!existsSync(source)) die(`${from} does not exist. The video goes in _video/, which is stripped at handoff.`);

/*
 * What the source actually is, before anything is cut out of it. Every number
 * below is read rather than assumed: a phone reel is 9:16 at 30fps and a
 * screen recording is neither, and a cut made against the wrong duration fails
 * silently by producing a clip of nothing.
 */
const probe = (path) => {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries',
     'stream=width,height,r_frame_rate,codec_name:format=duration,size', '-of', 'json', path],
    { encoding: 'utf8' },
  );
  const j = JSON.parse(out);
  const s = j.streams?.[0] ?? {};
  const [num, den] = String(s.r_frame_rate ?? '0/1').split('/').map(Number);
  return {
    width: s.width ?? 0,
    height: s.height ?? 0,
    codec: s.codec_name ?? '?',
    fps: den ? Math.round((num / den) * 100) / 100 : 0,
    duration: Number(j.format?.duration ?? 0),
    bytes: Number(j.format?.size ?? 0),
  };
};

const src = probe(source);
const kb = (n) => `${Math.round(n / 1024)}KB`;

console.log(`Source · ${from}`);
console.log(`  ${src.width}×${src.height} · ${src.fps}fps · ${src.duration.toFixed(1)}s · ${src.codec} · ${kb(src.bytes)}`);

/** `name@seconds` — the name is permanent, the timestamp is a record. */
const clips = all('clip').filter(Boolean).map((spec) => {
  const [name, at] = spec.split('@');
  if (!name || at === undefined) die(`--clip wants name@seconds, got "${spec}"`);
  if (!/^[a-z][a-z0-9-]*$/.test(name)) die(`"${name}" — a clip name is lowercase letters, digits and dashes; it becomes a file name and a content key`);
  const seconds = Number(at);
  if (!Number.isFinite(seconds) || seconds < 0) die(`--clip ${spec}: "${at}" is not a number of seconds`);
  return { name, at: seconds };
});

const LEN = Number(flag('len', 0.9)) || 0.9;
const WIDTH = Math.round(Number(flag('width', 414)) || 414);
const RATIO = String(flag('ratio', '9:16'));
const BOOMERANG = !has('no-boomerang');
/** Per clip. Five of these in a hero is the page's whole weight budget. */
const BUDGET = Number(flag('budget', 200)) || 200;

if (!clips.length) {
  console.log('');
  console.log('No --clip given, so nothing was cut. That is the point: which seconds are worth');
  console.log('a card is a judgement, and it is made by watching the video, not by a script.');
  console.log('');
  console.log('Open it, and pick moments that show the *work* rather than the person posing:');
  console.log('  · the material before it is touched — the drawing, the dough, the empty room');
  console.log('  · the hands doing the thing, close');
  console.log('  · the moment it changes — the first cut, the pour, the stencil going on');
  console.log('  · the finished thing, held or worn');
  console.log('  · one frame of them, if they are the business');
  console.log('');
  console.log('Then name them for what they are and cut:');
  console.log(`  jt-clips --from ${from} --clip sketch@3.2 --clip needle@24.5`);
  console.log('');
  console.log('No customer\'s face without their permission, and nothing that identifies');
  console.log('anybody who did not agree to be on a website.');
  process.exit(0);
}

const [rw, rh] = RATIO.split(':').map(Number);
if (!rw || !rh) die(`--ratio wants w:h, got "${RATIO}"`);
const HEIGHT = Math.round((WIDTH * rh) / rw / 2) * 2;

const clipsDir = join(root, 'public', 'clips');
mkdirSync(clipsDir, { recursive: true });

const written = [];

for (const clip of clips) {
  if (clip.at + LEN > src.duration) {
    die(`--clip ${clip.name}@${clip.at}: the source is ${src.duration.toFixed(1)}s and the clip would run past its end`);
  }

  const mp4 = join(clipsDir, `${clip.name}.mp4`);
  const jpg = join(clipsDir, `${clip.name}.jpg`);

  /*
   * Crop to the card's shape, then scale. Cropping first keeps the centre of
   * the frame rather than letterboxing, which is the same rule `<Shot>` holds
   * a photograph to: a frame that does not match crops into the picture, it
   * never squeezes it.
   *
   * `-an` rather than `muted`: the audio track is absent, not silenced. A muted
   * track is bytes nobody hears, and a browser that unmutes on a gesture would
   * play a stranger's room.
   */
  const crop = `crop='min(iw,ih*${rw}/${rh})':'min(ih,iw*${rh}/${rw})',scale=${WIDTH}:${HEIGHT}:flags=lanczos,setsar=1`;
  /*
   * Forward, then backwards. A loop cut out of a continuous shot jumps at the
   * seam; a palindrome has no seam anywhere, which is what lets a clip be under
   * a second and still not read as a stutter.
   */
  const filter = BOOMERANG
    ? `[0:v]${crop},split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0[v]`
    : `[0:v]${crop}[v]`;

  execFileSync(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-ss', String(clip.at), '-t', String(LEN), '-i', source,
     '-filter_complex', filter, '-map', '[v]', '-an',
     '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
     '-crf', String(flag('crf', 28)), '-preset', 'slow', '-movflags', '+faststart',
     mp4],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );

  /*
   * The poster is the loop's own first frame, taken from the finished clip
   * rather than from the source. Every way the video fails — autoplay refused,
   * Low Power Mode, a missing codec, JavaScript off — lands on this picture, so
   * it has to be the frame the loop starts from and not one near it.
   */
  execFileSync(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-i', mp4, '-frames:v', '1', '-q:v', '4', jpg],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );

  const out = probe(mp4);
  written.push({
    name: clip.name,
    from,
    at: clip.at,
    seconds: Number(out.duration.toFixed(2)),
    width: out.width,
    height: out.height,
    bytes: statSync(mp4).size,
    poster: statSync(jpg).size,
    boomerang: BOOMERANG,
  });
}

mkdirSync(join(root, STATE_DIR), { recursive: true });
writeFileSync(
  join(root, STATE_DIR, 'clips.json'),
  `${JSON.stringify(
    {
      source: { file: from, ...src },
      cut: { seconds: LEN, width: WIDTH, height: HEIGHT, ratio: RATIO, boomerang: BOOMERANG },
      clips: written,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log('');
for (const c of written) {
  const over = c.bytes > BUDGET * 1024;
  console.log(
    `  ${over ? '✗' : '✓'} public/clips/${c.name}.mp4  ${c.width}×${c.height} · ${c.seconds}s · ` +
      `${kb(c.bytes)}${over ? ` — over ${BUDGET}KB` : ''}  (poster ${kb(c.poster)})`,
  );
}

const total = written.reduce((n, c) => n + c.bytes + c.poster, 0);
console.log('');
console.log(`  ${written.length} clip(s), ${kb(total)} all in · ${STATE_DIR}/clips.json written`);

const over = written.filter((c) => c.bytes > BUDGET * 1024);
if (over.length) {
  console.log('');
  console.log(`  ${over.length} clip(s) over budget. In order of what to try:`);
  console.log('    --len 0.7          shorter is the cheapest fix and nobody notices');
  console.log('    --crf 32           more compression; watch it for mush on skin and gradients');
  console.log('    --width 360        smaller card');
  console.log('  A hero of five clips should come in around 300KB all in.');
}

console.log('');
console.log('Now the half a script cannot do: watch each loop once at full size.');
console.log('  · does it loop without a visible seam?');
console.log('  · is the first frame — which is the poster — worth looking at on its own?');
console.log('  · is anybody in it who did not agree to be on a website?');
console.log('  · does the set read as one process, in an order that makes sense?');

if (!existsSync(join(root, '.gitignore')) || !readFileSync(join(root, '.gitignore'), 'utf8').includes('_video/')) {
  console.log('');
  console.log('  The source video is not ignored by git. Add to .gitignore:');
  console.log('    _video/');
  console.log('  (public/clips/ stays — the clips are the site)');
}
