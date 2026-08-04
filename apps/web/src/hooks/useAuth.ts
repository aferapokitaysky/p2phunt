import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { resetWorkspaceJoin } from "../lib/socket.js";
import { useAuthStore } from "../store/auth.js";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface MeResponse {
  id: string;
  email: string;
  displayName: string | null;
  memberships: { role: string; workspace: { id: string; name: string; mode: "manual" | "auto"; emergencyStop: boolean } }[];
}

async function hydrateSession(auth: AuthResponse) {
  useAuthStore.getState().setSession(auth);
  const me = await api.get<MeResponse>("/auth/me");
  const membership = me.memberships[0];
  useAuthStore.getState().setSession({
    ...auth,
    user: { id: me.id, email: me.email, displayName: me.displayName },
    workspace: membership?.workspace
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const auth = await api.post<AuthResponse>("/auth/login", input);
      await hydrateSession(auth);
    }
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string; displayName?: string | undefined; workspaceName?: string | undefined }) => {
      const auth = await api.post<AuthResponse>("/auth/register", input);
      await hydrateSession(auth);
    }
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken }).catch(() => undefined);
      }
      useAuthStore.getState().clear();
      resetWorkspaceJoin();
    }
  });
}

export function useMe(enabled: boolean) {
  return useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/auth/me"), enabled, retry: false });
}
