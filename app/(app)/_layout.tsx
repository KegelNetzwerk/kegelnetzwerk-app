import { Image, Text, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { BASE_URL } from '../../constants/api';

function ClubLogo() {
  const { user } = useAuth();
  const theme = useTheme();
  if (!user) return null;
  return (
    <View style={{
      marginRight: 12,
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      {user.clubPic ? (
        <Image
          source={{ uri: `${BASE_URL}${user.clubPic}` }}
          style={{ width: 36, height: 36, resizeMode: 'contain' }}
        />
      ) : (
        <Text style={{ color: '#fff', fontFamily: 'DMSans_700Bold', fontSize: 16 }}>
          {user.clubName.charAt(0).toUpperCase()}
        </Text>
      )}
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
