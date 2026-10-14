---
description: Build the site on jtakeit and prepare the private preview link for the client
argument-hint: ""
---

Run the preview stage.

Load `jtakeit-sites:preview` and follow it. The order is the platform's:
`npx @jtakeit/astro catalogue`, `validate_catalogue` with the `jtk/` files,
commit and push, `import_branch` (or `attach_repo` the first time),
`commit_and_build`, `get_build` until it settles, `get_build_log` if it does
not. Read what was built with `get_built_page`, `shot: "phone"`, before anyone
else sees it.

Then `get_preview_link` and draft the message for the client — the link, what
to look at, what is deliberately unfinished, and how to send comments back. The
link is a ticket with a short life: send it, do not store it.

Nothing goes public at this stage. A site is public only when a person launches
it in the panel.
