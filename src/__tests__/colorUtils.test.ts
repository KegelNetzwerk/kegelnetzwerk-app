import { hexToRgb, rgbToHsl, hslToHex, contrastRatio, ensureContrast, hexToHsl, isLight } from '../utils/colorUtils';

describe('hexToRgb', () => {
  it('converts a 6-char hex without #', () => {
    expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts a 6-char hex with #', () => {
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('converts a 3-char hex (shorthand)', () => {
    expect(hexToRgb('fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts black', () => {
    expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('converts white', () => {
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts a mid-range hex', () => {
    const { r, g, b } = hexToRgb('3089AC');
    expect(r).toBe(0x30);
    expect(g).toBe(0x89);
    expect(b).toBe(0xac);
  });
});

describe('rgbToHsl', () => {
  it('converts red', () => {
    const { h, s, l } = rgbToHsl(255, 0, 0);
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBeCloseTo(100, 0);
    expect(l).toBeCloseTo(50, 0);
  });

  it('converts white', () => {
    const { s, l } = rgbToHsl(255, 255, 255);
    expect(s).toBeCloseTo(0, 0);
    expect(l).toBeCloseTo(100, 0);
  });

  it('converts black', () => {
    const { s, l } = rgbToHsl(0, 0, 0);
    expect(s).toBeCloseTo(0, 0);
    expect(l).toBeCloseTo(0, 0);
  });

  it('converts green', () => {
    const { h } = rgbToHsl(0, 255, 0);
    expect(h).toBeCloseTo(120, 0);
  });

  it('converts blue', () => {
    const { h } = rgbToHsl(0, 0, 255);
    expect(h).toBeCloseTo(240, 0);
  });

  it('handles achromatic (grey) correctly', () => {
    const { h, s } = rgbToHsl(128, 128, 128);
    expect(h).toBe(0);
    expect(s).toBe(0);
  });
});

describe('hslToHex', () => {
  it('converts red', () => {
    expect(hslToHex(0, 100, 50).toLowerCase()).toBe('#ff0000');
  });

  it('converts white', () => {
    expect(hslToHex(0, 0, 100).toLowerCase()).toBe('#ffffff');
  });

  it('converts black', () => {
    expect(hslToHex(0, 0, 0).toLowerCase()).toBe('#000000');
  });

  it('round-trips with hexToRgb and rgbToHsl', () => {
    const original = 'ff8800';
    const { r, g, b } = hexToRgb(original);
    const { h, s, l } = rgbToHsl(r, g, b);
    const result = hslToHex(h, s, l).replace('#', '').toLowerCase();
    expect(result).toBe(original.toLowerCase());
  });
});

describe('contrastRatio', () => {
  it('black vs white is approximately 21', () => {
    const ratio = contrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('same color has ratio 1', () => {
    expect(contrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 1);
  });

  it('is symmetric', () => {
    const r1 = contrastRatio('#005982', '#ffffff');
    const r2 = contrastRatio('#ffffff', '#005982');
    expect(r1).toBeCloseTo(r2, 5);
  });
});

describe('ensureContrast', () => {
  it('returns the original color if already meets ratio', () => {
    // Black on white already has ratio 21 — well above any threshold
    expect(ensureContrast('#000000', '#ffffff', 4.5, 'lighten')).toBe('#000000');
  });

  it('darkens a light color to meet the ratio against a light background', () => {
    // Very light grey on white won't meet 4.5 — darken it
    const result = ensureContrast('#e0e0e0', '#ffffff', 4.5, 'darken');
    expect(contrastRatio(result, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('lightens a dark color to meet the ratio against a dark background', () => {
    const result = ensureContrast('#111111', '#000000', 4.5, 'lighten');
    expect(contrastRatio(result, '#000000')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('hexToHsl', () => {
  it('converts red hex to HSL', () => {
    const { h, s, l } = hexToHsl('#ff0000');
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBeCloseTo(100, 0);
    expect(l).toBeCloseTo(50, 0);
  });

  it('gives same result as hexToRgb + rgbToHsl', () => {
    const hex = '#3089ac';
    const { r, g, b } = hexToRgb(hex);
    const expected = rgbToHsl(r, g, b);
    const result = hexToHsl(hex);
    expect(result.h).toBeCloseTo(expected.h, 5);
    expect(result.s).toBeCloseTo(expected.s, 5);
    expect(result.l).toBeCloseTo(expected.l, 5);
  });
});

describe('isLight', () => {
  it('returns true for white', () => {
    expect(isLight('#ffffff')).toBe(true);
  });

  it('returns false for black', () => {
    expect(isLight('#000000')).toBe(false);
  });

  it('returns true for a light color (lightness 51%)', () => {
    // hslToHex(0, 0, 51) → slightly above 50% lightness
    const lightGrey = hslToHex(0, 0, 51);
    expect(isLight(lightGrey)).toBe(true);
  });

  it('returns false for a dark color (lightness 49%)', () => {
    const darkGrey = hslToHex(0, 0, 49);
    expect(isLight(darkGrey)).toBe(false);
  });
});
