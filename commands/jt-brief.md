---
description: The brief — gather what the site needs from the developer, an old site, Instagram and the market
argument-hint: "[old site URL or @instagram handle]"
---

Run the brief for this project. Source material: $ARGUMENTS

Load the `jtakeit-sites:brief` skill and follow it. If a URL or an Instagram
handle was given above, start there before asking the developer anything they
would otherwise have to repeat.

Ask every question at once, and build on the developer's yes. The platform's
own questions are part of it: the currency, whether bookings are paid online or
on the spot (ask, never assume), where enquiries go, and whether the jtakeit
GitHub App is installed on the repository's owner — a person does that.

End by filling `BRIEF.md` (the scaffold wrote it), putting confirmed facts only
into `src/data/site.ts`, recording the agreed variant count with
`jt-state set variants.count <n>`, and advancing the stage.
