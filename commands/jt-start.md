---
description: Start a new client project — scaffold with @jtakeit/astro, pipeline state, first commits
argument-hint: "<slug> [business name]"
---

Start a new client project: $ARGUMENTS

Load `jtakeit-sites:pipeline` first, then `jtakeit-sites:brief`.

Before scaffolding, get from the developer — ask them together, in one message,
and do not guess any of them:

- the business's name and the slug (lowercase, `[a-z0-9-]`; it becomes the
  directory, the repository and the site's slug on jtakeit);
- the language of the site, as a BCP 47 tag (`de-CH`, `fr-CH`, `en`, …);
- the vertical;
- whether the business takes bookings — and if so, its kind, for the kit
  (`hotel`, `car_rental`, …);
- **how many design variants**;
- whether there is an existing site or an Instagram profile to work from.

Then:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-init.mjs" \
  --slug <slug> --name "<name>" --locale <tag> \
  --vertical <vertical> --variants <n> [--kit <kind>]
```

It runs `npx @jtakeit/astro create`, writes `.jtakeit/state.json` and
`STATUS.md`, and commits. Nothing leaves the machine. What it prints next is the
order the platform wants: `create_site` on the jtakeit MCP server (record the id
with `jt-state set site.id <id>`), the dev server and `open_dev_session`, then
the GitHub repository — `gh repo create <owner>/<slug> --private --source .
--push`, asked of the developer before it is run — and the jtakeit GitHub App on
it, which a person installs.

Then run the brief per `jtakeit-sites:brief`.
