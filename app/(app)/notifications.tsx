import ClubBackground from '../../src/components/ClubBackground';
import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarDays, Newspaper, CheckSquare, Bell } from 'lucide-react-native';
import { useColors } from '../../src/hooks/useColors';
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

  const c = useColors();
  const insets = useSafeAreaInsets();
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
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View className="p-4 gap-4">
        {/* Toggles */}
        <View style={{ backgroundColor: c.card, borderLeftWidth: 4, borderLeftColor: c.primaryFg, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text
            style={{ fontFamily: 'DMSans_700Bold', color: c.primaryFg, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }}
          >
            {t('notifications.settingsSection')}
          </Text>

          {typeKeys.map((type, idx) => (
            <View
              key={type}
              style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: idx === 0 ? 1 : 0, borderTopColor: c.divider, borderBottomWidth: idx < typeKeys.length - 1 ? 1 : 0, borderBottomColor: c.divider }}
            >
              <View className="flex-row items-center gap-3 flex-1 mr-4">
                <TypeIcon type={type} size={20} color={c.primaryFg} />
                <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textSecondary }} className="text-base">
                  {t(`notifications.types.${type}`)}
                </Text>
              </View>
              <Switch
                value={state?.enabled[type] ?? true}
                onValueChange={(v) => toggle(type, v)}
                trackColor={{ true: c.accentFg, false: c.switchOffTrack }}
                thumbColor="#fff"
                // @ts-ignore activeThumbColor is a react-native-web specific prop
                activeThumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Recent log */}
        <View style={{ backgroundColor: c.card, borderLeftWidth: 4, borderLeftColor: c.primaryFg, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <Text
            style={{ fontFamily: 'DMSans_700Bold', color: c.primaryFg, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }}
          >
            {t('notifications.recentSection')}
          </Text>

          {!state || state.recentLog.length === 0 ? (
            <View className="px-4 py-6 items-center">
              <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textFaint }} className="text-sm">
                {t('notifications.empty')}
              </Text>
            </View>
          ) : (
            state.recentLog.map((entry, idx) => (
              <View
                key={entry.id}
                style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.divider }}
              >
                <View className="flex-row items-start gap-2">
                  <View style={{ marginTop: 2 }}>
                    <TypeIcon type={entry.type} size={16} color={c.textMuted} />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: c.textStrong }} className="text-sm">
                      {entry.title}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textSecondary }} className="text-sm">
                      {entry.body}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textFaint }} className="text-xs mt-0.5">
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
