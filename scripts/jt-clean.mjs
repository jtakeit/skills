#!/usr/bin/env node
/**
 * jt-clean — take our working material out of the tree before the site is
 * handed over, and prove it is gone.
 *
 * A handover on jtakeit is the panel's: the client opens the handover link,
 * takes the site, and the repository is mirrored to them. What they receive is
 * this repository — so what should not reach them has to be out of it before
 * the link is minted: no pipeline state, no scrape, no portrait of them read
 * off their Instagram, no review notes, no agent instructions, no variant pages
 * under /v/ or the preview shell. The README stays as it is: the repository is
 * the site's, and a person reads it before the handover.
 *
 *   jt-clean            git rm the working files, drop unused kit pieces, scan
 *   jt-clean --check    scan the current tree only
 *
 * The scan is a gate, not advice: a finding exits non-zero and the handover
 * waits. It reads the working tree, not the history — the mirror carries the
 * history too, which is why a portrait and a review list are never worth
 * committing in the first place.
 *
 * Not needed when the developer keeps the client: a launched site the developer
 * runs keeps its STATUS.md and its state, and nobody but them reads the
 * repository.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { STATE_DIR, findRoot, readState } from './lib/state.mjs';


const argv = process.argv.slice(2);
const has = (name) => argv.includes(`--${name}`);
const flag = (name, fallback = undefined) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const root = findRoot();
const state = readState(root);
const slug = state?.client.slug ?? '';

/**
 * Removed outright. Ours, all of it. `BRIEF.md` and `jtk/` stay: the first is
 * the platform's (the panel reads it) and the client's own brief, the second
 * is the site's contract with the platform.
 */
const STRIP = [
  STATE_DIR,
  '.claude',
  '.cursor',
  '.github/copilot-instructions.md',
  '.mcp.json',
  '.cursorrules',
  '.windsurfrules',
  'CLAUDE.md',
  'AGENTS.md',
  'STATUS.md',
  'REVIEW.md',
  'PORTRAIT.md',
  'src/pages/preview.astro',
  'src/pages/v',
  'src/components/_preview',
  'src/data/variants.ts',
];

/** Any top-level directory starting with `_` is working material. */
const isWorkingDir = (name) => name.startsWith('_');

const TEXT = /\.(m?[jt]sx?|astro|css|scss|html|json|md|txt|ya?ml|toml|svg)$/i;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.astro', STATE_DIR]);

/** Files the scan does not read: the client's own brief names its open questions on purpose. */
const SKIP_FILES = new Set(['BRIEF.md', 'package-lock.json']);

/**
 * What must not reach the client. Each entry is [label, regex, severity].
 * `soft` findings are reported and do not fail on their own — they are the ones
 * that need a human to look rather than a rule to decide.
 */
function patterns({ allowCredit }) {
  const list = [
    ['agent tooling', /\b(claude|anthropic|chatgpt|openai|copilot|gpt-[0-9]|\bllm\b)/i, 'hard'],
    // A preview link is a ticket with a short life; one written into the
    // source is a dead link at best and a leaked one at worst.
    ['preview link', /preview\.(?:[a-z0-9-]+\.)*jtakeit\.com/i, 'hard'],
    ['unreplaced placeholder', /\{\{[A-Z_]+\}\}/, 'hard'],
    ['production marker', /TODO\(prod\)/i, 'hard'],
    ['open question', /NEEDS (CLIENT|COPY|REVIEW)/, 'hard'],
    ['filler copy', /lorem ipsum|placeholder@|example@example|\+1 555/i, 'hard'],
    ['loose marker', /\b(FIXME|XXX|HACK)\b/, 'soft'],
    // A converted prospect's site was built on guesses. If the word survives
    // into the client's copy, so did something that was never confirmed.
    ['unconfirmed material', /UNCONFIRMED|scraped from/i, 'hard'],
    // Soft: @jtakeit/astro's own comments name the portrait as a source of
    // colours, and that is not ours to strip. A mention anywhere else is.
    ['portrait mentioned', /PORTRAIT\.md/, 'soft'],
  ];
  // The developer's own name or studio, when the client did not ask for a
  // footer credit: pass it as --credit "<name>" to have it looked for.
  const credit = flag('credit');
  if (credit && !allowCredit) list.push(['developer credit', new RegExp(credit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), 'hard']);
  return list;
}

function walk(dir, base, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else out.push(relative(base, full));
  }
  return out;
}

function scan(dir, opts) {
  const rules = patterns(opts);
  const findings = [];

  for (const rel of walk(dir, dir)) {
    if (!TEXT.test(rel) || SKIP_FILES.has(rel)) continue;
    let body;
    try {
      body = readFileSync(join(dir, rel), 'utf8');
    } catch {
      continue;
    }
    const lines = body.split('\n');
    for (const [label, re, severity] of rules) {
      lines.forEach((line, i) => {
        if (re.test(line)) {
          findings.push({ file: rel, line: i + 1, label, severity, text: line.trim().slice(0, 120) });
        }
      });
    }
  }
  return findings;
}

