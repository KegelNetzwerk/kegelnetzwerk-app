import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, ClipboardList, X } from 'lucide-react-native';
import { useLocalData } from '../../src/hooks/useLocalData';
import { useTheme } from '../../src/hooks/useTheme';
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

  const { games, loading } = useLocalData();
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

  const handlePartPress = useCallback((game: GameOrPenalty, part: Part) => {
    router.push({
      pathname: '/(app)/selectwho',
      params: {
        gameId: String(game.id),
        gameName: game.name,
        partId: String(part.id),
        partName: part.name,
        partValue: part.value !== null ? String(part.value) : '',
        partOnce: part.once ? '1' : '0',
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
    <View className="flex-1 bg-gray-50">
      {/* Game tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-200"
        contentContainerClassName="px-2 py-2 gap-2"
      >
        {reversedGames.map((game, idx) => (
          <TouchableOpacity
            key={game.id}
            onPress={() => handleTabPress(idx)}
            style={idx === selectedGameIndex ? { backgroundColor: theme.primary } : undefined}
            className={`px-4 py-2 rounded-full ${idx === selectedGameIndex ? '' : 'bg-gray-100'}`}
          >
            <Text
              style={{ fontFamily: 'DMSans_500Medium' }}
              className={`text-sm ${idx === selectedGameIndex ? 'text-white' : 'text-gray-700'}`}
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
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item: game }) => (
          <ScrollView style={{ width }} contentContainerStyle={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {game.parts.map((part) => (
                <PartButton
                  key={part.id}
                  label={part.name}
                  size={cellSize}
                  onPress={() => handlePartPress(game, part)}
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
