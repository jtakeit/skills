#!/usr/bin/env node
/**
 * jt-setup — the parts of a first setup a script can do, for /jt-setup.
 *
 *   jt-setup owner              the GitHub account or organisation saved, if any
 *   jt-setup owner <name>       check it on GitHub, save it, and look for the App
 *   jt-setup app [<name>]       is the jtakeit GitHub App installed there?
 *   jt-setup browser            install playwright and its chromium now
 *
 * The owner is where the developer's own repositories go — every speculative
 * site, and a client's site unless the brief says the client's account. It is
 * saved once per machine, outside any project, in
 * $XDG_CONFIG_HOME/jtakeit-sites/config.json (~/.config/… by default), so
 * /jt-from-instagram stops asking it in the middle of a run.
 *
 * Whether the App is installed GitHub tells an organisation's members (`gh`
 * reads /orgs/<org>/installations with read:org) and does not tell anybody
 * about a personal account: the answer there is "unknown", the person
 * confirms, and attach_repo is the check that settles it.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadChromium } from './lib/browser.mjs';

const APP = 'jtakeit-connect';
const APP_URL = `https://github.com/apps/${APP}/installations/new`;
const CONFIG = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'jtakeit-sites', 'config.json');

const die = (message) => {
  console.error(`jt-setup: ${message}`);
  process.exit(1);
};

const readConfig = () => {
  try {
    return JSON.parse(readFileSync(CONFIG, 'utf8'));
  } catch {
    return {};
  }
};

const gh = (args) => {
  try {
    return JSON.parse(execFileSync('gh', ['api', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  } catch {
    return null;
  }
};

/** What GitHub can tell about the App on this owner: installed, absent, or unknown. */
function appOn(owner) {
  const account = gh([`users/${owner}`]);
  if (!account) return { known: false, why: `GitHub has no account named ${owner}, or gh is not logged in` };
  if (account.type !== 'Organization')
    return { known: false, why: `${owner} is a personal account — GitHub does not tell anybody which apps it has; confirm it yourself` };
  const listed = gh([`orgs/${owner}/installations`]);
  if (!listed) return { known: false, why: `gh cannot list ${owner}'s apps — you may not be an owner of it; confirm it yourself` };
  const found = (listed.installations ?? []).find((i) => i.app_slug === APP);
  if (!found) return { known: true, installed: false };
  return { known: true, installed: true, all: found.repository_selection === 'all' };
}

function reportApp(owner) {
  const app = appOn(owner);
  if (!app.known) {
    console.log(`app      unknown — ${app.why}`);
    console.log(`         install, or check, at ${APP_URL} (choose ${owner}, All repositories)`);
  } else if (!app.installed) {
    console.log(`app      not installed on ${owner}`);
    console.log(`         install it at ${APP_URL} (choose ${owner}, All repositories) — a person's step`);
  } else if (!app.all) {
    console.log(`app      installed on ${owner}, on selected repositories only`);
    console.log('         every new speculative site would wait for a person to add it; switch it to All repositories');
  } else {
    console.log(`app      installed on ${owner}, all repositories`);
  }
  return app;
}

const [command, arg] = process.argv.slice(2);

if (command === 'owner') {
  if (!arg) {
    const { owner } = readConfig();
    console.log(owner ? `owner    ${owner}` : 'owner    none saved');
    process.exit(owner ? 0 : 1);
  }
  const account = gh([`users/${arg}`]);
  if (!account) die(`GitHub has no account named ${arg}, or gh is not logged in (gh auth status)`);
  mkdirSync(dirname(CONFIG), { recursive: true });
  writeFileSync(CONFIG, `${JSON.stringify({ ...readConfig(), owner: account.login }, null, 2)}\n`);
  console.log(`owner    ${account.login} (${account.type === 'Organization' ? 'organisation' : 'personal account'}) — saved in ${CONFIG.replace(homedir(), '~')}`);
  reportApp(account.login);
} else if (command === 'app') {
  const owner = arg ?? readConfig().owner;
  if (!owner) die('no owner saved — jt-setup owner <name> first');
  reportApp(owner);
} else if (command === 'browser') {
  await loadChromium(die);
  console.log('browser  playwright and chromium ready');
} else {
  die('usage: jt-setup owner [<name>] | app [<name>] | browser');
}
