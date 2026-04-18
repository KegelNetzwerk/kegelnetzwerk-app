import ClubBackground from '../../src/components/ClubBackground';
import WorkingSettingsModal from '../../src/components/WorkingSettingsModal';
import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, router, useNavigation, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarChart2, ClipboardList, X, Settings } from 'lucide-react-native';
import { useLocalData } from '../../src/hooks/useLocalData';
import { useTheme } from '../../src/hooks/useTheme';
import { useUIColors } from '../../src/hooks/useUIColors';
import { useAuth } from '../../src/hooks/useAuth';
import PartButton from '../../src/components/PartButton';
import ToastStack, { type ToastItem } from '../../src/components/Toast';
import { getWorkingSettings } from '../../src/storage/workingSettings';
import { getResults } from '../../src/storage/resultPackage';
import { getCachedMembers } from '../../src/storage/cache';
import { consumePendingToast } from '../../src/storage/pendingToast';
import type { GameOrPenalty, Part } from '../../src/models/GameOrPenalty';

const BUTTON_MARGIN = 8;
const COLUMNS = 3;

export default function WorkingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const ui = useUIColors();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { games, loading } = useLocalData();
  const [hiddenGameIds, setHiddenGameIds] = useState<number[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [lastResult, setLastResult] = useState<{ memberLabel: string; partLabel: string; value: number } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  function showToast(message: string) {
    const id = String(++toastIdRef.current);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }

  // These hooks must be declared before any early return to comply with Rules of Hooks
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reversedGames = useMemo(
    () => [...games].reverse().filter((g) => !hiddenGameIds.includes(g.id)),
    [games, hiddenGameIds]
  );
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const pagerOffset = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  const switchToIndexRef = useRef<(idx: number) => void>(() => {});
  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 15,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) switchToIndexRef.current(indexRef.current + 1);
        else if (g.dx > 50) switchToIndexRef.current(indexRef.current - 1);
      },
    })
  ).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontFamily: 'DMSans_700Bold', fontSize: 16 }}>
            {t('working.title')}
          </Text>
          {lastResult && (
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'DMSans_400Regular', fontSize: 11 }}>
              ✓ {lastResult.memberLabel} – {lastResult.partLabel} · {lastResult.value}
            </Text>
          )}
        </View>
      ),
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={{ marginRight: 12 }}>
          <Settings size={20} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, t, lastResult]);

  useEffect(() => {
    getWorkingSettings().then((s) => setHiddenGameIds(s.hiddenGameIds));
  }, []);

  useFocusEffect(useCallback(() => {
    const pending = consumePendingToast();
    if (pending) showToast(pending);
    (async () => {
      const [results, members] = await Promise.all([getResults(), getCachedMembers()]);
      if (results.length === 0) return;
      const last = results[results.length - 1];
      const memberLabel = last.memberId
        ? (members.find((m) => m.id === last.memberId)?.nickname ?? `#${last.memberId}`)
        : (last.guestName ?? '?');
      const game = games.find((g) => g.id === last.gameId);
      const partLabel = game?.parts.find((p) => p.id === last.partId)?.name ?? '?';
      setLastResult({ memberLabel, partLabel, value: last.value });
    })();
  }, [games]));

  if (user?.role !== 'ADMIN') return <Redirect href="/(app)/main" />;

  const cellSize = Math.floor((width - 32 - COLUMNS * BUTTON_MARGIN) / COLUMNS);
  indexRef.current = selectedGameIndex;

  function switchToIndex(idx: number) {
    if (idx === indexRef.current) return;
    if (idx < 0 || idx >= reversedGames.length) return;
    indexRef.current = idx;
    setSelectedGameIndex(idx);
    Animated.timing(pagerOffset, {
      toValue: -width * idx,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }
  switchToIndexRef.current = switchToIndex;

  const navigateToSelectWho = (game: GameOrPenalty, part: Part, stay: boolean) => {
    router.push({
      pathname: '/(app)/selectwho',
      params: {
        gameId: String(game.id),
        gameName: game.name,
        partId: String(part.id),
        partName: part.name,
        partValue: String(part.value),
        partFactor: String(part.factor),
        partBonus: String(part.bonus),
        partVariable: part.variable ? '1' : '0',
        partOnce: part.once ? '1' : '0',
        stay: stay ? '1' : '0',
      },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-gray-500 dark:text-gray-400">
          {t('working.loading')}
        </Text>
      </View>
    );
  }

  if (reversedGames.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-gray-500 text-center">
          {t('working.noGames')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ClubBackground />

      {/* Game tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: theme.primary, flexGrow: 0 }}
        contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 }}
      >
        {reversedGames.map((game, idx) => (
          <TouchableOpacity
            key={game.id}
            onPress={() => switchToIndex(idx)}
            style={[
              { marginRight: 16, paddingBottom: 8, borderBottomWidth: 2 },
              idx === selectedGameIndex
                ? { borderBottomColor: '#fff' }
                : { borderBottomColor: 'transparent' },
            ]}
          >
            <Text
              style={{
                fontFamily: idx === selectedGameIndex ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                color: idx === selectedGameIndex ? '#fff' : 'rgba(255,255,255,0.55)',
              }}
            >
              {game.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Swipeable part pages */}
      <View style={{ flex: 1, overflow: 'hidden' }} {...swipe.panHandlers}>
        <Animated.View style={{
          flex: 1,
          flexDirection: 'row',
          width: width * reversedGames.length,
          transform: [{ translateX: pagerOffset }],
        }}>
          {reversedGames.map((game) => (
            <ScrollView
              key={game.id}
              style={{ width }}
              contentContainerStyle={{ padding: 16 }}
              nestedScrollEnabled
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {game.parts.map((part) => (
                  <PartButton
                    key={part.id}
                    label={part.name}
                    pic={part.pic}
                    size={cellSize}
                    onPress={() => navigateToSelectWho(game, part, false)}
                    onLongPress={() => navigateToSelectWho(game, part, true)}
                  />
                ))}
              </View>
            </ScrollView>
          ))}
        </Animated.View>
      </View>

      {/* Bottom bar */}
      <View style={{ flexDirection: 'row', backgroundColor: theme.primary, paddingBottom: insets.bottom }}>
        <TouchableOpacity
          className="flex-1 py-3 items-center gap-1"
          onPress={() => router.push('/(app)/overview')}
        >
          <BarChart2 size={18} color="rgba(255,255,255,0.85)" />
          <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.85)' }} className="text-xs">
            {t('working.overview')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center gap-1"
          onPress={() => router.push('/(app)/log')}
        >
          <ClipboardList size={18} color="rgba(255,255,255,0.85)" />
          <Text style={{ fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.85)' }} className="text-xs">
            {t('working.log')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center gap-1"
          onPress={() => router.push('/(app)/main')}
        >
          <X size={18} color="#fff" />
          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: '#fff' }} className="text-xs">
            {t('working.end')}
          </Text>
        </TouchableOpacity>
      </View>

      <ToastStack toasts={toasts} />

      <WorkingSettingsModal
        visible={settingsVisible}
        games={games}
        onClose={() => {
          setSettingsVisible(false);
          getWorkingSettings().then((s) => setHiddenGameIds(s.hiddenGameIds));
        }}
      />
    </View>
  );
}
