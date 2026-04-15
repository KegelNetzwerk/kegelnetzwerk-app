import ClubBackground from '../../src/components/ClubBackground';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_URL } from '../../constants/api';
import { router, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  Bell,
  Settings,
  ExternalLink,
} from 'lucide-react-native';
import { useLayoutEffect, useState, useEffect } from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { useColors } from '../../src/hooks/useColors';
import SyncStatus from '../../src/components/SyncStatus';
import { fetchFinanceSummary, type FinanceSummary } from '../../src/api/finance';

interface MenuButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function MenuButton({ label, icon, onPress }: MenuButtonProps) {
  const c = useColors();
  return (
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
      onPress={onPress}
    >
      <View className="w-8 items-center">{icon}</View>
      <Text
        style={{
          fontFamily: 'DMSans_600SemiBold',
          color: c.text,
          flex: 1,
          fontSize: 18,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function buildPayPalUrl(paypal: string, amount: number): string {
  const base = paypal.startsWith('http') ? paypal : `https://paypal.me/${paypal}`;
  return `${base}/${Math.abs(amount).toFixed(2)}`;
}

export default function MainScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [financeLoading, setFinanceLoading] = useState(true);

  useEffect(() => {
    fetchFinanceSummary()
      .then(setFinance)
      .catch((e) => console.error('[finance] fetch failed:', e))
      .finally(() => setFinanceLoading(false));
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/(app)/settings')} style={{ marginRight: 12 }}>
          <Settings size={20} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View className="flex-1">
      <ClubBackground />
      {/* Gradient header with logo */}
      <View style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 1,
      }}>
      <LinearGradient
        colors={[c.theme.primary, c.theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingTop: 56, paddingBottom: 24, alignItems: 'center' }}
      >
        <TouchableOpacity onPress={() => Linking.openURL('https://KegelNetzwerk.de')} activeOpacity={0.75}>
          <Image
            source={require('../../assets/splash_logo.png')}
            style={{ height: 120, width: 280, resizeMode: 'contain', marginBottom: 10 }}
          />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center', alignItems: 'center',
            padding: 5,
          }}>
            {user?.clubPic ? (
              <Image
                source={{ uri: `${BASE_URL}${user.clubPic}` }}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
            ) : (
              <Text style={{ color: '#fff', fontFamily: 'DMSans_700Bold', fontSize: 16 }}>
                {user?.clubName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
              {user?.clubName}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {user?.nickname}
            </Text>
          </View>
        </View>
      </LinearGradient>
      </View>

      <SyncStatus />

      {/* Balance card — always visible */}
      <View style={{
        marginHorizontal: 24,
        marginTop: 16,
        backgroundColor: c.card,
        borderLeftWidth: 4,
        borderLeftColor: finance && finance.balance < 0 ? '#c0392b' : finance && finance.balance > 0 ? '#27ae60' : c.primaryFg,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
          {t('main.balance')}
        </Text>
        {financeLoading ? (
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: c.textMuted }}>
            —
          </Text>
        ) : finance ? (
          <Text style={{
            fontFamily: 'DMSans_700Bold',
            fontSize: 22,
            color: finance.balance < 0 ? '#c0392b' : finance.balance > 0 ? '#27ae60' : c.text,
          }}>
            {finance.balance < 0 ? '–' : finance.balance > 0 ? '+' : ''}{Math.abs(finance.balance).toFixed(2)} €
          </Text>
        ) : (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: c.textMuted }}>
            —
          </Text>
        )}

        {finance && finance.balance < 0 && finance.paypal ? (
          <TouchableOpacity
            style={{
              marginTop: 12,
              backgroundColor: '#009cde',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onPress={() => Linking.openURL(buildPayPalUrl(finance.paypal!, finance.balance))}
          >
            <ExternalLink size={16} color="#fff" />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: '#fff', fontSize: 14 }}>
              {t('main.payViaPayPal')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Menu */}
      <View className="flex-1 p-6 gap-3">
        {user?.role === 'ADMIN' && (
          <MenuButton
            icon={<ClipboardList size={24} color={c.primaryFg} />}
            label={t('main.enterResults')}
            onPress={() => router.push('/(app)/working')}
          />
        )}
        <MenuButton
          icon={<Bell size={24} color={c.primaryFg} />}
          label={t('main.notifications')}
          onPress={() => router.push('/(app)/notifications')}
        />
      </View>

      {/* FoelliX footer */}
      <TouchableOpacity
        style={{ paddingBottom: 24 + insets.bottom }}
        className="items-center pt-2 gap-1"
        onPress={() => Linking.openURL('https://FoelliX.de')}
        activeOpacity={0.6}
      >
        <View className="flex-row items-center gap-1.5">
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: c.isDark ? 'rgba(255,255,255,0.7)' : c.textMuted }}>
            KegelNetzwerk.de by
          </Text>
          <Image
            source={require('../../assets/fx.png')}
            style={{ height: 42, width: 120, resizeMode: 'contain' }}
          />
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: c.isDark ? 'rgba(255,255,255,0.7)' : c.textMuted }}>
            · est. 2015 · revamped 2026
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
