jest.mock('../api/client', () => ({
  apiFetch: jest.fn(),
}));

import { postDonate } from '../api/donations';
import { apiFetch } from '../api/client';

const mockApiFetch = apiFetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('postDonate', () => {
  it('calls the correct endpoint with POST method and serialized body', async () => {
    mockApiFetch.mockResolvedValue({ kncBalance: 500, euroBalance: -5 });

    await postDonate(5);

    expect(mockApiFetch).toHaveBeenCalledWith('/api/app/finance/donate', {
      method: 'POST',
      body: JSON.stringify({ amount: 5 }),
    });
  });

  it('returns kncBalance and euroBalance from the API response', async () => {
    mockApiFetch.mockResolvedValue({ kncBalance: 1000, euroBalance: -10 });

    const result = await postDonate(10);

    expect(result.kncBalance).toBe(1000);
    expect(result.euroBalance).toBe(-10);
  });

  it('propagates errors thrown by apiFetch', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    await expect(postDonate(5)).rejects.toThrow('Network error');
  });

  it('sends the amount as-is without modification', async () => {
    mockApiFetch.mockResolvedValue({ kncBalance: 250, euroBalance: -2.5 });

    await postDonate(2.5);

    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify({ amount: 2.5 }) }),
    );
  });
});
