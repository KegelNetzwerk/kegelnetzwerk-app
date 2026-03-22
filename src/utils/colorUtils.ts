/** Converts a hex color string to RGB components (0–255). */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Converts RGB (0–255) to HSL (h: 0–360, s/l: 0–100). */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l: l * 100 };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  return { h: ((h * 60) + 360) % 360, s: s * 100, l: l * 100 };
}

/** Converts HSL (h: 0–360, s/l: 0–100) to a hex color string. */
export function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** WCAG relative luminance (0–1) for an RGB triplet. */
function luminance(r: number, g: number, b: number): number {
  const lin = (v: number) => {
    const n = v / 255;
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio (1–21) between two hex colors. */
export function contrastRatio(hex1: string, hex2: string): number {
  const { r: r1, g: g1, b: b1 } = hexToRgb(hex1);
  const { r: r2, g: g2, b: b2 } = hexToRgb(hex2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns `color` unchanged if it already meets `minRatio` against `bgHex`.
 * Otherwise shifts HSL lightness in `direction` by 1 % per step until the
 * ratio is reached or the lightness limit (0 / 100) is hit.
 */
export function ensureContrast(
  color: string,
  bgHex: string,
  minRatio: number,
  direction: 'lighten' | 'darken',
): string {
  if (contrastRatio(color, bgHex) >= minRatio) return color;
  const { r, g, b } = hexToRgb(color);
  let { h, s, l } = rgbToHsl(r, g, b);
  const step = direction === 'lighten' ? 1 : -1;
  while (l >= 0 && l <= 100) {
    l = Math.min(100, Math.max(0, l + step));
    const adjusted = hslToHex(h, s, l);
    if (contrastRatio(adjusted, bgHex) >= minRatio) return adjusted;
  }
  return hslToHex(h, s, direction === 'lighten' ? 100 : 0);
}
