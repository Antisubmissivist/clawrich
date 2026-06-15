/**
 * lib/rich-builder.js
 *
 * Convert Kael's structured "reply" (heading/summary/table/list/details) into
 * a Telegram Bot API 10.1 Rich Message HTML string.
 *
 * Reference: https://core.telegram.org/bots/api#inputrichmessage
 *            https://core.telegram.org/bots/features#rich-messages
 *
 * HTML tags used (Telegram Rich HTML style):
 *   <p>            paragraph
 *   <h1>-<h6>      section heading
 *   <b>, <i>, <u>, <s>, <code>, <pre>, <a href>
 *   <table>, <tr>, <th>, <td>      real table
 *   <ul>, <ol>, <checklist>        list / checklist
 *   <li label="..." has_checkbox="true" is_checked="true" value="1" type="a">
 *   <details>, <summary>           collapsible
 *   <blockquote>                   quotation
 *   <hr>                           divider
 *
 * Each block type's exact HTML tag mapping is in `BLOCK_TAGS` below.
 */

/**
 * Escape HTML special chars in user-provided text content.
 */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parse simple inline formatting: **bold**, *italic*, `code`, [text](url).
 * Returns HTML string.
 * @param {string} input
 * @returns {string}
 */
export function renderInline(input) {
  if (typeof input !== 'string' || input.length === 0) return '';
  // Process character-by-character is hard; use a token regex.
  // Order matters: ** before *.
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\))/g;
  let out = '';
  let lastIndex = 0;
  let m;
  while ((m = re.exec(input)) !== null) {
    if (m.index > lastIndex) out += esc(input.slice(lastIndex, m.index));
    const token = m[0];
    if (token.startsWith('**')) {
      out += `<b>${esc(token.slice(2, -2))}</b>`;
    } else if (token.startsWith('`')) {
      out += `<code>${esc(token.slice(1, -1))}</code>`;
    } else if (token.startsWith('*')) {
      out += `<i>${esc(token.slice(1, -1))}</i>`;
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const url = linkMatch[2].replace(/"/g, '&quot;');
        out += `<a href="${url}">${esc(linkMatch[1])}</a>`;
      } else {
        out += esc(token);
      }
    }
    lastIndex = m.index + token.length;
  }
  if (lastIndex < input.length) out += esc(input.slice(lastIndex));
  return out;
}

/**
 * Wrap raw text in <p>...</p>.
 */
export function paragraph(input) {
  return `<p>${renderInline(input ?? '')}</p>`;
}

/**
 * Section heading (default level 2; can be overridden via {level: 1-6}).
 */
export function sectionHeading(input, opts = {}) {
  const level = Math.min(6, Math.max(1, opts.level ?? 2));
  return `<h${level}>${renderInline(input ?? '')}</h${level}>`;
}

/**
 * Horizontal divider.
 */
export function divider() {
  return '<hr/>';
}

/**
 * Block quotation.
 */
export function blockquote(input) {
  return `<blockquote>${renderInline(input ?? '')}</blockquote>`;
}

/**
 * Real table. Telegram supports column count 1-N. Each row is a string[]
 * matching the column count.
 *
 *   { columns: ["A", "B"], rows: [["1","2"], ["3","4"]] }
 *
 * Output:
 *   <table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>
 */
export function table(t) {
  if (!t || !Array.isArray(t.columns) || !Array.isArray(t.rows)) {
    throw new Error('table requires { columns: string[], rows: string[][] }');
  }
  const colCount = t.columns.length;
  const thead = '<tr>' + t.columns.map((c) => `<th>${renderInline(c)}</th>`).join('') + '</tr>';
  const tbody = t.rows.map((row) => {
    // Pad or truncate row to column count
    const cells = [];
    for (let i = 0; i < colCount; i++) cells.push(row[i] ?? '');
    return '<tr>' + cells.map((c) => `<td>${renderInline(c)}</td>`).join('') + '</tr>';
  }).join('');
  return `<table>${thead}${tbody}</table>`;
}

/**
 * Checklist. Each item: { text: string, done?: boolean, label?: string }
 * Output: <checklist>...<li has_checkbox="true" is_checked="true">...</li>...</checklist>
 */
export function checklist(items) {
  if (!Array.isArray(items)) {
    throw new Error('checklist requires [{ text, done? }]');
  }
  const li = items.map((it) => {
    const done = it.done === true;
    const label = it.label ? ` label="${esc(it.label)}"` : '';
    return `<li${label} has_checkbox="true" is_checked="${done}">${renderInline(it.text ?? '')}</li>`;
  }).join('');
  return `<checklist>${li}</checklist>`;
}

