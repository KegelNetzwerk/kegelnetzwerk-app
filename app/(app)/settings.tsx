import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, LogOut, Trash2, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/hooks/useAuth';
import { uploadPhoto } from '../../src/api/photo';
import { clearResults } from '../../src/storage/resultPackage';
import { clearQueue } from '../../src/storage/syncQueue';
import { BASE_URL } from '../../constants/api';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settings.title'), headerShown: true });
  }, [navigation, t]);

  const { user, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);

  async function handlePhotoUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('settings.permissionMissing'), t('settings.permissionMessage'));
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
      Alert.alert(t('common.success'), t('settings.photoUpdated'));
    } catch {
      Alert.alert(t('common.error'), t('settings.photoError'));
    } finally {
      setUploading(false);
    }
  }

  async function handleClearSession() {
    Alert.alert(t('settings.clearSessionTitle'), t('settings.clearSessionMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await clearResults();
          await clearQueue();
          Alert.alert(t('common.success'), t('settings.clearSessionDone'));
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 gap-4">
        {/* Account */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase tracking-wide"
          >
            {t('settings.account')}
          </Text>
          <View className="px-4 pb-3">
            <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-base text-gray-800">
              {user?.nickname}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-gray-500">
              {user?.clubName}
            </Text>
          </View>

          <TouchableOpacity
            className="px-4 py-3 border-t border-gray-100 flex-row items-center justify-between"
            onPress={handlePhotoUpload}
            disabled={uploading}
          >
            <View className="flex-row items-center gap-3">
              <Camera size={18} color="#374151" />
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-base text-gray-700">
                {uploading ? t('settings.uploading') : t('settings.changePhoto')}
              </Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            className="px-4 py-3 border-t border-gray-100 flex-row items-center justify-between"
            onPress={signOut}
          >
            <View className="flex-row items-center gap-3">
              <LogOut size={18} color="#a91a1a" />
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-base text-accent">
                {t('settings.logout')}
              </Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Session */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase tracking-wide"
          >
            {t('settings.session')}
          </Text>
          <TouchableOpacity
            className="px-4 py-3 flex-row items-center justify-between"
            onPress={handleClearSession}
          >
            <View className="flex-row items-center gap-3">
              <Trash2 size={18} color="#a91a1a" />
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-base text-accent">
                {t('settings.clearSession')}
              </Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase tracking-wide"
          >
            {t('settings.info')}
          </Text>
          <View className="px-4 py-3 border-t border-gray-100">
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-gray-500">
              {t('settings.server')}: {BASE_URL}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
