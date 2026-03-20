import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';

export default function AppLayout() {
  const { user } = useAuth();
  const theme = useTheme();

  if (!user) return <Redirect href="/(auth)/login" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontFamily: 'DMSans_700Bold' },
        headerBackTitleStyle: { fontFamily: 'DMSans_400Regular' },
      }}
    />
  );
}
