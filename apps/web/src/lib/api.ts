import { useAuthStore } from "../store/auth.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, clear } = useAuthStore.getState();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    })
      .then(async (res) => {
        if (!res.ok) {
          clear();
          return null;
        }
        const body = (await res.json()) as { accessToken: string; refreshToken: string };
        setSession(body);
        return body.accessToken;
      })
      .catch(() => {
        clear();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const { accessToken, workspace } = useAuthStore.getState();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (workspace?.id) headers.set("X-Workspace-Id", workspace.id);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
  }

  if (!response.ok) {
    let body: { error?: { message?: string; code?: string; details?: unknown } } = {};
    try {
      body = await response.json();
    } catch {
      // non-JSON error body
    }
    throw new ApiError(body.error?.message ?? response.statusText, response.status, body.error?.code, body.error?.details);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as Promise<T>;
}

function withBody(method: string, body?: unknown): RequestInit {
  return body !== undefined ? { method, body: JSON.stringify(body) } : { method };
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, withBody("POST", body)),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, withBody("PATCH", body)),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" })
};
