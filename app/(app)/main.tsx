import ClubBackground from '../../src/components/ClubBackground';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  BarChart2,
  Bell,
  Settings,
} from 'lucide-react-native';
import { useLayoutEffect } from 'react';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useColors } from '../../src/hooks/useColors';
import SyncStatus from '../../src/components/SyncStatus';

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

export default function MainScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const c = useColors();
  const navigation = useNavigation();

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
          icon={<BarChart2 size={24} color={c.primaryFg} />}
          label={t('main.overview')}
          onPress={() => router.push('/(app)/overview')}
        />
        <MenuButton
          icon={<Bell size={24} color={c.primaryFg} />}
          label={t('main.notifications')}
          onPress={() => router.push('/(app)/notifications')}
        />
      </View>

      {/* FoelliX footer */}
      <TouchableOpacity
        className="items-center pb-6 pt-2 gap-1"
        onPress={() => Linking.openURL('https://FoelliX.de')}
        activeOpacity={0.6}
      >
        <View className="flex-row items-center gap-1.5">
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: c.textMuted }}>
            KegelNetzwerk.de by
          </Text>
          <Image
            source={require('../../assets/fx.png')}
            style={{ height: 42, width: 120, resizeMode: 'contain' }}
          />
        </View>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: c.textFaint }}>
          est. 2015 · revamped 2026
        </Text>
      </TouchableOpacity>
    </View>
  );
}
