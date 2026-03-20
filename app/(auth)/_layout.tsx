import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';

export default function AuthLayout() {
  const { user } = useAuth();
  if (user) return <Redirect href="/(app)/main" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
