import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Camera, Trash2 } from 'lucide-react-native';
import { useUIColors } from '../hooks/useUIColors';
import { useTheme } from '../hooks/useTheme';
import type { Guest } from '../models/Guest';

interface GuestDialogProps {
  visible: boolean;
  guest?: Guest; // undefined = add mode, defined = edit mode
  onSave: (guest: Guest) => void;
  onDelete?: (guestId: string) => void;
  onCancel: () => void;
}

export default function GuestDialog({ visible, guest, onSave, onDelete, onCancel }: GuestDialogProps) {
  const { t } = useTranslation();
  const ui = useUIColors();
  const theme = useTheme();

  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [picUri, setPicUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      setNickname(guest?.nickname ?? '');
      setFirstName(guest?.firstName ?? '');
      setLastName(guest?.lastName ?? '');
      setPicUri(guest?.picUri);
    }
  }, [visible, guest]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPicUri(result.assets[0].uri);
    }
  }

  function handleSave() {
    const nick = nickname.trim();
    if (!nick) return;
    onSave({
      id: guest?.id ?? '',
      nickname: nick,
      firstName: firstName.trim() || nick,
      lastName: lastName.trim() || nick,
      picUri,
    });
  }

  async function handleDelete() {
    if (!guest || !onDelete) return;
    if (Platform.OS === 'web') {
      if (window.confirm(t('selectwho.guestDialog.deleteConfirm', { name: guest.nickname }))) {
        onDelete(guest.id);
      }
    } else {
      Alert.alert(
        t('selectwho.guestDialog.deleteTitle'),
        t('selectwho.guestDialog.deleteConfirm', { name: guest.nickname }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.delete'), style: 'destructive', onPress: () => onDelete(guest.id) },
        ]
      );
    }
  }

  const avatarSize = 80;
  const isEdit = !!guest;
  const canSave = nickname.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <View style={{ backgroundColor: ui.card, borderRadius: 20, marginHorizontal: 24, width: '100%', maxWidth: 380, overflow: 'hidden' }}>
          <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">

            {/* Title */}
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: ui.text, marginBottom: 20 }}>
              {isEdit ? t('selectwho.guestDialog.editTitle') : t('selectwho.guestDialog.addTitle')}
            </Text>

            {/* Photo picker */}
            <TouchableOpacity
              onPress={pickImage}
              style={{ alignSelf: 'center', marginBottom: 20 }}
            >
              <View style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                backgroundColor: ui.surface,
                borderWidth: 2,
                borderColor: ui.inputBorder,
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {picUri ? (
                  <Image source={{ uri: picUri }} style={{ width: avatarSize, height: avatarSize }} />
                ) : (
                  <>
                    <Camera size={24} color={ui.textMuted} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: ui.textMuted, marginTop: 4 }}>
                      {t('selectwho.guestDialog.addPhoto')}
                    </Text>
                  </>
                )}
              </View>
              {picUri && (
                <View style={{
                  position: 'absolute', bottom: 0, right: 0,
                  backgroundColor: theme.primary, borderRadius: 12, padding: 4,
                }}>
                  <Camera size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Nickname (required) */}
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: ui.textSecondary, marginBottom: 4 }}>
              {t('selectwho.guestDialog.nickname')} <Text style={{ color: '#ef4444' }}>*</Text>
            </Text>
            <TextInput
              style={{
                fontFamily: 'DMSans_400Regular',
                borderWidth: 1,
                borderColor: nickname.trim() ? ui.inputBorder : '#ef4444',
                borderRadius: 8,
                padding: 10,
                fontSize: 15,
                color: ui.text,
                backgroundColor: ui.inputBg,
                marginBottom: 12,
              }}
              value={nickname}
              onChangeText={setNickname}
              placeholder={t('selectwho.guestDialog.nicknamePlaceholder')}
              placeholderTextColor={ui.textFaint}
              autoFocus={!isEdit}
              returnKeyType="next"
            />

            {/* First name */}
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: ui.textSecondary, marginBottom: 4 }}>
              {t('selectwho.guestDialog.firstName')}
            </Text>
            <TextInput
              style={{
                fontFamily: 'DMSans_400Regular',
                borderWidth: 1,
                borderColor: ui.inputBorder,
                borderRadius: 8,
                padding: 10,
                fontSize: 15,
                color: ui.text,
                backgroundColor: ui.inputBg,
                marginBottom: 12,
              }}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={nickname.trim() || t('selectwho.guestDialog.fallbackHint')}
              placeholderTextColor={ui.textFaint}
              returnKeyType="next"
            />

            {/* Last name */}
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: ui.textSecondary, marginBottom: 4 }}>
              {t('selectwho.guestDialog.lastName')}
            </Text>
            <TextInput
              style={{
                fontFamily: 'DMSans_400Regular',
                borderWidth: 1,
                borderColor: ui.inputBorder,
                borderRadius: 8,
                padding: 10,
                fontSize: 15,
                color: ui.text,
                backgroundColor: ui.inputBg,
                marginBottom: 20,
              }}
              value={lastName}
              onChangeText={setLastName}
              placeholder={nickname.trim() || t('selectwho.guestDialog.fallbackHint')}
              placeholderTextColor={ui.textFaint}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {isEdit && onDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: ui.cancelBg, borderRadius: 8, height: 44, justifyContent: 'center', alignItems: 'center' }}
                onPress={onCancel}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', color: ui.cancelText }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: canSave ? theme.primary : ui.divider, borderRadius: 8, height: 44, justifyContent: 'center', alignItems: 'center' }}
                onPress={handleSave}
                disabled={!canSave}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: canSave ? '#fff' : ui.textFaint }}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
