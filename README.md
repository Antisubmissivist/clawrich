# clawrich

> **Telegram Bot API 10.1 (2026-06-11) Rich Message sender for OpenClaw.**
> Send real tables, interactive checklists, collapsible details, math, and
> custom emoji to any Telegram chat 鈥?without depending on OpenClaw's
> bundled Telegram plugin to add support.

## Why

OpenClaw 2026.6.5's bundled Telegram plugin uses `parse_mode: HTML` for
outbound messages. That mode supports basic tags (`<b>`, `<i>`, `<code>`,
`<pre>`, `<a>`) but **cannot** render real tables, checklists, or
collapsible blocks.

Telegram Bot API 10.1 (released 2026-06-11) added the `sendRichMessage`
method that natively renders rich content. This plugin calls that API
directly, so your bot can send **true Telegram-native rich messages** to
any chat.

## Install

### From GitHub (recommended)

```bash
openclaw plugins install git:https://github.com/Antisubmissivist/clawrich.git
```

### From a local clone

```bash
git clone https://github.com/Antisubmissivist/clawrich.git
cd clawrich
npm install
openclaw plugins install --link .
```

## Configure

The plugin reads the bot token from your existing OpenClaw Telegram
account configuration. **No new credentials are needed** 鈥?make sure
you have at least one Telegram account configured:

```bash
openclaw config get channels.telegram
# Should show accounts[*].botToken (not redacted)
```

If your token is currently redacted, set it via:

```bash
openclaw config set channels.telegram.accounts.<account_id>.botToken <token>
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

Or with individual flags:

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

## Supported block types

| Block | Renders as |
|-------|-----------|
| `<h1>` 鈥?`<h6>` | Section heading |
| `<p>` | Paragraph with bold / italic / code / link inline |
| `<table>`, `<tr>`, `<th>`, `<td>` | **Real Telegram table** with header row |
| `<checklist>` with `<li has_checkbox is_checked>` | **Interactive checkboxes** (Premium users can check them) |
| `<ul>`, `<ol>` | Unordered / ordered lists |
| `<details>`, `<summary>` | **Collapsible** blocks (Telegram 8.0+) |
| `<blockquote>` | Block quotation |
| `<hr>` | Divider |

## Inline formatting (in any text field)

| Syntax | Renders as |
|--------|-----------|
| `**bold**` | bold |
| `*italic*` | italic |
| `` `code` `` | inline code |
| `[text](https://url)` | link |

HTML special characters in user input are automatically escaped to prevent
injection.

## API reference

`sendRichMessageFromConfig(input)` accepts:

| Field | Type | Description |
|-------|------|-------------|
| `chat_id` | string/number | **Required.** Telegram chat id |
| `account_id` | string | OpenClaw account id (default: first configured one) |
| `heading` | string | Section heading text |
| `heading_level` | 1-6 | Heading level (default 2) |
| `summary` | string | Short summary paragraph |
| `table` | object | `{ columns: [string], rows: [[string]] }` |
| `list` | array | `[{ text, done? }]` (becomes checklist if any `done` is set) |
| `checklist` | array | Force checklist rendering |
| `details` | array | `[{ summary, blocks: [string] }]` |
| `paragraphs` | array | Additional paragraphs |
| `quotes` | array | Block quotations |
| `divider` | boolean | Insert `<hr>` |
| `html` | string | Pass raw HTML (skips structured builder) |
| `markdown` | string | Pass raw Markdown |
| `message_thread_id` | number | Forum topic thread |
| `silent` | boolean | Send without notification |
| `is_rtl` | boolean | Right-to-left layout |
| `skip_entity_detection` | boolean | Skip URL/mention auto-detection |
| `dry_run` | boolean | Print payload, do not send |

## Limits

- Total rich message payload: **200 KB** (we hard-cap to be safe)
- Telegram enforces its own per-block text length limits (typically 4096 chars per block)
- Checklist interactivity requires the recipient to have **Telegram Premium** 鈥?  free users see static text. Tables and details still render normally.

## Security

- The plugin **never** ships or stores bot tokens
- User-supplied text content is HTML-escaped before injection
- Uses the same bot token already configured in your OpenClaw Telegram account

## Limitations

- This plugin calls `sendRichMessage` directly via HTTPS. It does **not** integrate
  with OpenClaw's outbound queue, retry, or rate-limiting layers.
- For high-volume bots, consider implementing your own throttling.
- Inline buttons (`reply_markup`) are not yet wrapped 鈥?use OpenClaw's native
  `message` tool for inline button replies; this plugin is for the message
  body only.

## Development

```bash
git clone https://github.com/Antisubmissivist/clawrich.git
cd clawrich
npm install
npm test                    # 13/13 unit tests
node bin/send.js --dry-run  # validate payload
```

## Maintainer

Antist
- Telegram: @Buddleja_impiorum
- Email: zackwang72@gmail.com
- GitHub: [@Antisubmissivist](https://github.com/Antisubmissivist)

## License

MIT 鈥?see [LICENSE](LICENSE)
