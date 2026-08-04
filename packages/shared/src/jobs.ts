/** BullMQ job payload contracts shared between the API (producer) and worker (consumer). */
export interface SyncAccountJobData {
  workspaceId: string;
  accountId: string;
  syncJobId: string;
}

export interface ExecuteCommandJobData {
  commandId: string;
}

export const CONNECTOR_QUEUE_NAME = "connector";
export const SYNC_ACCOUNT_JOB_NAME = "sync-account";
export const EXECUTE_COMMAND_JOB_NAME = "execute-command";
