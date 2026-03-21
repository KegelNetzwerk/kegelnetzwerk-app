import { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { BASE_URL } from '../../constants/api';
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
  const theme = useTheme();
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
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#111827' }}>
              {t('memberSettings.title')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#6b7280" />
            </TouchableOpacity>
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
                    borderBottomColor: '#f3f4f6',
                  }}
                >
                  {/* Avatar */}
                  {member.pic ? (
                    <Image
                      source={{ uri: `${BASE_URL}${member.pic}` }}
                      style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
                    />
                  ) : (
                    <View style={{
                      width: 36, height: 36, borderRadius: 18, marginRight: 12,
                      backgroundColor: isHidden ? '#e5e7eb' : theme.primary,
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Text style={{ color: '#fff', fontFamily: 'DMSans_700Bold', fontSize: 14 }}>
                        {member.nickname.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <Text style={{
                    fontFamily: 'DMSans_500Medium',
                    fontSize: 15,
                    color: isHidden ? '#9ca3af' : '#111827',
                    flex: 1,
                  }}>
                    {member.nickname}
                  </Text>

                  {isHidden
                    ? <EyeOff size={20} color="#9ca3af" />
                    : <Eye size={20} color={theme.primary} />
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
