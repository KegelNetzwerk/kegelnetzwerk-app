import ClubBackground from '../../src/components/ClubBackground';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Easing,
  PanResponder,
  TouchableOpacity,
  RefreshControl,
  Modal,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Banknote, SlidersHorizontal, X, Check, ChevronDown, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
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

type FilterSelection = null | { gameId: number; partId?: number };

export default function OverviewScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const theme = useTheme();

  const [results, setResults] = useState<ResultEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [games, setGames] = useState<GameOrPenalty[]>([]);
  const TABS = ['score', 'money'] as const;
  const [tab, setTab] = useState<'score' | 'money'>('score');
  const pagerOffset = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const [refreshing, setRefreshing] = useState(false);

  function switchTab(newTab: 'score' | 'money') {
    if (newTab === tabRef.current) return;
    tabRef.current = newTab;
    setTab(newTab);
    Animated.timing(pagerOffset, {
      toValue: newTab === 'money' ? -width : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const switchTabRef = useRef(switchTab);
  switchTabRef.current = switchTab;

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 15,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50 && tabRef.current === 'score') switchTabRef.current('money');
        else if (g.dx > 50 && tabRef.current === 'money') switchTabRef.current('score');
      },
    })
  ).current;

  const [filterSelection, setFilterSelection] = useState<FilterSelection>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [expandedGames, setExpandedGames] = useState<Set<number>>(new Set());

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('overview.title'),
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity onPress={() => setFilterVisible(true)} style={{ marginRight: 12 }}>
          <SlidersHorizontal size={20} color={filterSelection !== null ? theme.accent : '#fff'} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, t, filterSelection, theme]);

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

  const filteredResults = useMemo(() => {
    if (!filterSelection) return results;
    return results.filter((r) => {
      if (r.gameId !== filterSelection.gameId) return false;
      if (filterSelection.partId !== undefined && r.partId !== filterSelection.partId) return false;
      return true;
    });
  }, [results, filterSelection]);

  function buildRows(unit: 'POINTS' | 'EURO'): Row[] {
    const map = new Map<string, Row>();
    for (const r of filteredResults) {
      const game = games.find((g) => g.id === r.gameId);
      const part = game?.parts.find((p) => p.id === r.partId);
      if (part?.unit !== unit) continue;
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
  }

  const rowsScore = useMemo(() => buildRows('POINTS'), [filteredResults, games, members, t]);
  const rowsMoney = useMemo(() => buildRows('EURO'), [filteredResults, games, members, t]);

  function toggleGameExpand(gameId: number) {
    setExpandedGames((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
  }

  function isSelected(gameId: number, partId?: number): boolean {
    if (!filterSelection) return false;
    if (filterSelection.gameId !== gameId) return false;
    return filterSelection.partId === partId;
  }

  function selectFilter(gameId: number, partId?: number) {
    setFilterSelection({ gameId, partId });
    setFilterVisible(false);
  }

  function clearFilter() {
    setFilterSelection(null);
    setFilterVisible(false);
  }

  const filterLabel = useMemo(() => {
    if (!filterSelection) return null;
    const game = games.find((g) => g.id === filterSelection.gameId);
    if (!game) return null;
    if (filterSelection.partId === undefined) return game.name;
    const part = game.parts.find((p) => p.id === filterSelection.partId);
    return part ? `${game.name} › ${part.name}` : game.name;
  }, [filterSelection, games]);

  return (
    <View className="flex-1">
      <ClubBackground />

      {/* Score / Money tabs */}
      <View className="flex-row bg-white border-b border-gray-200 px-4 pt-2">
        {TABS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => switchTab(f)}
            style={[
              { marginRight: 16, paddingBottom: 8, borderBottomWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 6 },
              tab === f ? { borderBottomColor: theme.primary } : { borderBottomColor: 'transparent' },
            ]}
          >
            {f === 'score'
              ? <Target size={14} color={tab === f ? theme.primary : '#6b7280'} />
              : <Banknote size={14} color={tab === f ? theme.primary : '#6b7280'} />
            }
            <Text
              style={{
                fontFamily: tab === f ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                color: tab === f ? theme.primary : '#6b7280',
              }}
            >
              {f === 'score' ? t('overview.score') : t('overview.money')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active filter chip */}
      {filterLabel && (
        <View style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.primary + '18', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, gap: 6 }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', color: theme.primary, fontSize: 13 }}>
              {filterLabel}
            </Text>
            <TouchableOpacity onPress={clearFilter}>
              <X size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ flex: 1, overflow: 'hidden' }} {...swipe.panHandlers}>
        <Animated.View style={{ flex: 1, flexDirection: 'row', width: width * 2, transform: [{ translateX: pagerOffset }] }}>
          {([{ rows: rowsScore, decimals: 0 }, { rows: rowsMoney, decimals: 2 }] as const).map(({ rows, decimals }, pageIdx) => (
            <ScrollView
              key={pageIdx}
              style={{ width }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              nestedScrollEnabled
            >
              {rows.length === 0 ? (
                <View className="items-center justify-center p-8">
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
                        <Text style={{ fontFamily: 'DMSans_700Bold', color: theme.primary, fontSize: 18 }}>
                          {row.total.toFixed(decimals)}
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
          ))}
        </Animated.View>
      </View>

      {/* Filter modal */}
      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setFilterVisible(false)}
        />
        <SafeAreaView style={{ backgroundColor: '#fff', maxHeight: '75%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: '#111827' }}>
              {t('overview.filter')}
            </Text>
            <TouchableOpacity onPress={() => setFilterVisible(false)}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <TouchableOpacity
              onPress={clearFilter}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
            >
              <Text style={{ fontFamily: filterSelection === null ? 'DMSans_600SemiBold' : 'DMSans_400Regular', fontSize: 15, color: filterSelection === null ? theme.primary : '#111827' }}>
                {t('overview.filterAll')}
              </Text>
              {filterSelection === null && <Check size={18} color={theme.primary} />}
            </TouchableOpacity>

            {games.map((game) => {
              const expanded = expandedGames.has(game.id);
              const gameSelected = isSelected(game.id, undefined);
              return (
                <View key={game.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                    <TouchableOpacity
                      onPress={() => selectFilter(game.id)}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8, paddingVertical: 14 }}
                    >
                      <Text style={{ fontFamily: gameSelected ? 'DMSans_600SemiBold' : 'DMSans_500Medium', fontSize: 15, color: gameSelected ? theme.primary : '#111827' }}>
                        {game.name}
                      </Text>
                      {gameSelected && <Check size={18} color={theme.primary} />}
                    </TouchableOpacity>
                    {game.parts.length > 0 && (
                      <TouchableOpacity onPress={() => toggleGameExpand(game.id)} style={{ padding: 14 }}>
                        {expanded
                          ? <ChevronDown size={18} color="#6b7280" />
                          : <ChevronRight size={18} color="#6b7280" />
                        }
                      </TouchableOpacity>
                    )}
                  </View>

                  {expanded && game.parts.map((part) => {
                    const partSelected = isSelected(game.id, part.id);
                    return (
                      <TouchableOpacity
                        key={part.id}
                        onPress={() => selectFilter(game.id, part.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 36, paddingRight: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fafafa' }}
                      >
                        <Text style={{ fontFamily: partSelected ? 'DMSans_600SemiBold' : 'DMSans_400Regular', fontSize: 14, color: partSelected ? theme.primary : '#374151' }}>
                          {part.name}
                        </Text>
                        {partSelected && <Check size={16} color={theme.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
