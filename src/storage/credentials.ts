import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  TOKEN: 'kn_token',
  CLUB_ID: 'kn_club_id',
  CLUB_NAME: 'kn_club_name',
  NICKNAME: 'kn_nickname',
  PASSWORD: 'kn_password',
  AUTO_LOGIN: 'kn_auto_login',
} as const;

// expo-secure-store is native-only; fall back to localStorage on web
async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveCredentials(data: {
  token: string;
  clubId: number;
  clubName: string;
  nickname: string;
  password: string;
  autoLogin: boolean;
}) {
  await Promise.all([
    setItem(KEYS.TOKEN, data.token),
    setItem(KEYS.CLUB_ID, String(data.clubId)),
    setItem(KEYS.CLUB_NAME, data.clubName),
    setItem(KEYS.NICKNAME, data.nickname),
    setItem(KEYS.PASSWORD, data.password),
    setItem(KEYS.AUTO_LOGIN, data.autoLogin ? '1' : '0'),
  ]);
}

export async function getStoredToken(): Promise<string | null> {
  return getItem(KEYS.TOKEN);
}

export async function getStoredCredentials(): Promise<{
  token: string | null;
  clubId: number | null;
  clubName: string | null;
  nickname: string | null;
  password: string | null;
  autoLogin: boolean;
}> {
  const [token, clubIdStr, clubName, nickname, password, autoLoginStr] = await Promise.all([
    getItem(KEYS.TOKEN),
    getItem(KEYS.CLUB_ID),
    getItem(KEYS.CLUB_NAME),
    getItem(KEYS.NICKNAME),
    getItem(KEYS.PASSWORD),
    getItem(KEYS.AUTO_LOGIN),
  ]);
  return {
    token,
    clubId: clubIdStr ? parseInt(clubIdStr, 10) : null,
    clubName,
    nickname,
    password,
    autoLogin: autoLoginStr === '1',
  };
}

export async function clearCredentials() {
  await Promise.all(Object.values(KEYS).map((k) => deleteItem(k)));
}
