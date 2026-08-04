import btc from "../assets/coins/btc.svg";
import eth from "../assets/coins/eth.svg";
import usdt from "../assets/coins/usdt.svg";
import usdc from "../assets/coins/usdc.svg";
import bnb from "../assets/coins/bnb.svg";
import trx from "../assets/coins/trx.svg";
import ton from "../assets/coins/ton.svg";

const COIN_ICONS: Record<string, string> = {
  BTC: btc,
  ETH: eth,
  USDT: usdt,
  USDC: usdc,
  BNB: bnb,
  TRX: trx,
  TON: ton
};

const FIAT_FLAGS: Record<string, string> = {
  UAH: "🇺🇦",
  RUB: "🇷🇺",
  USD: "🇺🇸",
  EUR: "🇪🇺",
  KZT: "🇰🇿",
  TRY: "🇹🇷",
  PLN: "🇵🇱"
};

const MONOGRAM_COLORS = ["#5b8cff", "#3ddc97", "#e2a53a", "#f2555a", "#8b96a5", "#c084fc"];

function monogramColor(code: string): string {
  const sum = [...code].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return MONOGRAM_COLORS[sum % MONOGRAM_COLORS.length] ?? "#5b8cff";
}

export function CoinIcon({ asset, size = 18 }: { asset: string; size?: number }) {
  const code = asset.toUpperCase();

  if (FIAT_FLAGS[code]) {
    return (
      <span style={{ fontSize: size * 0.85, lineHeight: 1 }} title={code}>
        {FIAT_FLAGS[code]}
      </span>
    );
  }

  const icon = COIN_ICONS[code];
  if (icon) {
    return <img src={icon} alt={code} width={size} height={size} className="inline-block rounded-full" />;
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: monogramColor(code), fontSize: size * 0.45 }}
      title={code}
    >
      {code.slice(0, 1)}
    </span>
  );
}
