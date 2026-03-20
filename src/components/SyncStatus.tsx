import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import { getQueue } from '../storage/syncQueue';

export default function SyncStatus() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOnline(!!(state.isConnected && state.isInternetReachable !== false));
    });
    getQueue().then((q) => setPending(q.length));
    return unsub;
  }, []);

  if (pending === 0 && online) return null;

  const pendingText = t(pending === 1 ? 'sync.pending_one' : 'sync.pending_other', { count: pending });

  return (
    <View className="flex-row items-center gap-2 px-4 py-1 bg-yellow-50 border-b border-yellow-200">
      <View className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
      <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-gray-600">
        {!online ? `${t('sync.offline')} ` : ''}
        {pending > 0 ? pendingText : ''}
      </Text>
    </View>
  );
}
