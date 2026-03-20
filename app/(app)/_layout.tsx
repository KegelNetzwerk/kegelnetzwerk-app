import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';

export default function AppLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/(auth)/login" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#005982' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontFamily: 'DMSans_700Bold' },
        headerBackTitleStyle: { fontFamily: 'DMSans_400Regular' },
      }}
    />
  );
}