/**
 * Unordered list. Each item: { text: string } (no checkbox).
 */
export function unorderedList(items) {
  if (!Array.isArray(items)) {
    throw new Error('unorderedList requires [{ text }]');
  }
  const li = items.map((it) => `<li>${renderInline(it.text ?? '')}</li>`).join('');
  return `<ul>${li}</ul>`;
}

/**
 * Ordered list.
 */
export function orderedList(items, opts = {}) {
  if (!Array.isArray(items)) {
    throw new Error('orderedList requires [{ text }]');
  }
  const type = opts.type && /^[aA1iI]$/.test(opts.type) ? ` type="${opts.type}"` : '';
  const start = typeof opts.start === 'number' ? ` start="${opts.start}"` : '';
  const li = items.map((it) => {
    const value = typeof it.value === 'number' ? ` value="${it.value}"` : '';
    return `<li${value}>${renderInline(it.text ?? '')}</li>`;
  }).join('');
  return `<ol${type}${start}>${li}</ol>`;
}

/**
 * Smart list: if any item has `done` defined, render as checklist; else unordered.
 */
export function list(items) {
  if (!Array.isArray(items)) {
    throw new Error('list requires [{ text, done? }]');
  }
  if (items.some((it) => typeof it.done === 'boolean')) {
    return checklist(items);
  }
  return unorderedList(items);
}

/**
 * Collapsible details: { summary: string, blocks: string[] | blockHtml[] }
 * Output: <details><summary>...</summary>...</details>
 */
export function details(d) {
  if (!d || typeof d.summary !== 'string') {
    throw new Error('details requires { summary: string, blocks: [...] }');
  }
  const inner = (d.blocks ?? []).map((b) => {
    if (typeof b === 'string') return paragraph(b);
    return b;
  }).join('');
  return `<details><summary>${renderInline(d.summary)}</summary>${inner}</details>`;
}

/**
 * Top-level builder. Accepts a structured "reply" spec and returns
 * an HTML string for InputRichMessage.html.
 *
 * @param {object} spec - { heading?, summary?, table?, list?, details?, blocks?, rich_message? }
 * @returns {string} HTML string for rich_message.html
 */
export function buildRichHtml(spec = {}) {
  // Pass-through: if rich_message.html provided, use it as-is.
  if (spec.rich_message?.html) return spec.rich_message.html;
  if (spec.rich_message?.markdown) return spec.rich_message.markdown;
  if (typeof spec.rich_message === 'string') return spec.rich_message;

  const out = [];
  if (spec.heading) {
    out.push(sectionHeading(spec.heading, { level: spec.heading_level ?? 2 }));
  }
  if (spec.summary) {
    out.push(paragraph(spec.summary));
  }

  if (spec.table) {
    out.push(table(spec.table));
  }

  if (Array.isArray(spec.list) && spec.list.length > 0) {
    out.push(list(spec.list));
  }
  // Explicit checklist
  if (Array.isArray(spec.checklist) && spec.checklist.length > 0) {
    out.push(checklist(spec.checklist));
  }

  if (Array.isArray(spec.details) && spec.details.length > 0) {
    for (const d of spec.details) {
      out.push(details(d));
    }
  }

  if (Array.isArray(spec.paragraphs)) {
    for (const p of spec.paragraphs) out.push(paragraph(p));
  }
  if (Array.isArray(spec.quotes)) {
    for (const q of spec.quotes) out.push(blockquote(q));
  }

  if (Array.isArray(spec.blocks)) {
    for (const b of spec.blocks) {
      if (typeof b === 'string') out.push(paragraph(b));
      else out.push(b);
    }
  }

  if (spec.divider === true) out.push(divider());

  if (out.length === 0) {
    out.push(paragraph(''));
  }

  return out.join('\n');
}

/**
 * Build the full InputRichMessage JSON.
 */
export function buildRichMessage(spec = {}) {
  if (spec.rich_message && typeof spec.rich_message === 'object' && (spec.rich_message.html || spec.rich_message.markdown)) {
    return spec.rich_message;
  }
  return {
    html: buildRichHtml(spec),
    ...(spec.is_rtl ? { is_rtl: true } : {}),
    ...(spec.skip_entity_detection ? { skip_entity_detection: true } : {})
  };
}
