import 'react-native-get-random-values';
import '../global.css';
import '../src/i18n';
import { useEffect, useState, useCallback } from 'react';
import { Appearance, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import { getDisplaySettings } from '../src/storage/displaySettings';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { AuthContext, DEFAULT_COLORS, type AuthUser } from '../src/hooks/useAuth';
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

function colorsFromFarbe(farbe1?: string, farbe2?: string, farbe3?: string) {
  return {
    primary: farbe1 ? `#${farbe1}` : DEFAULT_COLORS.primary,
    secondary: farbe2 ? `#${farbe2}` : DEFAULT_COLORS.secondary,
    accent: farbe3 ? `#${farbe3}` : DEFAULT_COLORS.accent,
  };
}

function normalizePic(pic: string | null | undefined): string | null {
  return pic && pic !== 'none' ? pic : null;
}

function applyBodyBg(scheme: 'light' | 'dark' | 'system') {
  if (typeof document === 'undefined') return;
  if (scheme === 'dark') {
    document.body.style.backgroundColor = '#111827';
  } else if (scheme === 'light') {
    document.body.style.backgroundColor = '#ffffff';
  } else {
    document.body.style.backgroundColor = '';
  }
}

export default function RootLayout() {
  const { setColorScheme, colorScheme } = useColorScheme();
  useEffect(() => {
    getDisplaySettings().then((s) => {
      setColorScheme(s.colorSchemeMode);
      if (Platform.OS !== 'web') {
        Appearance.setColorScheme(s.colorSchemeMode === 'system' ? null : s.colorSchemeMode);
      }
      applyBodyBg(s.colorSchemeMode);
    });
  }, []);

  useEffect(() => {
    if (colorScheme) applyBodyBg(colorScheme as any);
  }, [colorScheme]);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function init() {
      const creds = await getStoredCredentials();
      if (creds.autoLogin && creds.nickname && creds.password && creds.clubName) {
        try {
          const res = await login(creds.clubName, creds.nickname, creds.password);
          const colors = colorsFromFarbe(res.farbe1, res.farbe2, res.farbe3);
          await saveCredentials({
            token: res.token,
            clubId: res.clubId,
            clubName: creds.clubName,
            clubPic: normalizePic(creds.clubPic),
            nickname: creds.nickname,
            password: creds.password,
            autoLogin: true,
            colors,
            clubBg: res.bg1 ?? 0,
          });
          setUser({
            token: res.token,
            memberId: res.memberId,
            nickname: res.nickname ?? creds.nickname,
            role: res.role,
            clubId: res.clubId,
            clubName: creds.clubName,
            clubPic: normalizePic(creds.clubPic),
            colors,
            clubBg: res.bg1 ?? 0,
          });
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
      clubPic: authUser.clubPic,
      nickname: authUser.nickname,
      password,
      autoLogin,
      colors: authUser.colors,
      clubBg: authUser.clubBg ?? 0,
    });
    setUser(authUser);
  }, []);

  const signOut = useCallback(async () => {
    await clearCredentials();
    setUser(null);
  }, []);

  if (!ready || !fontsLoaded) return null;

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
