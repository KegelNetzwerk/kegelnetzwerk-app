import { apiFetch } from './client';

export interface ActivityResponse {
  newNewsCount: number;
  newVotesCount: number;
  latestNewsTitle: string | null;
  latestNewsId: number | null;
  latestVoteTitle: string | null;
  latestVoteId: number | null;
  newPayoffCount: number;
}

export async function fetchActivity(since: string): Promise<ActivityResponse> {
  return apiFetch<ActivityResponse>(`/api/app/activity?since=${encodeURIComponent(since)}`);
}
