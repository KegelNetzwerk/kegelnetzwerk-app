import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationState {
  lastChecked: string | null; // ISO timestamp
  enabled: {
    events: boolean;
    news: boolean;
    votes: boolean;
  };
  recentLog: NotificationLogEntry[];
}

export interface NotificationLogEntry {
  id: string;
  type: 'event' | 'news' | 'vote';
  title: string;
  body: string;
  timestamp: string; // ISO
  targetId?: number;
}

const KEY = 'kn_notification_state';

const DEFAULT: NotificationState = {
  lastChecked: null,
  enabled: { events: true, news: true, votes: true },
  recentLog: [],
};

export async function getNotificationState(): Promise<NotificationState> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
}

export async function saveNotificationState(state: NotificationState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function updateLastChecked(iso: string) {
  const state = await getNotificationState();
  await saveNotificationState({ ...state, lastChecked: iso });
}

export async function setNotificationEnabled(type: keyof NotificationState['enabled'], enabled: boolean) {
  const state = await getNotificationState();
  await saveNotificationState({ ...state, enabled: { ...state.enabled, [type]: enabled } });
}

export async function appendNotificationLog(entry: NotificationLogEntry) {
  const state = await getNotificationState();
  const recentLog = [entry, ...state.recentLog].slice(0, 50); // keep last 50
  await saveNotificationState({ ...state, recentLog });
}
