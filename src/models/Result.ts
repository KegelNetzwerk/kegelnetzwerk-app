export interface ResultEntry {
  id: string;           // local UUID
  memberId: number | null; // null = guest
  guestName: string | null;
  gameId: number;
  partId: number;
  value: number;
  timestamp: string;    // ISO string
  synced: boolean;
  sessionGroup: number; // unix timestamp (seconds) identifying the bowling session
}
