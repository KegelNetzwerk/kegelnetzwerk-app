import * as SecureStore from 'expo-secure-store';

const KEYS = {
  TOKEN: 'kn_token',
  CLUB_ID: 'kn_club_id',
  CLUB_NAME: 'kn_club_name',
  NICKNAME: 'kn_nickname',
  PASSWORD: 'kn_password',
  AUTO_LOGIN: 'kn_auto_login',
} as const;

export async function saveCredentials(data: {
  token: string;
  clubId: number;
  clubName: string;
  nickname: string;
  password: string;
  autoLogin: boolean;
}) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.TOKEN, data.token),
    SecureStore.setItemAsync(KEYS.CLUB_ID, String(data.clubId)),
    SecureStore.setItemAsync(KEYS.CLUB_NAME, data.clubName),
    SecureStore.setItemAsync(KEYS.NICKNAME, data.nickname),
    SecureStore.setItemAsync(KEYS.PASSWORD, data.password),
    SecureStore.setItemAsync(KEYS.AUTO_LOGIN, data.autoLogin ? '1' : '0'),
  ]);
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.TOKEN);
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
    SecureStore.getItemAsync(KEYS.TOKEN),
    SecureStore.getItemAsync(KEYS.CLUB_ID),
    SecureStore.getItemAsync(KEYS.CLUB_NAME),
    SecureStore.getItemAsync(KEYS.NICKNAME),
    SecureStore.getItemAsync(KEYS.PASSWORD),
    SecureStore.getItemAsync(KEYS.AUTO_LOGIN),
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
  await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)));
}
