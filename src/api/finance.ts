import { apiFetch } from './client';

export interface FinanceSummary {
  balance: number;
  paypal: string | null;
  kncBalance: number;
}

export async function fetchFinanceSummary(): Promise<FinanceSummary> {
  return apiFetch<FinanceSummary>('/api/app/finance');
}
