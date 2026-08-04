import { describe, expect, it } from "vitest";
import { EXAMPLE_PARSER_RULES, parseTelegramMessage, replayCorpus, type TelegramMessage } from "../parser.js";

function makeMessage(overrides: Partial<TelegramMessage> = {}): TelegramMessage {
  return {
    botSlug: "example-bot",
    chatId: "chat-1",
    messageId: 1,
    text: "",
    timestamp: new Date().toISOString(),
    ...overrides
  };
}

describe("parseTelegramMessage", () => {
  it("matches the received-crypto template and extracts fields", () => {
    const message = makeMessage({ text: "You have received 12.5 USDT from @alice" });
    const result = parseTelegramMessage(EXAMPLE_PARSER_RULES, message);

    expect(result.type).toBe("deal.created");
    expect(result.matchedRuleId).toBe("example-received-crypto");
    expect(result.amount).toBe("12.5");
    expect(result.asset).toBe("USDT");
    expect(result.counterparty).toBe("@alice");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("matches the payment-confirmed template", () => {
    const message = makeMessage({ text: "Payment of 50 UAH confirmed" });
    const result = parseTelegramMessage(EXAMPLE_PARSER_RULES, message);

    expect(result.type).toBe("payment.update");
    expect(result.matchedRuleId).toBe("example-payment-confirmed");
  });

  it("returns irrelevant with zero confidence for unmatched text", () => {
    const message = makeMessage({ text: "Just a random unrelated message" });
    const result = parseTelegramMessage(EXAMPLE_PARSER_RULES, message);

    expect(result.type).toBe("irrelevant");
    expect(result.confidence).toBe(0);
    expect(result.matchedRuleId).toBeNull();
  });

  it("never matches rules from a different bot", () => {
    const message = makeMessage({ botSlug: "other-bot", text: "You have received 5 USDT from @bob" });
    const result = parseTelegramMessage(EXAMPLE_PARSER_RULES, message);

    expect(result.type).toBe("irrelevant");
  });

  it("builds a stable externalId from bot/chat/message ids", () => {
    const message = makeMessage({ botSlug: "example-bot", chatId: "c1", messageId: 42 });
    const result = parseTelegramMessage([], message);
    expect(result.externalId).toBe("telegram:example-bot:c1:42");
  });
});

describe("replayCorpus", () => {
  it("parses a batch of messages in order", () => {
    const messages: TelegramMessage[] = [
      makeMessage({ messageId: 1, text: "You have received 1 USDT from @a" }),
      makeMessage({ messageId: 2, text: "unrelated" }),
      makeMessage({ messageId: 3, text: "Payment of 2 USDT confirmed" })
    ];

    const results = replayCorpus(EXAMPLE_PARSER_RULES, messages);

    expect(results).toHaveLength(3);
    expect(results[0]?.type).toBe("deal.created");
    expect(results[1]?.type).toBe("irrelevant");
    expect(results[2]?.type).toBe("payment.update");
  });
});
