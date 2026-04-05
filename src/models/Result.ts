export interface ResultEntry {
  id: string;              // local UUID
  memberId: number | null; // null = guest result
  guestLocalId: string | null; // local guest UUID — used to resolve serverId at upload time
  guestName: string | null;    // display name (kept for local log display)
  gameId: number;
  partId: number;
  value: number;
  timestamp: string;       // ISO string
  synced: boolean;
  sessionGroup: number;    // unix timestamp (seconds) identifying the bowling session
}
