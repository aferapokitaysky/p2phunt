import type { SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function base(props: IconProps) {
  const { size = 20, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest
  };
}

/** Wordmark badge: two opposing arrows forming an exchange loop — the core P2P motif. */
export function IconLogo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="6" strokeWidth="1.4" opacity="0.35" />
      <path d="M7.5 9.5h9.5M17 9.5l-2.8-2.8M17 9.5l-2.8 2.8" />
      <path d="M16.5 14.5H7M7 14.5l2.8-2.8M7 14.5l2.8 2.8" />
    </svg>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.2" y="3.2" width="8" height="7" rx="2" />
      <rect x="13.2" y="3.2" width="7.6" height="4.2" rx="2" />
      <rect x="13.2" y="9.2" width="7.6" height="7.6" rx="2" />
      <rect x="3.2" y="12" width="8" height="8.8" rx="2" />
    </svg>
  );
}

export function IconDeals(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8.5h14.5" />
      <path d="M15 4.5l3.5 4-3.5 4" />
      <path d="M20 15.5H5.5" />
      <path d="M9 19.5l-3.5-4 3.5-4" />
    </svg>
  );
}

export function IconAccounts(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8.2" r="3.4" />
      <circle cx="16.3" cy="9.6" r="2.6" opacity="0.55" />
      <path d="M3.3 20c0-3.6 2.6-6 5.7-6s5.7 2.4 5.7 6" />
      <path d="M15.6 14.6c2.4.2 4.1 2.2 4.1 5.4" opacity="0.55" />
    </svg>
  );
}

export function IconBalances(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="14.5" height="11" rx="2.4" />
      <path d="M3 10.2h14.5" />
      <circle cx="17.5" cy="14.5" r="3.5" fill="currentColor" fillOpacity="0.12" />
      <path d="M17.5 12.8v3.4M15.9 14.5h3.2" />
    </svg>
  );
}

export function IconAds(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9.5v5a1.6 1.6 0 0 0 1.6 1.6h1.1l1.6 4" />
      <path d="M4 9.5a12 12 0 0 1 12.5-6.2v14.4A12 12 0 0 1 4 14.7" />
      <path d="M16.5 6.6a4 4 0 0 1 0 7.8" opacity="0.6" />
    </svg>
  );
}

export function IconMarket(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 20V11" />
      <path d="M12 20V6.5" />
      <path d="M19 20v-7" />
      <circle cx="5" cy="8.3" r="1.6" />
      <circle cx="12" cy="3.8" r="1.6" />
      <circle cx="19" cy="10.3" r="1.6" />
    </svg>
  );
}

export function IconRates(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 15.5l4.3-5 3.5 3 4.3-6.2" />
      <path d="M16.1 7.3h3.9v3.9" />
      <circle cx="4" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconAutomation(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="6" opacity="0.35" />
      <path d="M13 6.5l-5.2 7h4l-1 4.5 5.4-7.4h-4l1-4.1z" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

export function IconNotifications(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 10.2a6 6 0 0 1 12 0c0 4 1.4 5.4 1.4 5.4H4.6S6 14.2 6 10.2Z" />
      <path d="M9.6 18.5a2.4 2.4 0 0 0 4.8 0" />
    </svg>
  );
}

export function IconLogs(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4.5" y="3.2" width="15" height="17.6" rx="2.4" />
      <path d="M8 8.3h8M8 12h8M8 15.7h5" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h8.5M15 6.5h5" />
      <circle cx="13.3" cy="6.5" r="1.9" />
      <path d="M4 12h4.5M11 12h9" />
      <circle cx="8.8" cy="12" r="1.9" />
      <path d="M4 17.5h9M16.5 17.5h3.5" />
      <circle cx="14" cy="17.5" r="1.9" />
    </svg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 4.5H6.6A2.1 2.1 0 0 0 4.5 6.6v10.8a2.1 2.1 0 0 0 2.1 2.1H10" />
      <path d="M15.5 15.5l4-3.5-4-3.5" />
      <path d="M19.2 12H9.5" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M19.5 19.5l-4.3-4.3" />
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.3 4.3l1.7 1.7M18 18l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.3 19.7l1.7-1.7M18 6l1.7-1.7" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 13.8A8.2 8.2 0 1 1 10.2 4a6.4 6.4 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
