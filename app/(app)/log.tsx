import ClubBackground from '../../src/components/ClubBackground';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { getResults, removeResult } from '../../src/storage/resultPackage';
import { dequeue } from '../../src/storage/syncQueue';
import { getCachedMembers, getCachedGames } from '../../src/storage/cache';
import type { ResultEntry } from '../../src/models/Result';
import type { Member } from '../../src/models/Member';
import type { GameOrPenalty } from '../../src/models/GameOrPenalty';

interface DisplayEntry extends ResultEntry {
  memberLabel: string;
  gameLabel: string;
  partLabel: string;
}

export default function LogScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('log.title'), headerShown: true });
  }, [navigation, t]);

  const theme = useTheme();
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [results, members, games] = await Promise.all([
      getResults(),
      getCachedMembers(),
      getCachedGames(),
    ]);

    const display: DisplayEntry[] = [...results]
      .reverse()
      .map((r) => {
        const game = games.find((g) => g.id === r.gameId);
        const part = game?.parts.find((p) => p.id === r.partId);
        return {
          ...r,
          memberLabel: r.memberId
            ? (members.find((m) => m.id === r.memberId)?.nickname ?? `#${r.memberId}`)
            : (r.guestName ?? t('log.guest')),
          gameLabel: game?.name ?? `Spiel ${r.gameId}`,
          partLabel: part?.name ?? `Teil ${r.partId}`,
        };
      });

    setEntries(display);
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleDelete(entry: DisplayEntry) {
    Alert.alert(t('log.deleteTitle'), `${entry.memberLabel} – ${entry.partLabel}`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await removeResult(entry.id);
          await dequeue([entry.id]);
          await load();
        },
      },
    ]);
  }

  return (
    <View className="flex-1">
      <ClubBackground />
      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {entries.length === 0 ? (
          <View className="items-center justify-center p-8">
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-gray-400">
              {t('log.empty')}
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {entries.map((entry) => (
              <View
                key={entry.id}
                className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-1 mr-3">
                  <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-gray-800">
                    {entry.memberLabel}
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-gray-500">
                    {entry.gameLabel} › {entry.partLabel}
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(entry.timestamp), 'dd.MM.yyyy HH:mm')}
                    {!entry.synced && (
                      <Text className="text-orange-500"> · {t('log.pending')}</Text>
                    )}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text style={{ fontFamily: 'DMSans_700Bold', color: theme.primary, fontSize: 18 }}>
                    {entry.value}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(entry)}>
                    <Trash2 size={18} color={theme.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
