---
name: launch
description: Stage 4 of the jtakeit pipeline — take the signed-off site live. Runs the platform's preflight (with try_booking), says which steps are a person's in the panel (whose the site is, the plan, where enquiries go, the launch, the domain), then either keeps the client — billing them through jtakeit on the developer's own Stripe — or hands the site over with the panel's handover link. Load when the client has signed off, when the user says launch it, go live, put it on their domain, bill the client, or hand it over.
---

# Stage 4 · The launch

One gate, then two endings.

- **`keep`** — the developer keeps the client: the site stays in their studio,
  draws a line on their plan, and they charge the client what they like.
- **`handover`** — the client takes the site over with the panel's link, pays
  jtakeit directly, and the repository is mirrored to them.

Either way, **the launch is a person's act in the panel**, and so is the domain.
No tool launches a site, attaches a domain, links a notification channel, sets
a price or mints a handover link. This skill gets the site to the point where
the only thing left is a button, says whose button each one is, and writes the
handover message. The platform's own account of every screen involved is
`jtakeit:///guides/the-panel.md`; read it rather than guessing what the panel
does.

Set the ending in the state file before starting:

```bash
node "$JT/scripts/jt-state.mjs" set launch.mode keep        # or handover
node "$JT/scripts/jt-state.mjs" set client.domain atelier-nord.ch
```

---

## 1 · What is still ours

What the platform already does at every build, and is therefore not on this
list: the canonical, `robots.txt` and the sitemap on the site's real address,
indexing switched on at the launch and off on every preview, the icon checked,
the prices checked against the site's currency, dot-files withheld. The
scaffold has nothing to flip: one build serves the preview and, after the
launch, the address.

What is left is the site's own content and the studio's own care:

- **The open items.** `BRIEF.md`'s `NEEDS CLIENT` list, last pass: each one
  resolved, or carried into the handover message as a known gap. Nothing ships
  as fact that was never confirmed.
- **The mark.** The business's logo as the icon, or the monogram said back and
  accepted — `preflight` says which it found.
- **Real photographs** in place of anything off the feed, where they came.
- **The Search Console tag** — the scaffold leaves it commented out in
  `Layout.astro` (`google-site-verification`, empty): uncomment it with the
  property's token once the domain is the site's, or leave it out. And any
  `TODO(prod)` the project's own work left — grep for them.
- **The OG image** — the final design, 1200×630, actually rendered. A broken
  card is the first impression on every share.
- **Redirects**, if there was an old site: every indexed old URL to its
  replacement, in `dist/_meta.json`'s `redirects` (`{from, to, status}`), which
  `jtakeit-meta.mjs` writes through `writeMeta` from `@jtakeit/kit/meta`. A
  ranked page dropped onto `/` throws away whatever it had earned; a rule that
  matches its own target is a loop that takes the page down.
- **The privacy page is true.** The platform counts visits without cookies
  (`get_stats`); anything else added at the client's request is named there.

Read `jtakeit-sites:seo-geo` alongside this — the words, the facts and the local
signals are the part of search the platform cannot do for the site.

Commit, push, `import_branch`, `commit_and_build`, `get_build` until it settles.

## 2 · The gate: preflight

Not advisory. The site does not launch until it says `ready`.

```
preflight   site_id, try_booking: true
```

One call checks what somebody would check by hand: where the site is in its life
and every step it still owes — a repository, a build, the diary's hours, who the
business is, where enquiries and bookings go, the payment, the launch — with
**whose step each one is**; the icon; files the platform will not publish; that
the address answers; that the prices are in the site's currency; that search
engines are not told to stay away; that the form delivers. With `try_booking`
it books a free slot through the site's own booking form and cancels it again,
proving the diary end to end; it works on the preview, and the business never
sees the test as a customer's.

Fix every check that is the agent's. Put every check that is a person's to the
developer, by name — *the studio's owner launches*, *the business opens its
Stripe account*, *the client claims the site* — with where in the panel.

