import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ResultEntry } from '../models/Result';

const KEY = 'kn_result_package';

export async function getResults(): Promise<ResultEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addResult(entry: ResultEntry) {
  const results = await getResults();
  results.push(entry);
  await AsyncStorage.setItem(KEY, JSON.stringify(results));
}

export async function removeResult(id: string) {
  const results = await getResults();
  await AsyncStorage.setItem(KEY, JSON.stringify(results.filter((r) => r.id !== id)));
}

export async function markSynced(ids: string[]) {
  const results = await getResults();
  const idSet = new Set(ids);
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(results.map((r) => (idSet.has(r.id) ? { ...r, synced: true } : r)))
  );
}

export async function clearResults() {
  await AsyncStorage.removeItem(KEY);
}
