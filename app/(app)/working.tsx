import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalData } from '../../src/hooks/useLocalData';
import PartButton from '../../src/components/PartButton';
import type { GameOrPenalty, Part } from '../../src/models/GameOrPenalty';

const BUTTON_MARGIN = 8;
const COLUMNS = 3;

export default function WorkingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('working.title'), headerShown: true });
  }, [navigation, t]);

  const { games, loading } = useLocalData();
  const { width } = useWindowDimensions();
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);

  const cellSize = Math.floor((width - 32 - COLUMNS * BUTTON_MARGIN) / COLUMNS);

  const currentGame: GameOrPenalty | undefined = games[selectedGameIndex];

  const handlePartPress = useCallback(
    (game: GameOrPenalty, part: Part) => {
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

  if (games.length === 0) {
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
        {games.map((game, idx) => (
          <TouchableOpacity
            key={game.id}
            onPress={() => setSelectedGameIndex(idx)}
            className={`px-4 py-2 rounded-full ${
              idx === selectedGameIndex ? 'bg-primary' : 'bg-gray-100'
            }`}
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

      {/* Part buttons grid */}
      {currentGame ? (
        <ScrollView className="flex-1 p-4">
          <View className="flex-row flex-wrap justify-start">
            {currentGame.parts.map((part) => (
              <PartButton
                key={part.id}
                label={part.name}
                size={cellSize}
                onPress={() => handlePartPress(currentGame, part)}
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      {/* Bottom bar */}
      <View className="flex-row border-t border-gray-200 bg-white">
        <TouchableOpacity
          className="flex-1 py-3 items-center"
          onPress={() => router.push('/(app)/overview')}
        >
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-gray-600">
            📊 {t('working.overview')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center"
          onPress={() => router.push('/(app)/log')}
        >
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-gray-600">
            📋 {t('working.log')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center"
          onPress={() => router.push('/(app)/main')}
        >
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-accent">
            ✕ {t('working.end')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
