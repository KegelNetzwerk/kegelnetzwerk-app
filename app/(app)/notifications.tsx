import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { format } from 'date-fns';
import {
  getNotificationState,
  setNotificationEnabled,
  type NotificationLogEntry,
  type NotificationState,
} from '../../src/storage/notificationState';

const TYPE_ICONS: Record<string, string> = {
  event: '📅',
  news: '📰',
  vote: '🗳️',
};

const TYPE_LABELS: Record<string, string> = {
  events: 'Terminerinnerungen',
  news: 'Neue Neuigkeiten',
  votes: 'Neue Abstimmungen',
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Benachrichtigungen', headerShown: true });
  }, [navigation]);

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

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4 gap-4">
        {/* Toggles */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Einstellungen
          </Text>

          {(Object.keys(TYPE_LABELS) as Array<keyof NotificationState['enabled']>).map((type, idx, arr) => (
            <View
              key={type}
              className={`px-4 py-3 flex-row items-center justify-between ${
                idx < arr.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-row items-center gap-2 flex-1 mr-4">
                <Text className="text-lg">{TYPE_ICONS[type.replace('s', '')] ?? '🔔'}</Text>
                <Text className="text-base text-gray-700">{TYPE_LABELS[type]}</Text>
              </View>
              <Switch
                value={state?.enabled[type] ?? true}
                onValueChange={(v) => toggle(type, v)}
                trackColor={{ true: '#005982' }}
              />
            </View>
          ))}
        </View>

        {/* Recent log */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Text className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Zuletzt erhalten
          </Text>

          {!state || state.recentLog.length === 0 ? (
            <View className="px-4 py-6 items-center">
              <Text className="text-gray-400 text-sm">Noch keine Benachrichtigungen</Text>
            </View>
          ) : (
            state.recentLog.map((entry, idx) => (
              <View
                key={entry.id}
                className={`px-4 py-3 ${idx < state.recentLog.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="flex-row items-start gap-2">
                  <Text className="text-base mt-0.5">{TYPE_ICONS[entry.type] ?? '🔔'}</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800 text-sm">{entry.title}</Text>
                    <Text className="text-gray-600 text-sm">{entry.body}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
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
  );
}
