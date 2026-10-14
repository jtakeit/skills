/**
 * Shared state helpers for the jt-* scripts.
 *
 * The state file is the project's memory and the only writer is jt-state.mjs,
 * so everything that touches it lives here rather than being re-implemented per
 * script. No dependencies: these run with a bare `node`, in a fresh clone,
 * before `npm install`.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Two ways into the pipeline, one way through it.
 *
 * An INBOUND project starts at the brief: a business asked for a site.
 * An OUTBOUND project starts three stages earlier: the developer found them,
 * built a speculative site from what their Instagram says about them, put it on
 * jtakeit as a private preview, and pitched it. If they say yes, the two tracks
 * merge at `brief` — the same brief, now with a real conversation behind it,
 * and a site that already partly exists.
 *
 * `archived` is off the ladder: reachable from anywhere, and reversible.
 */
export const LADDER = {
  outbound: ['prospect', 'spec', 'pitch', 'brief', 'variants', 'preview', 'revisions', 'launch', 'delivered'],
  inbound: ['brief', 'variants', 'preview', 'revisions', 'launch', 'delivered'],
};

export const STAGES = LADDER.outbound;
export const ARCHIVED = 'archived';

/** The plugin's name, as skills are addressed: `jtakeit-sites:<skill>`. */
export const PLUGIN = 'jtakeit-sites';

export const STAGE_META = {
  prospect: {
    title: 'Prospect',
    skill: `${PLUGIN}:prospect`,
    blurb: 'One handle in, a sourced portrait out. Nothing is built yet.',
  },
  spec: {
    title: 'Spec build',
    skill: `${PLUGIN}:spec`,
    blurb: 'One site on their own material, on jtakeit as a private preview, stating nothing unconfirmed.',
  },
  pitch: {
    title: 'Pitch',
    skill: `${PLUGIN}:pitch`,
    blurb: 'A short video of the preview, handed to the person who will send it.',
  },
  archived: {
    title: 'Archived',
    skill: null,
    blurb: 'Closed without a deal. `jt-state revive` puts it back.',
  },
  brief: {
    title: 'Brief',
    skill: `${PLUGIN}:brief`,
    blurb: 'Everything about the business, sourced and confirmed, before design.',
  },
  variants: {
    title: 'Variants',
    skill: `${PLUGIN}:variants`,
    blurb: 'N clickable directions, complete on every viewport.',
  },
  preview: {
    title: 'Preview',
    skill: `${PLUGIN}:preview`,
    blurb: 'Built on jtakeit, private preview link with the client.',
  },
  revisions: {
    title: 'Revisions',
    skill: `${PLUGIN}:revisions`,
    blurb: 'The client picks a direction; every comment gets a verdict.',
  },
  launch: {
    title: 'Launch',
    skill: `${PLUGIN}:launch`,
    blurb: 'Preflight, then a person launches in the panel — kept, or handed over.',
  },
  delivered: {
    title: 'Delivered',
    skill: null,
    blurb: 'The site is live or with the client. The pipeline is finished.',
  },
};

/** Packages must match skills/pipeline/references/packages.md. */
export const PACKAGES = {
  landing: {
    title: 'Landing',
    summary: "One Astro page on jtakeit: the business's own words and photographs, an enquiry form.",
  },
  bookings: {
    title: 'Landing with bookings',
    summary: "The landing, plus the platform's diary, laid out from the kit for the business's kind.",
  },
};

export const STATE_DIR = '.jtakeit';
export const STATE_FILE = join(STATE_DIR, 'state.json');

/**
 * Which skill set is running, so a project can record what built it.
 *
 * Two people on the same project do not necessarily run the same skills: a
 * plugin installed from a marketplace is a copy pinned to a commit and stays
 * pinned until it is updated, while a directory install follows the working
 * copy. Nothing about that is visible from inside a client project — which is
 * exactly why the answer gets written into the state file and pushed with it.
 *
 * Returns a null commit where the plugin is a cache copy with no git history;
 * the version from plugin.json is used instead, which is still better than
 * nothing.
 */
