---
description: Show which pipeline stage this project is in and what is blocking it
argument-hint: ""
---

Load the `jtakeit-sites:pipeline` skill, then run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-state.mjs" show
```

Report, in a few lines:

- the business, the package, and the current stage;
- what the stage's exit checklist still has open — check the actual repository
  and, where the site exists on jtakeit, `get_site` and the last `get_build`;
  do not just read the state file back;
- the one next action, and which skill owns it.

If there is no `.jtakeit/state.json`, say so and offer to start the pipeline
with `/jt-start`, or `/jt-from-instagram <handle>` for a quick look at one
business.
