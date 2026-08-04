/**
 * Telegram message parsing per docs/08-telegram-rd.md, Stage 1-3 (capture -> classify -> parse).
 *
 * IMPORTANT: this ships a configurable rule engine, not hardcoded knowledge of any specific
 * bot's message format. CryptoBot / xRocket / Wallet notification text is not officially
 * documented and changes over time — nobody should trust a parser against real money until
 * its rules have been calibrated against a captured corpus of real messages from that bot and
 * reviewed by a human. The example rules below are illustrative starting templates only.
 */

export interface TelegramMessage {
  botSlug: string;
  chatId: string;
  messageId: number;
  senderId?: string;
  text: string;
  timestamp: string;
}

export type ParsedEventType =
  | "deal.created"
  | "payment.update"
  | "deal.completed"
  | "deal.cancelled"
  | "balance.changed"
  | "generic_notification"
  | "irrelevant";

export interface ParsedTelegramEvent {
  type: ParsedEventType;
  externalId: string;
  asset: string | null;
  amount: string | null;
  counterparty: string | null;
  confidence: number;
  rawText: string;
  matchedRuleId: string | null;
}

export interface TelegramParserRule {
  id: string;
  botSlug: string;
  type: ParsedEventType;
  /** Regex source with named capture groups: asset, amount, counterparty (all optional). */
  pattern: string;
  flags?: string;
  confidence: number;
}

export function parseTelegramMessage(rules: TelegramParserRule[], message: TelegramMessage): ParsedTelegramEvent {
  const externalId = `telegram:${message.botSlug}:${message.chatId}:${message.messageId}`;

  for (const rule of rules) {
    if (rule.botSlug !== message.botSlug) continue;

    const regex = new RegExp(rule.pattern, rule.flags ?? "i");
    const match = regex.exec(message.text);
    if (!match) continue;

    return {
      type: rule.type,
      externalId,
      asset: match.groups?.asset ?? null,
      amount: match.groups?.amount ?? null,
      counterparty: match.groups?.counterparty ?? null,
      confidence: rule.confidence,
      rawText: message.text,
      matchedRuleId: rule.id
    };
  }

  return {
    type: "irrelevant",
    externalId,
    asset: null,
    amount: null,
    counterparty: null,
    confidence: 0,
    rawText: message.text,
    matchedRuleId: null
  };
}

export function replayCorpus(rules: TelegramParserRule[], messages: TelegramMessage[]): ParsedTelegramEvent[] {
  return messages.map((message) => parseTelegramMessage(rules, message));
}

/**
 * Illustrative starting templates ONLY — not verified against any live bot. Replace with rules
 * derived from a real captured message corpus (see docs/08-telegram-rd.md "R&D Test Harness")
 * before relying on these for anything financial.
 */
export const EXAMPLE_PARSER_RULES: TelegramParserRule[] = [
  {
    id: "example-received-crypto",
    botSlug: "example-bot",
    type: "deal.created",
    pattern: "you (?:have )?received (?<amount>[\\d.,]+)\\s*(?<asset>[A-Z]{2,10})(?:.*from\\s*(?<counterparty>@?\\w+))?",
    confidence: 0.6
  },
  {
    id: "example-payment-confirmed",
    botSlug: "example-bot",
    type: "payment.update",
    pattern: "payment (?:of\\s*(?<amount>[\\d.,]+)\\s*(?<asset>[A-Z]{2,10}))?\\s*confirmed",
    confidence: 0.6
  }
];
