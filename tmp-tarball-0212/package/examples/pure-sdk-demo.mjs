/**
 * examples/pure-sdk-demo.mjs
 *
 * Pure Node SDK usage — no OpenClaw, no plugin context.
 * Just import clawrich and call sendRichMessage.
 */
import { sendRichMessage, buildRichMessage } from 'clawrich';

// Simulate user passing their own bot token
const TOKEN = process.env.TG_BOT_TOKEN || 'demo:dry-run-token';

// 1. Build a rich message spec (no I/O, pure function)
const spec = {
  heading: 'SDK Demo',
  summary: 'Sent from a pure Node script using clawrich',
  table: {
    columns: ['Capability', 'Status'],
    rows: [
      ['Real tables', '✅ working'],
      ['Checklists', '✅ working'],
      ['Collapsible details', '✅ working']
    ]
  },
  list: [
    { text: 'Step 1: install clawrich', done: true },
    { text: 'Step 2: send a rich message', done: true },
    { text: 'Step 3: build a real app', done: false }
  ]
};

const built = buildRichMessage(spec);
console.log('--- built html ---');
console.log(built.html);
console.log('--- end ---');

// 2. Send it (dry-run by default unless TG_BOT_TOKEN is set)
const isReal = TOKEN !== 'demo:dry-run-token';
const result = await sendRichMessage({
  token: TOKEN,
  chat_id: process.env.TG_CHAT_ID || 123456789,
  rich_spec: spec,
  dry_run: !isReal
});
console.log(JSON.stringify(result, null, 2));
