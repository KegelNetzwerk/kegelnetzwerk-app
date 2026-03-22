import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Member } from '../models/Member';

const KEY = 'kn_display_settings';

export type MemberDisplayMode = 'nickname' | 'firstname' | 'fullname';
export type ColorSchemeMode = 'system' | 'light' | 'dark';

export interface DisplaySettings {
  memberDisplayMode: MemberDisplayMode;
  colorSchemeMode: ColorSchemeMode;
}

const DEFAULT: DisplaySettings = { memberDisplayMode: 'nickname', colorSchemeMode: 'system' };

export async function getDisplaySettings(): Promise<DisplaySettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULT;
  try {
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export async function saveDisplaySettings(settings: DisplaySettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}

export function getMemberDisplayName(member: Member, mode: MemberDisplayMode): string {
  if (mode === 'firstname') return member.firstName || member.nickname;
  if (mode === 'fullname') {
    const full = [member.firstName, member.lastName].filter(Boolean).join(' ');
    return full || member.nickname;
  }
  return member.nickname;
}
