import { apiFetch } from './client';
import type { SymbolKey } from '../utils/slotLogic';

export interface SpinRequest {
  lines: number;
  bet: number;
  freeSpins?: boolean;
  expandingSymbol?: SymbolKey;
}

export interface SpinResponse {
  reels: SymbolKey[][];
  originalReels?: SymbolKey[][];
  win: number;
  kncBalance: number;
  featureTriggered?: boolean;
  expansionApplied?: boolean;
  expandingSymbol?: SymbolKey;
}

export async function postSpin(request: SpinRequest): Promise<SpinResponse> {
  return apiFetch<SpinResponse>('/api/app/slot/spin', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function postDonSettle(originalWin: number, finalWin: number): Promise<{ kncBalance: number }> {
  return apiFetch<{ kncBalance: number }>('/api/app/slot/don-settle', {
    method: 'POST',
    body: JSON.stringify({ originalWin, finalWin }),
  });
}
