import { useColorScheme } from 'nativewind';

export function useUIColors() {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  return {
    card: dark ? '#242424' : '#ffffff',
    surface: dark ? '#1a1a1a' : '#f3f4f6',
    subSurface: dark ? '#111111' : '#f9fafb',
    divider: dark ? '#333333' : '#e5e7eb',
    text: dark ? '#f1f5f9' : '#1f2937',
    textSecondary: dark ? '#cbd5e1' : '#374151',
    textMuted: dark ? '#94a3b8' : '#6b7280',
    textFaint: dark ? '#64748b' : '#9ca3af',
    textStrong: dark ? '#f8fafc' : '#111827',
    iconMuted: dark ? '#94a3b8' : '#6b7280',
    cancelBg: dark ? '#2a2a2a' : '#f3f4f6',
    cancelText: dark ? '#cbd5e1' : '#4b5563',
    inputBg: dark ? '#242424' : '#ffffff',
    inputBorder: dark ? '#3a3a3a' : '#d1d5db',
    switchOffTrack: dark ? '#3a3a3a' : '#d1d5db',
    isDark: dark,
  };
}
