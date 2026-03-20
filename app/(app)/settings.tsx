import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/hooks/useAuth';
import { uploadPhoto } from '../../src/api/photo';
import { clearResults } from '../../src/storage/resultPackage';
import { clearQueue } from '../../src/storage/syncQueue';
import { BASE_URL } from '../../constants/api';

export default function SettingsScreen() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Einstellungen', headerShown: true });
  }, [navigation]);

  const { user, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);

  async function handlePhotoUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Berechtigung fehlt', 'Bitte erlaube den Zugriff auf die Medienbibliothek.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      await uploadPhoto(result.assets[0].uri);
      Alert.alert('Erfolg', 'Profilbild wurde aktualisiert.');
    } catch {
      Alert.alert('Fehler', 'Foto konnte nicht hochgeladen werden.');
    } finally {
      setUploading(false);
    }
  }

  async function handleClearSession() {
    Alert.alert('Sitzung löschen?', 'Alle lokalen Ergebnisse dieser Sitzung werden gelöscht.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          await clearResults();
          await clearQueue();
          Alert.alert('Erledigt', 'Sitzungsdaten wurden gelöscht.');
        },
      },
    ]);
  }

  async function handleSignOut() {
    await signOut();
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 gap-4">
        {/* Account */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Konto
          </Text>
          <View className="px-4 pb-3">
            <Text className="text-base font-semibold text-gray-800">{user?.nickname}</Text>
            <Text className="text-sm text-gray-500">{user?.clubName}</Text>
          </View>

          <TouchableOpacity
            className="px-4 py-3 border-t border-gray-100 flex-row items-center justify-between"
            onPress={handlePhotoUpload}
            disabled={uploading}
          >
            <Text className="text-base text-gray-700">
              {uploading ? 'Lädt hoch...' : '📷 Profilbild ändern'}
            </Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="px-4 py-3 border-t border-gray-100 flex-row items-center justify-between"
            onPress={handleSignOut}
          >
            <Text className="text-base text-red-500">Abmelden</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        </View>

        {/* Session */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Sitzung
          </Text>
          <TouchableOpacity
            className="px-4 py-3 flex-row items-center justify-between"
            onPress={handleClearSession}
          >
            <Text className="text-base text-red-500">🗑 Sitzungsdaten löschen</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Info
          </Text>
          <View className="px-4 py-3 border-t border-gray-100">
            <Text className="text-sm text-gray-500">Server: {BASE_URL}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
