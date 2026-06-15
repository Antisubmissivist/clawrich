# clawrich

> **Send real tables, interactive checklists, collapsible details, math, and
> custom emoji to Telegram — via the new Bot API 10.1 `sendRichMessage` method.**
>
> Pure Node.js SDK. Zero framework lock-in. Optional OpenClaw plugin integration.

[![npm version](https://img.shields.io/npm/v/clawrich.svg)](https://www.npmjs.com/package/clawrich)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

---

## Why

Telegram Bot API **10.1 (2026-06-11)** added `sendRichMessage` — a new endpoint
that natively renders real `<table>`, `<checklist>`, `<details>`, `<math>`, and
custom emoji in any chat. No more `<pre>` hacks for tables, no more "list a
task list of strings" — actual interactive, native Telegram elements.

`clawrich` wraps this in a clean, framework-agnostic Node.js SDK:

- ✅ **Pure Node** — works in any Node.js ≥ 18 project
- ✅ **Zero dependencies** (only `typebox` for the OpenClaw plugin shim)
- ✅ **TypeScript-first** — full type definitions included
- ✅ **Three usage styles** — SDK function call, OpenClaw plugin tool, or CLI
- ✅ **No HTML escaping headaches** — pass structured spec, get native output

---

## Install

```bash
npm install clawrich
```

That's it. You now have a working `sendRichMessage` wrapper.

---

## Quick start (Node SDK)

```js
import { sendRichMessage } from 'clawrich';

const result = await sendRichMessage({
  token: process.env.TG_BOT_TOKEN,        // get from @BotFather
  chat_id: 123456789,                      // or @username
  rich_spec: {
    heading: 'Sprint Status',
    summary: 'Driver App shipped. Portal QA in progress.',
    table: {
      columns: ['Task', 'Owner', 'Status'],
      rows: [
        ['Driver App release', 'Alex', '✅ Done'],
        ['Portal QA', 'Sam', '🟡 In progress'],
        ['Route optimizer', 'Luke', '🔴 Blocked']
      ]
    },
    list: [
      { text: 'Review PR', done: true },
      { text: 'Run staging smoke test', done: false },
      { text: 'Send release note', done: false }
    ],
    details: [
      {
        summary: '⚠️ Risks',
        blocks: [
          'QA may slip if staging data is stale.',
          'Route optimizer dependency needs confirmation.'
        ]
      }
    ]
  }
});

console.log(result.message_id);
```

### Or use raw HTML / Markdown

```js
// Pass raw HTML
await sendRichMessage({
  token, chat_id,
  html: '<b>bold</b> <i>italic</i> <table>...</table>'
});

// Or raw Markdown
await sendRichMessage({
  token, chat_id,
  markdown: '**bold** _italic_ | A | B |\n|-|-|\n| 1 | 2 |'
});
```

### Build the payload without sending

```js
import { buildRichMessage } from 'clawrich';

const rich = buildRichMessage({
  heading: 'Title',
  table: { columns: ['A', 'B'], rows: [['1', '2']] }
});

console.log(rich.html);
// → '<h2>Title</h2>\n<table>...</table>'
```

---

## CLI

```bash
# Dry-run (print payload, don't send)
node node_modules/clawrich/bin/send.js --chat_id 12345 \
  --json examples/sprint-status.json --dry-run

# Real send
node node_modules/clawrich/bin/send.js --chat_id 12345 \
  --json examples/sprint-status.json
```

Or install globally and use `clawrich-send`:

```bash
npm install -g clawrich
clawrich-send --chat_id 12345 --json sprint.json
```

---

## OpenClaw plugin (optional)

If you use [OpenClaw](https://openclaw.ai) and want the same capability as a
native tool, the package also exports an OpenClaw plugin:

```bash
# Install alongside OpenClaw
npm install clawrich
openclaw plugins validate clawrich   # should say "Plugin clawrich is valid"
```

Your agent will then be able to call the `telegram_rich_send` tool directly.

> **Note:** The OpenClaw plugin shim uses `typebox` and `openclaw/plugin-sdk`
> as peer deps. If you don't use OpenClaw, you can ignore them — they're
> marked as `peerDependenciesMeta.optional: true`.

---

## API reference

### `sendRichMessage(params)`

| Field | Type | Required | Notes |
|---|---|---|---|
| `token` | `string` | ✅ | Telegram bot token from @BotFather |
| `chat_id` | `string \| number` | ✅ | Numeric chat_id or @username |
| `rich_spec` | `RichMessageSpec` | one of | Structured spec → auto-converted to html |
| `rich_message` | `{ html?, markdown? }` | one of | Pre-built Bot API payload |
| `html` | `string` | one of | Raw HTML shortcut |
| `markdown` | `string` | one of | Raw Markdown shortcut |
| `message_thread_id` | `number` | | Forum topic thread id |
| `silent` | `boolean` | | Send without notification |
| `is_rtl` | `boolean` | | Right-to-left layout |
| `skip_entity_detection` | `boolean` | | Skip auto-entity detection (faster) |
| `dry_run` | `boolean` | | Print payload, don't send |
| `edit` | `boolean` | | Edit existing message instead of sending |
| `message_id` | `string \| number` | edit mode | Required when `edit: true` |

Returns `Promise<{ ok: true, message_id, date, chat, ... }>`.

### `RichMessageSpec` (structured form)

```ts
interface RichMessageSpec {
  heading?: string;
  heading_level?: 1 | 2 | 3 | 4 | 5 | 6;  // default 2
  summary?: string;
  table?: { columns: string[]; rows: string[][] };
  list?: { text: string; done?: boolean }[];
  checklist?: { text: string; done?: boolean }[];
  details?: { summary: string; blocks: string[] }[];
  paragraphs?: string[];
  quotes?: string[];
  divider?: boolean;
}
```

---

## Supported rich elements

| Element | HTML | Markdown | Notes |
|---|---|---|---|
| Headings (h1–h6) | `<h1>`–`<h6>` | `# `–`###### ` | |
| Bold | `<b>` | `**x**` | |
| Italic | `<i>` | `*x*` | |
| Code | `<code>` | `` `x` `` | |
| Link | `<a href>` | `[text](url)` | |
| Table | `<table>` / `<tr>` / `<th>` / `<td>` | pipe syntax | |
| Checklist | `<checklist>` / `<li has_checkbox is_checked>` | `[x]` / `[ ]` | Clickable in client |
| Details | `<details>` / `<summary>` | n/a | Collapsible |
| Math (inline) | `<math>` | `$x$` | |
| Math (block) | `<math>` | `$$x$$` | |
| Custom emoji | `custom_emoji_id` | n/a | |
| Divider | `<hr>` | `---` | |

Reference: <https://core.telegram.org/bots/api#rich-message-formatting-options>

---

## Environment

- **Node.js** ≥ 18 (uses native `fetch`)
- **Telegram Bot API** ≥ 10.1 (2026-06-11)
- No transpilation, no bundler needed

---

## Testing

```bash
git clone https://github.com/Antisubmissivist/clawrich.git
cd clawrich
npm install
npm test
```

Tests use Node's built-in `node:test` runner — no test framework dependency.

---

## License

MIT © 2026 Antist (王子剑) — see [LICENSE](LICENSE)

---

## Acknowledgments

- Built for the [OpenClaw](https://openclaw.ai) ecosystem
- Powered by [Telegram Bot API 10.1](https://core.telegram.org/bots/api)
- Inspired by every bot developer who's ever wanted to send a real table
