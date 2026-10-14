---
description: Check this machine against what the pipeline needs, and which skills are actually running
argument-hint: "[stage]"
---

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-doctor.mjs" ${1:+--stage $1}
```

Report what is missing for the current stage and what is only needed later, in
a few lines. Two things deserve saying out loud whenever they appear, because
they are the reason two people get different results from the same skills:

- **the plugin is pinned.** A marketplace install stays at its commit until it
  is updated in `/plugin`; pulling the repository changes nothing.
- **this project was last written by different skills** than the ones running.

The jtakeit and Apify MCP servers sign in on first use, in the browser; the
script can only say whether they are configured. If a tool from either is
missing, point at `/mcp` rather than trying to sign in yourself.

If something is missing, say what to install and stop — do not start a stage on
a machine that cannot finish it.
