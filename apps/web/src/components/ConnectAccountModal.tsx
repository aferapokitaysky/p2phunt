import { useState } from "react";
import clsx from "clsx";
import { ExternalLink, X } from "lucide-react";
import { useConnectors, useCreateAccount, useSetAccountSecret, useSyncAccount } from "../hooks/api.js";
import { Button } from "./Button.js";
import { ExchangeIcon } from "./ExchangeIcon.js";
import { Field, Input } from "./Field.js";

const CAPABILITY_LABELS: Record<string, string> = {
  "profile.read": "профиль",
  "balances.read": "балансы",
  "deals.read": "сделки",
  "ads.read": "объявления",
  "ads.update_price": "изменение цены объявлений",
  "ads.enable": "включение объявлений",
  "ads.disable": "отключение объявлений",
  "rates.read": "курсы"
};

interface CredentialField {
  key: string;
  label: string;
  placeholder?: string;
}

interface CredentialSpec {
  fields: CredentialField[];
  hint: string;
  keyUrl: string;
  keyUrlLabel: string;
}

const CREDENTIAL_SPECS: Record<string, CredentialSpec> = {
  binance: {
    fields: [
      { key: "apiKey", label: "API Key" },
      { key: "apiSecret", label: "API Secret" }
    ],
    hint: "Создайте ключ в личном кабинете Binance → API Management. Права на вывод средств включать не нужно.",
    keyUrl: "https://www.binance.com/en/my/settings/api-management",
    keyUrlLabel: "Открыть Binance API Management"
  },
  bybit: {
    fields: [
      { key: "apiKey", label: "API Key" },
      { key: "apiSecret", label: "API Secret" }
    ],
    hint: "Создайте ключ в личном кабинете Bybit → API. Права на вывод средств включать не нужно.",
    keyUrl: "https://www.bybit.com/app/user/api-management",
    keyUrlLabel: "Открыть Bybit API Management"
  },
  cryptobot: {
    fields: [{ key: "apiToken", label: "API Token" }],
    hint: "Откройте @CryptoBot в Telegram → /pay → Create App, скопируйте API Token.",
    keyUrl: "https://t.me/CryptoBot?start=pay",
    keyUrlLabel: "Открыть @CryptoBot"
  },
  xrocket: {
    fields: [{ key: "apiToken", label: "API Token" }],
    hint: "Откройте @xRocket в Telegram → Rocket Pay → Create App → API token.",
    keyUrl: "https://t.me/xRocket",
    keyUrlLabel: "Открыть @xRocket"
  },
  walletpay: {
    fields: [{ key: "apiKey", label: "Store API Key" }],
    hint: "Получите ключ в кабинете pay.wallet.tg после одобрения магазина.",
    keyUrl: "https://pay.wallet.tg/",
    keyUrlLabel: "Открыть pay.wallet.tg"
  }
};

export function ConnectAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: connectors = [] } = useConnectors();
  const createAccount = useCreateAccount();
  const setSecret = useSetAccountSecret();
  const syncAccount = useSyncAccount();
  const [connectorSlug, setConnectorSlug] = useState("");
  const [name, setName] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);

  if (!open) return null;

  const selected = connectors.find((c) => c.slug === connectorSlug);
  const spec = selected ? CREDENTIAL_SPECS[selected.slug] : undefined;
  const needsCredentials = !!spec && spec.fields.length > 0;
  const credentialsComplete = !needsCredentials || spec.fields.every((f) => credentials[f.key]?.trim());

  const reset = () => {
    setConnectorSlug("");
    setName("");
    setCredentials({});
    setError(null);
    setPendingAccountId(null);
  };

  const submit = async () => {
    if (!selected || !name.trim() || !credentialsComplete) return;
    setError(null);

    try {
      // If a previous attempt already created the account but the key was rejected, reuse
      // that account on retry instead of creating a duplicate for every failed attempt.
      const accountId = pendingAccountId ?? (await createAccount.mutateAsync({ platform: selected.platform, connector: selected.slug, name: name.trim() })).id;
      if (!pendingAccountId) setPendingAccountId(accountId);

      if (needsCredentials) {
        const payload: Record<string, unknown> = {};
        for (const f of spec.fields) payload[f.key] = (credentials[f.key] ?? "").trim();
        await setSecret.mutateAsync({ id: accountId, kind: "api_key", payload });
      }

      syncAccount.mutate(accountId);
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось подключить аккаунт");
    }
  };

  const busy = createAccount.isPending || setSecret.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          reset();
          onClose();
        }}
      />
      <div className="glass-panel-strong relative w-full max-w-lg rounded-3xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Подключить аккаунт</h2>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-full p-1.5 text-muted hover:bg-glassHi hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-2 text-xs font-medium text-muted">Платформа</p>
        <div className="mb-4 grid grid-cols-4 gap-2.5">
          {connectors.map((c) => (
            <button
              key={c.slug}
              onClick={() => {
                setConnectorSlug(c.slug);
                setCredentials({});
                setError(null);
                setPendingAccountId(null);
              }}
              className={clsx(
                "flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all",
                connectorSlug === c.slug
                  ? "border-brand bg-brand/10 shadow-glass"
                  : "border-glassBorder bg-glass hover:bg-glassHi"
              )}
            >
              <ExchangeIcon platform={c.platform} size={30} />
              <span className="text-[11px] font-medium text-ink">{c.displayName}</span>
            </button>
          ))}
        </div>

        {selected && (
          <>
            <p className="mb-4 rounded-xl bg-glass px-3 py-2 text-xs text-muted">
              Доступно: {selected.capabilities.map((cap) => CAPABILITY_LABELS[cap] ?? cap).join(", ")}.
              {selected.safetyLevel <= 1 && " Коннектор только для чтения — без ключа менять ничего нельзя."}
            </p>

            <div className="mb-4">
              <Field label="Название аккаунта">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`например, ${selected.displayName} — основной`} autoFocus />
              </Field>
            </div>

            {needsCredentials && (
              <div className="mb-2 space-y-3 rounded-xl border border-glassBorder bg-glass p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted">{spec.hint}</p>
                  <a
                    href={spec.keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-glassHi px-2 py-1 text-xs font-medium text-brand hover:brightness-110"
                  >
                    {spec.keyUrlLabel}
                    <ExternalLink size={11} />
                  </a>
                </div>
                {pendingAccountId && (
                  <p className="rounded-lg bg-warning/12 px-2 py-1 text-xs text-warning">
                    Аккаунт уже создан — просто исправьте ключ и подключите снова.
                  </p>
                )}
                {spec.fields.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={credentials[f.key] ?? ""}
                      onChange={(e) => setCredentials((c) => ({ ...c, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                    />
                  </Field>
                ))}
              </div>
            )}

            {!needsCredentials && selected.slug !== "mock" && (
              <p className="mb-2 text-xs text-subtle">Этот коннектор не требует ключей для чтения данных.</p>
            )}
          </>
        )}

        {error && <p className="mb-2 text-xs text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Отмена
          </Button>
          <Button variant="primary" onClick={submit} loading={busy} disabled={!selected || !name.trim() || !credentialsComplete}>
            Подключить
          </Button>
        </div>
      </div>
    </div>
  );
}
