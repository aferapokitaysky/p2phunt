import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getSocket, joinWorkspaceRoom } from "../lib/socket.js";
import { useAuthStore } from "../store/auth.js";

const INVALIDATIONS: Record<string, string[][]> = {
  "account.created": [["accounts"], ["dashboard"]],
  "account.sync_started": [["accounts"], ["sync-jobs"]],
  "account.sync_finished": [["accounts"], ["sync-jobs"], ["dashboard"], ["deals"], ["balances"], ["ads"], ["logs"]],
  "account.sync_failed": [["accounts"], ["sync-jobs"], ["dashboard"], ["notifications"], ["logs"]],
  "account.status_changed": [["accounts"], ["dashboard"], ["notifications"]],
  "deal.created": [["deals"], ["dashboard"]],
  "deal.updated": [["deals"], ["dashboard"]],
  "balance.updated": [["balances"], ["dashboard"]],
  "rate.updated": [["rates"]],
  "ad.updated": [["ads"], ["dashboard"]],
  "rule.executed": [["automation", "executions"], ["notifications"], ["dashboard"]],
  "notification.created": [["notifications"], ["dashboard"]],
  "connector.command_updated": [["commands"], ["ads"]],
  "connector.command_failed": [["commands"], ["notifications"]]
};

export function useLiveEvents() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const workspaceId = useAuthStore((s) => s.workspace?.id);

  useEffect(() => {
    if (!accessToken || !workspaceId) return;

    joinWorkspaceRoom();
    const socket = getSocket();

    const handler = (eventName: string) => {
      const keys = INVALIDATIONS[eventName];
      if (!keys) return;
      for (const key of keys) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    };

    socket.onAny(handler);
    return () => {
      socket.offAny(handler);
    };
  }, [accessToken, workspaceId, queryClient]);
}
