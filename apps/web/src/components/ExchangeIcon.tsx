import binance from "../assets/exchanges/binance.svg";
import bybit from "../assets/exchanges/bybit.svg";
import mock from "../assets/exchanges/mock.svg";
import telegram from "../assets/exchanges/telegram.svg";

const EXCHANGE_ICONS: Record<string, string> = {
  binance,
  bybit,
  mock,
  telegram
};

const EXCHANGE_LABELS: Record<string, string> = {
  binance: "Binance",
  bybit: "Bybit",
  mock: "Демо",
  telegram: "Telegram"
};

export function ExchangeIcon({ platform, size = 20 }: { platform: string; size?: number }) {
  const key = platform.toLowerCase();
  const icon = EXCHANGE_ICONS[key];
  const label = EXCHANGE_LABELS[key] ?? platform;

  if (icon) {
    return <img src={icon} alt={label} width={size} height={size} className="inline-block rounded-full" title={label} />;
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-glass font-bold text-muted"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={label}
    >
      {label.slice(0, 1)}
    </span>
  );
}

export function exchangeLabel(platform: string): string {
  return EXCHANGE_LABELS[platform.toLowerCase()] ?? platform;
}
