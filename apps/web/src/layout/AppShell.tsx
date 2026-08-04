import { Outlet } from "react-router-dom";
import { useLiveEvents } from "../hooks/useLiveEvents.js";
import { Sidebar } from "./Sidebar.js";
import { Topbar } from "./Topbar.js";

export function AppShell() {
  useLiveEvents();

  return (
    <div className="flex h-screen gap-4 p-4">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Topbar />
        <main className="flex-1 overflow-y-auto rounded-3xl px-1 pb-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
