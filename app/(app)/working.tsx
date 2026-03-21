import ClubBackground from '../../src/components/ClubBackground';
import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Redirect, router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, ClipboardList, X } from 'lucide-react-native';
import { useLocalData } from '../../src/hooks/useLocalData';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/hooks/useAuth';
import PartButton from '../../src/components/PartButton';
import type { GameOrPenalty, Part } from '../../src/models/GameOrPenalty';

const BUTTON_MARGIN = 8;
const COLUMNS = 3;

export default function WorkingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('working.title'), headerShown: true });
  }, [navigation, t]);

  const { user } = useAuth();
  const { games, loading } = useLocalData();

  if (user?.role !== 'ADMIN') return <Redirect href="/(app)/main" />;
  const { width } = useWindowDimensions();
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const flatListRef = useRef<FlatList<GameOrPenalty>>(null);

  // Reverse so the last game appears first in the tab bar
  const reversedGames = useMemo(() => [...games].reverse(), [games]);

  const cellSize = Math.floor((width - 32 - COLUMNS * BUTTON_MARGIN) / COLUMNS);

  const handleTabPress = useCallback((idx: number) => {
    setSelectedGameIndex(idx);
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
  }, []);

  const navigateToSelectWho = useCallback((game: GameOrPenalty, part: Part, stay: boolean) => {
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
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setSelectedGameIndex(viewableItems[0].index);
      }
    },
    []
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-gray-500">
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
        style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexGrow: 0 }}
        contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 }}
      >
        {reversedGames.map((game, idx) => (
          <TouchableOpacity
            key={game.id}
            onPress={() => handleTabPress(idx)}
            style={[
              { marginRight: 16, paddingBottom: 8, borderBottomWidth: 2 },
              idx === selectedGameIndex
                ? { borderBottomColor: theme.primary }
                : { borderBottomColor: 'transparent' },
            ]}
          >
            <Text
              style={{
                fontFamily: idx === selectedGameIndex ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                color: idx === selectedGameIndex ? theme.primary : '#6b7280',
              }}
            >
              {game.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Swipeable part buttons — one page per game */}
      <FlatList
        ref={flatListRef}
        data={reversedGames}
        keyExtractor={(g) => String(g.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        disableIntervalMomentum
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item: game }) => (
          <ScrollView style={{ width }} contentContainerStyle={{ padding: 16 }}>
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
        )}
      />

      {/* Bottom bar */}
      <View className="flex-row border-t border-gray-200 bg-white">
        <TouchableOpacity
          className="flex-1 py-3 items-center gap-1"
          onPress={() => router.push('/(app)/overview')}
        >
          <BarChart2 size={18} color="#4b5563" />
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-gray-600">
            {t('working.overview')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center gap-1"
          onPress={() => router.push('/(app)/log')}
        >
          <ClipboardList size={18} color="#4b5563" />
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-gray-600">
            {t('working.log')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center gap-1"
          onPress={() => router.push('/(app)/main')}
        >
          <X size={18} color={theme.accent} />
          <Text style={{ fontFamily: 'DMSans_400Regular', color: theme.accent }} className="text-xs">
            {t('working.end')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