`send_real_enquiry: true` sends an enquiry the client will see, rather than a
probe the edge drops. Use it once, with the person who receives enquiries
watching, and confirm the message arrived by looking where it was meant to
arrive — not at the tool's answer. The enquiry check is the one that is skipped
and the one that costs a client money.

Then, by hand, because a tool cannot judge them:

- `get_built_page` with `shot: "phone"` and `shot: "desktop"`, every page —
  looked at;
- Lighthouse on the preview: ≥ 95 desktop, ≥ 90 mobile. If it is short, it is
  almost always an unoptimised image or a webfont;
- the site on a real phone; every link, including the footer and the legal
  pages.

## 3 · The person's steps, in the panel

All of these are on the site's screen in the panel, under **Setting up**, and
the panel refuses the launch in its own words until each is true. Say them to
the developer as a list, with the screen:

1. **Whose the site is** — the site's **Ownership**. Either *this is our studio's
   own site*, or the client's: the studio sets what the client pays it (zero is
   an answer) and sends the **owner's link**; the client reads the terms before
   signing in and takes the site. On a handover, the other answer — *the client
   pays jtakeit directly* — is §4b.
2. **The plan** — a live site draws one `base` line from the studio's plan, and
   a `bookings` line if the catalogue turns the diary on. Nothing is charged
   before the launch. *Launching a site needs one site in this studio's plan* is
   the plan being short; buying is under **Reselling**, and only a person may
   buy. `get_allowance` says what is free; `get_prices` says what a line costs.
3. **Where enquiries and bookings go** — **The site → Notifications**: a
   Telegram chat or an email address, verified. Every kind the site collects
   must be heard by at least one verified channel, or the launch is refused.
   Doing without is an answer the panel offers, with what it means in front of
   the button.
4. **The diary**, where there is one — the owner publishes the hours under
   **Diary → Opening hours**; *Save and publish*, a draft offers nothing.
5. **Payments for bookings**, if the brief said online — the business's own
   Stripe account, opened by the owner or an admin from the site's **Payments**.
   The studio does not see that screen's contents and takes nothing from the
   payments; Stripe's card fee is the business's.
6. **The launch** — the last row of **Setting up**, pressed by the studio's
   owner or admin, or by the client once they have taken the site on the
   studio's terms. Launching revokes every preview link, switches publishing to
   manual, and rebuilds the site for its public address. Every site gets a
   handle of the platform's, `<slug>-<suffix>.jtakeit.site`, that keeps working.
7. **The domain** — optional, at the launch or later, under **The site →
   Domain**: typed without `https://` and without `www`, then the DNS records
   the screen prints, set where the domain was bought. It says *waiting* until
   they answer, up to half an hour. The domain is the business's name: the
   site's owner or admin attaches it; the studio does so only on its own site.
   If a domain has to be bought, it is bought in the client's name — a domain
   registered to the studio is the client's hostage.

After the launch, `preflight` again, against the live address. From then on an
agent's build is a **candidate**: visitors keep what they see until a person
publishes it in the panel.

## 4a · Ending `keep` — billing the client

The studio is a reseller. It **buys** a line on its plan for every live site at
a wholesale price (`get_prices`), it **sells** its client a subscription of its
own, at its own price, and it **keeps** the difference — all of it. The
platform takes a price per site and never a share of what a client pays.

How the client is charged is the developer's choice, set per site under
**Ownership**:

- **Zero, or invoiced their own way** — nothing from the platform, no Stripe
  account needed.
- **Billed through jtakeit** — **Ownership → Bill the client through us**. Once,
  first: the studio's own Stripe account under **Reselling → Stripe account**.
  Then per site: the price, the currency, monthly or yearly, by card or by
  invoice (Stripe emails it, fourteen days to pay), the client's email, and
  whether to freeze the site after fourteen days unpaid — off by default. The
  money goes to the studio's own Stripe whole; the platform creates the
  subscription, sends the invoices and reminders, and costs nothing beyond the
  site itself. Stripe's own fees are the studio's, as the seller. Ending the
  billing on a live site takes the site off its address — say so before anybody
  presses it.

