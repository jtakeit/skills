/**
 * The studio's last sites, on this machine — so a new one can be set beside
 * them.
 *
 * Every project's record lives in its own repository, and nothing inside one
 * project can see the one before it. The design axes (skills/spec/references/
 * axes.md) are meant to be chosen per client, and the only way anybody notices
 * three sites in a row arriving at the same hero is to look at the three. So
 * jt-shots, which already takes the hero's picture for the critic, leaves one
 * line per project in a small index beside /jt-setup's config, and the critic
 * and the design stages read the last few.
 *
 * It *shows*, it never refuses (jtakeit-core wiki/115: a person makes the sites
 * they like, similar ones included). Nothing here fails a check; a missing or
 * unreadable index is simply an empty one.
 *
 *   $XDG_CONFIG_HOME/jtakeit-sites/studio-sites.json     the last KEEP projects
 *   $XDG_CONFIG_HOME/jtakeit-sites/studio-sites/<key>-laptop.png, -phone.png
 *
 * The first screens are copied rather than pointed at: a project handed over
 * is cleaned (`jt-clean`) or deleted, and its shots go with it, while the
 * studio still wants to see what it built.
 */

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

/** The fourteen keys of `axes` in jtk/design.json, in the catalogue's order. */
export const AXES = [
  'hero',
  'ground',
  'measures',
  'shape',
  'header',
  'phone_menu',
  'overlap',
  'surfaces',
  'mark',
  'motion',
  'fonts',
  'hook',
  'proof',
  'contact',
];

/**
 * Recorded on every site and compared on none: the mark is the one thing that
 * is this client's by definition (A8), so a "match" there means nothing.
 */
export const NEVER_COMPARED = new Set(['mark']);

/** How many projects the index keeps. The critic looks at three. */
export const KEEP = 10;

export function studioDir(env = process.env) {
  return join(env.XDG_CONFIG_HOME || join(env.HOME || homedir(), '.config'), 'jtakeit-sites');
}

export function indexPath(env = process.env) {
  return join(studioDir(env), 'studio-sites.json');
}

/**
 * The axes this project recorded, from `jtk/design.json`.
 * Returns null when there is no design document; `missing` lists the keys not
 * yet written (an empty string counts as not written).
 */
