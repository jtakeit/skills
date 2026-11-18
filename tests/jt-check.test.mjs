/**
 * jt-check, held to the pages it once got wrong.
 *
 *   node --test tests/*.test.mjs
 *
 * Two halves. The rules in scripts/lib/check.mjs are tried directly, in
 * milliseconds. The measurements only exist in a browser, so two fixture
 * pages are run through the whole script: tests/fixtures/on-the-grid is a
 * correct page that failed four checks (wohlfühl-Raum, 18 November 2026) and
 * must pass them, tests/fixtures/real-faults is what those checks are for and
 * must keep failing. Only the lines named here are read — a fixture is not a
 * site, and the rest of the report says so.
 *
 * The browser half needs playwright, which jt-check installs into
 * scripts/.deps on first use, and takes about a minute.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { describe, it, before } from 'node:test';
import { fileURLToPath } from 'node:url';

import { attributionIn, judgeBands, LOPSIDED } from '../scripts/lib/check.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(HERE, '..', 'scripts', 'jt-check.mjs');

describe('quotation: the body copy, not the chrome', () => {
  it('passes the studio’s Instagram in the menu, the footer and a body link', () => {
    const html = `<header><nav><a href="https://instagram.com/x">Instagram</a></nav></header>
      <main><p>Neue Arbeiten zeigen wir <a href="https://www.instagram.com/x">dort</a>.</p></main>
      <footer>Folgen Sie uns auf Instagram · @wohlfuehl.raum</footer>`;
    assert.equal(attributionIn(html), null);
  });
  it('fails a pulled line credited to Instagram, link and all', () => {
    const html = `<main><blockquote>Jeder Kopf weiss es. <cite>— Lea, auf <a href="https://instagram.com/lea">Instagram</a></cite></blockquote></main>`;
    assert.match(attributionIn(html), /instagram/i);
  });
  it('fails a handle or «on her Instagram» in the body copy', () => {
    assert.match(attributionIn('<main><p>Wie sie auf Instagram schreibt: Ruhe zuerst.</p></main>'), /instagram/i);
    assert.match(attributionIn('<main><p>So sagt es @lea.hair selbst.</p></main>'), /@lea\.hair/);
  });
  it('reads no comment as text, even one with a > in it', () => {
    assert.equal(attributionIn('<!-- the <details> and the Instagram link --><main><p>Ruhe.</p></main>'), null);
  });
  it('fails a profile phrase in the body copy', () => {
    assert.ok(attributionIn('<main><p>Як вона пише у своєму профілі</p></main>'));
  });
});

describe('empty space: the grid and the declared exception', () => {
  const band = (over) => ({ name: 'hero', left: 352, right: 1008, contentLeft: 352, contentRight: 912, lopsided: 656 / 1920, ...over });
  const lines = { left: [352], right: [1568] };

  it('passes a hero set on the logo’s line', () => {
    const judged = judgeBands([band()], lines);
    assert.deepEqual(judged.problems, []);
    assert.equal(judged.aligned.length, 1);
  });
  it('passes it a few pixels off the line, and fails it far off', () => {
    assert.equal(judgeBands([band({ contentLeft: 356 })], lines).problems.length, 0);
    assert.equal(judgeBands([band({ contentLeft: 100, left: 100 })], lines).problems.length, 1);
  });
  it('fails a grid on the line whose second column is empty', () => {
    const judged = judgeBands([band({ emptyColumn: 592 })], lines);
    assert.match(judged.problems[0], /column of its grid 592px/);
  });
  it('does not excuse a void on the left by the left line', () => {
    const judged = judgeBands([band({ left: 1008, right: 352, contentLeft: 1008, contentRight: 1568 - 300 })], lines);
    assert.equal(judged.problems.length, 1);
  });
  it('lists a declared band and skips it', () => {
    const judged = judgeBands([{ name: 'aside', skipped: true, allowed: ['the line stands right'], unexplained: [] }], lines);
    assert.deepEqual(judged.problems, []);
    assert.deepEqual(judged.allowed, ['aside: the line stands right']);
  });
  it('keeps the threshold it had', () => assert.equal(LOPSIDED, 0.15));
});

/** Runs jt-check on a fixture and returns its lines by check name. */
function check(fixture, port, extra = []) {
  const dir = join(HERE, 'fixtures', fixture);
  return new Promise((done, failed) => {
    execFile(process.execPath, [SCRIPT, '--dist', dir, '--port', String(port), ...extra], { cwd: dir, timeout: 240_000, maxBuffer: 1 << 24 }, (error, stdout) => {
      if (error && typeof error.code !== 'number') return failed(error);
      const lines = new Map();
      for (const m of stdout.matchAll(/^ {2}([✓✗·]) (.{20}) (.*)$/gm)) {
        const name = m[2].trim();
        lines.set(name, [...(lines.get(name) ?? []), { mark: m[1], detail: m[3] }]);
      }
      done({ lines, stdout });
    });
  });
}
const verdict = (run, name) => {
  const got = run.lines.get(name) ?? [];
  return got.find((l) => l.mark !== '·') ?? got[0] ?? { mark: '?', detail: `no «${name}» line in:\n${run.stdout}` };
};
const notes = (run, name) => (run.lines.get(name) ?? []).filter((l) => l.mark === '·').map((l) => l.detail).join('\n');

describe('jt-check on the fixtures', { timeout: 300_000 }, () => {
  let good;
  let bad;
  before(async () => {
    [good, bad] = await Promise.all([check('on-the-grid', 4581, ['--spec']), check('real-faults', 4582, ['--spec'])]);
  });

  it('empty space: passes the hero on the grid, lists the declared band', () => {
    assert.equal(verdict(good, 'empty space').mark, '✓', verdict(good, 'empty space').detail);
    assert.match(notes(good, 'empty space'), /allowed: aside: the closing line stands right/);
    assert.match(notes(good, 'empty space'), /on the header's left line/);
  });
  it('empty space: still fails an empty grid column and a band off the grid', () => {
    const v = verdict(bad, 'empty space');
    assert.equal(v.mark, '✗');
    assert.match(v.detail, /column of its grid/);
    assert.match(v.detail, /shoved: \d+px of air/);
  });
  it('padding: passes a closed dropdown, a closed <details> and a top-ruled list', () => {
    assert.equal(verdict(good, 'padding').mark, '✓', verdict(good, 'padding').detail);
  });
  it('padding: still fails a cell and a ruled row with their text on the line', () => {
    const v = verdict(bad, 'padding');
    assert.equal(v.mark, '✗');
    assert.match(v.detail, /«Schnitt» \(left\)/);
    assert.match(v.detail, /dt «Farbe» \(top\)/);
  });
  it('text at the edge: measured on the tablets too', () => {
    assert.equal(verdict(good, 'text at the edge').mark, '✓', verdict(good, 'text at the edge').detail);
    assert.match(verdict(good, 'text at the edge').detail, /1440, 1032, 768, 393/);
    const v = verdict(bad, 'text at the edge');
    assert.equal(v.mark, '✗');
    assert.match(v.detail, /at 768: blockquote/);
    assert.doesNotMatch(v.detail, /at (1440|393):/);
  });
  it('quotation: passes the studio’s own Instagram links, fails a credited line', () => {
    assert.equal(verdict(good, 'quotation').mark, '✓', verdict(good, 'quotation').detail);
    assert.equal(verdict(bad, 'quotation').mark, '✗');
  });
});
