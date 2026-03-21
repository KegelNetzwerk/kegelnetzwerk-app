import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Eye, EyeOff, ChevronRight, ChevronDown, Pin, PinOff } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import {
  getWorkingSettings,
  saveWorkingSettings,
  type WorkingSettings,
  type PinnedPart,
} from '../storage/workingSettings';
import type { GameOrPenalty } from '../models/GameOrPenalty';

interface Props {
  visible: boolean;
  games: GameOrPenalty[];
  onClose: () => void;
}

export default function WorkingSettingsModal({ visible, games, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [settings, setSettings] = useState<WorkingSettings>({ hiddenGameIds: [], pinnedParts: [] });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible) {
      getWorkingSettings().then(setSettings);
    }
  }, [visible]);

  async function toggleGameVisibility(gameId: number) {
    const next: WorkingSettings = {
      ...settings,
      hiddenGameIds: settings.hiddenGameIds.includes(gameId)
        ? settings.hiddenGameIds.filter((id) => id !== gameId)
        : [...settings.hiddenGameIds, gameId],
    };
    setSettings(next);
    await saveWorkingSettings(next);
  }

  async function togglePin(gameId: number, partId: number) {
    const isPinned = settings.pinnedParts.some(
      (p) => p.gameId === gameId && p.partId === partId
    );
    const next: WorkingSettings = {
      ...settings,
      pinnedParts: isPinned
        ? settings.pinnedParts.filter((p) => !(p.gameId === gameId && p.partId === partId))
        : [...settings.pinnedParts, { gameId, partId }],
    };
    setSettings(next);
    await saveWorkingSettings(next);
  }

  function toggleExpand(gameId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(gameId) ? next.delete(gameId) : next.add(gameId);
      return next;
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#111827' }}>
              {t('workingSettings.title')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {games.map((game) => {
              const isHidden = settings.hiddenGameIds.includes(game.id);
              const isExpanded = expanded.has(game.id);
              return (
                <View key={game.id} style={{ marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Game row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 14 }}>
                    <TouchableOpacity onPress={() => toggleGameVisibility(game.id)} style={{ marginRight: 12 }}>
                      {isHidden
                        ? <EyeOff size={20} color="#9ca3af" />
                        : <Eye size={20} color={theme.primary} />
                      }
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: isHidden ? '#9ca3af' : '#111827', flex: 1 }}>
                      {game.name}
                    </Text>
                    <TouchableOpacity onPress={() => toggleExpand(game.id)} style={{ padding: 4 }}>
                      {isExpanded
                        ? <ChevronDown size={18} color="#6b7280" />
                        : <ChevronRight size={18} color="#6b7280" />
                      }
                    </TouchableOpacity>
                  </View>

                  {/* Parts list */}
                  {isExpanded && game.parts.map((part) => {
                    const isPinned = settings.pinnedParts.some(
                      (p) => p.gameId === game.id && p.partId === part.id
                    );
                    return (
                      <TouchableOpacity
                        key={part.id}
                        onPress={() => togglePin(game.id, part.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}
                      >
                        {isPinned
                          ? <Pin size={16} color={theme.primary} style={{ marginRight: 10 }} />
                          : <PinOff size={16} color="#d1d5db" style={{ marginRight: 10 }} />
                        }
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#374151', flex: 1 }}>
                          {part.name}
                        </Text>
                        {isPinned && (
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: theme.primary }}>
                            {t('workingSettings.pinned')}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
