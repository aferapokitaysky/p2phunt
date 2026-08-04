import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  IconAccounts,
  IconAds,
  IconAutomation,
  IconBalances,
  IconDashboard,
  IconDeals,
  IconLogo,
  IconLogs,
  IconMarket,
  IconNotifications,
  IconRates,
  IconSettings,
  type IconProps
} from "../components/icons/NavIcons.js";

const NAV_ITEMS: { to: string; label: string; icon: (p: IconProps) => JSX.Element; end?: boolean }[] = [
  { to: "/", label: "Дашборд", icon: IconDashboard, end: true },
  { to: "/deals", label: "Сделки", icon: IconDeals },
  { to: "/accounts", label: "Аккаунты", icon: IconAccounts },
  { to: "/balances", label: "Балансы", icon: IconBalances },
  { to: "/ads", label: "Объявления", icon: IconAds },
  { to: "/market", label: "Рынок", icon: IconMarket },
  { to: "/rates", label: "Курсы", icon: IconRates },
  { to: "/automation", label: "Автоматизация", icon: IconAutomation },
  { to: "/notifications", label: "Уведомления", icon: IconNotifications },
  { to: "/logs", label: "Журналы", icon: IconLogs },
  { to: "/settings", label: "Настройки", icon: IconSettings }
];

export function Sidebar() {
  return (
    <aside className="glass-panel-strong relative z-30 flex h-full w-[72px] flex-shrink-0 flex-col items-center rounded-3xl py-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl text-brand">
        <IconLogo size={24} />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? false}
            title={item.label}
            className={({ isActive }) =>
              clsx(
                "group relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                isActive ? "bg-flamingo text-white shadow-glass" : "text-muted hover:bg-glassHi hover:text-ink"
              )
            }
          >
            <item.icon size={19} />
            <span
              className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink opacity-0 shadow-glassLg transition-opacity group-hover:opacity-100 glass-panel-strong z-50"
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
