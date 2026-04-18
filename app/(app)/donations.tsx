import ClubBackground from '../../src/components/ClubBackground';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Heart, Dices } from 'lucide-react-native';
import { useColors } from '../../src/hooks/useColors';
import { fetchFinanceSummary } from '../../src/api/finance';
import { postDonate } from '../../src/api/donations';
import ToastStack, { type ToastItem } from '../../src/components/Toast';

export default function DonationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('donations.title'), headerShown: true });
  }, [navigation, t]);

  const c = useColors();
  const insets = useSafeAreaInsets();

  const [kncBalance, setKncBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [donateInput, setDonateInput] = useState('');
  const [donating, setDonating] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function showToast(message: string) {
    const id = String(++toastIdRef.current);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => removeToast(id), 2500);
  }

  useEffect(() => {
    fetchFinanceSummary()
      .then((d) => setKncBalance(d.kncBalance))
      .catch(() => setKncBalance(0))
      .finally(() => setLoading(false));
  }, []);

  async function handleDonate() {
    const amt = Number.parseFloat(donateInput.replace(',', '.'));
    if (Number.isNaN(amt) || amt <= 0) {
      showToast(t('donations.invalidAmount'));
      return;
    }
    setDonating(true);
    try {
      const result = await postDonate(amt);
      setKncBalance(result.kncBalance);
      setDonateModalVisible(false);
      setDonateInput('');
      showToast(t('donations.success', { knc: Math.round(amt * 100) }));
    } catch {
      showToast(t('donations.error'));
    } finally {
      setDonating(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ClubBackground />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 12,
          paddingBottom: 24 + insets.bottom,
        }}
      >
        {/* KNC balance card */}
        <View
          style={{
            backgroundColor: c.card,
            borderLeftWidth: 4,
            borderLeftColor: '#d97706',
            borderRadius: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: c.textMuted, textTransform: 'uppercase' }}>
            {t('donations.kncBalance')}
          </Text>
          {loading ? (
            <ActivityIndicator color="#d97706" style={{ marginTop: 8 }} />
          ) : (
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 28, color: '#d97706', marginTop: 2 }}>
              {(kncBalance ?? 0).toFixed(0)} KNC
            </Text>
          )}
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: c.textMuted, marginTop: 2 }}>
            KegelNetzwerk Coins
          </Text>
        </View>

        {/* Donate button */}
        <TouchableOpacity
          style={{
            backgroundColor: c.card,
            borderLeftWidth: 4,
            borderLeftColor: c.primaryFg,
            borderRadius: 12,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}
          onPress={() => setDonateModalVisible(true)}
        >
          <View style={{ width: 32, alignItems: 'center' }}>
            <Heart size={24} color={c.primaryFg} />
          </View>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: c.text }}>
            {t('donations.donate')}
          </Text>
        </TouchableOpacity>

        {/* Slot Machine button */}
        <TouchableOpacity
          style={{
            backgroundColor: c.card,
            borderLeftWidth: 4,
            borderLeftColor: c.primaryFg,
            borderRadius: 12,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}
          onPress={() => showToast(t('donations.comingSoon'))}
        >
          <View style={{ width: 32, alignItems: 'center' }}>
            <Dices size={24} color={c.primaryFg} />
          </View>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: c.text }}>
            {t('donations.slotMachine')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ToastStack toasts={toasts} />

      {/* Donate modal */}
      <Modal
        visible={donateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDonateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              width: '85%',
              gap: 16,
            }}
          >
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#111' }}>
              {t('donations.modal.title')}
            </Text>
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#555' }}>
                {t('donations.modal.amountLabel')}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  padding: 12,
                  fontFamily: 'DMSans_400Regular',
                  fontSize: 16,
                  color: '#111',
                }}
                placeholder={t('donations.modal.amountPlaceholder')}
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={donateInput}
                onChangeText={setDonateInput}
                autoFocus
              />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#d97706' }}>
                {t('donations.modal.exchangeRate')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => { setDonateModalVisible(false); setDonateInput(''); }}
                disabled={donating}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                }}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: '#555' }}>
                  {t('donations.modal.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDonate}
                disabled={donating}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: '#d97706',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {donating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Heart size={14} color="#fff" />
                )}
                <Text style={{ fontFamily: 'DMSans_600SemiBold', color: '#fff' }}>
                  {t('donations.modal.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
