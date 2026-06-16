/**
 * lib/bot-api.js
 *
 * Send Rich Message to Telegram via Bot API 10.1.
 * Bypasses OpenClaw's HTML-only text path entirely.
 *
 * Reference: https://core.telegram.org/bots/api#sendrichmessage
 */

import { readFileSync } from 'node:fs';
import { buildRichMessage, buildRichHtml } from './rich-builder.js';
import { resolveAccountConfig, getDefaultAccountId } from './config.js';

/**
 * Make an HTTPS POST request to the Telegram Bot API.
 */
async function callTelegramApi(token, method, body) {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Telegram API ${method} returned non-JSON (HTTP ${res.status}): ${text.slice(0, 500)}`);
  }
  if (!json.ok) {
    const err = new Error(`Telegram API ${method} failed: ${json.description || JSON.stringify(json)}`);
    err.code = json.error_code;
    err.payload = json;
    throw err;
  }
  return json.result;
}

/**
 * Resolve a bot token for the given OpenClaw account id.
 */
export function getBotToken(accountId) {
  const cfg = resolveAccountConfig(accountId);
  return cfg.token;
}

/**
 * Send a Rich Message to Telegram.
 *
 * @param {object} params
 * @param {string|number} params.chat_id - Telegram chat id or @username
 * @param {object} params.rich_message - InputRichMessage JSON (with html or markdown field)
 * @param {object} [params.rich_spec] - Structured spec; will be passed to buildRichMessage
 * @param {string} [params.html] - Shortcut: HTML content
 * @param {string} [params.markdown] - Shortcut: Markdown content
 * @param {string|number} [params.message_thread_id] - Forum topic thread id
 * @param {boolean} [params.silent]
 * @param {string} [params.account_id] - OpenClaw account id (default: kael)
 * @param {string} [params.token] - Override token (default: read from openclaw.json)
 * @param {boolean} [params.dry_run] - If true, print payload and don't send
 * @param {boolean} [params.edit] - If true, use editMessageText with rich_message
 * @param {string|number} [params.message_id] - Required for edit
 */
export async function sendRichMessage(params) {
  if (!params || !params.chat_id) {
    throw new Error('sendRichMessage requires { chat_id, ... }');
  }
  const accountId = params.account_id || getDefaultAccountId();
  const token = params.token || getBotToken(accountId);

  let richMessage;
  if (params.rich_message) {
    richMessage = params.rich_message;
  } else if (params.rich_spec) {
    richMessage = buildRichMessage(params.rich_spec);
  } else if (params.html) {
    richMessage = { html: params.html };
  } else if (params.markdown) {
    richMessage = { markdown: params.markdown };
  } else {
    throw new Error('sendRichMessage requires one of: rich_message, rich_spec, html, markdown');
  }

  // Validate size: Telegram Rich message HTML up to 4096 chars per block
  // (we just enforce a sane upper bound on the total payload)
  const json = JSON.stringify(richMessage);
  if (json.length > 200_000) {
    throw new Error(`Rich message too large: ${json.length} bytes (max 200k). Consider splitting.`);
  }

  if (params.dry_run) {
    return {
      ok: true,
      dry_run: true,
      method: params.edit ? 'editMessageText' : 'sendRichMessage',
      payload: { chat_id: params.chat_id, rich_message: richMessage }
    };
  }

  if (params.edit) {
    if (!params.message_id) {
      throw new Error('edit mode requires message_id');
    }
    return await callTelegramApi(token, 'editMessageText', {
      chat_id: params.chat_id,
      message_id: params.message_id,
      rich_message: richMessage
    });
  }

  const body = {
    chat_id: params.chat_id,
    rich_message: richMessage
  };
  if (params.message_thread_id) body.message_thread_id = params.message_thread_id;
  if (params.silent === true) body.disable_notification = true;

  return await callTelegramApi(token, 'sendRichMessage', body);
}

/**
 * High-level helper: take the OpenClaw tool input (chat_id, heading, summary, table, list, details, ...)
 * and dispatch to sendRichMessage.
 *
 * @param {object} input - OpenClaw tool input matching openclaw.plugin.json schema
 */
export async function sendRichMessageFromConfig(input) {
  const { chat_id, account_id, heading, summary, table, list, details, checklist, html, markdown, ...rest } = input || {};
  if (!chat_id) {
    throw new Error('telegram_rich_send requires chat_id');
  }
  if (html) {
    return await sendRichMessage({ chat_id, account_id, html, ...rest });
  }
  if (markdown) {
    return await sendRichMessage({ chat_id, account_id, markdown, ...rest });
  }
  return await sendRichMessage({
    chat_id,
    account_id,
    rich_spec: { heading, summary, table, list, details, checklist, ...rest },
    ...rest
  });
}

/**
 * Read a JSON spec from a file and send.
 */
export async function sendFromFile(filePath, chatId, accountId) {
  const raw = readFileSync(filePath, 'utf-8');
  const spec = JSON.parse(raw);
  return await sendRichMessageFromConfig({ chat_id: chatId, account_id: accountId, ...spec });
}
