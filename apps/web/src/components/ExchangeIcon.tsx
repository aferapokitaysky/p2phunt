import binance from "../assets/exchanges/binance.svg";
import bybit from "../assets/exchanges/bybit.svg";
import cryptobot from "../assets/exchanges/cryptobot.jpg";
import mock from "../assets/exchanges/mock.svg";
import okx from "../assets/exchanges/okx.svg";
import telegram from "../assets/exchanges/telegram.svg";
import walletpay from "../assets/exchanges/walletpay.svg";
import xrocket from "../assets/exchanges/xrocket.svg";

const EXCHANGE_ICONS: Record<string, string> = {
  binance,
  bybit,
  okx,
  mock,
  telegram,
  cryptobot,
  xrocket,
  walletpay
};

const EXCHANGE_LABELS: Record<string, string> = {
  binance: "Binance",
  bybit: "Bybit",
  okx: "OKX",
  mock: "Демо",
  telegram: "Telegram",
  cryptobot: "CryptoBot",
  xrocket: "xRocket",
  walletpay: "Wallet"
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
