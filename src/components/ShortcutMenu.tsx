import { Modal, View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Zap } from 'lucide-react-native';
import { useColors } from '../hooks/useColors';
import PartButton from './PartButton';

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
            <ScrollView contentContainerStyle={{ padding: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {shortcuts.map(({ game, part }) => (
                  <PartButton
                    key={`${game.id}-${part.id}`}
                    label={part.name}
                    pic={part.pic}
                    size={cellSize}
                    onPress={() => onSelect(game, part)}
                    onLongPress={() => {}}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
