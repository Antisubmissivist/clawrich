---
name: clawrich
version: 0.1.1
description: ClawRich 鈥?Telegram Bot API 10.1 Rich Message sender for OpenClaw. True tables, interactive checklists, collapsible details, math, custom emoji. Bypasses OpenClaw's HTML-only text path.
author: Antisubmissivist <Antisubmissivist@gmail.com>
tags: clawrich, telegram, bot-api-10.1, rich-message, table, checklist, channel-extension
---

# ClawRich

> **Telegram Bot API 10.1 (2026-06-11) Rich Message sender for OpenClaw.**
> The first OpenClaw plugin to support the new `sendRichMessage` method.

## Why

OpenClaw 2026.6.5's bundled Telegram plugin uses `parse_mode: HTML`, which only supports
basic tags (`<b> <i> <u> <s> <code> <pre> <a href>`). It **cannot** render real tables,
interactive checklists, collapsible details, or math expressions.

Telegram Bot API 10.1 (released June 11, 2026) added the `sendRichMessage` method that
natively renders rich content. This plugin calls that API directly, bypassing OpenClaw's
text-only path, so your bot can send **true Telegram-native rich messages** to any chat.

## What you get

| Block type | Renders as |
|------------|-----------|
| `<h1>` - `<h6>` | Section heading (with bold and accent) |
| `<p>` | Paragraph with bold / italic / code / link inline |
| `<table>`, `<tr>`, `<th>`, `<td>` | **Real Telegram table** with header row |
| `<checklist>` with `<li has_checkbox is_checked>` | **Interactive checkboxes** (Premium users can check them) |
| `<ul>`, `<ol>` | Unordered / ordered lists |
| `<details>`, `<summary>` | **Collapsible** blocks (Telegram 8.0+) |
| `<blockquote>` | Block quotation |
| `<hr>` | Divider |

## Install

```bash
openclaw plugins install clawhub:clawrich
```

Or from a local path:
```bash
openclaw plugins install --link /path/to/clawrich
```

## Configure

The plugin reads the bot token from your existing OpenClaw Telegram account
configuration 鈥?**no new credentials needed**. Make sure you have a Telegram
account configured:

```bash
openclaw config get channels.telegram
# Should show at least one account with a non-redacted botToken
```

## Usage

### As an OpenClaw tool

Call `telegram_rich_send` from any agent that can use OpenClaw tools:

```json
{
  "chat_id": "6462079744",
  "heading": "馃搳 Sprint Status",
  "summary": "Driver App shipped. Portal QA in progress. Route Optimizer blocked.",
  "table": {
    "columns": ["Task", "Owner", "Status"],
    "rows": [
      ["Driver App release", "Alex", "鉁?Done"],
      ["Portal QA", "Sam", "馃攧 In progress"],
      ["Route optimizer", "Luke", "馃毇 Blocked"]
    ]
  },
  "list": [
    { "text": "Review PR", "done": true },
    { "text": "Run staging smoke test", "done": false },
    { "text": "Send release note", "done": false }
  ],
  "details": [
    {
      "summary": "鈿狅笍 Risks",
      "blocks": [
        "QA may slip if staging data is stale.",
        "Route optimizer dependency needs confirmation."
      ]
    }
  ]
}
```

### As a CLI

```bash
node bin/send.js --chat_id 6462079744 --json examples/sprint-status.json
```

```bash
node bin/send.js --chat_id 6462079744 \
  --heading "Stock analysis" \
  --summary "AMZN stop-loss executed." \
  --table-file table.json \
  --details-file risks.json
```

### As a Node module

```js
import { sendRichMessageFromConfig } from 'clawrich';

await sendRichMessageFromConfig({
  chat_id: 6462079744,
  heading: 'Hello',
  summary: 'This is a **bold** and *italic* test',
  table: { columns: ['A', 'B'], rows: [['1', '2']] }
});
```

## Inline formatting (in any text field)

| Syntax | Renders as |
|--------|-----------|
| `**bold**` | bold |
| `*italic*` | italic |
| `` `code` `` | inline code |
| `[text](https://url)` | link |

HTML special characters in user input are automatically escaped to prevent injection.

## API reference

`sendRichMessageFromConfig(input)` accepts:

| Field | Type | Description |
|-------|------|-------------|
| `chat_id` | string/number | **Required.** Telegram chat id |
| `account_id` | string | OpenClaw account id (default: first one) |
| `heading` | string | Section heading |
| `heading_level` | 1-6 | Heading level (default: 2) |
| `summary` | string | Paragraph |
| `table` | object | `{ columns: [string], rows: [[string]] }` |
| `list` | array | `[{ text, done? }]` (becomes checklist if any `done` is set) |
| `checklist` | array | Force checklist even without `done` |
| `details` | array | `[{ summary, blocks: [string] }]` |
| `paragraphs` | array | Additional paragraphs |
| `quotes` | array | Block quotations |
| `divider` | boolean | Insert `<hr>` |
| `html` | string | Pass raw HTML (skips structured builder) |
| `markdown` | string | Pass raw Markdown |
| `message_thread_id` | number | Forum topic thread |
| `silent` | boolean | Send without notification |
| `dry_run` | boolean | Print payload, don't send |
| `is_rtl` | boolean | Right-to-left layout |
| `skip_entity_detection` | boolean | Skip URL/mention auto-detection |

## Limits

- Total rich message payload: **200 KB** (we hard-cap to be safe)
- Telegram enforces its own per-block text length limits (4096 chars for most blocks)
- Checklist interactivity requires the recipient to have **Telegram Premium**
- Free users see checklist items as static text 鈥?tables and details still render

## Security

- The plugin **never** ships or stores bot tokens
- User-supplied text content is HTML-escaped before injection into the rich message
- The plugin uses the same bot token already configured in your OpenClaw Telegram account

## Limitations

- This plugin calls `sendRichMessage` directly via HTTPS. It does **not** integrate
  with OpenClaw's outbound queue, retry, or rate-limiting layers
- For high-volume bots, consider implementing your own throttling around the send call
- Inline buttons (`reply_markup`) are not yet wrapped 鈥?use OpenClaw's native `message`
  tool for inline button replies; this plugin is for the message body only

## Changelog

### 0.1.0 (2026-06-15)
- First release
- Supports Bot API 10.1 `sendRichMessage`
- Real tables, checklists, details, quotes, dividers
- Structured input (heading/summary/table/list/details) 鈫?HTML string
- HTML inline parsing: bold, italic, code, link
- XSS-safe: user input is escaped
- CLI + Node module + OpenClaw tool entry points
- 13/13 unit tests pass

## Maintainer

Antisubmissivist (Antisubmissivist@gmail.com)
- Telegram: @Buddleja_impiorum
- OpenClaw workspace: `~/.openclaw/workspace/clawrich`

## License

MIT

