import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ResultEntry } from '../models/Result';

const KEY = 'kn_sync_queue';

export async function getQueue(): Promise<ResultEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function enqueue(entries: ResultEntry[]) {
  const queue = await getQueue();
  const ids = new Set(queue.map((e) => e.id));
  const toAdd = entries.filter((e) => !ids.has(e.id));
  if (toAdd.length === 0) return;
  await AsyncStorage.setItem(KEY, JSON.stringify([...queue, ...toAdd]));
}

export async function dequeue(ids: string[]) {
  const queue = await getQueue();
  const idSet = new Set(ids);
  await AsyncStorage.setItem(KEY, JSON.stringify(queue.filter((e) => !idSet.has(e.id))));
}

export async function clearQueue() {
  await AsyncStorage.removeItem(KEY);
}
