# Telegram Integration R&D

## Key Constraint

Telegram Bot API cannot read the user's chats with other bots.

That means a normal notification bot cannot see messages from CryptoBot, xRocket, Wallet, or similar services.

To observe and interact with those services as the user, P2PHunt needs Telegram Client API / MTProto.

## Candidate Libraries

- GramJS: TypeScript/Node-friendly.
- Telethon: Python, mature and widely used.
- TDLib: official client library, powerful but more complex.
- MadelineProto: PHP ecosystem.

Given the project stack is Node/TypeScript, GramJS is the natural first candidate.

## Telegram Worker Responsibilities

- Manage Telegram account sessions.
- Handle login by phone, code, and 2FA.
- Store encrypted session strings.
- Subscribe to message updates.
- Identify dialogs/bots.
- Parse relevant messages.
- Publish normalized events to Redis/API.
- Handle reconnects and flood limits.
- Maintain per-account sync health.

## Auth Flow

```text
User creates Telegram account in P2PHunt
  -> enters phone
  -> telegram-worker requests code
  -> user enters code
  -> if 2FA enabled, user enters password
  -> worker stores encrypted session
  -> account becomes active
```

## Event Flow

```text
Telegram update
  -> worker receives message
  -> match known bot/dialog
  -> classify message
  -> parse with connector parser
  -> emit normalized event
  -> backend upserts deal/balance/etc.
  -> notification/rules run
```

## Parsing Strategy

### Stage 1 - Message Capture

Store message metadata:

- Telegram account id;
- chat id;
- sender id;
- message id;
- timestamp;
- text;
- buttons metadata if available;
- media/document metadata if relevant.

### Stage 2 - Classification

Classify whether message is:

- new deal;
- payment update;
- completion;
- cancellation;
- balance change;
- transfer;
- generic notification;
- irrelevant.

### Stage 3 - Parser

Start with deterministic parsers:

- regex;
- known phrase templates;
- locale-specific rules.

Later add:

- configurable parser rules;
- ML/LLM-assisted parsing for ambiguous messages;
- user correction flow that improves templates.

### Stage 4 - Normalization

Parser emits:

```json
{
  "type": "deal.created",
  "externalId": "telegram_message:123",
  "asset": "USDT",
  "amount": "1200",
  "counterparty": "username",
  "confidence": 0.92
}
```

## Why Not Start With LLM Parsing

LLM parsing is useful for messy text, but it is risky for financial automation:

- can hallucinate fields;
- can misread locale formats;
- costs money;
- adds latency;
- requires validation anyway.

Use LLM only as fallback and always store confidence + original text.

## Reverse Engineering Track

For some Telegram services, button presses may call web apps or backend APIs.

Research should identify:

- whether the bot uses Telegram Web Apps;
- what endpoints are called;
- whether auth is tied to Telegram init data;
- whether requests can be reproduced legally and safely;
- whether the service terms allow automation.

## R&D Deliverables

For each Telegram service:

- login feasibility;
- message access feasibility;
- sample message corpus;
- supported actions;
- parser accuracy;
- rate/flood limits;
- session stability;
- ToS/risk notes;
- final capability matrix.

## R&D Test Harness

Build a local script/service to:

- connect one Telegram account;
- list dialogs;
- watch selected bot messages;
- write captured events to JSONL;
- run parser tests;
- replay captured messages against parsers.

## Safety Notes

- Never store Telegram 2FA password plaintext.
- Avoid spammy automated message sending.
- Respect Telegram flood waits.
- Provide "disconnect and delete session" action.
- Separate notification bot from client-account sessions.
