import { useTheme } from './useTheme';
import { useUIColors } from './useUIColors';
import { ensureContrast } from '../utils/colorUtils';

// Background references used to check readability (card surface in each mode).
const BG_LIGHT = '#ffffff';
const BG_DARK = '#242424';

const MIN_CONTRAST = 4.5; // WCAG AA

/**
 * Combined color hook. Spreads all UIColors and adds:
 * - theme: club-specific primary/secondary/accent
 * - primaryFg: club primary color, lightened/darkened if needed for readability
 * - accentFg: club accent color, lightened/darkened if needed for readability
 */
export function useColors() {
  const theme = useTheme();
  const ui = useUIColors();
  const bg = ui.isDark ? BG_DARK : BG_LIGHT;
  const direction = ui.isDark ? 'lighten' : 'darken';
  return {
    ...ui,
    theme,
    primaryFg: ensureContrast(theme.primary, bg, MIN_CONTRAST, direction),
    accentFg: ensureContrast(theme.accent, bg, MIN_CONTRAST, direction),
  };
}
