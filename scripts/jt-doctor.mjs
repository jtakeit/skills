#!/usr/bin/env node
/**
 * jt-doctor — why your machine produces a different result than somebody else's.
 *
 * Everything the pipeline needs can be written in a README and required by
 * nothing. That is fine until two people work from the same skills and get
 * different output, at which point the interesting question is not "what does
 * the skill say" but "what is actually installed, and which skills are actually
 * running".
 *
 * The commonest answers, and this checks all of them:
 *
 *   · a plugin installed from a marketplace is pinned to a commit and stays
 *     pinned until it is updated — `git pull` in the repository changes nothing
 *   · ffmpeg, playwright's browser, gh: absent, and discovered
 *     halfway through a stage
 *   · frontend-design not installed, so the variants are designed without it
 *   · the jtakeit or Apify MCP server not configured, or not signed in
 *   · the scripts resolving a different project than the one you are in
 *
 *   jt-doctor              # everything, against the current stage
 *   jt-doctor --stage spec # as if the project were at that stage
 *
 * Exit code is the number of things missing for the current stage. Warnings for
 * later stages are printed and do not fail: a prospect does not need ffmpeg.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { browserCache, DEPS, hasChromium } from './lib/browser.mjs';
import { findRoot, readState, skillsVersion, STATE_FILE } from './lib/state.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(HERE, '..');

const argv = process.argv.slice(2);
const flag = (n, d = undefined) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};

const rows = [];
const ok = (name, detail) => rows.push({ level: 'ok', name, detail });
const missing = (name, detail) => rows.push({ level: 'missing', name, detail });
const later = (name, detail) => rows.push({ level: 'later', name, detail });
const note = (name, detail) => rows.push({ level: 'note', name, detail });

const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
};

// --- where are we, and what is running --------------------------------------

const root = findRoot();
const state = root && existsSync(join(root, STATE_FILE)) ? readState(root) : null;
const stage = flag('stage', state?.stage ?? null);
const track = state?.track ?? 'outbound';

/*
 * The platform, because most of this skill set's shell snippets are POSIX and
 * a native Windows shell is where they stop being copy-pasteable. The scripts
 * themselves are portable node; the `node "$JT/…"` lines in the skills are
 * not, and neither are heredocs.
 */
const platform = (() => {
  if (process.platform !== 'win32') {
    const wsl = existsSync('/proc/version') && /microsoft/i.test(readFileSync('/proc/version', 'utf8'));
    return `${process.platform}${wsl ? ' (WSL)' : ''}`;
  }
  return 'win32 — run the pipeline from WSL2 or Git Bash; PowerShell cannot read the shell snippets in the skills';
})();

console.log('');
console.log(`Machine · node ${process.versions.node} on ${platform}`);
console.log(`Project · ${state ? `${state.client.name || state.client.slug} — stage ${state.stage}` : 'none here'}`);
console.log(`          ${root}`);

const skills = skillsVersion();
console.log(`Skills  · ${skills.version}${skills.commit ? ` @ ${skills.commit}` : ' (no git history — a marketplace copy)'}`);
console.log(`          ${PLUGIN_ROOT}`);

/*
 * How this plugin is installed decides whether `git pull` in the repository
 * changes anything at all. A `directory` marketplace is a symlink to a working
 * copy and follows it; anything else is a copy pinned to `gitCommitSha` until
 * the plugin is updated. Two colleagues can be on the same branch and running
 * skills a month apart, and nothing in a client project would show it.
 */
{
  const installed = join(homedir(), '.claude', 'plugins', 'installed_plugins.json');
  const known = join(homedir(), '.claude', 'plugins', 'known_marketplaces.json');
  try {
    const record = JSON.parse(readFileSync(installed, 'utf8')).plugins?.['jtakeit-sites@jtakeit']?.[0];
    const source = JSON.parse(readFileSync(known, 'utf8'))['jtakeit']?.source?.source;
    if (!record) {
      note('plugin', 'jtakeit-sites@jtakeit is not installed for this user — the skills are not loading from here');
    } else if (source === 'directory') {
      ok('plugin', `installed from a directory — follows ${record.installPath}, so edits are live`);
    } else {
      note(
        'plugin',
        `installed from ${source ?? 'a marketplace'}, pinned at ${(record.gitCommitSha ?? '?').slice(0, 12)} — ` +
          'a `git pull` in the repository does not change what runs. Update it in /plugin.',
      );
    }
    if (state?.skills?.commit && skills.commit && state.skills.commit.replace('+', '') !== skills.commit.replace('+', ''))
      note('plugin', `this project was last written by skills ${state.skills.commit}, you are running ${skills.commit}`);
  } catch {
    note('plugin', 'no plugin records under ~/.claude/plugins — running the scripts directly, not as a plugin');
  }
}

