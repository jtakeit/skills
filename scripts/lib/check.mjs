/**
 * The parts of jt-check that are rules rather than measurements.
 *
 * jt-check itself is one long script with side effects from its first line —
 * it reads argv, serves a directory, opens a browser — so nothing in it can be
 * tried on its own. What is here is the judgement applied to what was read or
 * measured, kept apart so that tests/ can hold it to the cases that once
 * failed a correct page (wohlfühl-Raum, 18 November 2026) without a build.
 */

/**
 * The page as a reader sees it: no markup, no scripts, no entities, no
 * comments. Comments since 18 November 2026: one with a `>` in it was cut at
 * that `>` by the tag pattern, and the rest of it read as the page's text.
 */
export const readerText = (html = '') =>
  html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/*
 * Where a quoted line says it came from.
 *
 * Everything on the page is the business speaking, so attributing one of
 * their own sentences to them is odd on any site; on a spec build it also
 * announces that we went through their Instagram, which is the one thing the
 * pitch must not do. See jtakeit-sites:spec → references/copy.md.
 */
export const ATTRIBUTION = [
  /у своєму профіл|в своєму профіл|у профіл|зі свого профіл|из своего профил|в профиле/i,
  /instagram|інстаграм|инстаграм|@[a-z0-9._]{3,}/i,
  /з допису|із допису|з посту|в дописі|из поста|aus dem post/i,
];

const QUOTED = /<(blockquote|q|cite|figcaption)\b[^>]*>[\s\S]*?<\/\1>/gi;
const CHROME = /<(header|footer|nav)\b[^>]*>[\s\S]*?<\/\1>/gi;
const PROFILE_LINK = /<a\b[^>]*\bhref\s*=\s*["']?[^"'\s>]*(?:instagram\.com|instagr\.am)[^>]*>[\s\S]*?<\/a>/gi;

/**
 * The words the attribution rule reads: the body copy, not the site's chrome.
 *
 * Read over the whole page the rule failed every site that links to its own
 * Instagram — the icon in the footer, «Instagram» in the menu — which is a
 * business pointing at its profile, not a line credited to it (wohlfühl-Raum,
 * 18 November 2026). So the header, the footer and the navigation are left
 * out, and so is a link to the profile in the body. A quotation is read whole,
 * links and all, wherever it stands: «— Lea, <a href=instagram…>@lea</a>»
 * under a pulled line is the very thing the rule is for.
 */
export function bodyCopy(html = '') {
  const page = html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ');
  const quoted = [...page.matchAll(QUOTED)].map((m) => m[0]).join(' ');
  const body = page.replace(CHROME, ' ').replace(QUOTED, ' ').replace(PROFILE_LINK, ' ');
  return readerText(`${body} ${quoted}`);
}

/** The first attribution in the body copy, or null. */
export function attributionIn(html) {
  const copy = bodyCopy(html);
  for (const re of ATTRIBUTION) {
    const m = re.exec(copy);
    if (m) return m[0];
  }
  return null;
}

/*
 * Empty space, judged.
 *
 * A band is lopsided when the air on its two sides differs by more than 15%
 * of its width. That catches the fault it was written for — a grid whose
 * second column ended up empty — and, until 18 November 2026, also every hero
 * set on the site's own grid: text that starts on the logo's line, 352px in at
 * 1920, with a photograph or a colour field to its right (wohlfühl-Raum,
 * which got past it only with --unchecked). Starting on the line the header
 * starts on is alignment, not emptiness, so a band whose content starts (or
 * ends) within TOLERANCE of a line of the header's is not counted — unless a
 * grid inside it has a column with nothing in it, which is the original fault
 * standing on the grid line, and still fails.
 *
 * A band the design means to leave lopsided says so on the page:
 * data-jtk-allow="empty-space" with data-jtk-reason="<why>", on the section or
 * on the element. It is skipped, and the reason is printed, so the decision is
 * read by the next person rather than rediscovered. Without a reason it is not
 * honoured: an exception nobody explained is a fault somebody silenced.
 */
export const LOPSIDED = 0.15;
export const TOLERANCE = 6;

export function judgeBands(bands, lines = { left: [], right: [] }) {
  const problems = [];
  const aligned = [];
  const allowed = [];
  const unexplained = [];
  for (const b of bands) {
    for (const why of b.allowed ?? []) allowed.push(`${b.name}: ${why}`);
    for (const what of b.unexplained ?? []) unexplained.push(`${b.name}: ${what}`);
    if (b.skipped || !(b.lopsided > LOPSIDED)) continue;
    if (b.emptyColumn) {
      problems.push(`${b.name}: a column of its grid ${b.emptyColumn}px wide has nothing in it — a band with one empty half`);
      continue;
    }
    const near = (x, list) => list.some((line) => Math.abs(x - line) <= TOLERANCE);
    const onLeft = b.left > b.right ? false : near(b.contentLeft, lines.left ?? []);
    const onRight = b.right > b.left ? false : near(b.contentRight, lines.right ?? []);
    if (onLeft || onRight) {
      aligned.push(`${b.name} on the header's ${onLeft ? 'left' : 'right'} line (${Math.round(onLeft ? b.contentLeft : b.contentRight)}px)`);
      continue;
    }
    problems.push(`${b.name}: ${b.left}px of air on one side and ${b.right}px on the other — a band with one empty half`);
  }
  return { problems, aligned, allowed, unexplained };
}