export function readAxes(root) {
  const file = join(root, 'jtk', 'design.json');
  if (!existsSync(file)) return null;
  let doc;
  try {
    doc = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
  const raw = doc && typeof doc.axes === 'object' && doc.axes ? doc.axes : {};
  const axes = {};
  for (const key of AXES) if (typeof raw[key] === 'string' && raw[key].trim()) axes[key] = raw[key].trim();
  return { axes, missing: AXES.filter((k) => !(k in axes)) };
}

/**
 * The part of a value that is compared: the catalogue id before a `: ` note,
 * or a ` · ` count, lowercased. `"fonts": "serif+sans: Fraunces + Inter"`
 * compares as `serif+sans`; `"motion": "draw · 2"` as `draw`.
 */
export function axisId(value) {
  return String(value ?? '')
    .split(/:\s| · /)[0]
    .trim()
    .toLowerCase();
}

/** The axes two records share, the mark left out. */
export function sharedAxes(a = {}, b = {}) {
  return AXES.filter((k) => !NEVER_COMPARED.has(k) && a[k] && b[k] && axisId(a[k]) === axisId(b[k]));
}

export function readIndex(env = process.env) {
  try {
    const list = JSON.parse(readFileSync(indexPath(env), 'utf8'));
    return Array.isArray(list) ? list.filter((e) => e && typeof e.root === 'string') : [];
  } catch {
    return [];
  }
}

/** A file-name-safe key that stays the same for one project directory. */
export function keyFor(root, name) {
  const slug = String(name || basename(root))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'site';
  return `${slug}-${createHash('sha1').update(root).digest('hex').slice(0, 6)}`;
}

/**
 * Put this project at the end of the index, replacing its earlier line, keep
 * the last KEEP, copy its first screens beside the index and delete the copies
 * of the projects that fell off. Only files this function wrote are ever
 * removed: names in studio-sites/ that are no entry's.
 *
 * `shots` is { laptop, phone } — paths to this project's first screens; either
 * may be missing. Returns the entry written, or null when nothing could be
 * written (a read-only home is an index nobody keeps, not an error).
 */
export function recordSite({ root, name, slug, axes = {}, look = null, url = null, shots = {} }, env = process.env, now = new Date()) {
  const dir = studioDir(env);
  const pictures = join(dir, 'studio-sites');
  try {
    mkdirSync(pictures, { recursive: true });
  } catch {
    return null;
  }
  const key = keyFor(root, slug || name);
  const copied = {};
  for (const tag of ['laptop', 'phone']) {
    const from = shots[tag];
    if (!from || !existsSync(from)) continue;
    const to = join(pictures, `${key}-${tag}.png`);
    try {
      copyFileSync(from, to);
      copied[tag] = to;
    } catch {
      /* a picture that will not copy leaves the line without it */
    }
  }
  const entry = {
    root,
    name: name || basename(root),
    key,
    at: now.toISOString().slice(0, 19) + 'Z',
    ...(url ? { url } : {}),
    ...(look ? { look } : {}),
    axes,
    hero: copied,
  };
  const list = [...readIndex(env).filter((e) => e.root !== root), entry].slice(-KEEP);
  try {
    writeFileSync(indexPath(env), `${JSON.stringify(list, null, 2)}\n`);
  } catch {
    return null;
  }
  const kept = new Set(list.map((e) => e.key).filter(Boolean));
  try {
    for (const file of readdirSync(pictures)) {
      const owner = file.replace(/-(laptop|phone)\.png$/, '');
      if (owner !== file && !kept.has(owner)) rmSync(join(pictures, file), { force: true });
    }
  } catch {
    /* pruning is tidiness, not correctness */
  }
  return entry;
}

/**
 * The last `n` projects other than this one, newest first, each with the axes
 * it shares with this one's (`shared`) — what the critic and `jt-studio` print.
 */
export function recentSites(root, axes = {}, n = 3, env = process.env) {
  return readIndex(env)
    .filter((e) => e.root !== root)
    .slice(-n)
    .reverse()
    .map((e) => ({ ...e, shared: sharedAxes(axes, e.axes ?? {}) }));
}

/**
 * What a project says about itself for the index: its name and slug from the
 * state, its look, its axes, and the first screens jt-shots left in
 * `.jtakeit/shots/home/`. Null when the directory is not a pipeline project —
 * the index is the studio's clients, not every folder jt-shots was run in.
 */
export function projectRecord(root) {
  let state;
  try {
    state = JSON.parse(readFileSync(join(root, '.jtakeit', 'state.json'), 'utf8'));
  } catch {
    return null;
  }
  const home = join(root, '.jtakeit', 'shots', 'home');
  return {
    root,
    name: state?.client?.name || state?.client?.slug || basename(root),
    slug: state?.client?.slug || null,
    look: state?.design?.look || null,
    axes: readAxes(root)?.axes ?? {},
    shots: { laptop: join(home, 'laptop-00-first-screen.png'), phone: join(home, 'phone-00-first-screen.png') },
  };
}

/** Lines for a terminal: one block per recent site. */
export function describeRecent(recent, axes = {}) {
  if (!recent.length) return ['No earlier sites in the studio index on this machine yet.'];
  const lines = [];
  for (const e of recent) {
    lines.push(`${e.name} · ${e.at?.slice(0, 10) ?? '?'}${e.look ? ` · ${e.look}` : ''}`);
    const pics = [e.hero?.laptop, e.hero?.phone].filter((p) => p && existsSync(p));
    lines.push(`  hero:   ${pics.length ? pics.join('  ') : '— no picture kept'}`);
    const recorded = AXES.filter((k) => e.axes?.[k]).map((k) => `${k} ${e.axes[k]}`);
    lines.push(`  axes:   ${recorded.length ? recorded.join(' · ') : '— none recorded'}`);
    if (Object.keys(axes).length)
      lines.push(
        `  shares: ${e.shared.length ? `${e.shared.length} of ${AXES.length - NEVER_COMPARED.size} — ${e.shared.join(', ')}` : 'nothing'}`,
      );
  }
  return lines;
}