// --- the tools, per stage ---------------------------------------------------
//
// Needed *now* is a failure; needed three stages later is a line to read. A
// prospect blocked on ffmpeg would be a check people learn to skip.

const NEEDED = {
  prospect: ['node', 'git', 'playwright', 'apify'],
  spec: ['node', 'git', 'gh', 'playwright'],
  clips: ['node', 'ffmpeg'],
  pitch: ['node', 'git', 'playwright', 'ffmpeg', 'pitch-audio'],
  brief: ['node', 'git'],
  variants: ['node', 'git', 'playwright', 'frontend-design'],
  preview: ['node', 'git', 'gh'],
  revisions: ['node', 'git', 'gh'],
  launch: ['node', 'git', 'gh'],
};
const needed = new Set(NEEDED[stage] ?? Object.values(NEEDED).flat());
const judge = (key, name, detail, present) =>
  present ? ok(name, detail) : needed.has(key) ? missing(name, detail) : later(name, detail);

const node = process.versions.node;
judge('node', 'node', `${node}${Number(node.split('.')[0]) >= 22 ? '' : ' — the scripts want ≥ 22.12'}`, Number(node.split('.')[0]) >= 22);
judge('git', 'git', run('git', ['--version']) ?? 'not on PATH', Boolean(run('git', ['--version'])));

const gh = run('gh', ['--version'])?.split('\n')[0];
const ghAuth = gh ? run('gh', ['auth', 'status']) !== null : false;
judge('gh', 'gh', gh ? (ghAuth ? `${gh}, logged in` : `${gh}, NOT logged in — \`gh auth login\``) : 'not installed', Boolean(gh) && ghAuth);

const ffmpeg = run('ffmpeg', ['-version'])?.split('\n')[0]?.slice(0, 40);
const INSTALL_FFMPEG =
  process.platform === 'darwin'
    ? '`brew install ffmpeg`'
    : process.platform === 'win32'
      ? '`winget install ffmpeg` (or scoop/choco)'
      : '`apt install ffmpeg`';
judge(
  'ffmpeg',
  'ffmpeg',
  ffmpeg ?? `not installed — ${INSTALL_FFMPEG}`,
  Boolean(ffmpeg) && Boolean(run('ffprobe', ['-version'])),
);

/*
 * Playwright is two things and only one of them installs itself. The package
 * lands in scripts/.deps on first use; the browser binary is a separate
 * download, and its absence is discovered in the middle of jt-check.
 */
{
  const pkg = existsSync(join(DEPS, 'node_modules', 'playwright'));
  const browser = hasChromium();
  judge(
    'playwright',
    'playwright',
    pkg
      ? browser
        ? `package and chromium both present (${browserCache()})`
        : 'package present, no chromium — the next run installs it'
      : 'not installed yet — the first run installs the package and the browser',
    pkg && browser,
  );
}