function report(findings) {
  if (!findings.length) {
    console.log('Scan clean — nothing of ours left in the tree.');
    return 0;
  }
  const hard = findings.filter((f) => f.severity === 'hard');
  const soft = findings.filter((f) => f.severity === 'soft');

  for (const group of [hard, soft]) {
    for (const f of group) {
      const mark = f.severity === 'hard' ? '✗' : '·';
      console.log(`${mark} ${f.file}:${f.line}  [${f.label}]  ${f.text}`);
    }
  }
  console.log('');
  console.log(`${hard.length} blocking, ${soft.length} to look at.`);
  if (hard.length) {
    console.log('');
    console.log('The handover waits on blocking findings. Fix them, then run again.');
    console.log('If the client asked for a footer credit, pass --allow-credit.');
  }
  return hard.length ? 1 : 0;
}

// --- check mode ------------------------------------------------------------

if (has('check')) {
  process.exit(report(scan(root, { allowCredit: has('allow-credit') })));
}

// --- clean mode ------------------------------------------------------------

// The unchosen variants. `chosen` is set during revisions; without it there is
// nothing to collapse and the caller has skipped a step.
if (state?.variants?.names?.length > 1 && !state.variants.chosen) {
  console.error('jt-clean: variants.chosen is not set — the losing directions have not been removed.');
  console.error('Collapse the project onto the chosen variant first (jtakeit-sites:revisions).');
  process.exit(1);
}

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const tracked = (() => {
  try {
    return new Set(git('ls-files').split('\n').filter(Boolean));
  } catch {
    console.error(`jt-clean: ${root} is not a git repository — the handover mirrors a repository, so there is nothing to clean.`);
    process.exit(1);
  }
})();

const removed = [];
const take = (rel) => {
  const full = join(root, rel);
  if (!existsSync(full)) return;
  const inGit = [...tracked].some((f) => f === rel || f.startsWith(`${rel}/`));
  if (inGit) git('rm', '-r', '-q', '--cached', '--', rel);
  rmSync(full, { recursive: true, force: true });
  removed.push(rel);
};

for (const rel of STRIP) {
  // The state is kept on disk, out of git: the pipeline still needs it to
  // advance to `delivered` after the handover.
  if (rel === STATE_DIR) {
    if ([...tracked].some((f) => f.startsWith(`${STATE_DIR}/`))) {
      git('rm', '-r', '-q', '--cached', '--', STATE_DIR);
      removed.push(`${STATE_DIR} (out of git, kept on this machine)`);
    }
    // And kept out: jt-init ignored the directory but for the state file.
    const ignore = join(root, '.gitignore');
    if (existsSync(ignore)) {
      const before = readFileSync(ignore, 'utf8');
      const after = before.replace(/^!\.jtakeit\/state\.json\n?/m, '');
      if (after !== before) writeFileSync(ignore, after, 'utf8');
    }
    continue;
  }
  take(rel);
}
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isDirectory() && isWorkingDir(entry.name)) take(entry.name);
}

/*
 * Unused kit components. The scaffold ships pieces a given site may never use —
 * the hero field is the expensive one, a WebGL shader nobody imported, and the
 * ground catalogue is six backgrounds where a site uses at most one — and a
 * client reading their own codebase should not have to work out whether the
 * animation they have never seen is part of their site.
 *
 * Only what nothing references, decided by looking rather than by a list.
 */
{
  const optional = [
    ['src/components/motion', /HeroField/],
    ['src/components/surface', /<Pattern/],
    ['src/components/Pile.astro', /<Pile/],
    ['src/components/gallery', /<Gallery/],
  ];
  const files = walk(root, root);
  for (const [dir, used] of optional) {
    if (!existsSync(join(root, dir))) continue;
    const referenced = files.some(
      (rel) =>
        !rel.startsWith(`${dir}/`) &&
        rel !== dir &&
        TEXT.test(rel) &&
        existsSync(join(root, rel)) &&
        used.test(readFileSync(join(root, rel), 'utf8')),
    );
    if (!referenced) take(dir);
  }
}

if (removed.length) {
  console.log('Taken out of the tree:');
  for (const rel of removed) console.log(`  - ${rel}`);
} else {
  console.log('Nothing of ours was in the tree.');
}
console.log('');

const code = report(scan(root, { allowCredit: has('allow-credit') }));
if (code === 0) {
  console.log('\nNow: commit, push, `import_branch` and `commit_and_build`, and check the build');
  console.log('before the handover link is minted in the panel. And read the comments by hand —');
  console.log('a script cannot tell one that explains the code from one that argues with an old attempt.');
}
process.exit(code);
