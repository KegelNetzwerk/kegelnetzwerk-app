import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'kn_working_settings';

export interface PinnedPart {
  gameId: number;
  partId: number;
}

export interface WorkingSettings {
  hiddenGameIds: number[];
  hiddenMemberIds: number[];
  pinnedParts: PinnedPart[];
}

const DEFAULT: WorkingSettings = { hiddenGameIds: [], hiddenMemberIds: [], pinnedParts: [] };

export async function getWorkingSettings(): Promise<WorkingSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULT;
  try {
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export async function saveWorkingSettings(settings: WorkingSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
