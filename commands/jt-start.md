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
- the currency the prices are in, three letters (`chf`) — `create_site` takes
  it, once;
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
order the platform wants: `create_site` on the jtakeit MCP server with the slug,
the name and the currency (record the id with `jt-state set site.id <id>`), the
dev server and `open_dev_session`, then the GitHub repository — `gh repo create
<owner>/<slug> --private --source . --push`, asked of the developer before it
is run — and the jtakeit GitHub App on it, which a person installs.

Say to the developer, in these words or near them: the site is laid out in the
design system of Brumy (brumy.ch), jtakeit's maker, as an example; it may be
kept, and the recommendation is to adapt or redo the design for this business.

Then run the brief per `jtakeit-sites:brief`. After the developer's yes, take
out every section of the example the brief does not name and add the modules it
does — `npx @jtakeit/astro remove <section>` and `add <module>` where the kit
has them (`npx @jtakeit/astro --help` lists them), otherwise by hand as the
brief skill's *After the yes* says — and record it: `jt-state set
design.sections "<kept, in order>"`, and `design.look` (`brumy` until a
direction replaces it; `"brumy (kept: <who, when>)"` only on the developer's
explicit word).
