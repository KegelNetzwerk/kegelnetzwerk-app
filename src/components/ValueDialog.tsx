import { useState, useRef } from 'react';
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
import { useColors } from '../hooks/useColors';

interface ValueDialogProps {
  visible: boolean;
  partName: string;
  memberName: string;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

const NUMPAD = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

export default function ValueDialog({
  visible,
  partName,
  memberName,
  onConfirm,
  onCancel,
}: ValueDialogProps) {
  const { t } = useTranslation();
  const c = useColors();
  const [input, setInput] = useState('');
  const inputRef = useRef<TextInput>(null);

  function handleConfirm() {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val)) return;
    onConfirm(val);
    setInput('');
  }

  function handleNumpad(digit: number) {
    onConfirm(digit);
    setInput('');
  }

  function handleCancel() {
    setInput('');
    onCancel();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      onShow={() => inputRef.current?.focus()}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center items-center bg-black/50"
      >
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-6 w-full max-w-sm shadow-xl">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-base text-gray-800 dark:text-gray-100 mb-1"
          >
            {partName}
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {memberName}
          </Text>

          <TextInput
            ref={inputRef}
            style={{ fontFamily: 'DMSans_700Bold' }}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center text-2xl text-gray-900 dark:text-gray-100 mb-4"
            value={input}
            onChangeText={setInput}
            keyboardType="numeric"
            placeholder="0"
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />

          {/* Numpad 1–9 */}
          <View style={{ gap: 8, marginBottom: 8 }}>
            {NUMPAD.map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
                {row.map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={{
                      flex: 1,
                      backgroundColor: c.theme.primary + '18',
                      borderRadius: 10,
                      paddingVertical: 14,
                      alignItems: 'center',
                    }}
                    onPress={() => handleNumpad(digit)}
                  >
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: c.theme.primary }}>
                      {digit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            {/* 0 row */}
            <TouchableOpacity
              style={{
                backgroundColor: c.theme.primary + '18',
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
              }}
              onPress={() => handleNumpad(0)}
            >
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: c.theme.primary }}>
                0
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity
              className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg py-3 items-center"
              onPress={handleCancel}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-gray-600 dark:text-gray-300">
                {t('valueDialog.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: c.theme.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
              onPress={handleConfirm}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-white">
                {t('valueDialog.confirm')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
