import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
}

export interface SessionWorkspace {
  id: string;
  name: string;
  mode: "manual" | "auto";
  emergencyStop: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  workspace: SessionWorkspace | null;
  setSession: (data: { accessToken: string; refreshToken: string; user?: SessionUser | undefined; workspace?: SessionWorkspace | undefined }) => void;
  setWorkspace: (workspace: SessionWorkspace) => void;
  patchWorkspace: (patch: Partial<SessionWorkspace>) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      workspace: null,
      setSession: ({ accessToken, refreshToken, user, workspace }) =>
        set((state) => ({
          accessToken,
          refreshToken,
          user: user ?? state.user,
          workspace: workspace ?? state.workspace
        })),
      setWorkspace: (workspace) => set({ workspace }),
      patchWorkspace: (patch) => set((state) => (state.workspace ? { workspace: { ...state.workspace, ...patch } } : state)),
      clear: () => set({ accessToken: null, refreshToken: null, user: null, workspace: null })
    }),
    { name: "p2phunt-auth" }
  )
);
