#!/usr/bin/env node
/**
 * jt-studio — the studio's last sites on this machine, beside this one.
 *
 *   jt-studio [--n 3] [--json]   the last n projects before this one: their
 *                                hero shots, their axes, and the axes this
 *                                project shares with each
 *   jt-studio record             put this project in the index now
 *                                (jt-shots does it after every run)
 *
 * For the design stages, before choosing — so a choice that repeats the last
 * site is made knowingly — and for the site critic, which sets the new hero
 * beside the last three. It shows; it never fails anything (jtakeit-core
 * wiki/115). The index is scripts/lib/studio.mjs; the axes are
 * skills/spec/references/axes.md.
 */

import { AXES, describeRecent, indexPath, projectRecord, readAxes, recentSites, recordSite } from './lib/studio.mjs';
import { findRoot } from './lib/state.mjs';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`jt-studio — the studio's last sites, beside this one

  jt-studio [--n 3] [--json]   the last n projects, their hero shots and axes
  jt-studio record             put this project in the index now

Index: ${indexPath()}`);
  process.exit(0);
}

const root = findRoot() ?? process.cwd();

if (argv[0] === 'record') {
  const record = projectRecord(root);
  if (!record) {
    console.error('jt-studio: no .jtakeit/state.json here — the index keeps pipeline projects only.');
    process.exit(1);
  }
  const entry = recordSite(record);
  if (!entry) {
    console.error(`jt-studio: could not write ${indexPath()} — nothing recorded.`);
    process.exit(1);
  }
  console.log(`Recorded ${entry.name} in ${indexPath()}${entry.hero.laptop ? '' : ' (no first screen yet — run jt-shots)'}.`);
  process.exit(0);
}

const mine = readAxes(root);
const axes = mine?.axes ?? {};
const recent = recentSites(root, axes, Number(flag('n', 3)) || 3);

if (argv.includes('--json')) {
  console.log(JSON.stringify({ index: indexPath(), axes, missing: mine?.missing ?? AXES, recent }, null, 2));
  process.exit(0);
}

console.log(`This project: ${Object.keys(axes).length} of ${AXES.length} axes in jtk/design.json${mine?.missing?.length ? ` — not yet: ${mine.missing.join(', ')}` : ''}`);
console.log('');
for (const line of describeRecent(recent, axes)) console.log(line);
console.log('');
console.log('Shown, not ruled: a variant the last site used is still right when this client\'s material asks for it.');
