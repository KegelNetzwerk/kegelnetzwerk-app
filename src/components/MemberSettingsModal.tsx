import { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X, Eye, EyeOff } from 'lucide-react-native';
import { useColors } from '../hooks/useColors';
import MemberAvatar from './MemberAvatar';
import {
  getWorkingSettings,
  saveWorkingSettings,
  type WorkingSettings,
} from '../storage/workingSettings';
import type { Member } from '../models/Member';

interface Props {
  visible: boolean;
  members: Member[];
  onClose: () => void;
}

export default function MemberSettingsModal({ visible, members, onClose }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<WorkingSettings>({ hiddenGameIds: [], hiddenMemberIds: [], pinnedParts: [] });

  useEffect(() => {
    if (visible) getWorkingSettings().then(setSettings);
  }, [visible]);

  async function toggleMember(memberId: number) {
    const next: WorkingSettings = {
      ...settings,
      hiddenMemberIds: settings.hiddenMemberIds.includes(memberId)
        ? settings.hiddenMemberIds.filter((id) => id !== memberId)
        : [...settings.hiddenMemberIds, memberId],
    };
    setSettings(next);
    await saveWorkingSettings(next);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: insets.bottom }}>
          {/* Header */}
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: c.divider }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: c.textStrong }}>
                {t('memberSettings.title')}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color={c.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
              <Eye size={14} color={c.textMuted} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.textMuted }}>
                {t('memberSettings.legendShowHide')}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {members.map((member) => {
              const isHidden = settings.hiddenMemberIds.includes(member.id);
              return (
                <TouchableOpacity
                  key={member.id}
                  onPress={() => toggleMember(member.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: c.divider,
                  }}
                >
                  {/* Avatar */}
                  <View style={{ marginRight: 12 }}>
                    <MemberAvatar pic={member.pic} size={36} />
                  </View>

                  <Text style={{
                    fontFamily: 'DMSans_500Medium',
                    fontSize: 15,
                    color: isHidden ? c.textFaint : c.textStrong,
                    flex: 1,
                  }}>
                    {member.nickname}
                  </Text>

                  {isHidden
                    ? <EyeOff size={20} color={c.textFaint} />
                    : <Eye size={20} color={c.primaryFg} />
                  }
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
