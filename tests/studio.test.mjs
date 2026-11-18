/**
 * The studio index, held to what it promises (scripts/lib/studio.mjs).
 *
 *   node --test tests/*.test.mjs
 *
 * It shows the studio's last sites beside a new one and never refuses one
 * (jtakeit-core wiki/115), so what is tested is that it keeps the right lines,
 * keeps its pictures with them, compares what it should and not the mark, and
 * that a missing index is an empty one rather than an error. Every test writes
 * into a temporary XDG_CONFIG_HOME, never into the real home.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  AXES,
  KEEP,
  axisId,
  indexPath,
  projectRecord,
  readAxes,
  readIndex,
  recentSites,
  recordSite,
  sharedAxes,
} from '../scripts/lib/studio.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const STUDIO = resolve(HERE, '..', 'scripts', 'jt-studio.mjs');

const temp = (name) => mkdtempSync(join(tmpdir(), `jt-studio-${name}-`));
const envAt = () => ({ XDG_CONFIG_HOME: temp('config'), HOME: '/nonexistent' });

/** A pipeline project on disk: a state file, a design document, two first screens. */
function project(name, axes = {}, { shots = true } = {}) {
  const root = temp(name);
  mkdirSync(join(root, '.jtakeit', 'shots', 'home'), { recursive: true });
  mkdirSync(join(root, 'jtk'), { recursive: true });
  writeFileSync(join(root, '.git'), ''); // findRoot stops at a repository boundary
  writeFileSync(join(root, '.jtakeit', 'state.json'), JSON.stringify({ client: { name, slug: name.toLowerCase() }, design: { look: `${name}: test` } }));
  writeFileSync(join(root, 'jtk', 'design.json'), JSON.stringify({ v: 2, accent: '#000000', axes }));
  if (shots)
    for (const tag of ['laptop', 'phone']) writeFileSync(join(root, '.jtakeit', 'shots', 'home', `${tag}-00-first-screen.png`), `${name}-${tag}`);
  return root;
}

describe('the axes in jtk/design.json', () => {
  it('reads the fourteen keys and says which are missing', () => {
    const root = project('Lea', { hero: 'portrait-dissolve', ground: 'light', mark: 'the ring', stray: 'x', fonts: '  ' });
    const read = readAxes(root);
    assert.deepEqual(read.axes, { hero: 'portrait-dissolve', ground: 'light', mark: 'the ring' });
    assert.equal(read.missing.length, AXES.length - 3);
    assert.ok(read.missing.includes('fonts'), 'a blank value is not a choice');
  });
  it('is null without a design document', () => {
    assert.equal(readAxes(temp('bare')), null);
  });
  it('compares the id, not the note, and never the mark', () => {
    assert.equal(axisId('serif+sans: Fraunces + Inter'), 'serif+sans');
    assert.equal(axisId('draw · 2'), 'draw');
    assert.equal(axisId('Light-One-Dark: the booking'), 'light-one-dark');
    const a = { hero: 'split-framed', fonts: 'serif+sans: Fraunces + Inter', mark: 'the arch', motion: 'draw · 2' };
    const b = { hero: 'split-framed: gold arch', fonts: 'serif+sans: Lora + Inter', mark: 'the arch', motion: 'rise · 1' };
    assert.deepEqual(sharedAxes(a, b), ['hero', 'fonts']);
  });
});

describe('the index', () => {
  it('is empty, not an error, when there is none', () => {
    const env = envAt();
    assert.deepEqual(readIndex(env), []);
    assert.deepEqual(recentSites('/nowhere', {}, 3, env), []);
  });

  it('keeps one line per project, the last first screens copied beside it', () => {
    const env = envAt();
    const root = project('Kurve', { hero: 'split-framed' });
    recordSite(projectRecord(root), env);
    recordSite({ ...projectRecord(root), axes: { hero: 'reel' } }, env);
    const list = readIndex(env);
    assert.equal(list.length, 1, 'a project recorded twice is one line');
    assert.deepEqual(list[0].axes, { hero: 'reel' });
    assert.equal(list[0].look, 'Kurve: test');
    assert.ok(existsSync(list[0].hero.laptop) && existsSync(list[0].hero.phone));
    assert.ok(list[0].hero.laptop.startsWith(env.XDG_CONFIG_HOME), 'copied, not pointed at the project');
  });

  it(`keeps the last ${KEEP} and deletes the pictures of the ones that fell off`, () => {
    const env = envAt();
    const roots = Array.from({ length: KEEP + 2 }, (_, i) => project(`Site${i}`, { hero: 'reel' }));
    for (const root of roots) recordSite(projectRecord(root), env);
    const list = readIndex(env);
    assert.equal(list.length, KEEP);
    assert.equal(list[0].name, 'Site2');
    const pictures = readdirSync(join(env.XDG_CONFIG_HOME, 'jtakeit-sites', 'studio-sites'));
    assert.equal(pictures.length, KEEP * 2);
    assert.ok(!pictures.some((f) => f.startsWith('site0-') || f.startsWith('site1-')));
  });

  it('records a project with no shots yet, and no picture', () => {
    const env = envAt();
    const entry = recordSite(projectRecord(project('Maserung', {}, { shots: false })), env);
    assert.deepEqual(entry.hero, {});
  });

  it('shows the last three others, newest first, with what they share', () => {
    const env = envAt();
    const names = ['Strupler', 'Rail-tec', 'KAIF', 'Lacqué'];
    const roots = names.map((n, i) => project(n, { hero: i % 2 ? 'type-over-film' : 'model-explode', shape: 'square', mark: 'same' }));
    for (const root of roots) recordSite(projectRecord(root), env);
    const here = roots[3];
    const recent = recentSites(here, { hero: 'type-over-film', shape: 'square', mark: 'same' }, 3, env);
    assert.deepEqual(recent.map((e) => e.name), ['KAIF', 'Rail-tec', 'Strupler']);
    assert.deepEqual(recent[1].shared, ['hero', 'shape']);
    assert.deepEqual(recent[0].shared, ['shape'], 'the mark is never compared');
  });

  it('keeps only pipeline projects', () => {
    assert.equal(projectRecord(temp('loose')), null);
  });
});

describe('jt-studio', () => {
  const run = (root, args, env) =>
    execFileSync(process.execPath, [STUDIO, ...args], { cwd: root, env: { ...process.env, ...env }, encoding: 'utf8' });

  it('records, then lists the others and exits 0 — it never fails a site', () => {
    const env = envAt();
    const a = project('Brumy', { hero: 'reel', header: 'strip-to-capsule' });
    const b = project('Natshalee', { hero: 'split-framed', header: 'strip-to-capsule' });
    run(a, ['record'], env);
    run(b, ['record'], env);
    const out = run(b, [], env);
    assert.match(out, /2 of 14 axes/);
    assert.match(out, /Brumy/);
    assert.match(out, /shares: 1 of 13 — header/);
    assert.doesNotMatch(out, /Natshalee ·/, 'not itself');
    const json = JSON.parse(run(b, ['--json'], env));
    assert.equal(json.index, indexPath(env));
    assert.equal(json.recent.length, 1);
  });

  it('says so when the index is empty', () => {
    const out = run(project('Solo', {}), [], envAt());
    assert.match(out, /No earlier sites/);
  });
});
