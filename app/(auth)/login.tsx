'use client';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import { fetchClubs, login, type Club } from '../../src/api/auth';
import { useAuth } from '../../src/hooks/useAuth';
import {
  requestNotificationPermissions,
  registerPushTokenWithServer,
} from '../../src/notifications/setup';
import { registerBackgroundFetch } from '../../src/notifications/backgroundTask';

export default function LoginScreen() {
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
      .catch(() => setError('Clubs konnten nicht geladen werden'));
  }, []);

  async function handleLogin() {
    if (!selectedClub) {
      setError('Bitte einen Verein auswählen');
      return;
    }
    if (!nickname.trim() || !password) {
      setError('Benutzername und Passwort erforderlich');
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

      // Notification permission + setup
      const granted = await requestNotificationPermissions();
      if (granted) {
        await registerPushTokenWithServer();
        await registerBackgroundFetch();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6 pt-16">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-primary mt-4">KegelNetzwerk</Text>
        <Text className="text-gray-500 mt-1">Vereinsverwaltung</Text>
      </View>

      {/* Club picker */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Verein</Text>
        <TouchableOpacity
          className="border border-gray-300 rounded-lg p-3 flex-row items-center justify-between"
          onPress={() => setShowClubPicker(!showClubPicker)}
        >
          <Text className={selectedClub ? 'text-gray-900' : 'text-gray-400'}>
            {selectedClub ? selectedClub.name : 'Verein auswählen...'}
          </Text>
          <Text className="text-gray-400">▼</Text>
        </TouchableOpacity>
        {showClubPicker && (
          <View className="border border-gray-300 rounded-lg mt-1 bg-white shadow-sm">
            {clubs.map((club) => (
              <TouchableOpacity
                key={club.id}
                className="p-3 border-b border-gray-100 last:border-0"
                onPress={() => {
                  setSelectedClub(club);
                  setShowClubPicker(false);
                }}
              >
                <Text className="text-gray-900">{club.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Nickname */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Spitzname</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-gray-900"
          value={nickname}
          onChangeText={setNickname}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Dein Spitzname"
        />
      </View>

      {/* Password */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Passwort</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-gray-900"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
      </View>

      {/* Auto-login */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-sm text-gray-700">Automatisch einloggen</Text>
        <Switch value={autoLogin} onValueChange={setAutoLogin} trackColor={{ true: '#005982' }} />
      </View>

      {error ? (
        <Text className="text-red-500 text-sm mb-4 text-center">{error}</Text>
      ) : null}

      <TouchableOpacity
        className="bg-primary rounded-lg p-4 items-center"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">Anmelden</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
