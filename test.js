/**
 * test.js — quick smoke test
 */

import { buildRichMessage, buildRichHtml, renderInline, paragraph, table, list, details, sectionHeading } from './lib/rich-builder.js';
import { getCachedConfig, getDefaultAccountId, resolveAccountConfig } from './lib/config.js';

let pass = 0;
let fail = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    pass++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    fail++;
  }
}

console.log('\n=== rich-builder ===');

test('builds a minimal empty message', () => {
  const html = buildRichHtml();
  if (!html.includes('<p>')) throw new Error('expected <p> tag');
});

test('builds heading + summary + table + list + details', () => {
  const html = buildRichHtml({
    heading: 'Test',
    summary: 'Hello **bold** and *italic*',
    table: { columns: ['A', 'B'], rows: [['1', '2']] },
    list: [{ text: 'todo 1', done: true }, { text: 'todo 2' }],
    details: [{ summary: 'Risk', blocks: ['line 1'] }]
  });
  if (!html.includes('<h2>Test</h2>')) throw new Error('missing heading');
  if (!html.includes('<b>bold</b>')) throw new Error('missing bold');
  if (!html.includes('<i>italic</i>')) throw new Error('missing italic');
  if (!html.includes('<table>')) throw new Error('missing table');
  if (!html.includes('<th>A</th>')) throw new Error('missing th');
  if (!html.includes('<td>1</td>')) throw new Error('missing td');
  if (!html.includes('<checklist>')) throw new Error('missing checklist');
  if (!html.includes('has_checkbox="true"')) throw new Error('missing has_checkbox');
  if (!html.includes('is_checked="true"')) throw new Error('missing is_checked on done item');
  if (!html.includes('<details>')) throw new Error('missing details');
  if (!html.includes('<summary>Risk</summary>')) throw new Error('missing summary');
});

test('buildRichMessage wraps html in { html: ... }', () => {
  const r = buildRichMessage({ heading: 'X' });
  if (typeof r.html !== 'string') throw new Error('html field missing');
  if (r.markdown) throw new Error('should not have markdown');
});

test('parses inline **bold** in text', () => {
  const html = renderInline('Hello **world** foo');
  if (!html.includes('<b>world</b>')) throw new Error(`bold missing: ${html}`);
  if (!html.includes('Hello ')) throw new Error(`prefix missing: ${html}`);
});

test('parses inline `code` in text', () => {
  const html = renderInline('use `npm install`');
  if (!html.includes('<code>npm install</code>')) throw new Error(`code missing: ${html}`);
});

test('parses inline [text](url) link', () => {
  const html = renderInline('visit [OpenClaw](https://openclaw.ai) now');
  if (!html.includes('<a href="https://openclaw.ai">OpenClaw</a>')) throw new Error(`link wrong: ${html}`);
});

test('escapes HTML in text', () => {
  const html = renderInline('<script>alert("xss")</script>');
  if (html.includes('<script>')) throw new Error('XSS not escaped!');
  if (!html.includes('&lt;script&gt;')) throw new Error('should be escaped');
});

test('table throws on bad input', () => {
  try {
    table({ columns: 'bad' });
    throw new Error('should have thrown');
  } catch (err) {
    if (!err.message.includes('columns')) throw new Error('wrong error: ' + err.message);
  }
});

test('table pads short rows', () => {
  const html = table({ columns: ['A', 'B', 'C'], rows: [['1']] });
  // 1 cell + 2 empty cells
  if (!html.match(/<tr><td>1<\/td><td><\/td><td><\/td><\/tr>/)) {
    throw new Error('row padding wrong: ' + html);
  }
});

test('list renders as checklist when done is defined', () => {
  const html = list([{ text: 'a', done: true }]);
  if (!html.includes('<checklist>')) throw new Error('should be checklist');
});

test('list renders as ul when no done field', () => {
  const html = list([{ text: 'a' }]);
  if (!html.includes('<ul>')) throw new Error('should be ul');
  if (html.includes('<checklist>')) throw new Error('should NOT be checklist');
});

console.log('\n=== config ===');

test('getDefaultAccountId returns first telegram account', () => {
  const id = getDefaultAccountId();
  if (!id) throw new Error('no account id');
  console.log(`     (default account: ${id})`);
});

test('resolveAccountConfig returns token for kael account', () => {
  try {
    const cfg = resolveAccountConfig('kael');
    if (!cfg.token) throw new Error('no token');
    if (cfg.token === '__OPENCLAW_REDACTED__') throw new Error('token is redacted');
    console.log(`     (token length: ${cfg.token.length})`);
  } catch (err) {
    if (err.message.includes('redacted')) {
      console.log('     (skip: bot token is redacted in openclaw.json — needs real value)');
      return;
    }
    throw err;
  }
});

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===\n`);
process.exit(fail > 0 ? 1 : 0);
