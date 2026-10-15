#!/usr/bin/env node
/**
 * jt-state — read and advance a client project's pipeline stage.
 *
 * The only writer of .jtakeit/state.json. Every write also regenerates
 * STATUS.md, so the stage shown on the repository's front page cannot fall out
 * of step with the stage the pipeline believes it is in.
 *
 *   jt-state show
 *   jt-state init --slug atelier-nord --name "Atelier Nord" --locale de-CH [--variants 3]
 *   jt-state set site.id <id from create_site>
 *   jt-state set variants.chosen linen
 *   jt-state advance preview --note "link sent to the owner"
 *   jt-state archive --reason "no reply after two follow-ups"
 *   jt-state revive
 *   jt-state status            regenerate STATUS.md only
 */

import { existsSync } from 'node:fs';
import {
  ARCHIVED,
  LADDER,
  PACKAGES,
  STAGES,
  STAGE_META,
  ladderFor,
  coerce,
  emptyState,
  findRoot,
  getPath,
  nowIso,
  readState,
  setPath,
  siteHash,
  statePath,
  today,
  skillsVersion,
  writeState,
} from './lib/state.mjs';

const argv = process.argv.slice(2);
const command = argv[0];

function flag(name, fallback = undefined) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
}

function die(message) {
  console.error(`jt-state: ${message}`);
  process.exit(1);
}

const HELP = `jt-state — the pipeline's stage tracker

  show                      current stage, blockers, next skill
  init --slug … --name …    create .jtakeit/state.json
                            [--track inbound|outbound] [--handle <ig>]
                            [--package ${Object.keys(PACKAGES).join('|')}] [--locale <tag>] [--variants <n>]
  set <path> <value>        e.g. set site.id <id>, set variants.chosen linen
  advance <stage> [--note]  one stage forward, never backwards
  archive --reason "…"      close it without a deal; reversible
  revive [--note]           put an archived project back where it stopped
  status                    regenerate STATUS.md

Outbound: ${LADDER.outbound.join(' → ')}
Inbound:  ${LADDER.inbound.join(' → ')}`;

if (!command || command === '--help' || command === '-h' || command === 'help') {
  console.log(HELP);
  process.exit(0);
}

const root = findRoot();

function requireState() {
  const state = readState(root);
  if (!state) {
    die(`no ${statePath(root)} — this project has no pipeline state yet. Run \`jt-init\`, or \`jt-state init\` in an existing site.`);
  }
  return state;
}

