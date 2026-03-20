import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Member } from '../models/Member';
import type { GameOrPenalty } from '../models/GameOrPenalty';

const KEYS = {
  MEMBERS: 'kn_members',
  GAMES: 'kn_games',
} as const;

export async function cacheMembers(members: Member[]) {
  await AsyncStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
}

export async function getCachedMembers(): Promise<Member[]> {
  const raw = await AsyncStorage.getItem(KEYS.MEMBERS);
  return raw ? JSON.parse(raw) : [];
}

export async function cacheGames(games: GameOrPenalty[]) {
  await AsyncStorage.setItem(KEYS.GAMES, JSON.stringify(games));
}

export async function getCachedGames(): Promise<GameOrPenalty[]> {
  const raw = await AsyncStorage.getItem(KEYS.GAMES);
  return raw ? JSON.parse(raw) : [];
}
