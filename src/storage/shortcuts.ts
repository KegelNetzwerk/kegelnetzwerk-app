import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Shortcut {
  gameId: number;
  partId: number;
  label: string;
}

const KEY = 'kn_shortcuts';

export async function getShortcuts(): Promise<Shortcut[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveShortcuts(shortcuts: Shortcut[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(shortcuts));
}
