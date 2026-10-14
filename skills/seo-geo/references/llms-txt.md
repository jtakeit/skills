# The words in `llms.txt`

The scaffold serves `llms.txt` as a route (`src/pages/llms.txt.ts`), built from
the same data as the page and the structured data: the business's name,
`BUSINESS.description`, the address and phone, the price range, one line per
entry in `PAGES` with its `summary`, and the collections' entries by title. Nobody
is bound by it and no engine promises to read it; it costs nothing, and for a
business whose pitch is "be findable" it is a reasonable thing to have.

What the route cannot write is the sentences. Those are yours:

```
# Atelier Nord

> Coiffeur in Zürich, Kreis 4. Schnitt, Farbe und Balayage, ein Stuhl,
> Termine online oder telefonisch.

Langstrasse 00, 8004 Zürich
044 000 00 00
CHF 40–180

## Pages
- /: Schnitt und Farbe in Zürich — Preise, Termine, Anfahrt.
- /preise/: Die vollständige Preisliste.
```

(An invented business; the address and the number are placeholders on purpose.)

## Rules

- **The client's language**, like every other visitor-facing text.
- **Facts only, from `src/data/site.ts`.** It is another surface asserting the
  business's facts. The route builds it from the same data; never type it
  twice by replacing the route with a static file.
- **`BUSINESS.description` is one sentence**: what the business is, where, for
  whom. The same sentence the brief's *In one sentence* says.
- **Each `summary` says what is on the page**, in a line an assistant could
  quote — not the page's title again.
- **Say what the business does not do** in the description or the home page's
  summary, where it matters. It is what stops an assistant recommending it for
  the wrong thing — worse for the client than not being recommended at all.
- **Not a dumping ground.** If it grows past a screen, the page it summarises is
  the thing that needs work.
