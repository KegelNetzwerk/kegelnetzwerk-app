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
import { Target, Banknote, SlidersHorizontal, X, Check, ChevronDown, ChevronRight, UserRound } from 'lucide-react-native';
import { useColors } from '../../src/hooks/useColors';
import MemberAvatar from '../../src/components/MemberAvatar';
import { getResults } from '../../src/storage/resultPackage';
import { getCachedMembers, getCachedGames } from '../../src/storage/cache';
import { getCurrentSessionGroup } from '../../src/storage/session';
import type { ResultEntry } from '../../src/models/Result';
import type { Member } from '../../src/models/Member';
import type { GameOrPenalty } from '../../src/models/GameOrPenalty';

interface Row {
  label: string;
  total: number;
  count: number;
  isGuest: boolean;
  pic: string | null;
}

type FilterSelection = null | { gameId: number; partId?: number };

export default function OverviewScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const c = useColors();
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
  const [showGuests, setShowGuests] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [expandedGames, setExpandedGames] = useState<Set<number>>(new Set());

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('overview.title'),
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity onPress={() => setFilterVisible(true)} style={{ marginRight: 12 }}>
          <SlidersHorizontal size={20} color={(filterSelection !== null || !showGuests) ? c.accentFg : '#fff'} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, t, filterSelection, showGuests, c]);

  const load = useCallback(async () => {
    const [allResults, m, g, sessionGroup] = await Promise.all([
      getResults(), getCachedMembers(), getCachedGames(), getCurrentSessionGroup(),
    ]);
    const r = sessionGroup !== null
      ? allResults.filter((e) => e.sessionGroup === sessionGroup)
      : [];
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
    return results.filter((r) => {
      if (!showGuests && r.memberId === null) return false;
      if (!filterSelection) return true;
      if (r.gameId !== filterSelection.gameId) return false;
      if (filterSelection.partId !== undefined && r.partId !== filterSelection.partId) return false;
      return true;
    });
  }, [results, filterSelection, showGuests]);

  function buildRows(unit: 'POINTS' | 'EURO'): Row[] {
    const map = new Map<string, Row>();
    for (const r of filteredResults) {
      const game = games.find((g) => g.id === r.gameId);
      const part = game?.parts.find((p) => p.id === r.partId);
      if (part?.unit !== unit) continue;
      const member = r.memberId ? members.find((m) => m.id === r.memberId) : null;
      const label = member?.nickname ?? (r.memberId ? `#${r.memberId}` : (r.guestName ?? t('log.guest')));
      const key = r.memberId ? `m-${r.memberId}` : `g-${r.guestName}`;
      const existing = map.get(key) ?? { label, total: 0, count: 0, isGuest: !r.memberId, pic: member?.pic ?? null };
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
      <View style={{ flexDirection: 'row', backgroundColor: c.theme.primary, paddingHorizontal: 16, paddingTop: 8 }}>
        {TABS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => switchTab(f)}
            style={[
              { marginRight: 16, paddingBottom: 8, borderBottomWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 6 },
              tab === f ? { borderBottomColor: '#fff' } : { borderBottomColor: 'transparent' },
            ]}
          >
            {f === 'score'
              ? <Target size={14} color={tab === f ? '#fff' : 'rgba(255,255,255,0.55)'} />
              : <Banknote size={14} color={tab === f ? '#fff' : 'rgba(255,255,255,0.55)'} />
            }
            <Text
              style={{
                fontFamily: tab === f ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                color: tab === f ? '#fff' : 'rgba(255,255,255,0.55)',
              }}
            >
              {f === 'score' ? t('overview.score') : t('overview.money')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active filter chip */}
      {filterLabel && (
        <View style={{ backgroundColor: c.surface, paddingHorizontal: 16, paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: c.primaryFg + '25', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, gap: 6 }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', color: c.primaryFg, fontSize: 13 }}>
              {filterLabel}
            </Text>
            <TouchableOpacity onPress={clearFilter}>
              <X size={14} color={c.primaryFg} />
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
                  <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textFaint }} className="text-center">
                    {t('overview.empty')}
                  </Text>
                </View>
              ) : (
                <View className="p-4 gap-2">
                  {rows.map((row, idx) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: c.card,
                        borderLeftWidth: 4,
                        borderLeftColor: c.primaryFg,
                        borderRadius: 12,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 2,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View className="flex-row items-center gap-3">
                        <Text style={{ fontFamily: 'DMSans_700Bold', color: c.textFaint }} className="text-lg w-7">
                          {idx + 1}
                        </Text>
                        <MemberAvatar pic={row.pic} size={44} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: c.textStrong }} className="text-base">
                            {row.label}
                          </Text>
                          {row.isGuest && <UserRound size={13} color={c.textMuted} />}
                        </View>
                      </View>
                      <View className="items-end">
                        <Text style={{ fontFamily: 'DMSans_700Bold', color: c.primaryFg, fontSize: 18 }}>
                          {row.total.toFixed(decimals)}
                        </Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textFaint }} className="text-xs">
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
        <SafeAreaView style={{ backgroundColor: c.card, maxHeight: '75%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.divider }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: c.textStrong }}>
              {t('overview.filter')}
            </Text>
            <TouchableOpacity onPress={() => setFilterVisible(false)}>
              <X size={20} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <TouchableOpacity
              onPress={() => setShowGuests((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.divider }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <UserRound size={16} color={c.textMuted} />
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: c.textStrong }}>
                  {t('overview.showGuests')}
                </Text>
              </View>
              <View style={{
                width: 20, height: 20, borderRadius: 4, borderWidth: 2,
                borderColor: showGuests ? c.primaryFg : c.divider,
                backgroundColor: showGuests ? c.primaryFg : 'transparent',
                justifyContent: 'center', alignItems: 'center',
              }}>
                {showGuests && <Check size={13} color="#fff" />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearFilter}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.divider }}
            >
              <Text style={{ fontFamily: filterSelection === null ? 'DMSans_600SemiBold' : 'DMSans_400Regular', fontSize: 15, color: filterSelection === null ? c.primaryFg : c.textStrong }}>
                {t('overview.filterAll')}
              </Text>
              {filterSelection === null && <Check size={18} color={c.primaryFg} />}
            </TouchableOpacity>

            {games.map((game) => {
              const expanded = expandedGames.has(game.id);
              const gameSelected = isSelected(game.id, undefined);
              return (
                <View key={game.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.divider }}>
                    <TouchableOpacity
                      onPress={() => selectFilter(game.id)}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8, paddingVertical: 14 }}
                    >
                      <Text style={{ fontFamily: gameSelected ? 'DMSans_600SemiBold' : 'DMSans_500Medium', fontSize: 15, color: gameSelected ? c.primaryFg : c.textStrong }}>
                        {game.name}
                      </Text>
                      {gameSelected && <Check size={18} color={c.primaryFg} />}
                    </TouchableOpacity>
                    {game.parts.length > 0 && (
                      <TouchableOpacity onPress={() => toggleGameExpand(game.id)} style={{ padding: 14 }}>
                        {expanded
                          ? <ChevronDown size={18} color={c.textMuted} />
                          : <ChevronRight size={18} color={c.textMuted} />
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
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 36, paddingRight: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.divider, backgroundColor: c.subSurface }}
                      >
                        <Text style={{ fontFamily: partSelected ? 'DMSans_600SemiBold' : 'DMSans_400Regular', fontSize: 14, color: partSelected ? c.primaryFg : c.textSecondary }}>
                          {part.name}
                        </Text>
                        {partSelected && <Check size={16} color={c.primaryFg} />}
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
