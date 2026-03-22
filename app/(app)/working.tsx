import ClubBackground from '../../src/components/ClubBackground';
import WorkingSettingsModal from '../../src/components/WorkingSettingsModal';
import { useState, useEffect, useRef, useMemo } from 'react';
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
import { Redirect, router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, ClipboardList, X, Settings } from 'lucide-react-native';
import { useLocalData } from '../../src/hooks/useLocalData';
import { useTheme } from '../../src/hooks/useTheme';
import { useUIColors } from '../../src/hooks/useUIColors';
import { useAuth } from '../../src/hooks/useAuth';
import PartButton from '../../src/components/PartButton';
import { getWorkingSettings } from '../../src/storage/workingSettings';
import type { GameOrPenalty, Part } from '../../src/models/GameOrPenalty';

const BUTTON_MARGIN = 8;
const COLUMNS = 3;

export default function WorkingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const ui = useUIColors();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('working.title'),
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={{ marginRight: 12 }}>
          <Settings size={20} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, t]);

  const { user } = useAuth();
  const { games, loading } = useLocalData();
  const [hiddenGameIds, setHiddenGameIds] = useState<number[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    getWorkingSettings().then((s) => setHiddenGameIds(s.hiddenGameIds));
  }, []);

  if (user?.role !== 'ADMIN') return <Redirect href="/(app)/main" />;

  const { width } = useWindowDimensions();

  const reversedGames = useMemo(
    () => [...games].reverse().filter((g) => !hiddenGameIds.includes(g.id)),
    [games, hiddenGameIds]
  );

  const cellSize = Math.floor((width - 32 - COLUMNS * BUTTON_MARGIN) / COLUMNS);

  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const pagerOffset = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
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

  const switchToIndexRef = useRef(switchToIndex);
  switchToIndexRef.current = switchToIndex;

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

  const navigateToSelectWho = (game: GameOrPenalty, part: Part, stay: boolean) => {
    router.push({
      pathname: '/(app)/selectwho',
      params: {
        gameId: String(game.id),
        gameName: game.name,
        partId: String(part.id),
        partName: part.name,
        partValue: String(part.value),
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
      <View style={{ flexDirection: 'row', backgroundColor: theme.primary }}>
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
