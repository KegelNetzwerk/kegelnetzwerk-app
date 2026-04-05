import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearGuests } from './guests';

const KEY = 'kn_session';
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionData {
  group: number;        // unix timestamp in seconds — stored as sessionGroup in DB
  lastResultAt: number; // unix timestamp in ms
}

async function load(): Promise<SessionData | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

async function save(data: SessionData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

/** Returns the current session group (int). Creates a new one if none exists or last result was >24 h ago. */
export async function getOrCreateSession(): Promise<number> {
  const now = Date.now();
  const session = await load();
  if (session && now - session.lastResultAt < SESSION_TIMEOUT_MS) {
    return session.group;
  }
  const group = Math.floor(now / 1000);
  await Promise.all([
    save({ group, lastResultAt: now }),
    clearGuests(),
  ]);
  return group;
}

/** Returns the current session group, or null if no session has been started. */
export async function getCurrentSessionGroup(): Promise<number | null> {
  const session = await load();
  if (!session) return null;
  const expired = Date.now() - session.lastResultAt >= SESSION_TIMEOUT_MS;
  return expired ? null : session.group;
}

/** Updates the last-result timestamp so the 24 h window stays open. */
export async function touchSession(): Promise<void> {
  const session = await load();
  if (session) {
    await save({ ...session, lastResultAt: Date.now() });
  }
}

/** Forces a new session regardless of the last activity time. */
export async function resetSession(): Promise<void> {
  const now = Date.now();
  await Promise.all([
    save({ group: Math.floor(now / 1000), lastResultAt: now }),
    clearGuests(),
  ]);
}