The client then sees, on their own **Subscription** screen, what they pay the
studio and the buttons that pay it.

On the client's own site, once they have taken it, they decide under **People →
Maintainers** what the studio may see: the records in full, and the money.

## 4b · Ending `handover` — the client takes the site

**Who:** the studio's owner or admin starts it, the client finishes it.
**Where:** the site's screen → **Hand the site over to the client**.

The client gets an account of their own, pays jtakeit directly at the direct
price (`get_prices`, the direct row), and the site — its lines, its repository
(mirrored to them), its people — moves to them. The studio stops paying for it.
On a site still being built, the studio stays on as a maintainer until the
client takes it off from **People**.

The panel refuses to mint the link until:

- the enquiry destinations are the client's, not the studio's;
- no Stripe account of the studio's is attached for the site's bookings;
- the client is not being billed by the studio through jtakeit.

Each refusal is a sentence naming what to undo.

**Before the link is minted, clean the repository.** The mirror is this
repository, history and all:

```bash
node "$JT/scripts/jt-clean.mjs"
```

It takes the pipeline state, the status page, the review list, the portrait,
agent instructions and the preview harness out of the tree, and scans what is
left; a finding stops the handover. `BRIEF.md` and `jtk/` stay — the first is
the client's own brief, which the panel reads; the second is the site. Then
read the comments by hand: the code keeps its comments, and what comes out is
anything addressed to an agent or arguing with a previous attempt. Commit,
push, `import_branch`, `commit_and_build`.

The link is shown once and lasts fourteen days. The client opens it, reads whose
site and at what price before signing in, presses **Take the site over**, pays
at a Stripe Checkout, and the site moves the moment the money lands. If they
want the studio back later, they let it in from **People**.

## 5 · What the client gets

A short message, in the client's language:

- the live address — and the domain's state, if it is still *waiting*;
- where enquiries and bookings arrive, and that every one is also kept in the
  panel under **Enquiries** and **Diary**;
- what they change themselves: the words and the photographs, by tapping them
  on their own page in the panel; the hours, in the diary;
- what needs the developer: the layout, a new section, a new page;
- the accounts in play and whose each is — the panel, the domain's registrar,
  Stripe (theirs, for bookings), the repository on a handover;
- that their data comes out whole — the pages are files in the repository, the
  enquiries and bookings export from the panel
  (`jtakeit:///guides/your-clients-data.md`);
- any known gap carried from `BRIEF.md`, named plainly.

## Exit checklist

- [ ] `launch.mode` and `client.domain` in the state file
- [ ] `NEEDS CLIENT` resolved or carried as a named gap
- [ ] the Search Console tag set or left out on purpose; no `TODO(prod)` left; the OG image looked at; old URLs redirect, no loops
- [ ] `preflight` with `try_booking` says `ready`, before and after the launch
- [ ] a real enquiry arrived where the client reads them
- [ ] Lighthouse ≥ 95 desktop / ≥ 90 mobile; the site on a real phone
- [ ] every person's step said to the developer, with its screen
- [ ] `keep`: the client's terms set under Ownership — or `handover`:
      `jt-clean` clean, the link minted by a person and taken
- [ ] the handover message sent, in the client's language

Then:

```bash
node "$JT/scripts/jt-state.mjs" set launch.launchedAt $(date +%F)
node "$JT/scripts/jt-state.mjs" advance delivered --note "live on atelier-nord.ch"
```

`STATUS.md` now reads **delivered**, and the pipeline is finished. Anything after
it — a change the client asks for in March — starts at `git pull` and `get_site`
(`jtakeit-sites:revisions`, *Before any edit*).
