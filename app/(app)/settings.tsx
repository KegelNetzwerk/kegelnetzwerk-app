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
import { Camera, LogOut, Trash2, RotateCcw, ChevronRight, Check, Sun, Moon, Smartphone } from 'lucide-react-native';
import { useColors } from '../../src/hooks/useColors';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/hooks/useAuth';
import { uploadPhoto } from '../../src/api/photo';
import { clearResults } from '../../src/storage/resultPackage';
import { clearQueue } from '../../src/storage/syncQueue';
import { getCachedMembers } from '../../src/storage/cache';
import { getOrCreateSession, resetSession } from '../../src/storage/session';
import { getDisplaySettings, saveDisplaySettings, type MemberDisplayMode, type ColorSchemeMode } from '../../src/storage/displaySettings';
import { useColorScheme } from 'nativewind';
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
  const c = useColors();
  const { setColorScheme } = useColorScheme();
  const [uploading, setUploading] = useState(false);
  const [memberDisplayMode, setMemberDisplayMode] = useState<MemberDisplayMode>('nickname');
  const [colorSchemeMode, setColorSchemeMode] = useState<ColorSchemeMode>('system');
  // picUri: null = no pic, string = absolute URL or local file URI
  const [picUri, setPicUri] = useState<string | null>(null);
  const [sessionGroup, setSessionGroup] = useState<number | null>(null);

  useEffect(() => {
    getCachedMembers().then((members) => {
      const me = members.find((m) => m.id === user?.memberId);
      if (me?.pic) setPicUri(`${BASE_URL}${me.pic}`);
    });
    getOrCreateSession().then(setSessionGroup);
    getDisplaySettings().then((s) => {
      setMemberDisplayMode(s.memberDisplayMode);
      setColorSchemeMode(s.colorSchemeMode);
    });
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
        <View style={{ backgroundColor: c.card, borderLeftWidth: 4, borderLeftColor: c.primaryFg, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text
            style={{ fontFamily: 'DMSans_700Bold', color: c.primaryFg, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }}
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
                  borderColor: c.primaryFg,
                }}
              />
            ) : (
              <View
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: AVATAR_SIZE / 2,
                  backgroundColor: c.primaryFg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 28, color: c.isDark ? '#1e2d3f' : '#fff' }}>
                  {initial}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: c.textStrong }} className="text-base">
                {user?.nickname}
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textMuted }} className="text-sm">
                {user?.clubName}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={handlePhotoUpload}
            disabled={uploading}
          >
            <View className="flex-row items-center gap-3">
              <Camera size={18} color={c.textSecondary} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textSecondary }} className="text-base">
                {uploading ? t('settings.uploading') : t('settings.changePhoto')}
              </Text>
            </View>
            <ChevronRight size={16} color={c.textFaint} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={handleLogout}
          >
            <View className="flex-row items-center gap-3">
              <LogOut size={18} color={c.accentFg} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: c.accentFg }} className="text-base">
                {t('settings.logout')}
              </Text>
            </View>
            <ChevronRight size={16} color={c.textFaint} />
          </TouchableOpacity>
        </View>

        {/* Session */}
        <View style={{ backgroundColor: c.card, borderLeftWidth: 4, borderLeftColor: c.primaryFg, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text
            style={{ fontFamily: 'DMSans_700Bold', color: c.primaryFg, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }}
          >
            {t('settings.session')}
          </Text>
          <TouchableOpacity
            className="px-4 py-3 flex-row items-center justify-between"
            onPress={handleNewSession}
          >
            <View className="flex-row items-center gap-3">
              <RotateCcw size={18} color={c.primaryFg} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: c.primaryFg }} className="text-base">
                {t('settings.newSession')}
              </Text>
            </View>
            <ChevronRight size={16} color={c.textFaint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={handleClearSession}
          >
            <View className="flex-row items-center gap-3">
              <Trash2 size={18} color={c.accentFg} />
              <Text style={{ fontFamily: 'DMSans_400Regular', color: c.accentFg }} className="text-base">
                {t('settings.clearSession')}
              </Text>
            </View>
            <ChevronRight size={16} color={c.textFaint} />
          </TouchableOpacity>
        </View>

        {/* Display */}
        <View style={{ backgroundColor: c.card, borderLeftWidth: 4, borderLeftColor: c.primaryFg, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text
            style={{ fontFamily: 'DMSans_700Bold', color: c.primaryFg, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }}
          >
            {t('settings.display')}
          </Text>
          {/* Color scheme */}
          <Text
            style={{ fontFamily: 'DMSans_400Regular', paddingHorizontal: 16, paddingBottom: 8, fontSize: 13, color: c.textMuted }}
          >
            {t('settings.colorScheme')}
          </Text>
          {([
            { mode: 'system' as ColorSchemeMode, icon: <Smartphone size={16} color={c.primaryFg} /> },
            { mode: 'light'  as ColorSchemeMode, icon: <Sun        size={16} color={c.primaryFg} /> },
            { mode: 'dark'   as ColorSchemeMode, icon: <Moon       size={16} color={c.primaryFg} /> },
          ]).map(({ mode, icon }) => (
            <TouchableOpacity
              key={mode}
              style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              onPress={async () => {
                setColorSchemeMode(mode);
                setColorScheme(mode);
                const current = await getDisplaySettings();
                await saveDisplaySettings({ ...current, colorSchemeMode: mode });
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {icon}
                <Text style={{ fontFamily: colorSchemeMode === mode ? 'DMSans_600SemiBold' : 'DMSans_400Regular', fontSize: 15, color: colorSchemeMode === mode ? c.primaryFg : c.textSecondary }}>
                  {t(`settings.colorScheme${mode.charAt(0).toUpperCase() + mode.slice(1)}` as any)}
                </Text>
              </View>
              {colorSchemeMode === mode && <Check size={18} color={c.primaryFg} />}
            </TouchableOpacity>
          ))}

          {/* Member display mode */}
          <Text
            style={{ fontFamily: 'DMSans_400Regular', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, fontSize: 13, borderTopWidth: 1, borderTopColor: c.divider, color: c.textMuted }}
          >
            {t('settings.memberDisplayMode')}
          </Text>
          {(['nickname', 'firstname', 'fullname'] as MemberDisplayMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              onPress={async () => {
                setMemberDisplayMode(mode);
                await saveDisplaySettings({ memberDisplayMode: mode });
              }}
            >
              <Text style={{ fontFamily: memberDisplayMode === mode ? 'DMSans_600SemiBold' : 'DMSans_400Regular', fontSize: 15, color: memberDisplayMode === mode ? c.primaryFg : c.textSecondary }}>
                {t(`settings.memberDisplay${mode.charAt(0).toUpperCase() + mode.slice(1)}` as any)}
              </Text>
              {memberDisplayMode === mode && <Check size={18} color={c.primaryFg} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info */}
        <View style={{ backgroundColor: c.card, borderLeftWidth: 4, borderLeftColor: c.primaryFg, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text
            style={{ fontFamily: 'DMSans_700Bold', color: c.primaryFg, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }}
          >
            {t('settings.info')}
          </Text>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.divider, gap: 4 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular' }} style={{ color: c.textMuted }}>
              {t('settings.server')}: {BASE_URL}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular' }} style={{ color: c.textMuted }}>
              {t('settings.version')}: {Constants.expoConfig?.version ?? '—'}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular' }} style={{ color: c.textMuted }}>
              {t('settings.sessionId')}: {sessionGroup ?? '—'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </View>
  );
}
