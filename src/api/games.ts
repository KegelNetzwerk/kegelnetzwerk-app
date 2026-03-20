import { apiFetch } from './client';
import type { GameOrPenalty } from '../models/GameOrPenalty';

export async function fetchGames(): Promise<GameOrPenalty[]> {
  return apiFetch<GameOrPenalty[]>('/api/games');
}
