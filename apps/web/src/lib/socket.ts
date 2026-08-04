import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth.js";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:4000";

let socket: Socket | null = null;
let joinedWorkspaceId: string | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  return socket;
}

export function joinWorkspaceRoom(): void {
  const { accessToken, workspace } = useAuthStore.getState();
  if (!accessToken || !workspace) return;
  if (joinedWorkspaceId === workspace.id) return;

  const s = getSocket();
  const doJoin = () => {
    s.emit("workspace.join", { workspaceId: workspace.id, accessToken }, (ack: { ok: boolean }) => {
      if (ack?.ok) joinedWorkspaceId = workspace.id;
    });
  };

  if (s.connected) doJoin();
  else s.once("connect", doJoin);
}

export function resetWorkspaceJoin(): void {
  joinedWorkspaceId = null;
}
