# @antisubmissivist/clawrich

> **Send real tables, interactive checklists, collapsible details, math, and
> custom emoji to Telegram 鈥?via the new Bot API 10.1 `sendRichMessage` method.**
>
> Pure Node.js SDK. Zero framework lock-in. Optional OpenClaw plugin integration.

[![npm version](https://img.shields.io/npm/v/@antisubmissivist/clawrich.svg)](https://www.npmjs.com/package/@antisubmissivist/clawrich)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

---

## Which install is right for me?

Three install paths for three audiences 鈥?pick the one that matches you:

| You are鈥?| Install command | You get |
|---|---|---|
| 馃叞锔?**An OpenClaw user** (you already run `openclaw message send`) | `openclaw plugins install clawhub:clawrich` | A new `telegram_rich_send` tool your agent can call |
| 馃叡锔?**A Node.js developer** (you want to import a library) | `npm install @antisubmissivist/clawrich` | A pure-Node SDK with TypeScript types |
| 馃叢锔?**A contributor / hacker** (you want to read or fork the code) | `git clone https://github.com/Antisubmissivist/clawrich.git` | Full source, build, and test suite |

> 馃挕 **Same code, three doors.** The npm tarball and the ClawHub plugin share
> the same `src/` and `lib/` 鈥?the npm one is the SDK, the ClawHub one wires
> it as an OpenClaw tool. You don't need both.

---

## Why

Telegram Bot API **10.1 (2026-06-11)** added `sendRichMessage` 鈥?a new endpoint
that natively renders real `<table>`, `<checklist>`, `<details>`, `<math>`, and
custom emoji in any chat. No more `<pre>` hacks for tables, no more "list a
task list of strings" 鈥?actual interactive, native Telegram elements.

`clawrich` wraps this in a clean, framework-agnostic Node.js SDK:

- 鉁?**Pure Node** 鈥?works in any Node.js 鈮?18 project
- 鉁?**Zero dependencies** (only `typebox` for the OpenClaw plugin shim)
- 鉁?**TypeScript-first** 鈥?full type definitions included
- 鉁?**Three usage styles** 鈥?SDK function call, OpenClaw plugin tool, or CLI
- 鉁?**No HTML escaping headaches** 鈥?pass structured spec, get native output

---

## Install (Node SDK)

```bash
npm install @antisubmissivist/clawrich
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
        ['Driver App release', 'Alex', '鉁?Done'],
        ['Portal QA', 'Sam', '馃煛 In progress'],
        ['Route optimizer', 'Luke', '馃敶 Blocked']
      ]
    },
    list: [
      { text: 'Review PR', done: true },
      { text: 'Run staging smoke test', done: false },
      { text: 'Send release note', done: false }
    ],
    details: [
      {
        summary: '鈿狅笍 Risks',
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
// 鈫?'<h2>Title</h2>\n<table>...</table>'
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
> as peer deps. If you don't use OpenClaw, you can ignore them 鈥?they're
> marked as `peerDependenciesMeta.optional: true`.

---

## API reference

### `sendRichMessage(params)`

| Field | Type | Required | Notes |
|---|---|---|---|
| `token` | `string` | 鉁?| Telegram bot token from @BotFather |
| `chat_id` | `string \| number` | 鉁?| Numeric chat_id or @username |
| `rich_spec` | `RichMessageSpec` | one of | Structured spec 鈫?auto-converted to html |
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
| Headings (h1鈥揾6) | `<h1>`鈥揱<h6>` | `# `鈥揱###### ` | |
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

- **Node.js** 鈮?18 (uses native `fetch`)
- **Telegram Bot API** 鈮?10.1 (2026-06-11)
- No transpilation, no bundler needed

---

## Testing

```bash
git clone https://github.com/Antisubmissivist/clawrich.git
cd clawrich
npm install
npm test
```

Tests use Node's built-in `node:test` runner 鈥?no test framework dependency.

---

## License

MIT 漏 2026 Antisubmissivist 鈥\?see [LICENSE](LICENSE)

---

## Acknowledgments

- Built for the [OpenClaw](https://openclaw.ai) ecosystem
- Powered by [Telegram Bot API 10.1](https://core.telegram.org/bots/api)
- Inspired by every bot developer who's ever wanted to send a real table

