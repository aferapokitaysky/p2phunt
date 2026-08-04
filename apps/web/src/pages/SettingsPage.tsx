import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button.js";
import { Card, CardBody } from "../components/Card.js";
import { Field, Input } from "../components/Field.js";
import { Select } from "../components/Select.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatusChip } from "../components/StatusChip.js";
import { useCreateMarkupRule, useDeleteMarkupRule, useMarkupRules, useUpdateMarkupRule } from "../hooks/api.js";
import { SCOPE_LABELS, SIDE_LABELS } from "../lib/labels.js";
import { useAuthStore } from "../store/auth.js";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const workspace = useAuthStore((s) => s.workspace);
  const { data: rules = [] } = useMarkupRules();
  const createRule = useCreateMarkupRule();
  const updateRule = useUpdateMarkupRule();
  const deleteRule = useDeleteMarkupRule();

  const [form, setForm] = useState({
    scopeType: "global" as "global" | "platform" | "account" | "ad",
    markupType: "percent" as "percent" | "fixed",
    value: "1"
  });

  return (
    <div>
      <PageHeader title="Настройки" subtitle="Профиль рабочего пространства, правила ценообразования и безопасность." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-3 text-sm font-semibold text-ink">Профиль</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Email</dt>
                <dd className="text-ink">{user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Рабочее пространство</dt>
                <dd className="text-ink">{workspace?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Режим</dt>
                <dd>
                  <StatusChip status={workspace?.mode ?? "manual"} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Экстренная остановка</dt>
                <dd>
                  <StatusChip status={workspace?.emergencyStop ? "critical" : "success"} />
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-3 text-sm font-semibold text-ink">Правила наценки</h2>
            <p className="mb-3 text-xs text-muted">
              Побеждает наиболее конкретное правило: объявление важнее аккаунта, аккаунт важнее платформы, платформа важнее глобального. Наценки
              не суммируются.
            </p>
            <ul className="mb-3 space-y-2">
              {rules.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-lg bg-glass px-3 py-2 text-sm">
                  <span className="text-ink">
                    {SCOPE_LABELS[r.scopeType] ?? r.scopeType}
                    {r.baseAsset ? ` · ${r.baseAsset}/${r.quoteAsset ?? "*"}` : ""}
                    {r.side ? ` · ${SIDE_LABELS[r.side] ?? r.side}` : ""} — {r.value}
                    {r.markupType === "percent" ? "%" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateRule.mutate({ id: r.id, enabled: !r.enabled })}>
                      <StatusChip status={r.enabled ? "active" : "disabled"} />
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => deleteRule.mutate(r.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </li>
              ))}
              {rules.length === 0 && <p className="text-sm text-muted">Правил наценки пока нет — по умолчанию 0%, пока вы не добавите своё.</p>}
            </ul>

            <div className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
              <Field label="Область">
                <Select value={form.scopeType} onChange={(value) => setForm((f) => ({ ...f, scopeType: value as typeof f.scopeType }))}>
                  <option value="global">Глобально</option>
                  <option value="platform">Платформа</option>
                  <option value="account">Аккаунт</option>
                  <option value="ad">Объявление</option>
                </Select>
              </Field>
              <Field label="Тип">
                <Select value={form.markupType} onChange={(value) => setForm((f) => ({ ...f, markupType: value as typeof f.markupType }))}>
                  <option value="percent">Процент</option>
                  <option value="fixed">Фиксированная</option>
                </Select>
              </Field>
              <Field label="Значение">
                <Input className="w-24" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
              </Field>
              <Button
                variant="primary"
                onClick={() =>
                  createRule.mutate({
                    scopeType: form.scopeType,
                    markupType: form.markupType,
                    value: Number(form.value)
                  })
                }
              >
                <Plus size={14} /> Добавить правило
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
