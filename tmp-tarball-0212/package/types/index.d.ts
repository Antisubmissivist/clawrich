/**
 * TypeScript type definitions for clawrich — Telegram Bot API 10.1 Rich Message SDK.
 *
 * Reference: https://core.telegram.org/bots/api#rich-message-formatting-options
 */

// ─── Rich Message input spec (structured form) ──────────────────────────────

export interface RichTableSpec {
  columns: string[];
  rows: string[][];
}

export interface RichListItem {
  text: string;
  done?: boolean;
}

export interface RichDetailsBlock {
  summary: string;
  blocks: string[];
}

export interface RichMessageSpec {
  heading?: string;
  heading_level?: 1 | 2 | 3 | 4 | 5 | 6;
  summary?: string;
  table?: RichTableSpec;
  list?: RichListItem[];
  checklist?: RichListItem[];
  details?: RichDetailsBlock[];
  paragraphs?: string[];
  quotes?: string[];
  divider?: boolean;
}

// ─── Rich Message (Bot API form) ────────────────────────────────────────────

export interface RichMessage {
  html?: string;
  markdown?: string;
}

// ─── Send params ────────────────────────────────────────────────────────────

export interface SendRichMessageParams {
  /** Telegram bot token (get from @BotFather). */
  token?: string;
  /** OpenClaw account id (alternative to token; reads bot token from openclaw.json). */
  account_id?: string;
  /** Target chat: numeric chat_id or @username. */
  chat_id: string | number;
  /** Pre-built rich_message payload (with html or markdown field). */
  rich_message?: RichMessage;
  /** Structured spec — will be passed to buildRichMessage internally. */
  rich_spec?: RichMessageSpec;
  /** Shortcut: HTML content. */
  html?: string;
  /** Shortcut: Markdown content. */
  markdown?: string;
  /** Forum topic thread id. */
  message_thread_id?: number;
  /** Send without notification. */
  silent?: boolean;
  /** Right-to-left layout. */
  is_rtl?: boolean;
  /** Don't auto-detect entities (faster). */
  skip_entity_detection?: boolean;
  /** Print payload and don't send. */
  dry_run?: boolean;
  /** Edit an existing message instead of sending a new one. */
  edit?: boolean;
  /** Required when edit=true. */
  message_id?: string | number;
}

export interface SendRichMessageResult {
  ok: true;
  message_id?: number;
  date?: number;
  chat?: { id: number; type: string };
  text?: string;
  /** Set when dry_run=true. */
  dry_run?: boolean;
  method?: 'sendRichMessage' | 'editMessageText';
  payload?: unknown;
}

// ─── Build functions ────────────────────────────────────────────────────────

export function buildRichMessage(spec: RichMessageSpec): RichMessage;
export function buildRichHtml(spec: RichMessageSpec): string;

// ─── Send functions ─────────────────────────────────────────────────────────

export function sendRichMessage(params: SendRichMessageParams): Promise<SendRichMessageResult>;
export function sendRichMessageFromConfig(input: SendRichMessageParams & Record<string, unknown>): Promise<SendRichMessageResult>;
export function sendFromFile(filePath: string, chatId: string | number, accountId?: string): Promise<SendRichMessageResult>;

// ─── OpenClaw tool input (for tIncoming tool calls) ─────────────────────────

export interface TelegramRichSendToolInput {
  chat_id: string | number;
  account_id?: string;
  heading?: string;
  heading_level?: 1 | 2 | 3 | 4 | 5 | 6;
  summary?: string;
  table?: RichTableSpec;
  list?: RichListItem[];
  checklist?: RichListItem[];
  details?: RichDetailsBlock[];
  paragraphs?: string[];
  quotes?: string[];
  divider?: boolean;
  html?: string;
  markdown?: string;
  message_thread_id?: number;
  silent?: boolean;
  is_rtl?: boolean;
  skip_entity_detection?: boolean;
  dry_run?: boolean;
  account_id_override?: string;
}