switch (command) {
  case 'init': {
    if (existsSync(statePath(root)) && !argv.includes('--force')) {
      die(`${statePath(root)} already exists. Pass --force to overwrite.`);
    }
    const slug = flag('slug');
    if (!slug) die('init needs --slug');
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      die(`slug "${slug}" must be lowercase letters, digits and dashes — it becomes the directory, the repository and the site's slug on jtakeit`);
    }
    const pkg = flag('package', 'landing');
    if (!PACKAGES[pkg]) die(`unknown package "${pkg}". Known: ${Object.keys(PACKAGES).join(', ')}`);

    const track = flag('track', 'inbound');
    if (track !== 'inbound' && track !== 'outbound') die('--track must be inbound or outbound');
    const handle = (flag('handle', '') || '').replace(/^@/, '') || null;

    const state = emptyState({
      slug,
      track,
      handle,
      name: flag('name', slug),
      locale: flag('locale', 'en'),
      vertical: flag('vertical', ''),
      package: pkg,
      variants: track === 'outbound' ? 1 : flag('variants', 3),
      domain: flag('domain', null),
      repo: flag('repo', null),
      kit: flag('kit', null),
    });
    writeState(root, state);
    console.log(`Initialised ${statePath(root)} — ${track} track, stage 0 · ${STAGE_META[state.stage].title}.`);
    break;
  }

  case 'show': {
    const state = requireState();
    const ladder = ladderFor(state);
    const archived = state.stage === ARCHIVED;
    const i = ladder.indexOf(archived ? (state.archivedFrom ?? ladder[0]) : state.stage);
    const meta = STAGE_META[state.stage];
    if (!meta) die(`stage "${state.stage}" is not one this skill set knows — was the file written by an older version?`);
    console.log(`${state.client.name || state.client.slug} · ${state.track} · package ${state.package}`);
    if (archived) {
      console.log(`Archived at ${STAGE_META[state.archivedFrom ?? ladder[0]].title} — since ${state.stageStartedAt}`);
      console.log('  `jt-state revive` puts it back where it stopped.');
    } else {
      console.log(`Stage ${i} · ${meta.title} — since ${state.stageStartedAt}`);
      console.log(`  ${meta.blurb}`);
    }
    console.log(`Variants: ${state.variants.count}${state.variants.chosen ? ` (chosen: ${state.variants.chosen})` : ''}`);
    console.log(`Site:     ${state.site?.id ?? '— not created on jtakeit yet (create_site)'}`);
    console.log(`Repo:     ${state.site?.repo ?? '—'}`);
    console.log(`Domain:   ${state.client.domain ?? '— not yet'}`);
    if (state.track === 'outbound') {
      console.log(`Instagram: ${state.prospect?.handle ? `@${state.prospect.handle}` : '—'}`);
    }
    /*
     * Whose skills did this, against whose are running now. Two people on the
     * same project are not necessarily on the same skills: a marketplace
     * install is pinned to a commit until it is updated, and nothing else in a
     * client project would ever show that.
     */
    {
      const now = skillsVersion();
      const was = state.skills?.commit;
      const shape = [state.design?.hero, state.design?.form, state.design?.type].filter(Boolean);
      console.log(`Shape:    ${shape.length ? shape.join(' · ') : '— not chosen (node_modules/@jtakeit/astro/docs/shapes.md)'}`);
      const surface = [
        state.design?.pattern,
        state.design?.edge,
        state.design?.reveal,
        state.design?.treatment,
        state.design?.gallery,
      ].filter(Boolean);
      console.log(`Surface:  ${surface.length ? surface.join(' · ') : '— not chosen (node_modules/@jtakeit/astro/docs/surface.md)'}`);
      console.log(`Angles:   ${state.design?.angles ?? '— not chosen (spec → references/copy.md)'}`);
      console.log(`Skills:   ${now.version}${now.commit ? ` @ ${now.commit}` : ''}`);
      if (was && now.commit && was.replace('+', '') !== now.commit.replace('+', '')) {
        console.log(`  ! this project was last written by ${was}. Different skills, possibly different results.`);
        console.log('    Update the plugin (/plugin) or check out that commit before comparing.');
      }
    }
    if (archived) {
      break;
    }
    if (meta.skill) {
      console.log(`\nNext: load ${meta.skill} and finish its exit checklist, then \`jt-state advance <next>\`.`);
      const next = ladder[i + 1];
      if (next) console.log(`Next stage would be: ${next}`);
    } else {
      console.log('\nDelivered. Nothing further in this pipeline.');
    }
    break;
  }

  case 'set': {
    const state = requireState();
    const path = argv[1];
    const raw = argv[2];
    if (!path || raw === undefined) die('usage: jt-state set <path> <value>');
    if (path === 'stage') die('use `jt-state advance <stage>` — stage is not set directly');
    /*
     * The guard is against typos, not against new decisions. `design.` is open
     * for the same reason `client.` is: the catalogues grow, and a project
     * started before the newest one existed would otherwise be unable to record
     * a choice it had actually made.
     */
    const open = ['client.', 'launch.', 'design.', 'site.'];
    if (getPath(state, path) === undefined && !open.some((prefix) => path.startsWith(prefix))) {
      die(`unknown path "${path}"`);
    }
    setPath(state, path, coerce(raw));
    writeState(root, state);
    console.log(`${path} = ${JSON.stringify(getPath(state, path))}`);
    break;
  }

  case 'advance': {
    const state = requireState();
    const ladder = ladderFor(state);
    if (state.stage === ARCHIVED) die('this project is archived. `jt-state revive` first.');
    const target = argv[1];
    if (!target) die(`usage: jt-state advance <${ladder.join('|')}>`);
    const from = ladder.indexOf(state.stage);
    const to = ladder.indexOf(target);
    if (to === -1) {
      die(
        STAGES.includes(target)
          ? `"${target}" is not on the ${state.track} ladder: ${ladder.join(' → ')}`
          : `unknown stage "${target}". Known: ${STAGES.join(', ')}`,
      );
    }
    if (to <= from) {
      die(`already at "${state.stage}" — the pipeline does not move backwards. Work that has to be redone is done in the stage it is already in.`);
    }
    if (to > from + 1) {
      die(`cannot skip from "${state.stage}" to "${target}". Finish ${ladder[from + 1]} first.`);
    }
    // Out of a stage that builds, only with the build checked: jt-check passed,
    // on the files as they are now. The 8001 Barber and Schorem specs left the
    // stage with no check run at all (15 October 2026) — a hero cut off at the
    // fold, a menu item to nowhere — and a person found it instead.
    if (['spec', 'variants', 'revisions'].includes(state.stage)) {
      const unchecked = flag('unchecked', '');
      const checks = state.checks;
      const why = !checks
        ? 'jt-check has not been run on this project'
        : !checks.ok
          ? `jt-check failed: ${(checks.failed ?? []).join(', ')}`
          : checks.files !== siteHash(root)
            ? 'the site has changed since jt-check last passed'
            : '';
      if (why && !unchecked) {
        die(`${why}. Build, run \`node "$JT/scripts/jt-check.mjs" --dist ./dist\` until it passes, then advance. (A person may override with --unchecked "<why>", and the reason is logged.)`);
      }
      if (why) state.log.push({ stage: state.stage, at: nowIso(), note: `left unchecked: ${unchecked} (${why})` });
    }
    state.stage = target;
    state.stageStartedAt = today();
    state.log.push({ stage: target, at: nowIso(), note: flag('note', '') });
    if (target === 'delivered') state.launch.deliveredAt = today();
    if (target === 'brief' && state.track === 'outbound') {
      state.prospect.repliedAt = state.prospect.repliedAt ?? today();
    }
    writeState(root, state);
    console.log(`Stage ${to} · ${STAGE_META[target].title}. STATUS.md rewritten — commit and push it.`);
    // The conversion. Everything on the spec site was read off a profile.
    if (target === 'brief' && state.track === 'outbound') {
      console.log('');
      console.log('This prospect said yes. What changes now:');
      console.log('  1. Every fact on the site is still unconfirmed — the brief confirms them, one by one.');
      console.log('  2. The site on jtakeit stays a private preview; nothing goes public until a person launches it.');
      console.log('  3. The photographs were taken from their profile: ask which they want used, and for originals.');
    }
    break;
  }

  case 'archive': {
    const state = requireState();
    if (state.stage === ARCHIVED) die('already archived.');
    const reason = flag('reason');
    if (!reason) die('archive needs --reason — a closed project with no reason is a project nobody can reopen sensibly');
    state.archivedFrom = state.stage;
    state.stage = ARCHIVED;
    state.stageStartedAt = today();
    state.log.push({ stage: ARCHIVED, at: nowIso(), note: reason });
    writeState(root, state);
    console.log(`Archived at ${STAGE_META[state.archivedFrom].title} — ${reason}`);
    console.log('`jt-state revive` puts it back where it stopped.');
    if (state.site?.id) {
      console.log(`The site on jtakeit (${state.site.id}) is still there as a draft; archive it in the panel if it is not coming back.`);
    }
    break;
  }

  case 'revive': {
    const state = requireState();
    if (state.stage !== ARCHIVED) die(`not archived — currently at "${state.stage}".`);
    const back = state.archivedFrom ?? ladderFor(state)[0];
    state.stage = back;
    state.archivedFrom = null;
    state.stageStartedAt = today();
    state.log.push({ stage: back, at: nowIso(), note: flag('note', 'revived') });
    writeState(root, state);
    console.log(`Back at ${STAGE_META[back].title}.`);
    break;
  }

  case 'status': {
    const state = requireState();
    writeState(root, state);
    console.log('STATUS.md regenerated.');
    break;
  }

  default:
    console.error(HELP);
    process.exit(1);
}
