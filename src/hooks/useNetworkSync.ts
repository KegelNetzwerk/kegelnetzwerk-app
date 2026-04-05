import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkSync(onOnline: () => void) {
  const wasOffline = useRef(false);
  const callbackRef = useRef(onOnline);
  callbackRef.current = onOnline;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = !!(state.isConnected && state.isInternetReachable !== false);
      if (wasOffline.current && isOnline) {
        callbackRef.current();
      }
      wasOffline.current = !isOnline;
    });
    return unsubscribe;
  }, []); // stable — callback changes are handled via ref
}
