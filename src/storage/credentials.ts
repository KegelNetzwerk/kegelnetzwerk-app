import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { DEFAULT_COLORS, type ClubColors } from '../hooks/useAuth';

const KEYS = {
  TOKEN: 'kn_token',
  CLUB_ID: 'kn_club_id',
  CLUB_NAME: 'kn_club_name',
  CLUB_PIC: 'kn_club_pic',
  NICKNAME: 'kn_nickname',
  PASSWORD: 'kn_password',
  AUTO_LOGIN: 'kn_auto_login',
  COLORS: 'kn_colors',
  CLUB_BG: 'kn_club_bg',
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
  clubPic: string | null;
  nickname: string;
  password: string;
  autoLogin: boolean;
  colors: ClubColors;
  clubBg: number;
}) {
  await Promise.all([
    setItem(KEYS.TOKEN, data.token),
    setItem(KEYS.CLUB_ID, String(data.clubId)),
    setItem(KEYS.CLUB_NAME, data.clubName),
    data.clubPic ? setItem(KEYS.CLUB_PIC, data.clubPic) : deleteItem(KEYS.CLUB_PIC),
    setItem(KEYS.NICKNAME, data.nickname),
    setItem(KEYS.PASSWORD, data.password),
    setItem(KEYS.AUTO_LOGIN, data.autoLogin ? '1' : '0'),
    setItem(KEYS.COLORS, JSON.stringify(data.colors)),
    setItem(KEYS.CLUB_BG, String(data.clubBg)),
  ]);
}

export async function getStoredToken(): Promise<string | null> {
  return getItem(KEYS.TOKEN);
}

export async function getStoredCredentials(): Promise<{
  token: string | null;
  clubId: number | null;
  clubName: string | null;
  clubPic: string | null;
  nickname: string | null;
  password: string | null;
  autoLogin: boolean;
  colors: ClubColors;
  clubBg: number;
}> {
  const [token, clubIdStr, clubName, clubPic, nickname, password, autoLoginStr, colorsStr, clubBgStr] =
    await Promise.all([
      getItem(KEYS.TOKEN),
      getItem(KEYS.CLUB_ID),
      getItem(KEYS.CLUB_NAME),
      getItem(KEYS.CLUB_PIC),
      getItem(KEYS.NICKNAME),
      getItem(KEYS.PASSWORD),
      getItem(KEYS.AUTO_LOGIN),
      getItem(KEYS.COLORS),
      getItem(KEYS.CLUB_BG),
    ]);

  let colors: ClubColors = DEFAULT_COLORS;
  if (colorsStr) {
    try {
      colors = JSON.parse(colorsStr);
    } catch {
      colors = DEFAULT_COLORS;
    }
  }

  return {
    token,
    clubId: clubIdStr ? Number.parseInt(clubIdStr, 10) : null,
    clubName,
    clubPic,
    nickname,
    password,
    autoLogin: autoLoginStr === '1',
    colors,
    clubBg: clubBgStr ? Number.parseInt(clubBgStr, 10) : 0,
  };
}

export async function clearCredentials() {
  await Promise.all(Object.values(KEYS).map((k) => deleteItem(k)));
}
