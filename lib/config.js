/**
 * lib/config.js
 *
 * Resolve OpenClaw Telegram bot token from the active config.
 * No hardcoded tokens 鈥?always read live from openclaw.json.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Locate the active OpenClaw config file path.
 * Defaults to: %USERPROFILE%\.openclaw\openclaw.json (Windows)
 *              ~/.openclaw/openclaw.json (POSIX)
 */
export function findOpenClawConfigPath() {
  const candidates = [
    process.env.OPENCLAW_CONFIG,
    join(process.env.USERPROFILE || process.env.HOME || '', '.openclaw', 'openclaw.json'),
    join(process.env.HOME || '', '.openclaw', 'openclaw.json'),
    'C:\\Users\\Public\\.openclaw\\openclaw.json'
  ];
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  throw new Error('openclaw.json not found in any known location');
}

/**
 * Load the OpenClaw config JSON.
 * Strips the __OPENCLAW_REDACTED__ placeholder from bot tokens; if redacted, throws.
 */
export function loadConfig() {
  const path = findOpenClawConfigPath();
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw);
}

let _configCache = null;
let _configCacheAt = 0;

/**
 * Get a cached copy of the config (5 second TTL).
 */
export function getCachedConfig(ttlMs = 5000) {
  const now = Date.now();
  if (!_configCache || now - _configCacheAt > ttlMs) {
    _configCache = loadConfig();
    _configCacheAt = now;
  }
  return _configCache;
}

export function clearConfigCache() {
  _configCache = null;
  _configCacheAt = 0;
}

/**
 * Return the default telegram account id.
 */
export function getDefaultAccountId() {
  const cfg = getCachedConfig();
  const accounts = cfg?.channels?.telegram?.accounts || {};
  const ids = Object.keys(accounts);
  if (ids.length === 0) throw new Error('No telegram accounts configured');
  return ids[0];
}

/**
 * Resolve the bot token + account config for a given account id.
 * If accountId is omitted, uses the first one found.
 */
export function resolveAccountConfig(accountId) {
  const cfg = getCachedConfig();
  const accounts = cfg?.channels?.telegram?.accounts || {};
  const id = accountId || getDefaultAccountId();
  const account = accounts[id];
  if (!account) {
    throw new Error(`Telegram account "${id}" not found in openclaw.json. Available: ${Object.keys(accounts).join(', ')}`);
  }
  const token = account.botToken;
  if (!token || token === '__OPENCLAW_REDACTED__') {
    throw new Error(`Bot token for account "${id}" is redacted or missing. Set it via \`openclaw config set channels.telegram.accounts.${id}.botToken <token>\` or env TELEGRAM_BOT_TOKEN_${id.toUpperCase()}.`);
  }
  return {
    id,
    token,
    account
  };
}