/*
 * The jtakeit MCP server. A hint, never a failure: the tools are the platform's
 * and sign in over OAuth on first use, approved by a person in the panel, which
 * nothing on this machine can check. What can be checked is that a server named
 * `jtakeit` is configured at all — in this plugin's own .mcp.json, or the
 * user's — so that "the tools are missing" is told apart from "not signed in".
 */
{
  const servers = [];
  const read = (file, pick) => {
    try {
      const doc = JSON.parse(readFileSync(file, 'utf8'));
      if (pick(doc) && !servers.includes(file.replace(homedir(), '~'))) servers.push(file.replace(homedir(), '~'));
    } catch {
      /* absent or unreadable: simply not a place it is configured */
    }
  };
  read(join(PLUGIN_ROOT, '.mcp.json'), (d) => d.mcpServers?.jtakeit);
  read(join(homedir(), '.claude.json'), (d) => d.mcpServers?.jtakeit);
  read(join(root, '.mcp.json'), (d) => d.mcpServers?.jtakeit);
  servers.length
    ? note('jtakeit mcp', `configured (${servers.join(', ')}) — check \`/mcp\` shows it connected; the first use signs in through the browser`)
    : note('jtakeit mcp', 'no server named jtakeit configured — the plugin ships one in .mcp.json (https://mcp.jtakeit.com/mcp)');
}

// Apify, the way jtakeit is reached: the plugin's .mcp.json names the server
// and the first use signs in through the browser — no token in the environment.
// Whether that sign-in happened only `/mcp` knows, so the stage that scrapes
// says to look there; a script cannot.
{
  let configured = false;
  try {
    configured = Boolean(JSON.parse(readFileSync(join(PLUGIN_ROOT, '.mcp.json'), 'utf8')).mcpServers?.apify);
  } catch {
    /* unreadable: reported as not configured */
  }
  judge('apify', 'apify mcp', configured
    ? 'configured — check `/mcp` shows apify connected; the first use signs in to your Apify account through the browser'
    : 'no server named apify in the plugin\'s .mcp.json — reinstall the plugin', configured);
}

/*
 * The design plugin. The variants stage says "invoke frontend-design per variant"; where
 * it is not installed nothing errors, the design simply happens without it, and
 * that is a different result from a colleague who has it.
 */
{
  let present = false;
  try {
    present = Boolean(
      JSON.parse(readFileSync(join(homedir(), '.claude', 'plugins', 'installed_plugins.json'), 'utf8')).plugins?.[
        'frontend-design@claude-plugins-official'
      ],
    );
  } catch {
    /* no records: reported by the plugin row above */
  }
  judge('frontend-design', 'frontend-design', present ? 'installed' : 'NOT installed — the variants will be designed without it', present);
}

// The pitch audio is the user's own: no music and no voice ship with the
// plugin (no licence for the one, and the other is a particular person's
// voice). jt-pitch reads them from assets/pitch/, or from JT_PITCH_ASSETS.
{
  const dir = process.env.JT_PITCH_ASSETS ? resolve(process.env.JT_PITCH_ASSETS) : join(PLUGIN_ROOT, 'assets', 'pitch');
  const AUDIO = /\.(mp3|m4a|wav|aac|ogg)$/i;
  const count = (sub) => (existsSync(join(dir, sub)) ? readdirSync(join(dir, sub)).filter((f) => AUDIO.test(f)).length : 0);
  const music = count('music');
  const voice = count('voice');
  judge(
    'pitch-audio',
    'pitch audio',
    `${voice} voice file(s), ${music} music bed(s) in ${dir.replace(homedir(), '~')} — your own recordings; see assets/pitch/README.md`,
    voice > 0,
  );
}

// --- report -----------------------------------------------------------------

const MARK = { ok: '✓', missing: '✗', later: '·', note: '·' };
console.log('');
for (const r of rows) console.log(`  ${MARK[r.level]} ${r.name.padEnd(16)} ${r.detail}`);

const blocking = rows.filter((r) => r.level === 'missing');
console.log('');
if (blocking.length) {
  console.log(
    `${blocking.length} thing(s) missing for ${stage ? `stage ${stage}` : 'the pipeline'}. Fix these before comparing results with anybody — /jt-setup walks through them.`,
  );
} else {
  console.log(`Ready${stage ? ` for stage ${stage}` : ''}.`);
}
process.exit(Math.min(blocking.length, 100));
