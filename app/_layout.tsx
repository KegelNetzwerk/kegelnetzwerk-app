import 'react-native-get-random-values';
import '../global.css';
import { StyleSheet } from 'react-native';
StyleSheet.setFlag('darkMode', 'class');
import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, type AuthUser } from '../src/hooks/useAuth';
import {
  getStoredCredentials,
  saveCredentials,
  clearCredentials,
} from '../src/storage/credentials';
import { login } from '../src/api/auth';
import {
  requestNotificationPermissions,
  registerPushTokenWithServer,
} from '../src/notifications/setup';
import { registerBackgroundFetch } from '../src/notifications/backgroundTask';
import { setupNotificationHandlers } from '../src/notifications/handlers';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function init() {
      // Try auto-login
      const creds = await getStoredCredentials();
      if (creds.autoLogin && creds.nickname && creds.password && creds.clubName) {
        try {
          const res = await login(creds.clubName, creds.nickname, creds.password);
          await saveCredentials({
            token: res.token,
            clubId: res.clubId,
            clubName: creds.clubName,
            nickname: creds.nickname,
            password: creds.password,
            autoLogin: true,
          });
          setUser({
            token: res.token,
            memberId: res.memberId,
            nickname: res.nickname ?? creds.nickname,
            role: res.role,
            clubId: res.clubId,
            clubName: creds.clubName,
          });
          // Notification setup after login
          const granted = await requestNotificationPermissions();
          if (granted) {
            await registerPushTokenWithServer();
            await registerBackgroundFetch();
          }
        } catch {
          // Auto-login failed — show login screen
        }
      }

      cleanup = setupNotificationHandlers();
      setReady(true);
    }

    init();
    return () => cleanup?.();
  }, []);

  const signIn = useCallback(async (authUser: AuthUser, password: string, autoLogin: boolean) => {
    await saveCredentials({
      token: authUser.token,
      clubId: authUser.clubId,
      clubName: authUser.clubName,
      nickname: authUser.nickname,
      password,
      autoLogin,
    });
    setUser(authUser);
  }, []);

  const signOut = useCallback(async () => {
    await clearCredentials();
    setUser(null);
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, signIn, signOut }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
