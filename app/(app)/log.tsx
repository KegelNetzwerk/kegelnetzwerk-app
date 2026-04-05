import ClubBackground from '../../src/components/ClubBackground';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Trash2, UserRound, SlidersHorizontal, X, Check, ChevronDown, ChevronRight } from 'lucide-react-native';
import { useColors } from '../../src/hooks/useColors';
import { BASE_URL } from '../../constants/api';
import MemberAvatar from '../../src/components/MemberAvatar';
import { getResults, removeResult } from '../../src/storage/resultPackage';
import { dequeue } from '../../src/storage/syncQueue';
import { getCurrentSessionGroup } from '../../src/storage/session';
import { deleteResults } from '../../src/api/results';
import { getCachedMembers, getCachedGames } from '../../src/storage/cache';
import type { ResultEntry } from '../../src/models/Result';
import type { GameOrPenalty } from '../../src/models/GameOrPenalty';

interface DisplayEntry extends ResultEntry {
  memberLabel: string;
  gameLabel: string;
  partLabel: string;
  memberPic: string | null;
  partPic: string | undefined;
}

type FilterSelection = null | { gameId: number; partId?: number };

export default function LogScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [allEntries, setAllEntries] = useState<DisplayEntry[]>([]);
  const [games, setGames] = useState<GameOrPenalty[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [filterSelection, setFilterSelection] = useState<FilterSelection>(null);
  const [showGuests, setShowGuests] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [expandedGames, setExpandedGames] = useState<Set<number>>(new Set());

  const filterActive = filterSelection !== null || !showGuests;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('log.title'),
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity onPress={() => setFilterVisible(true)} style={{ marginRight: 12 }}>
          <SlidersHorizontal size={20} color={filterActive ? c.accentFg : '#fff'} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, t, filterActive, c]);

  const load = useCallback(async () => {
    const [allResults, members, fetchedGames, sessionGroup] = await Promise.all([
      getResults(),
      getCachedMembers(),
      getCachedGames(),
      getCurrentSessionGroup(),
    ]);

    const results = sessionGroup !== null
      ? allResults.filter((e) => e.sessionGroup === sessionGroup)
      : [];

    setGames(fetchedGames);

    const display: DisplayEntry[] = [...results]
      .reverse()
      .map((r) => {
        const game = fetchedGames.find((g) => g.id === r.gameId);
        const part = game?.parts.find((p) => p.id === r.partId);
        const member = r.memberId ? members.find((m) => m.id === r.memberId) : null;
        return {
          ...r,
          memberLabel: member?.nickname ?? (r.memberId ? `#${r.memberId}` : (r.guestName ?? t('log.guest'))),
          gameLabel: game?.name ?? `Spiel ${r.gameId}`,
          partLabel: part?.name ?? `Teil ${r.partId}`,
          memberPic: member?.pic ?? null,
          partPic: part?.pic,
        };
      });

    setAllEntries(display);
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const entries = useMemo(() => {
    return allEntries.filter((e) => {
      if (!showGuests && e.memberId === null) return false;
      if (!filterSelection) return true;
      if (e.gameId !== filterSelection.gameId) return false;
      if (filterSelection.partId !== undefined && e.partId !== filterSelection.partId) return false;
      return true;
    });
  }, [allEntries, filterSelection, showGuests]);

  async function handleDelete(entry: DisplayEntry) {
    const ago = formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true, locale: de });
    const detail = `${entry.memberLabel} – ${entry.partLabel}\n${ago}`;
    const message = `${t('log.deleteTitle')}\n${detail}`;
    const confirmed = Platform.OS === 'web'
      ? window.confirm(message)
      : await new Promise<boolean>((resolve) =>
          Alert.alert(t('log.deleteTitle'), detail, [
            { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
            { text: t('common.delete'), style: 'destructive', onPress: () => resolve(true) },
          ])
        );
    if (!confirmed) return;
    if (entry.synced) {
      await deleteResults([entry.id]);
    }
    await removeResult(entry.id);
    await dequeue([entry.id]);
    await load();
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

  function toggleGameExpand(gameId: number) {
    setExpandedGames((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
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

      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {entries.length === 0 ? (
          <View className="items-center justify-center p-8">
            <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textFaint }}>
              {t('log.empty')}
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {entries.map((entry) => (
              <View
                key={entry.id}
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
                <View className="flex-1 mr-3">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MemberAvatar pic={entry.memberPic} size={28} />
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', color: c.textStrong }}>
                      {entry.memberLabel}
                    </Text>
                    {entry.memberId === null && (
                      <UserRound size={13} color={c.textMuted} />
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textSecondary, fontSize: 14 }}>
                      {entry.gameLabel} ›
                    </Text>
                    {entry.partPic?.startsWith('emoji:') ? (
                      <Text style={{ fontSize: 14 }}>{entry.partPic.slice(6)}</Text>
                    ) : entry.partPic && entry.partPic !== 'none' ? (
                      <Image
                        source={{ uri: entry.partPic.startsWith('http') ? entry.partPic : `${BASE_URL}${entry.partPic}` }}
                        style={{ width: 18, height: 18, borderRadius: 3 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.primaryFg + '20', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, color: c.primaryFg, fontFamily: 'DMSans_600SemiBold' }}>{entry.partLabel.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textSecondary, fontSize: 14 }}>
                      {entry.partLabel}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textFaint, fontSize: 12 }}>
                      {format(new Date(entry.timestamp), 'dd.MM.yyyy HH:mm')}
                    </Text>
                    {entry.synced ? (
                      <Check size={12} color={c.primaryFg} />
                    ) : (
                      <Text style={{ fontFamily: 'DMSans_400Regular', color: '#f97316', fontSize: 12 }}> · {t('log.pending')}</Text>
                    )}
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text style={{ fontFamily: 'DMSans_700Bold', color: c.primaryFg, fontSize: 18 }}>
                    {entry.value}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(entry)}>
                    <Trash2 size={18} color={c.accentFg} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

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
            {/* Show guests toggle */}
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

            {/* All results */}
            <TouchableOpacity
              onPress={clearFilter}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.divider }}
            >
              <Text style={{ fontFamily: filterSelection === null ? 'DMSans_600SemiBold' : 'DMSans_400Regular', fontSize: 15, color: filterSelection === null ? c.primaryFg : c.textStrong }}>
                {t('overview.filterAll')}
              </Text>
              {filterSelection === null && <Check size={18} color={c.primaryFg} />}
            </TouchableOpacity>

            {/* Game / part tree */}
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
