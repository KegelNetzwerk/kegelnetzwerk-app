import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/hooks/useAuth';
import SyncStatus from '../../src/components/SyncStatus';

interface MenuButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuButton({ label, icon, onPress, danger }: MenuButtonProps) {
  return (
    <TouchableOpacity
      className="bg-white border border-gray-200 rounded-xl p-5 flex-row items-center gap-4 shadow-sm active:bg-gray-50"
      onPress={onPress}
    >
      <Text className="text-3xl">{icon}</Text>
      <Text
        style={{ fontFamily: 'DMSans_600SemiBold' }}
        className={`text-lg ${danger ? 'text-accent' : 'text-gray-800'}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function MainScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Gradient header */}
      <LinearGradient
        colors={['#005982', '#3089ac']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingTop: 56, paddingBottom: 28, alignItems: 'center' }}
      >
        <Text
          style={{ fontFamily: 'DMSans_700Bold', fontSize: 26, color: '#fff', letterSpacing: 0.5 }}
        >
          KegelNetzwerk
        </Text>
        <Text
          style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}
        >
          {user?.clubName}
        </Text>
        <Text
          style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}
        >
          {user?.nickname}
        </Text>
      </LinearGradient>

      <SyncStatus />

      {/* Menu */}
      <View className="flex-1 p-6 gap-4">
        <MenuButton
          icon="🎳"
          label={t('main.enterResults')}
          onPress={() => router.push('/(app)/working')}
        />
        <MenuButton
          icon="📊"
          label={t('main.overview')}
          onPress={() => router.push('/(app)/overview')}
        />
        <MenuButton
          icon="🔔"
          label={t('main.notifications')}
          onPress={() => router.push('/(app)/notifications')}
        />
        <MenuButton
          icon="⚙️"
          label={t('main.settings')}
          onPress={() => router.push('/(app)/settings')}
        />
        <MenuButton
          icon="↩"
          label={t('main.logout')}
          danger
          onPress={async () => {
            await signOut();
          }}
        />
      </View>
    </View>
  );
}
