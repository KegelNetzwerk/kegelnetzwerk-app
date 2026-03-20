import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  BarChart2,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import SyncStatus from '../../src/components/SyncStatus';

interface MenuButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
  accentColor?: string;
}

function MenuButton({ label, icon, onPress, danger, accentColor }: MenuButtonProps) {
  return (
    <TouchableOpacity
      className="bg-white border border-gray-200 rounded-xl p-5 flex-row items-center gap-4 shadow-sm active:bg-gray-50"
      onPress={onPress}
    >
      <View className="w-8 items-center">{icon}</View>
      <Text
        style={{
          fontFamily: 'DMSans_600SemiBold',
          color: danger ? (accentColor ?? '#a91a1a') : '#1f2937',
          flex: 1,
          fontSize: 18,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function MainScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const theme = useTheme();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Gradient header with logo */}
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingTop: 56, paddingBottom: 24, alignItems: 'center' }}
      >
        <Image
          source={require('../../assets/splash_logo.png')}
          style={{ height: 72, width: 180, resizeMode: 'contain', marginBottom: 10 }}
        />
        <Text
          style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}
        >
          {user?.clubName}
        </Text>
        <Text
          style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}
        >
          {user?.nickname}
        </Text>
      </LinearGradient>

      <SyncStatus />

      {/* Menu */}
      <View className="flex-1 p-6 gap-3">
        <MenuButton
          icon={<ClipboardList size={24} color={theme.primary} />}
          label={t('main.enterResults')}
          onPress={() => router.push('/(app)/working')}
        />
        <MenuButton
          icon={<BarChart2 size={24} color={theme.primary} />}
          label={t('main.overview')}
          onPress={() => router.push('/(app)/overview')}
        />
        <MenuButton
          icon={<Bell size={24} color={theme.primary} />}
          label={t('main.notifications')}
          onPress={() => router.push('/(app)/notifications')}
        />
        <MenuButton
          icon={<Settings size={24} color={theme.primary} />}
          label={t('main.settings')}
          onPress={() => router.push('/(app)/settings')}
        />
        <MenuButton
          icon={<LogOut size={24} color={theme.accent} />}
          label={t('main.logout')}
          danger
          accentColor={theme.accent}
          onPress={async () => { await signOut(); }}
        />
      </View>

      {/* FoelliX footer */}
      <TouchableOpacity
        className="items-center pb-6 pt-2 gap-1"
        onPress={() => Linking.openURL('https://FoelliX.de')}
        activeOpacity={0.6}
      >
        <View className="flex-row items-center gap-1.5">
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6b7280' }}>
            KegelNetzwerk.de by
          </Text>
          <Image
            source={require('../../assets/fx.png')}
            style={{ height: 14, width: 40, resizeMode: 'contain' }}
          />
        </View>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#9ca3af' }}>
          est. 2015 · revamped 2026
        </Text>
      </TouchableOpacity>
    </View>
  );
}
