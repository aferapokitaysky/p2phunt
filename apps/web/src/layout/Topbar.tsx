import { Link } from "react-router-dom";
import { IconLogout, IconNotifications } from "../components/icons/NavIcons.js";
import { ModeControls } from "../components/ModeControls.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { useDashboard } from "../hooks/api.js";
import { useLogout } from "../hooks/useAuth.js";
import { useAuthStore } from "../store/auth.js";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const workspace = useAuthStore((s) => s.workspace);
  const { data: dashboard } = useDashboard();
  const logout = useLogout();

  return (
    <header className="glass-panel-strong flex h-16 flex-shrink-0 items-center justify-between rounded-3xl px-5">
      <div className="text-sm text-muted">
        <span className="font-semibold text-ink">{workspace?.name ?? "Рабочее пространство"}</span>
      </div>
      <div className="flex items-center gap-3">
        <ModeControls />

        <div className="mx-1 h-6 w-px bg-line" />

        <Link
          to="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-glassHi hover:text-ink"
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
          <span className="hidden text-muted sm:inline">{user?.email}</span>
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
