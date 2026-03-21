import { createContext, useContext } from 'react';

export interface ClubColors {
  primary: string;   // e.g. "#005982"
  secondary: string; // e.g. "#3089ac"
  accent: string;    // e.g. "#a91a1a"
}

export const DEFAULT_COLORS: ClubColors = {
  primary: '#005982',
  secondary: '#3089ac',
  accent: '#a91a1a',
};

export interface AuthUser {
  token: string;
  memberId: number;
  nickname: string;
  role: string;
  clubId: number;
  clubName: string;
  clubPic: string | null;
  colors: ClubColors;
  clubBg: number; // 0 = fullbg.jpg, 1 = fullbg_alt.jpg, 2 = fullbg_neutral.jpg
}

export interface AuthContextValue {
  user: AuthUser | null;
  signIn: (user: AuthUser, password: string, autoLogin: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
