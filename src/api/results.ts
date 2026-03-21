import { apiFetch } from './client';
import type { ResultEntry } from '../models/Result';

interface UploadEntry {
  memberId: number;
  partId: number;
  gopId: number;
  value: number;
  date: string;
  sessionGroup: number;
}

export async function uploadResults(entries: ResultEntry[]): Promise<void> {
  // Guests (memberId === null) cannot be stored server-side yet — skip them
  const uploadable: UploadEntry[] = entries
    .filter((e) => e.memberId !== null)
    .map((e) => ({
      memberId: e.memberId as number,
      partId: e.partId,
      gopId: e.gameId,
      value: e.value,
      date: e.timestamp,
      sessionGroup: e.sessionGroup,
    }));

  if (uploadable.length === 0) return;

  await apiFetch('/api/app/upload-results', {
    method: 'POST',
    body: JSON.stringify(uploadable),
  });
}
