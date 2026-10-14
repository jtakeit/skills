---
description: Launch — preflight, then a person launches in the panel and either keeps the client or hands the site over
argument-hint: "keep|handover"
---

Run the launch stage. Ending: $ARGUMENTS

Load `jtakeit-sites:launch`, and `jtakeit-sites:seo-geo` with it.

Order matters and no step is skippable:

1. `preflight` with `try_booking` where the site takes bookings. It names every
   step a launch still waits on and **whose** each one is — yours (fix it,
   commit, `import_branch`, `commit_and_build`) or a person's in the panel.
2. Read the built pages with `get_built_page`, `shot: "phone"`, and put the
   site in front of the developer on a real phone.
3. The person's steps, said plainly, with where they are in the panel: who is
   responsible for the site, the plan line, where enquiries go, the launch
   button, the domain. You cannot do these; do not offer to.
4. The ending:
   - **keep** — the developer keeps the client, and bills them through jtakeit
     on their own Stripe account or invoices them their own way;
   - **handover** — run `jt-clean` first, so the mirrored repository carries
     nothing of ours, then the panel's handover link moves the site to the
     client:

     ```bash
     node "${CLAUDE_PLUGIN_ROOT}/scripts/jt-clean.mjs"
     ```

Report the preflight output verbatim. If anything that is yours fails, the
site does not launch; say what failed and fix it.
