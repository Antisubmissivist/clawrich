/**
 * clawrich — main entry
 *
 * Telegram Bot API 10.1 Rich Message sender.
 * https://core.telegram.org/bots/api#rich-message-formatting-options
 *
 * Two entry points:
 *   1) default export: OpenClaw plugin (telegram_rich_send tool)
 *   2) named exports:  pure Node SDK (sendRichMessage, buildRichMessage, etc.)
 *
 * The SDK works in any Node.js environment — no OpenClaw required.
 */

import { Type } from 'typebox';
import { defineToolPlugin } from 'openclaw/plugin-sdk/tool-plugin';
import { sendRichMessageFromConfig } from '../lib/bot-api.js';
import { buildRichMessage, buildRichHtml } from '../lib/rich-builder.js';

// ─── Named exports: pure Node SDK (no OpenClaw dependency) ──────────────────

/**
 * Send a Telegram Rich Message via Bot API 10.1.
 *
 * @example
 *   import { sendRichMessage } from 'clawrich';
 *   await sendRichMessage({
 *     token: process.env.TG_BOT_TOKEN,
 *     chat_id: 123456789,
 *     rich_spec: {
 *       heading: 'Sprint Status',
 *       table: { columns: ['Task', 'Status'], rows: [['Ship', '✅']] }
 *     }
 *   });
 */
export { sendRichMessage, sendRichMessageFromConfig, sendFromFile } from '../lib/bot-api.js';

/**
 * Build a Rich Message object from a structured spec.
 *
 * @example
 *   import { buildRichMessage } from 'clawrich';
 *   const rich = buildRichMessage({
 *     heading: 'Title',
 *     table: { columns: ['A', 'B'], rows: [['1', '2']] }
 *   });
 */
export { buildRichMessage, buildRichHtml } from '../lib/rich-builder.js';

// ─── Default export: OpenClaw plugin ────────────────────────────────────────

export default defineToolPlugin({
  id: 'clawrich',
  name: 'ClawRich — Telegram Rich Messages',
  description: 'Send Telegram Rich Messages (true tables, checklists, collapsible details, custom emoji) via Bot API 10.1. The first OpenClaw plugin to support sendRichMessage.',

  tools: (tool) => [
    tool({
      name: 'telegram_rich_send',
      description: 'Send a structured Rich Message to any Telegram chat via Bot API 10.1 sendRichMessage. Supports tables, checklists, details, math, custom emoji.',
      parameters: Type.Object({
        chat_id: Type.Union([Type.String(), Type.Number()], {
          description: 'Telegram chat id (numeric, e.g. 6462079744) or @username'
        }),
        account_id: Type.Optional(Type.String({
          description: 'OpenClaw telegram account id (default: first configured one)'
        })),
        heading: Type.Optional(Type.String({ description: 'Section heading text' })),
        heading_level: Type.Optional(Type.Integer({ minimum: 1, maximum: 6, description: 'Heading level 1-6 (default 2)' })),
        summary: Type.Optional(Type.String({ description: 'Short summary paragraph' })),
        table: Type.Optional(Type.Object({
          columns: Type.Array(Type.String(), { description: 'Column headers' }),
          rows: Type.Array(Type.Array(Type.String()), { description: 'Table rows (array of cell arrays)' })
        })),
        list: Type.Optional(Type.Array(Type.Object({
          text: Type.String(),
          done: Type.Optional(Type.Boolean())
        }), { description: 'List items. If any item has done, becomes a checklist.' })),
        checklist: Type.Optional(Type.Array(Type.Object({
          text: Type.String(),
          done: Type.Optional(Type.Boolean())
        }), { description: 'Force checklist rendering.' })),
        details: Type.Optional(Type.Array(Type.Object({
          summary: Type.String(),
          blocks: Type.Array(Type.String())
        }), { description: 'Collapsible details blocks.' })),
        paragraphs: Type.Optional(Type.Array(Type.String())),
        quotes: Type.Optional(Type.Array(Type.String())),
        divider: Type.Optional(Type.Boolean()),
        html: Type.Optional(Type.String({ description: 'Raw HTML pass-through (skips structured builder)' })),
        markdown: Type.Optional(Type.String({ description: 'Raw Markdown pass-through' })),
        message_thread_id: Type.Optional(Type.Integer()),
        silent: Type.Optional(Type.Boolean({ description: 'Send without notification' })),
        is_rtl: Type.Optional(Type.Boolean()),
        skip_entity_detection: Type.Optional(Type.Boolean()),
        dry_run: Type.Optional(Type.Boolean({ description: 'Print payload, do not send' })),
        account_id_override: Type.Optional(Type.String())
      }, { additionalProperties: false }),
      execute: async (params) => {
        const result = await sendRichMessageFromConfig(params);
        if (params?.dry_run) {
          return { ok: true, dry_run: true, payload: result?.payload ?? result };
        }
        return {
          ok: true,
          message_id: result?.message_id,
          date: result?.date,
          chat_id: result?.chat?.id
        };
      }
    })
  ]
});
