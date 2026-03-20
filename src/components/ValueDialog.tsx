import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';

interface ValueDialogProps {
  visible: boolean;
  partName: string;
  memberName: string;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

export default function ValueDialog({
  visible,
  partName,
  memberName,
  onConfirm,
  onCancel,
}: ValueDialogProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  function handleConfirm() {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    onConfirm(val);
    setInput('');
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center items-center bg-black/50"
      >
        <View className="bg-white rounded-2xl p-6 mx-6 w-full max-w-sm shadow-xl">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-base text-gray-800 mb-1"
          >
            {partName}
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-gray-500 mb-4">
            {memberName}
          </Text>

          <TextInput
            style={{ fontFamily: 'DMSans_700Bold' }}
            className="border border-gray-300 rounded-lg p-3 text-center text-2xl text-gray-900 mb-4"
            value={input}
            onChangeText={setInput}
            keyboardType="numeric"
            autoFocus
            placeholder="0"
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
              onPress={onCancel}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-gray-600">
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-primary rounded-lg py-3 items-center"
              onPress={handleConfirm}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-white">
                {t('common.confirm')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
