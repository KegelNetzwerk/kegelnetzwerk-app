import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkSync(onOnline: () => void) {
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = !!(state.isConnected && state.isInternetReachable !== false);
      if (wasOffline.current && isOnline) {
        onOnline();
      }
      wasOffline.current = !isOnline;
    });
    return unsubscribe;
  }, [onOnline]);
}
