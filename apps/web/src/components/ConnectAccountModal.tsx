import { useState } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { useConnectors, useCreateAccount } from "../hooks/api.js";
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

export function ConnectAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: connectors = [] } = useConnectors();
  const createAccount = useCreateAccount();
  const [connectorSlug, setConnectorSlug] = useState("");
  const [name, setName] = useState("");

  if (!open) return null;

  const selected = connectors.find((c) => c.slug === connectorSlug);

  const submit = () => {
    if (!selected || !name.trim()) return;
    createAccount.mutate(
      { platform: selected.platform, connector: selected.slug, name: name.trim() },
      {
        onSuccess: () => {
          setConnectorSlug("");
          setName("");
          onClose();
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-panel-strong relative w-full max-w-lg rounded-3xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Подключить аккаунт</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-glassHi hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <p className="mb-2 text-xs font-medium text-muted">Платформа</p>
        <div className="mb-4 grid grid-cols-4 gap-2.5">
          {connectors.map((c) => (
            <button
              key={c.slug}
              onClick={() => setConnectorSlug(c.slug)}
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
              {(selected.slug === "binance" || selected.slug === "bybit") &&
                " Не проверялся на реальном аккаунте — сообщите, если что-то не сработает."}
            </p>

            <Field label="Название аккаунта">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="например, Bybit — основной" autoFocus />
            </Field>
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" onClick={submit} loading={createAccount.isPending} disabled={!selected || !name.trim()}>
            Подключить
          </Button>
        </div>
      </div>
    </div>
  );
}
