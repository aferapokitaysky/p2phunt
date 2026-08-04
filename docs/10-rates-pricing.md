# Rates And Pricing

## Purpose

Rates and markups are central to P2PHunt.

The trader needs fast, reliable reference prices and controlled derived prices for ads and decision-making.

## Assets

Crypto examples:

- USDT;
- BTC;
- ETH;
- TON;
- USDC;
- BNB;
- TRX.

Fiat examples:

- UAH;
- RUB;
- USD;
- EUR;
- KZT;
- TRY;
- PLN.

The system should not hardcode a small list. Assets should be registry-driven.

## Rate Sources

Possible sources:

- Binance;
- Bybit;
- OKX;
- CoinMarketCap;
- CoinGecko;
- custom API;
- manual override;
- connector-specific market data.

## Source Priority

Each pair can have source priority:

```text
USDT/UAH:
  1. Binance P2P
  2. Bybit P2P
  3. Custom API
  4. Manual override
```

## Freshness

Every rate has:

- source timestamp;
- received timestamp;
- age;
- freshness status.

Freshness statuses:

- `fresh`;
- `stale`;
- `failed`;
- `manual_override`;
- `fallback`.

## Update Intervals

Configurable examples:

- 100ms;
- 250ms;
- 500ms;
- 1000ms;
- 5000ms;
- 30000ms.

Practical note:

Very fast intervals can hit API limits. The system should enforce per-source minimums and rate-limit budgets.

## Price Calculation

Base formula:

```text
selectedRate + markup = targetPrice
```

Percent markup:

```text
targetPrice = selectedRate * (1 + markupPercent / 100)
```

Fixed markup:

```text
targetPrice = selectedRate + fixedMarkup
```

Side-specific rules:

```text
BUY price = sourceBid + buyMarkup
SELL price = sourceAsk + sellMarkup
```

## Markup Resolution

Priority from broad to specific:

1. global;
2. platform;
3. account;
4. ad.

Most specific enabled rule wins unless the UI supports additive stacking.

Initial recommendation:

- use most-specific-wins;
- avoid stacking until product behavior is clearer.

## Price Guards

Before updating ads:

- check max price change;
- check minimum/maximum allowed price;
- check source freshness;
- check account mode;
- check connector health;
- check cooldown;
- preview bulk updates.

## Rate History

Store rate ticks for:

- charts;
- debugging;
- automation simulation;
- profit calculations;
- source comparison.

Downsample later:

- raw ticks for short period;
- minute candles;
- hour candles;
- daily candles.

## UI Requirements

Rates page should show:

- pair;
- selected source;
- bid/ask/mid;
- age;
- source status;
- markup;
- final target price;
- last update;
- mini chart;
- fallback indicator.

Pricing preview should show:

- current ad price;
- new calculated price;
- delta;
- affected account/ad;
- guard result;
- whether action would execute in Auto mode.

## API Events

- `rate.updated`;
- `rate.stale`;
- `rate.source_failed`;
- `rate.fallback_used`;
- `price.calculated`;
- `price.update_blocked`;
- `price.update_requested`;
- `price.updated`.
