import { createContext, useContext } from 'react';

export interface AuthUser {
  token: string;
  memberId: number;
  nickname: string;
  role: string;
  clubId: number;
  clubName: string;
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
