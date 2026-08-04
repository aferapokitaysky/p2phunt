import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExchangeIcon } from "../components/ExchangeIcon.js";
import { IconLogout, IconNotifications, IconSearch } from "../components/icons/NavIcons.js";
import { ModeControls } from "../components/ModeControls.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { useAccounts, useDashboard } from "../hooks/api.js";
import { useLogout } from "../hooks/useAuth.js";
import { useAuthStore } from "../store/auth.js";

function workspaceInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function QuickSearch() {
  const navigate = useNavigate();
  const { data: accounts = [] } = useAccounts();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return accounts.filter((a) => a.name.toLowerCase().includes(q) || a.platform.name.toLowerCase().includes(q)).slice(0, 6);
  }, [accounts, query]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (accountId: string) => {
    navigate(`/accounts/${accountId}`);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full max-w-xs">
      <div className="flex items-center gap-2 rounded-full bg-glass px-3.5 py-2 text-sm text-muted transition-colors focus-within:bg-glassHi">
        <IconSearch size={15} className="flex-shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) go(results[0].id);
          }}
          placeholder="Найти аккаунт…"
          className="w-full bg-transparent text-ink placeholder:text-subtle focus:outline-none"
        />
      </div>

      {open && query.trim() && (
        <div className="glass-panel-strong absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-72 overflow-auto rounded-xl p-1">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-muted">Ничего не найдено.</p>
          ) : (
            results.map((a) => (
              <button
                key={a.id}
                onClick={() => go(a.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-glassHi"
              >
                <ExchangeIcon platform={a.platform.slug} size={18} />
                <span className="min-w-0 flex-1 truncate text-ink">{a.name}</span>
                <span className="flex-shrink-0 text-xs text-subtle">{a.platform.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const workspace = useAuthStore((s) => s.workspace);
  const { data: dashboard } = useDashboard();
  const logout = useLogout();
  const now = useClock();

  return (
    <header className="glass-panel-strong flex h-16 flex-shrink-0 items-center gap-4 rounded-3xl px-5">
      <div className="flex flex-shrink-0 items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-gradient text-xs font-bold text-onPrimary">
          {workspaceInitials(workspace?.name ?? "P2P")}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-tight text-ink">{workspace?.name ?? "Рабочее пространство"}</p>
          <p className="text-xs leading-tight text-subtle">
            {now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            {" · "}
            {now.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
          </p>
        </div>
      </div>

      <div className="hidden flex-1 justify-center md:flex">
        <QuickSearch />
      </div>

      <div className="ml-auto flex flex-shrink-0 items-center gap-3">
        <ModeControls />

        <div className="mx-1 h-6 w-px bg-line" />

        <Link
          to="/activity"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-glassHi hover:text-ink"
          title="Активность"
        >
          <IconNotifications size={18} />
          {!!dashboard?.unreadNotifications && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {dashboard.unreadNotifications}
            </span>
          )}
        </Link>

        <ThemeToggle />

        <div className="mx-1 h-6 w-px bg-line" />

        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted lg:inline">{user?.email}</span>
          <button
            onClick={() => logout.mutate()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/15 hover:text-danger"
            title="Выйти"
          >
            <IconLogout size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
