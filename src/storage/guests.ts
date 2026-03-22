import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Guest } from '../models/Guest';

const KEY = 'kn_guests';

export async function getGuests(): Promise<Guest[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveGuests(guests: Guest[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(guests));
}

export async function clearGuests(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
