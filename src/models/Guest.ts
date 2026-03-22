export interface Guest {
  id: string;
  nickname: string;
  firstName?: string;
  lastName?: string;
  picUri?: string; // local URI from device image picker
}
