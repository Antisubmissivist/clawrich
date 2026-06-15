/**
 * Test: buildRichMessage — structured spec → Bot API payload
 *
 * Run: node --test test/builder.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRichMessage, buildRichHtml } from '../lib/rich-builder.js';

describe('buildRichMessage', () => {
  it('builds a heading + summary', () => {
    const rich = buildRichMessage({ heading: 'Hello', summary: 'World' });
    assert.equal(typeof rich.html, 'string');
    assert.match(rich.html, /Hello/);
    assert.match(rich.html, /World/);
  });

  it('builds a table', () => {
    const rich = buildRichMessage({
      table: { columns: ['A', 'B'], rows: [['1', '2'], ['3', '4']] }
    });
    assert.match(rich.html, /<table/);
    assert.match(rich.html, /<th[^>]*>A<\/th>/);
    assert.match(rich.html, /<td[^>]*>1<\/td>/);
  });

  it('builds a checklist', () => {
    const rich = buildRichMessage({
      checklist: [
        { text: 'done', done: true },
        { text: 'todo', done: false }
      ]
    });
    assert.match(rich.html, /<checklist>/);
    assert.match(rich.html, /is_checked="true"/);
    assert.match(rich.html, /is_checked="false"/);
  });

  it('builds collapsible details', () => {
    const rich = buildRichMessage({
      details: [{ summary: 'click', blocks: ['hidden content'] }]
    });
    assert.match(rich.html, /<details>/);
    assert.match(rich.html, /<summary>click<\/summary>/);
    assert.match(rich.html, /hidden content/);
  });

  it('builds a divider', () => {
    const rich = buildRichMessage({ divider: true });
    assert.match(rich.html, /<hr\s*\/?>/);
  });

  it('returns html-only when no markdown specified', () => {
    const rich = buildRichMessage({ heading: 'x' });
    assert.ok(rich.html);
    assert.equal(rich.markdown, undefined);
  });
});

describe('buildRichHtml', () => {
  it('returns just the html string', () => {
    const html = buildRichHtml({ heading: 'X' });
    assert.equal(typeof html, 'string');
    assert.match(html, /X/);
  });
});
