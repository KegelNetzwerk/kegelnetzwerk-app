import { Modal, View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Zap } from 'lucide-react-native';
import { useColors } from '../hooks/useColors';
import type { GameOrPenalty, Part } from '../models/GameOrPenalty';
import type { PinnedPart } from '../storage/workingSettings';

const COLUMNS = 3;
const BUTTON_MARGIN = 8;

interface Props {
  visible: boolean;
  memberName: string;
  games: GameOrPenalty[];
  pinnedParts: PinnedPart[];
  onSelect: (game: GameOrPenalty, part: Part) => void;
  onCancel: () => void;
}

export default function ShortcutMenu({ visible, memberName, games, pinnedParts, onSelect, onCancel }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const { width } = useWindowDimensions();

  // Modal has 48px horizontal padding (24 each side)
  const modalWidth = width - 48;
  const cellSize = Math.min(
    Math.floor((modalWidth - COLUMNS * BUTTON_MARGIN * 2) / COLUMNS),
    160
  );

  const shortcuts = pinnedParts.flatMap(({ gameId, partId }) => {
    const game = games.find((g) => g.id === gameId);
    const part = game?.parts.find((p) => p.id === partId);
    if (!game || !part) return [];
    return [{ game, part }];
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: c.card, borderRadius: 16, overflow: 'hidden', maxHeight: '80%' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: c.divider }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Zap size={18} color={c.primaryFg} />
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: c.textStrong, flex: 1 }} numberOfLines={1}>
                {memberName}
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={{ marginLeft: 8 }}>
              <X size={20} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          {shortcuts.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', color: c.textFaint, textAlign: 'center' }}>
                {t('shortcutMenu.empty')}
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {shortcuts.map(({ game, part }) => (
                  <TouchableOpacity
                    key={`${game.id}-${part.id}`}
                    onPress={() => onSelect(game, part)}
                    activeOpacity={0.75}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      margin: BUTTON_MARGIN / 2,
                      borderRadius: 12,
                      backgroundColor: c.primaryFg,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontFamily: 'DMSans_700Bold',
                        fontSize: Math.min(16, cellSize * 0.16),
                        textAlign: 'center',
                        paddingHorizontal: 8,
                      }}
                      numberOfLines={3}
                    >
                      {part.name}
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: 'DMSans_400Regular',
                        fontSize: Math.min(11, cellSize * 0.11),
                        textAlign: 'center',
                        paddingHorizontal: 6,
                        marginTop: 4,
                      }}
                      numberOfLines={1}
                    >
                      {game.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
