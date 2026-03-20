import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { fetchClubs, login, type Club } from '../../src/api/auth';
import { useAuth } from '../../src/hooks/useAuth';
import {
  requestNotificationPermissions,
  registerPushTokenWithServer,
} from '../../src/notifications/setup';
import { registerBackgroundFetch } from '../../src/notifications/backgroundTask';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showClubPicker, setShowClubPicker] = useState(false);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClubs()
      .then((data) => {
        setClubs(data);
        if (data.length === 1) setSelectedClub(data[0]);
      })
      .catch(() => setError(t('auth.login.error.clubsNotLoaded')));
  }, []);

  async function handleLogin() {
    if (!selectedClub) {
      setError(t('auth.login.error.selectClub'));
      return;
    }
    if (!nickname.trim() || !password) {
      setError(t('auth.login.error.requiredFields'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(selectedClub.name, nickname.trim(), password);
      const authUser = {
        token: res.token,
        memberId: res.memberId,
        nickname: res.nickname ?? nickname.trim(),
        role: res.role,
        clubId: res.clubId,
        clubName: selectedClub.name,
      };
      await signIn(authUser, password, autoLogin);

      const granted = await requestNotificationPermissions();
      if (granted) {
        await registerPushTokenWithServer();
        await registerBackgroundFetch();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('auth.login.error.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="flex-grow">
      {/* Header gradient */}
      <LinearGradient
        colors={['#005982', '#3089ac']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingTop: 64, paddingBottom: 40, alignItems: 'center' }}
      >
        <Text
          style={{ fontFamily: 'DMSans_700Bold', fontSize: 28, color: '#fff', letterSpacing: 0.5 }}
        >
          KegelNetzwerk
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          {t('auth.login.subtitle')}
        </Text>
      </LinearGradient>

      <View className="p-6 flex-1">
        {/* Club picker */}
        <View className="mb-4">
          <Text
            style={{ fontFamily: 'DMSans_500Medium' }}
            className="text-sm text-gray-700 mb-1"
          >
            {t('auth.login.clubLabel')}
          </Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg p-3 flex-row items-center justify-between bg-white"
            onPress={() => setShowClubPicker(!showClubPicker)}
          >
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className={selectedClub ? 'text-gray-900' : 'text-gray-400'}
            >
              {selectedClub ? selectedClub.name : t('auth.login.clubPlaceholder')}
            </Text>
            <Text className="text-gray-400">▼</Text>
          </TouchableOpacity>
          {showClubPicker && (
            <View className="border border-gray-300 rounded-lg mt-1 bg-white shadow-sm">
              {clubs.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  className="p-3 border-b border-gray-100"
                  onPress={() => {
                    setSelectedClub(club);
                    setShowClubPicker(false);
                  }}
                >
                  <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-gray-900">
                    {club.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Nickname */}
        <View className="mb-4">
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-sm text-gray-700 mb-1">
            {t('auth.login.nickname')}
          </Text>
          <TextInput
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="border border-gray-300 rounded-lg p-3 text-gray-900 bg-white"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t('auth.login.nicknamePlaceholder')}
          />
        </View>

        {/* Password */}
        <View className="mb-4">
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-sm text-gray-700 mb-1">
            {t('auth.login.password')}
          </Text>
          <TextInput
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="border border-gray-300 rounded-lg p-3 text-gray-900 bg-white"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={t('auth.login.passwordPlaceholder')}
          />
        </View>

        {/* Auto-login */}
        <View className="flex-row items-center justify-between mb-6">
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-gray-700">
            {t('auth.login.autoLogin')}
          </Text>
          <Switch value={autoLogin} onValueChange={setAutoLogin} trackColor={{ true: '#005982' }} />
        </View>

        {error ? (
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-accent text-sm mb-4 text-center"
          >
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          className="bg-primary rounded-lg p-4 items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-white text-base">
              {t('auth.login.submit')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