export function skillsVersion() {
  const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const out = (args) => {
    try {
      return execFileSync('git', ['-C', pluginRoot, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return '';
    }
  };
  let version = '';
  try {
    version = JSON.parse(readFileSync(join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf8')).version ?? '';
  } catch {
    /* a plugin without its manifest is not a reason to fail a stage */
  }
  const commit = out(['rev-parse', '--short', 'HEAD']);
  const dirty = commit ? Boolean(out(['status', '--porcelain'])) : false;
  return {
    version,
    commit: commit ? `${commit}${dirty ? '+' : ''}` : null,
    at: nowIso(),
  };
}

/**
 * Which project we are in.
 *
 * **The search stops at a repository boundary**, and that is the whole point of
 * this function. Without it the walk goes all the way to `/`, so a project
 * started inside a directory that happens to carry a `.jtakeit/` — an older
 * client, a sandbox, a folder somebody once ran `jt-init` in by mistake —
 * silently adopts that project's state. Every script then writes there: a new
 * project whose `.jtakeit` holds another business's scrape, another business's
 * photographs and a stage nobody set. It looks like corruption and it is
 * ordinary path resolution.
 *
 * A project is a git repository (`@jtakeit/astro create` makes one), so `.git`
 * is where the walk ends: the state of a directory this one merely sits inside
 * is not ours to read.
 */
export function findRoot(from = process.cwd()) {
  const walk = (test) => {
    let dir = resolve(from);
    for (;;) {
      if (test(dir)) return dir;
      // Checked after the test, so a repository root carrying the state file is
      // still found — it is climbing *past* one that is forbidden.
      if (existsSync(join(dir, '.git'))) return null;
      const parent = dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  };

  return (
    walk((dir) => existsSync(join(dir, STATE_FILE))) ??
    // No state file yet — the nearest package.json is the next best guess at
    // where the project starts.
    walk((dir) => existsSync(join(dir, 'package.json'))) ??
    resolve(from)
  );
}

export function statePath(root) {
  return join(root, STATE_FILE);
}

export function readState(root) {
  const file = statePath(root);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`${file} is not valid JSON: ${e.message}`);
  }
}

export function writeState(root, state) {
  // Stamped on every write rather than only at init: what matters is which
  // skills did the last piece of work, not which ones created the directory.
  state.skills = skillsVersion();
  const dir = join(root, STATE_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(statePath(root), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  writeFileSync(join(root, 'STATUS.md'), renderStatus(state), 'utf8');
}

export function emptyState(fields = {}) {
  const track = fields.track === 'outbound' ? 'outbound' : 'inbound';
  return {
    version: 2,
    track,
    client: {
      name: fields.name ?? '',
      slug: fields.slug ?? '',
      locale: fields.locale ?? 'en',
      vertical: fields.vertical ?? '',
      /** The business's own domain, attached in the panel at launch or later. */
      domain: fields.domain ?? null,
    },
    package: fields.package ?? 'landing',
    stage: LADDER[track][0],
    stageStartedAt: today(),
    /** Outbound only. Everything here is scraped and therefore unconfirmed. */
    prospect: {
      handle: fields.handle ?? null,
      scrapedAt: null,
      /** What the pitch video was made from, and when it was handed over. */
      pitchVideo: null,
      sentAt: null,
      repliedAt: null,
    },
    /** Set when a project is archived, so `revive` knows where to put it back. */
    archivedFrom: null,
    /** Which skill set last wrote this file. See skillsVersion(). */
    skills: skillsVersion(),
    /**
     * The shape this project took. Chosen from the catalogues in
     * `@jtakeit/astro`'s docs/shapes.md, and recorded because three builds in a
     * row can arrive at the same hero and the same stack of bands with nobody
     * deciding that. What makes the next one different is knowing what the last
     * one was.
     */
    design: {
      hero: fields.hero ?? null,
      form: fields.form ?? null,
      type: fields.type ?? null,
      /** What it is printed on — docs/surface.md. */
      pattern: null,
      edge: null,
      reveal: null,
      /** How the photographs are printed — docs/photos.md. */
      treatment: null,
      /** How the body of work is shown — docs/gallery.md. */
      gallery: null,
      /** Which angles the page argues from — `jtakeit-sites:spec` → references/copy.md. */
      angles: null,
      /** The element on the page that could not be moved to another site. */
      signature: null,
    },
    variants: {
      count: Number(fields.variants ?? 3),
      names: fields.names ?? [],
      chosen: null,
    },
    /**
     * The site on jtakeit. `id` is what `create_site` answered; `repo` is
     * `<owner>/<name>` on GitHub, the one `attach_repo` was given. The preview
     * link is not stored: it is a ticket with a short life, minted fresh with
     * `get_preview_link` whenever a person needs one.
     */
    site: {
      id: null,
      repo: fields.repo ?? null,
      kit: fields.kit ?? null,
      lastBuild: null,
    },
    preview: {
      /** When a preview link was last sent to the business. */
      sentAt: null,
    },
    /**
     * `mode` is how the developer ends it: `keep` — they keep the client and a
     * person launches in the panel; `handover` — the panel's handover link moves
     * the site and its repository to the client. See `jtakeit-sites:launch`.
     */
    launch: { mode: null, launchedAt: null, deliveredAt: null },
    log: [],
  };
}

/** The stage list this project actually walks. */
export function ladderFor(state) {
  return LADDER[state.track === 'outbound' ? 'outbound' : 'inbound'];
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** `a.b.c` → the value at that path, or undefined. */
export function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

/** `a.b.c` = value, creating intermediate objects. */
export function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let node = obj;
  for (const key of keys) {
    if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
    node = node[key];
  }
  node[last] = value;
}

/** Numbers and booleans typed on a command line arrive as strings. */
export function coerce(raw) {
  if (raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw !== '' && !Number.isNaN(Number(raw))) return Number(raw);
  if (raw.startsWith('[') || raw.startsWith('{')) {
    try {
      return JSON.parse(raw);
    } catch {
      /* fall through — it was meant as a string */
    }
  }
  return raw;
}

/**
 * STATUS.md — the human-readable copy of the state, regenerated on every write
 * and committed with it. It is what shows the stage on the repository's front
 * page, and it is taken out of the tree before a handover (`jt-clean`).
 */
export function renderStatus(state) {
  const ladder = ladderFor(state);
  const archived = state.stage === ARCHIVED;
  // An archived project still shows where it stopped, so the row it stopped on
  // is the one marked — «closed at the pitch» and «closed at launch» are very
  // different facts and the table should not flatten them.
  const current = ladder.indexOf(archived ? (state.archivedFrom ?? ladder[0]) : state.stage);
  const pkg = PACKAGES[state.package] ?? { title: state.package, summary: '' };
  const name = state.client.name || state.client.slug || 'Unnamed client';

  const rows = ladder.map((stage, i) => {
    const meta = STAGE_META[stage];
    const mark = archived && i === current ? '[—]' : i < current ? '[x]' : i === current ? '[>]' : '[ ]';
    const label = i === current ? `**${meta.title}**` : meta.title;
    return `| ${mark} | ${i} | ${label} | ${meta.blurb} |`;
  });

  const log = state.log.length
    ? state.log
        .slice()
        .reverse()
        .map((e) => `- \`${e.at.slice(0, 10)}\` → **${e.stage}**${e.note ? ` — ${e.note}` : ''}`)
        .join('\n')
    : '- (nothing logged yet)';

  const facts = [
    ['Track', state.track === 'outbound' ? 'Outbound — we approached them' : 'Inbound — they approached us'],
    ['Package', `${pkg.title} — ${pkg.summary}`],
    ['Locale', state.client.locale],
    ['Vertical', state.client.vertical || '—'],
    ['Variants', `${state.variants.count}${state.variants.chosen ? ` (chosen: ${state.variants.chosen})` : ''}`],
    ['jtakeit site', state.site?.id ?? '— not created yet'],
    ['Repository', state.site?.repo ?? '—'],
    ['Domain', state.client.domain ?? '— (not yet)'],
    [
      'Shape',
      [state.design?.hero, state.design?.form, state.design?.type].filter(Boolean).join(' · ') || '— not chosen',
    ],
    [
      'Surface',
      [state.design?.pattern, state.design?.edge, state.design?.reveal, state.design?.treatment, state.design?.gallery]
        .filter(Boolean)
        .join(' · ') || '— not chosen',
    ],
    ['Angles', state.design?.angles ?? '— not chosen'],
    ...(state.design?.signature ? [['Signature', state.design.signature]] : []),
    ['Skills', state.skills?.commit ? `${state.skills.version} @ ${state.skills.commit}` : state.skills?.version || '—'],
    ...(state.track === 'outbound'
      ? [['Instagram', state.prospect?.handle ? `@${state.prospect.handle}` : '—']]
      : []),
  ]
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join('\n');

  const next = archived
    ? `Archived at **${STAGE_META[state.archivedFrom ?? ladder[0]].title}**. \`jt-state revive\` puts it back.`
    : STAGE_META[state.stage].skill
      ? `Next: run **${STAGE_META[state.stage].skill}**.`
      : 'Delivered. Nothing further in this pipeline.';

  const heading = archived
    ? `**Archived** — since ${state.stageStartedAt}. ${next}`
    : `**Stage ${current} · ${STAGE_META[state.stage].title}** — since ${state.stageStartedAt}. ${next}`;

  return `# ${name} — status

> Generated by \`jt-state.mjs\`. Do not edit by hand; edit the state and it is
> rewritten. Taken out of the tree before the site is handed over.

${heading}

| | # | Stage | |
| --- | --- | --- | --- |
${rows.join('\n')}

## Project

| | |
| --- | --- |
${facts}

## Log

${log}
`;
}
