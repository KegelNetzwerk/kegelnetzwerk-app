export interface Guest {
  id: string;        // local UUID
  serverId?: number; // server-assigned ID after sync via POST /api/app/guests
  nickname: string;
  firstName?: string;
  lastName?: string;
  picUri?: string; // local URI from device image picker
}
