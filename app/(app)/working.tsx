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
import { useLocalData } from '../../src/hooks/useLocalData';
import PartButton from '../../src/components/PartButton';
import type { GameOrPenalty, Part } from '../../src/models/GameOrPenalty';

const BUTTON_MARGIN = 8; // 2 * 4px margin per side
const COLUMNS = 3;

export default function WorkingScreen() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Ergebnisse eingeben', headerShown: true });
  }, [navigation]);

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
        <Text className="text-gray-500">Lade Spiele...</Text>
      </View>
    );
  }

  if (games.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-500 text-center">
          Keine Spiele verfügbar. Bitte zuerst Spiele im Webservice anlegen.
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
              idx === selectedGameIndex
                ? 'bg-primary'
                : 'bg-gray-100'
            }`}
          >
            <Text
              className={`font-medium text-sm ${
                idx === selectedGameIndex ? 'text-white' : 'text-gray-700'
              }`}
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
          <Text className="text-xs text-gray-600">📊 Übersicht</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center"
          onPress={() => router.push('/(app)/log')}
        >
          <Text className="text-xs text-gray-600">📋 Protokoll</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center"
          onPress={() => router.push('/(app)/main')}
        >
          <Text className="text-xs text-red-600">✕ Beenden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
