import { Image, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { BASE_URL } from '../../constants/api';

function ClubLogo() {
  const { user } = useAuth();
  if (!user?.clubPic) return null;
  return (
    <View style={{ marginRight: 12 }}>
      <Image
        source={{ uri: `${BASE_URL}${user.clubPic}` }}
        style={{ width: 32, height: 32, borderRadius: 6, resizeMode: 'contain' }}
      />
    </View>
  );
}

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
        headerRight: () => <ClubLogo />,
      }}
    >
      <Stack.Screen
        name="main"
        options={{ title: `KegelNetzwerk — ${user.clubName}` }}
      />
    </Stack>
  );
}
