---
description: First run — set this machine and these accounts up for the pipeline, fixing what can be fixed and saying what is a person's
argument-hint: "[github-owner]"
---

Set up jtakeit-sites on this machine: $ARGUMENTS

Run once, right after installing the plugin, and again whenever something is
off. Go through the steps in order, one short message per step that needs the
developer, and fix what you can yourself rather than listing it. End with one
line on what is ready and what is still theirs.

## 1. The machine

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-doctor.mjs" --stage spec
```

For each ✗:

- **node, git, gh, ffmpeg** — give the one install command for this platform
  (Homebrew on macOS, the distribution's package manager on Linux, WSL2 on
  Windows) and let the developer run it. Do not install system packages
  yourself.
- **gh not logged in** — `gh auth login` is interactive: ask the developer to
  run it, with `! gh auth login` in this prompt.
- **playwright** — yours: `node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-setup.mjs" browser`.
  Say first that it downloads a browser of about 150 MB, once.
- **frontend-design** — only the variants stage uses it:
  `/plugin install frontend-design@claude-plugins-official`, when they get there.
- **pitch audio** — only the pitch video uses it, and it is their own voice;
  mention it, do not chase it (see `assets/pitch/README.md`).

## 2. The two accounts

Look for the jtakeit tools (`create_site`, `list_sites`) and the Apify
profile-scraper tool among the tools you have. A server that has not been
signed in has none. For each one missing, ask the developer to open `/mcp`,
choose it, and sign in in the browser that opens:

- **jtakeit** — Google or an email link, then the studio's name. Free until a
  site goes live.
- **Apify** — their own account; every scrape is billed to it, about 20 cents
  a profile.

The tools appear in the same session. When they say it is done, look again,
and call `list_sites` once to be sure jtakeit answers.

## 3. Where the repositories go

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-setup.mjs" owner
```

If none is saved, take it from the argument, or ask once: which GitHub account
or organisation the speculative sites — and their own client sites, unless a
client wants theirs — are created under. Suggest an organisation of their own
(free on GitHub) over the personal account: the sites stay apart from their
other work, and the App check below can answer. Then:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-setup.mjs" owner <name>
```

## 4. The GitHub App

The script's `app` line says what GitHub could tell. jtakeit builds from the
repository through its GitHub App, and **a person installs it**, on GitHub, not
here: give the link the script printed, and ask for **All repositories**, so
that no new site waits for this step again.

- installed, all repositories — done;
- not installed, or on selected repositories only — ask, wait, then
  `jt-setup app` again;
- unknown (a personal account) — ask them to confirm it is installed on all
  repositories; the first `attach_repo` is the check that settles it.

## 5. Ready

One line of what is ready, one of what is still theirs if anything is, and the
next thing to type:

```
/jt-from-instagram <handle>      a business's Instagram → a private preview link
/jt-start <slug>                 a client who asked you for a site
```
