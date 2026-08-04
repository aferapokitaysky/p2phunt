import { Navigate, Route, Routes } from "react-router-dom";
import { AnimatedBackground } from "./components/AnimatedBackground.js";
import { AppShell } from "./layout/AppShell.js";
import { AccountDetailPage } from "./pages/AccountDetailPage.js";
import { AccountsPage } from "./pages/AccountsPage.js";
import { ActivityPage } from "./pages/ActivityPage.js";
import { AdsPage } from "./pages/AdsPage.js";
import { AutomationPage } from "./pages/AutomationPage.js";
import { BalancesPage } from "./pages/BalancesPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { DealsPage } from "./pages/DealsPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { MarketPage } from "./pages/MarketPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { useAuthStore } from "./store/auth.js";

function ProtectedLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <AppShell />;
}

export function App() {
  return (
    <>
      <AnimatedBackground />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/:id" element={<AccountDetailPage />} />
          <Route path="/balances" element={<BalancesPage />} />
          <Route path="/ads" element={<AdsPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/rates" element={<Navigate to="/market" replace />} />
          <Route path="/automation" element={<AutomationPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/notifications" element={<Navigate to="/activity" replace />} />
          <Route path="/logs" element={<Navigate to="/activity" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
