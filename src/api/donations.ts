import { apiFetch } from './client';

export async function postDonate(amount: number): Promise<{ kncBalance: number; euroBalance: number }> {
  return apiFetch<{ kncBalance: number; euroBalance: number }>('/api/app/finance/donate', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}
