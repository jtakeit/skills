# The bar — sixteen sites to stand next to

Every spec is built to the rules in `docs/` and still came out «fine by the
rules». What it lacked was a picture of better. These are sixteen sites of
local businesses in our trades — barbers, salons, nails, tattoo, food, coffee,
studios, a clinic — each recognised by Awwwards, each opened and looked at in a
browser on 17 October 2026, chosen by the developer from twenty. The list, with
what to take from each, is [benchmarks.json](benchmarks.json).

Links and descriptions only: their pages are theirs, so no screenshot of them
lives in this repository. `jt-refs` takes fresh ones into the project when they
are wanted.

## What the sixteen have in common

Read this before choosing any of them; it is the bar itself.

- **Type is the image.** The headline is set large enough to be the first
  thing seen — a name across the full width, a slogan in a condensed face, a
  serif with half the line in italic. One characterful display face, used with
  conviction; never a heading that is merely big.
- **One decision about colour.** Either one loud brand colour carries the page
  (Rendezvous, Sqew), or the photographs carry it and share one grade
  (Brzozowski, Zimmerl). Never both, never neutral by default.
- **The hero decides.** A photograph, a wordmark, the team, the booking itself
  — one of them leads and the rest are quiet. No hero puts a picture, a field
  and a headline at the same weight.
- **The practical thing is on the first screen.** Booking (Porem), hours
  (Sunbeam, Muchacha), locations (Hagi's, Sqew). Beauty and use, not beauty
  instead of use.
- **People are the product** in the trades where they are: the crew (HYPE), the
  practitioner at work (Aventura), the chef (Zimmerl).
- **Restraint around the one bold move.** Each has one memorable thing — the
  colour, the type, the strip of thumbnails, the menu as the hero — and keeps
  the rest calm.

## How a spec uses them

1. After the portrait, choose **two or three** whose `suits` matches this
   business — its trade, its mood, its material. A barber with a loud
   Instagram is Rendezvous or Sqew; a heritage shop is Hagi's; a booking-led
   pitch is Porem whatever the trade.
2. Look at them:

   ```bash
   node "$JT/scripts/jt-refs.mjs" porem hagis
   ```

   Pictures of each — the first screen and three screens down at a laptop, and
   the phone — in `.jtakeit/refs/`. Read them.
3. Write down what is taken, as moves, not looks:

   ```bash
   node "$JT/scripts/jt-state.mjs" set design.benchmarks "porem: booking in the hero; hagis: overlap band"
   ```

4. Build it with their material. **A move, not a look**: never their copy,
   their logo, their photographs, their palette whole, their layout cloned. A
   barber built «like Rendezvous» is orange because Rendezvous is orange; a
   barber built with Rendezvous's move has one colour of its own that carries
   the whole ground.

The critic is shown the same two or three and answers one more question: would
this page stand next to them?
