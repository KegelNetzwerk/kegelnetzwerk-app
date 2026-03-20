import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Banknote } from 'lucide-react-native';
import { getResults } from '../../src/storage/resultPackage';
import { getCachedMembers, getCachedGames } from '../../src/storage/cache';
import type { ResultEntry } from '../../src/models/Result';
import type { Member } from '../../src/models/Member';
import type { GameOrPenalty } from '../../src/models/GameOrPenalty';

interface Row {
  label: string;
  total: number;
  count: number;
}

export default function OverviewScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('overview.title'), headerShown: true });
  }, [navigation, t]);

  const [results, setResults] = useState<ResultEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [games, setGames] = useState<GameOrPenalty[]>([]);
  const [filter, setFilter] = useState<'score' | 'money'>('score');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [r, m, g] = await Promise.all([getResults(), getCachedMembers(), getCachedGames()]);
    setResults(r);
    setMembers(m);
    setGames(g);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const rows: Row[] = (() => {
    const map = new Map<string, Row>();

    for (const r of results) {
      const label = r.memberId
        ? (members.find((m) => m.id === r.memberId)?.nickname ?? `#${r.memberId}`)
        : (r.guestName ?? t('log.guest'));
      const key = r.memberId ? `m-${r.memberId}` : `g-${r.guestName}`;

      const existing = map.get(key) ?? { label, total: 0, count: 0 };
      existing.total += r.value;
      existing.count += 1;
      map.set(key, existing);
    }

    return [...map.values()].sort((a, b) => b.total - a.total);
  })();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter tabs */}
      <View className="flex-row bg-white border-b border-gray-200 px-4 pt-2">
        {(['score', 'money'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            className={`mr-4 pb-2 border-b-2 flex-row items-center gap-1.5 ${filter === f ? 'border-primary' : 'border-transparent'}`}
          >
            {f === 'score'
              ? <Target size={14} color={filter === f ? '#005982' : '#6b7280'} />
              : <Banknote size={14} color={filter === f ? '#005982' : '#6b7280'} />
            }
            <Text
              style={{ fontFamily: filter === f ? 'DMSans_600SemiBold' : 'DMSans_400Regular' }}
              className={filter === f ? 'text-primary' : 'text-gray-500'}
            >
              {f === 'score' ? t('overview.score') : t('overview.money')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {rows.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-gray-400 text-center">
              {t('overview.empty')}
            </Text>
          </View>
        ) : (
          <View className="p-4 gap-2">
            {rows.map((row, idx) => (
              <View
                key={idx}
                className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-row items-center gap-3">
                  <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-lg text-gray-400 w-7">
                    {idx + 1}
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-base text-gray-800">
                    {row.label}
                  </Text>
                </View>
                <View className="items-end">
                  <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-lg text-primary">
                    {row.total.toFixed(filter === 'money' ? 2 : 0)}
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-gray-400">
                    {row.count}{t('overview.entries')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
