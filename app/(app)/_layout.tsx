import { useEffect } from 'react';
import { AppState, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, Stack, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { flushQueue } from '../../src/hooks/useSyncQueue';
import { checkAndNotify } from '../../src/notifications/backgroundTask';

function HeaderBackground() {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={[theme.primary, theme.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  const theme = useTheme();
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        flushQueue().catch(() => {});
        checkAndNotify().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.overscrollBehaviorX = 'none';
    }
  }, []);

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerBackground: () => <HeaderBackground />,
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontFamily: 'DMSans_700Bold' },
        headerLeft: ({ canGoBack }) => canGoBack ? (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 12 }}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
        ) : null,
        headerRight: () => null,
      }}
    >
      <Stack.Screen
        name="main"
        options={{ title: `KegelNetzwerk — ${user.clubName}` }}
      />
    </Stack>
  );
}
