import ClubBackground from '../../src/components/ClubBackground';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, LogOut, Trash2, RotateCcw, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/hooks/useAuth';
import { uploadPhoto } from '../../src/api/photo';
import { clearResults } from '../../src/storage/resultPackage';
import { clearQueue } from '../../src/storage/syncQueue';
import { getCachedMembers } from '../../src/storage/cache';
import { getOrCreateSession, resetSession } from '../../src/storage/session';
import { BASE_URL } from '../../constants/api';
import Constants from 'expo-constants';

const AVATAR_SIZE = 72;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settings.title'), headerShown: true });
  }, [navigation, t]);

  const { user, signOut } = useAuth();
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  // picUri: null = no pic, string = absolute URL or local file URI
  const [picUri, setPicUri] = useState<string | null>(null);
  const [sessionGroup, setSessionGroup] = useState<number | null>(null);

  useEffect(() => {
    getCachedMembers().then((members) => {
      const me = members.find((m) => m.id === user?.memberId);
      if (me?.pic) setPicUri(`${BASE_URL}${me.pic}`);
    });
    getOrCreateSession().then(setSessionGroup);
  }, [user?.memberId]);

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
      // Show the new image immediately without waiting for a cache refresh
      setPicUri(result.assets[0].uri);
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

  function handleLogout() {
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  }

  async function handleNewSession() {
    Alert.alert(t('settings.newSessionTitle'), t('settings.newSessionMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          await resetSession();
          const group = await getOrCreateSession();
          setSessionGroup(group);
          Alert.alert(t('common.success'), t('settings.newSessionDone'));
        },
      },
    ]);
  }

  const initial = (user?.nickname ?? '?').charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1 }}>
      <ClubBackground />
      <ScrollView className="flex-1">
      <View className="p-4 gap-4">
        {/* Account */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase tracking-wide"
          >
            {t('settings.account')}
          </Text>

          {/* Avatar + name row */}
          <View className="px-4 pb-4 flex-row items-center gap-4">
            {picUri ? (
              <Image
                source={{ uri: picUri }}
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: AVATAR_SIZE / 2,
                  borderWidth: 2,
                  borderColor: theme.primary,
                }}
              />
            ) : (
              <View
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: AVATAR_SIZE / 2,
                  backgroundColor: theme.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 28, color: '#fff' }}>
                  {initial}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-base text-gray-800">
                {user?.nickname}
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-gray-500">
                {user?.clubName}
              </Text>
            </View>
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
            onPress={handleLogout}
          >
            <View className="flex-row items-center gap-3">
              <LogOut size={18} color={theme.accent} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: theme.accent }} className="text-base">
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
            onPress={handleNewSession}
          >
            <View className="flex-row items-center gap-3">
              <RotateCcw size={18} color={theme.primary} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: theme.primary }} className="text-base">
                {t('settings.newSession')}
              </Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-3 border-t border-gray-100 flex-row items-center justify-between"
            onPress={handleClearSession}
          >
            <View className="flex-row items-center gap-3">
              <Trash2 size={18} color={theme.accent} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: theme.accent }} className="text-base">
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
          <View className="px-4 py-3 border-t border-gray-100 gap-1">
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-gray-500">
              {t('settings.server')}: {BASE_URL}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-gray-500">
              {t('settings.version')}: {Constants.expoConfig?.version ?? '—'}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-gray-500">
              {t('settings.sessionId')}: {sessionGroup ?? '—'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </View>
  );
}
