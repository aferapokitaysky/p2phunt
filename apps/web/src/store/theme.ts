import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  set: (mode: ThemeMode) => void;
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "dark",
      toggle: () => {
        const next = get().mode === "dark" ? "light" : "dark";
        applyTheme(next);
        set({ mode: next });
      },
      set: (mode) => {
        applyTheme(mode);
        set({ mode });
      }
    }),
    {
      name: "p2phunt-theme",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode);
      }
    }
  )
);
