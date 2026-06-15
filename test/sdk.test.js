/**
 * Test: SDK surface — named exports + dry-run path
 *
 * Run: node --test test/sdk.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// Configure env BEFORE importing lib (it reads openclaw.json at import time)
process.env.CLAWRICH_TEST_FAKE_TOKEN = 'test:fake-token-for-dry-run';

import * as sdk from '../src/index.js';

describe('SDK named exports', () => {
  it('exposes sendRichMessage', () => {
    assert.equal(typeof sdk.sendRichMessage, 'function');
  });

  it('exposes sendRichMessageFromConfig', () => {
    assert.equal(typeof sdk.sendRichMessageFromConfig, 'function');
  });

  it('exposes buildRichMessage', () => {
    assert.equal(typeof sdk.buildRichMessage, 'function');
  });

  it('exposes buildRichHtml', () => {
    assert.equal(typeof sdk.buildRichHtml, 'function');
  });

  it('exposes default OpenClaw plugin export', () => {
    assert.equal(typeof sdk.default, 'object');
    assert.equal(sdk.default.id, 'clawrich');
  });
});

describe('sendRichMessage — dry_run path', () => {
  it('returns a dry_run envelope without hitting Telegram', async () => {
    const result = await sdk.sendRichMessage({
      token: 'test:fake-token',
      chat_id: 12345,
      rich_spec: { heading: 'Test', summary: 'Hi' },
      dry_run: true
    });
    assert.equal(result.ok, true);
    assert.equal(result.dry_run, true);
    assert.equal(result.method, 'sendRichMessage');
    assert.equal(result.payload.chat_id, 12345);
    assert.ok(result.payload.rich_message.html);
  });

  it('rejects when chat_id is missing', async () => {
    await assert.rejects(
      () => sdk.sendRichMessage({ token: 'x', rich_spec: { heading: 'y' } }),
      /requires \{ chat_id/
    );
  });

  it('rejects when no rich_message / rich_spec / html / markdown', async () => {
    await assert.rejects(
      () => sdk.sendRichMessage({ token: 'x', chat_id: 1 }),
      /requires one of: rich_message, rich_spec, html, markdown/
    );
  });

  it('accepts raw html shortcut', async () => {
    const result = await sdk.sendRichMessage({
      token: 'x',
      chat_id: 1,
      html: '<b>hi</b>',
      dry_run: true
    });
    assert.equal(result.ok, true);
    assert.match(result.payload.rich_message.html, /<b>hi<\/b>/);
  });

  it('accepts raw markdown shortcut', async () => {
    const result = await sdk.sendRichMessage({
      token: 'x',
      chat_id: 1,
      markdown: '**bold**',
      dry_run: true
    });
    assert.equal(result.ok, true);
    assert.match(result.payload.rich_message.markdown, /\*\*bold\*\*/);
  });
});
