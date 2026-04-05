import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerPushTokenWithServer() {
  try {
    const projectId =
      Constants.easConfig?.projectId ??
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined);
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    await apiFetch('/api/app/push-token', {
      method: 'POST',
      body: JSON.stringify({ token: tokenData.data }),
    });
  } catch {
    // Non-fatal — push notifications are best-effort
  }
}
