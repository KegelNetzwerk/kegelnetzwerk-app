import ClubBackground from '../../src/components/ClubBackground';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  RefreshControl,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarDays, Newspaper, CheckSquare, Bell } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import {
  getNotificationState,
  setNotificationEnabled,
  type NotificationState,
} from '../../src/storage/notificationState';

function TypeIcon({ type, size = 18, color = '#005982' }: { type: string; size?: number; color?: string }) {
  if (type === 'events' || type === 'event') return <CalendarDays size={size} color={color} />;
  if (type === 'news') return <Newspaper size={size} color={color} />;
  if (type === 'votes' || type === 'vote') return <CheckSquare size={size} color={color} />;
  return <Bell size={size} color={color} />;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('notifications.title'), headerShown: true });
  }, [navigation, t]);

  const theme = useTheme();
  const [state, setState] = useState<NotificationState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const s = await getNotificationState();
    setState(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function toggle(type: keyof NotificationState['enabled'], value: boolean) {
    await setNotificationEnabled(type, value);
    setState((prev) => prev ? { ...prev, enabled: { ...prev.enabled, [type]: value } } : prev);
  }

  const typeKeys = Object.keys(t('notifications.types', { returnObjects: true })) as Array<keyof NotificationState['enabled']>;

  return (
    <View style={{ flex: 1 }}>
      <ClubBackground />
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View className="p-4 gap-4">
        {/* Toggles */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase tracking-wide"
          >
            {t('notifications.settingsSection')}
          </Text>

          {typeKeys.map((type, idx) => (
            <View
              key={type}
              className={`px-4 py-3 flex-row items-center justify-between ${
                idx < typeKeys.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-row items-center gap-3 flex-1 mr-4">
                <TypeIcon type={type} size={20} color={theme.primary} />
                <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-base text-gray-700">
                  {t(`notifications.types.${type}`)}
                </Text>
              </View>
              <Switch
                value={state?.enabled[type] ?? true}
                onValueChange={(v) => toggle(type, v)}
                trackColor={{ true: theme.accent, false: '#d1d5db' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Recent log */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase tracking-wide"
          >
            {t('notifications.recentSection')}
          </Text>

          {!state || state.recentLog.length === 0 ? (
            <View className="px-4 py-6 items-center">
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-gray-400 text-sm">
                {t('notifications.empty')}
              </Text>
            </View>
          ) : (
            state.recentLog.map((entry, idx) => (
              <View
                key={entry.id}
                className={`px-4 py-3 ${idx < state.recentLog.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="flex-row items-start gap-2">
                  <View style={{ marginTop: 2 }}>
                    <TypeIcon type={entry.type} size={16} color="#6b7280" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-gray-800 text-sm">
                      {entry.title}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-gray-600 text-sm">
                      {entry.body}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(entry.timestamp), 'dd.MM. HH:mm')}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
    </View>
  );
}
