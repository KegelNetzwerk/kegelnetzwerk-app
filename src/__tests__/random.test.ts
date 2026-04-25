import { secureRandom } from '../utils/random';

describe('secureRandom', () => {
  it('returns a number in [0, 1)', () => {
    const v = secureRandom();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  it('returns different values on successive calls', () => {
    const values = Array.from({ length: 20 }, () => secureRandom());
    const unique = new Set(values);
    expect(unique.size).toBeGreaterThan(1);
  });
});
