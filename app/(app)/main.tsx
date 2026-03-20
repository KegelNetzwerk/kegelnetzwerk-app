import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import SyncStatus from '../../src/components/SyncStatus';

interface MenuButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
}

function MenuButton({ label, icon, onPress }: MenuButtonProps) {
  return (
    <TouchableOpacity
      className="bg-white border border-gray-200 rounded-xl p-5 flex-row items-center gap-4 shadow-sm active:bg-gray-50"
      onPress={onPress}
    >
      <Text className="text-3xl">{icon}</Text>
      <Text className="text-lg font-semibold text-gray-800">{label}</Text>
    </TouchableOpacity>
  );
}

export default function MainScreen() {
  const { user, signOut } = useAuth();

  return (
    <View className="flex-1 bg-gray-50">
      <SyncStatus />

      <View className="flex-1 p-6 justify-center">
        {/* Header */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-primary">KegelNetzwerk</Text>
          <Text className="text-gray-500 mt-1">{user?.clubName}</Text>
          <Text className="text-sm text-gray-400 mt-0.5">{user?.nickname}</Text>
        </View>

        {/* Menu */}
        <View className="gap-4">
          <MenuButton
            icon="🎳"
            label="Ergebnisse eingeben"
            onPress={() => router.push('/(app)/working')}
          />
          <MenuButton
            icon="📊"
            label="Übersicht"
            onPress={() => router.push('/(app)/overview')}
          />
          <MenuButton
            icon="🔔"
            label="Benachrichtigungen"
            onPress={() => router.push('/(app)/notifications')}
          />
          <MenuButton
            icon="⚙️"
            label="Einstellungen"
            onPress={() => router.push('/(app)/settings')}
          />
          <MenuButton
            icon="✕"
            label="Abmelden"
            onPress={async () => {
              await signOut();
            }}
          />
        </View>
      </View>
    </View>
  );
}
