import { apiFetch } from './client';
import type { ResultEntry } from '../models/Result';

export async function uploadResults(entries: ResultEntry[]): Promise<void> {
  await apiFetch('/api/app/upload-results', {
    method: 'POST',
    body: JSON.stringify({ results: entries }),
  });
}
