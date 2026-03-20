import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getQueue } from '../storage/syncQueue';

export default function SyncStatus() {
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

  return (
    <View className="flex-row items-center gap-2 px-4 py-1 bg-yellow-50 border-b border-yellow-200">
      <View className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
      <Text className="text-xs text-gray-600">
        {online ? '' : 'Offline – '}
        {pending > 0 ? `${pending} Ergebnis(se) ausstehend` : ''}
      </Text>
    </View>
  );
}
