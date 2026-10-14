#!/usr/bin/env node
/**
 * jt-init — start a client project: the site from @jtakeit/astro, the pipeline
 * state beside it.
 *
 * The scaffold is not ours any more. `npx @jtakeit/astro create` lays out the
 * platform's contract as an Astro project — layout, hero, the enquiry form the
 * platform answers, the booking form for its diary, robots, sitemap, llms.txt,
 * `src/content/blocks.ts`, `BRIEF.md` — and makes the first commit. This script
 * runs it, then writes `.jtakeit/state.json` and `STATUS.md` into the new
 * repository and commits them, so the stage is written down from the first
 * minute.
 *
 *   jt-init --slug atelier-nord --name "Atelier Nord" --locale de-CH \
 *           [--vertical salon] [--package landing|bookings] [--kit <kind>] \
 *           [--variants 3] [--track outbound --handle atelier.nord.zh] \
 *           [--out <dir>] [--dry-run]
 *
 * Nothing here reaches outside the machine. The repository on GitHub, the site
 * on jtakeit and the GitHub App are the next steps, and each is said at the end
 * rather than done: `gh repo create` puts a business's name on somebody's
 * account, and `create_site` is the platform's, through its MCP server.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { npm } from './lib/browser.mjs';
import { PACKAGES, STATE_FILE, emptyState, writeState } from './lib/state.mjs';

const argv = process.argv.slice(2);
const has = (name) => argv.includes(`--${name}`);
const flag = (name, fallback = undefined) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

function die(message) {
  console.error(`jt-init: ${message}`);
  process.exit(1);
}

if (has('help') || has('h') || !argv.length) {
  console.log(`jt-init — scaffold a site with @jtakeit/astro and start its pipeline state

  --slug <slug>          lowercase letters, digits and dashes (required)
  --name "<name>"        the business's name
  --locale <tag>         BCP 47: de-CH, en, fr-CH, it-CH, uk, …
  --vertical <word>      salon, restaurant, studio, …
  --package <p>          ${Object.keys(PACKAGES).join(' | ')} (default landing)
  --kit <kind|file>      a booking kit, passed to @jtakeit/astro (implies --package bookings)
  --variants <n>         design directions agreed in the brief (inbound; default 3)
  --track <t>            inbound (default) | outbound
  --handle <ig>          the Instagram handle (outbound; required there)
  --out <dir>            where to scaffold; ./<slug> by default
  --astro <version>      the @jtakeit/astro version to run (default latest)
  --dry-run              say what would happen and stop`);
  process.exit(argv.length ? 0 : 1);
}

const slug = flag('slug');
if (!slug) die('needs --slug');
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  die(`slug "${slug}" must be lowercase letters, digits and dashes — it becomes the directory, the repository name and the site's slug on jtakeit`);
}

const kit = flag('kit', null);
const pkg = flag('package', kit ? 'bookings' : 'landing');
if (!PACKAGES[pkg]) die(`unknown package "${pkg}". Known: ${Object.keys(PACKAGES).join(', ')}`);
if (pkg === 'bookings' && !kit) {
  die('--package bookings needs --kit <kind>: a site that takes bookings starts from its kind\'s kit, whole');
}

const name = flag('name', slug);
const locale = flag('locale', 'en');
const vertical = flag('vertical', '');
const track = flag('track', 'inbound');
if (track !== 'inbound' && track !== 'outbound') die('--track must be inbound or outbound');
const handle = (flag('handle', '') || '').replace(/^@/, '');
if (track === 'outbound' && !handle) die('an outbound project needs --handle <instagram-username>');

// A spec build is one site, not a choice of directions: there is no client yet
// to show three to, and the pitch video shows one page.
const variants = track === 'outbound' ? 1 : Number(flag('variants', 3));
if (!Number.isInteger(variants) || variants < 1) die('--variants must be a positive integer');

const target = resolve(flag('out', slug));
const dryRun = has('dry-run');

if (existsSync(target) && readdirSync(target).filter((f) => f !== '.git').length && !has('force')) {
  die(`${target} is not empty. Pass --force to scaffold into it anyway.`);
}

/*
 * Never inside another project.
 *
 * `.jtakeit/` belongs to exactly one business, and a project scaffolded under a
 * directory that already has one is one `--no-git` away from inheriting it:
 * every script walking up from here would find the parent's state first. What
 * that looks like from the outside is a new project whose `.jtakeit` holds
 * somebody else's scrape and somebody else's photographs.
 */
{
  let dir = dirname(target);
  for (;;) {
    if (existsSync(join(dir, STATE_FILE)) && !has('force')) {
      const owner = (() => {
        try {
          return JSON.parse(readFileSync(join(dir, STATE_FILE), 'utf8')).client?.slug ?? '?';
        } catch {
          return '?';
        }
      })();
      die(
        [
          `${target} sits inside another project (${owner}, at ${dir}).`,
          'Scaffold beside it rather than inside it. Pass --force if you genuinely mean to.',
        ].join('\n'),
      );
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

// --- the scaffold: @jtakeit/astro's, run as it is published ------------------

const spec = `@jtakeit/astro@${flag('astro', 'latest')}`;
const createArgs = ['--yes', spec, 'create', slug, '--name', name, '--locale', locale, '--out', target];
if (vertical) createArgs.push('--vertical', vertical);
if (kit) createArgs.push('--kit', kit);
if (flag('schema-type')) createArgs.push('--schema-type', flag('schema-type'));
if (has('blog')) createArgs.push('--blog');
if (has('force')) createArgs.push('--force');

if (dryRun) {
  console.log(`Would run: npx ${createArgs.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}`);
  console.log(`Then write ${join(relative(process.cwd(), target) || '.', STATE_FILE)} and STATUS.md: ${track} track, package ${pkg}, ${variants} variant(s).`);
  process.exit(0);
}

console.log(`npx ${spec} create ${slug} …`);
const created = spawnSync(npm('npx'), createArgs, { stdio: 'inherit' });
if (created.status !== 0) {
  die(`@jtakeit/astro create failed (exit ${created.status ?? created.signal}). Nothing of the pipeline was written.`);
}
if (!existsSync(join(target, 'package.json'))) {
  die(`@jtakeit/astro create finished but ${target} has no package.json — look at its output above.`);
}

// --- the state ---------------------------------------------------------------

const state = emptyState({ slug, name, locale, vertical, package: pkg, variants, track, handle: handle || null, kit });
writeState(target, state);

// The scaffold made the first commit; the state is the second. `.jtakeit/`
// is committed on purpose — the stage is the repository's, not a laptop's —
// except the scrape and the photographs, which are large and are the
// business's material rather than ours: those stay out of git.
try {
  const git = (...args) => execFileSync('git', args, { cwd: target, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (existsSync(join(target, '.git'))) {
    const ignore = join(target, '.gitignore');
    const current = existsSync(ignore) ? readFileSync(ignore, 'utf8') : '';
    if (!current.includes('.jtakeit/')) {
      const block =
        '\n# The pipeline (jtakeit-sites): the state is committed; the scrape and the\n' +
        '# photographs taken from it are working material and stay on this machine.\n' +
        '.jtakeit/*\n!.jtakeit/state.json\n';
      appendFileSync(ignore, block, 'utf8');
    }
    git('add', '.gitignore', STATE_FILE, 'STATUS.md');
    git('commit', '-q', '-m', `pipeline: ${track} track, stage ${state.stage}`);
  }
} catch (e) {
  console.error(`jt-init: the state is written, the commit was not — ${String(e.stderr || e.message).trim()}`);
}

const rel = relative(process.cwd(), target) || '.';
console.log('');
console.log(`Started ${name} in ${rel}`);
console.log(`  track    ${track}${track === 'outbound' ? ` — spec build for @${handle}` : ''}`);
console.log(`  package  ${pkg}${kit ? ` (kit ${kit})` : ''}`);
console.log(`  locale   ${locale}`);
console.log(`  variants ${variants}`);
console.log('');
console.log('Next, in order:');
console.log(`  cd ${rel} && npm ci && npm run dev`);
console.log(`  create_site (jtakeit MCP) with slug "${slug}" and the name — then: jt-state set site.id <id>`);
console.log('  open_dev_session with the dev server\'s address, so the developer sees the pages as they are written');
console.log(`  gh repo create <owner>/${slug} --private --source . --push   — asked of the developer first, never assumed`);
console.log('  the jtakeit GitHub App on that repository (https://github.com/apps/jtakeit-connect) — a person installs it');
console.log(
  track === 'outbound'
    ? '\nThen load jtakeit-sites:prospect.'
    : '\nThen load jtakeit-sites:brief and fill BRIEF.md.',
);
