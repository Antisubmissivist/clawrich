#!/usr/bin/env node
/**
 * bin/send.js 鈥?CLI entry
 *
 * Usage:
 *   node bin/send.js --chat_id 6462079744 --json examples/sprint.json
 *   node bin/send.js --chat_id 6462079744 --heading "..." --summary "..." --table-file table.json
 *   cat reply.json | node bin/send.js --chat_id 6462079744
 *
 * Flags:
 *   --chat_id <id>        Telegram chat id (required)
 *   --account_id <id>     OpenClaw account id (default: first one)
 *   --json <file>         Load full InputRichMessage from JSON file
 *   --table-file <file>   Load table from JSON file
 *   --heading <text>
 *   --summary <text>
 *   --details-file <file> Load array of {summary, blocks} from JSON
 *   --list-file <file>    Load array of {text, done} from JSON
 *   --thread <id>         Forum topic thread id
 *   --silent              Send without notification
 *   --dry-run             Print payload, don't send
 */

import { readFileSync, existsSync } from 'node:fs';
import { sendRichMessageFromConfig } from '../lib/bot-api.js';

function parseArgs(argv) {
  const args = { _list: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--chat_id') args.chat_id = argv[++i];
    else if (a === '--account_id') args.account_id = argv[++i];
    else if (a === '--json') args.json = argv[++i];
    else if (a === '--table-file') args.tableFile = argv[++i];
    else if (a === '--heading') args.heading = argv[++i];
    else if (a === '--summary') args.summary = argv[++i];
    else if (a === '--details-file') args.detailsFile = argv[++i];
    else if (a === '--list-file') args.listFile = argv[++i];
    else if (a === '--thread') args.message_thread_id = argv[++i];
    else if (a === '--silent') args.silent = true;
    else if (a === '--dry-run') args.dry_run = true;
    else if (a === '-h' || a === '--help') {
      printHelp();
      process.exit(0);
    } else args._list.push(a);
  }
  return args;
}

function printHelp() {
  console.log('clawrich-send 鈥?send Telegram Rich Message (Bot API 10.1)');
  console.log('');
  console.log('Usage:');
  console.log('  node bin/send.js --chat_id <id> [--json <file>] [--heading <s>] [--summary <s>]');
  console.log('');
  console.log('Flags:');
  console.log('  --chat_id <id>        Telegram chat id (required)');
  console.log('  --account_id <id>     OpenClaw account id (default: first one)');
  console.log('  --json <file>         Load full InputRichMessage from JSON file');
  console.log('  --table-file <file>   Load table from JSON file');
  console.log('  --heading <text>');
  console.log('  --summary <text>');
  console.log('  --details-file <file>');
  console.log('  --list-file <file>');
  console.log('  --thread <id>         Forum topic thread id');
  console.log('  --silent              Send without notification');
  console.log('  --dry-run             Print payload, don\'t send');
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.chat_id) {
    printHelp();
    process.exit(1);
  }

  if (args.json) {
    if (!existsSync(args.json)) {
      console.error(`JSON file not found: ${args.json}`);
      process.exit(1);
    }
    const spec = JSON.parse(readFileSync(args.json, 'utf-8'));
    Object.assign(args, spec);
  }
  if (args.tableFile) {
    args.table = JSON.parse(readFileSync(args.tableFile, 'utf-8'));
  }
  if (args.listFile) {
    args.list = JSON.parse(readFileSync(args.listFile, 'utf-8'));
  }
  if (args.detailsFile) {
    args.details = JSON.parse(readFileSync(args.detailsFile, 'utf-8'));
  }

  try {
    const result = await sendRichMessageFromConfig(args);
    if (args.dry_run) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(JSON.stringify({ ok: true, message_id: result.message_id, date: result.date }, null, 2));
    }
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.payload) console.error(JSON.stringify(err.payload, null, 2));
    process.exit(2);
  }
}

main();
