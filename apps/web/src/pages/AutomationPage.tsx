import { Plus, TestTube2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button.js";
import { Card, CardBody } from "../components/Card.js";
import { Field, Input } from "../components/Field.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatusChip } from "../components/StatusChip.js";
import {
  useAutomationExecutions,
  useAutomationRules,
  useCreateAutomationRule,
  useDeleteAutomationRule,
  useTestAutomationRule,
  useUpdateAutomationRule
} from "../hooks/api.js";
import type { AutomationRule } from "../lib/types.js";

const TEMPLATE = {
  trigger: { type: "balance.updated" },
  conditions: [{ field: "asset", operator: "eq", value: "USDT" }],
  actions: [{ type: "notify", params: { message: "Баланс USDT изменился" } }]
};

function pluralCond(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "условие";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "условия";
  return "условий";
}

function pluralAction(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "действие";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "действия";
  return "действий";
}

function RuleCard({ rule }: { rule: AutomationRule }) {
  const update = useUpdateAutomationRule();
  const remove = useDeleteAutomationRule();
  const test = useTestAutomationRule();
  const { data: executions = [] } = useAutomationExecutions(rule.id);
  const [showTest, setShowTest] = useState(false);
  const [sampleInput, setSampleInput] = useState('{\n  "asset": "USDT",\n  "totalAmount": 500\n}');
  const [result, setResult] = useState<Awaited<ReturnType<typeof test.mutateAsync>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setError(null);
    try {
      const parsed = JSON.parse(sampleInput);
      const res = await test.mutateAsync({ id: rule.id, sampleInput: parsed });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Некорректный JSON");
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">{rule.name}</h3>
            <p className="text-xs text-muted">
              триггер: <code>{rule.trigger.type}</code> · {rule.conditions.length} {pluralCond(rule.conditions.length)} · {rule.actions.length}{" "}
              {pluralAction(rule.actions.length)}
              {rule.cooldownSeconds ? ` · остывание ${rule.cooldownSeconds} с` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => update.mutate({ id: rule.id, enabled: !rule.enabled })}
              className="rounded-full"
              title={rule.enabled ? "Отключить правило" : "Включить правило"}
            >
              <StatusChip status={rule.enabled ? "active" : "disabled"} />
            </button>
            <Button size="sm" variant="ghost" onClick={() => setShowTest((v) => !v)}>
              <TestTube2 size={14} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove.mutate(rule.id)}>
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {showTest && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-1 text-xs font-medium text-muted">Пример входных данных триггера (JSON)</p>
            <textarea
              className="mb-2 h-24 w-full rounded-lg border border-line bg-glass p-2 font-mono text-xs text-ink"
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
            />
            <Button size="sm" variant="primary" onClick={runTest} loading={test.isPending}>
              Пробный запуск
            </Button>
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            {result && (
              <div className="mt-3 space-y-2 text-xs">
                <p className={result.matched ? "text-brand" : "text-muted"}>{result.matched ? "Условия выполнены" : "Условия не выполнены"}</p>
                <ul className="space-y-1">
                  {result.conditionResults.map((c, i) => (
                    <li key={i} className={c.passed ? "text-muted" : "text-danger"}>
                      {JSON.stringify(c.condition)} → {JSON.stringify(c.actualValue)} — {c.passed ? "пройдено" : "не пройдено"}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-1">
                  {result.plannedActions.map((a, i) => (
                    <li key={i} className="text-ink">
                      {a.type}: {a.wouldExecute ? "будет выполнено" : `заблокировано (${a.blockedReason})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {executions.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-1 text-xs font-medium text-muted">Последние выполнения</p>
            <ul className="space-y-1">
              {executions.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{new Date(e.startedAt).toLocaleString("ru-RU")}</span>
                  <StatusChip status={e.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function AutomationPage() {
  const { data: rules = [], isLoading } = useAutomationRules();
  const createRule = useCreateAutomationRule();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [json, setJson] = useState(JSON.stringify(TEMPLATE, null, 2));
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    try {
      const parsed = JSON.parse(json);
      createRule.mutate(
        { name, trigger: parsed.trigger, conditions: parsed.conditions, actions: parsed.actions, guards: parsed.guards, cooldownSeconds: parsed.cooldownSeconds },
        { onSuccess: () => { setShowCreate(false); setName(""); setJson(JSON.stringify(TEMPLATE, null, 2)); } }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Некорректный JSON");
    }
  };

  return (
    <div>
      <PageHeader
        title="Автоматизация"
        subtitle="Правила работают только в авторежиме, учитывают экстренную остановку и всегда логируют каждое решение."
        actions={
          <Button variant="primary" onClick={() => setShowCreate((v) => !v)}>
            <Plus size={14} /> Новое правило
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-4">
          <CardBody>
            <Field label="Название правила">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="например, Уведомить о низком балансе USDT" />
            </Field>
            <p className="mb-1 mt-3 text-xs font-medium text-muted">
              Триггер / условия / действия (JSON). Безопасные действия: notify. Действия записи (ads.update_price/enable/disable) ставят команду
              коннектору в очередь. Высокорисковые действия (переводы, подтверждение оплаты) всегда заблокированы.
            </p>
            <textarea
              className="h-56 w-full rounded-lg border border-line bg-glass p-2 font-mono text-xs text-ink"
              value={json}
              onChange={(e) => setJson(e.target.value)}
            />
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            <div className="mt-3 flex gap-2">
              <Button variant="primary" disabled={!name} onClick={submit} loading={createRule.isPending}>
                Создать правило
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Отмена
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted">Загрузка…</p>}
        {!isLoading && rules.length === 0 && <p className="text-sm text-muted">Правил автоматизации пока нет.</p>}
        {rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>
    </div>
  );
}
