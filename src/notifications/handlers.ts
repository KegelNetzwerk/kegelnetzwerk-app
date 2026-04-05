import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { BASE_URL } from '../../constants/api';

function openForNotification(data: Record<string, unknown>) {
  const type = data?.type as string | undefined;
  let url: string | null = null;

  if (type === 'event' && data.eventId) {
    url = `${BASE_URL}/events/${data.eventId}`;
  } else if (type === 'news') {
    url = data.newsId ? `${BASE_URL}/news/${data.newsId}` : `${BASE_URL}/news`;
  } else if (type === 'vote') {
    url = data.voteId ? `${BASE_URL}/votes/${data.voteId}` : `${BASE_URL}/votes`;
  }

  if (url) Linking.openURL(url);
}

export function setupNotificationHandlers() {
  // Handle taps while the app is running (foreground or background)
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    openForNotification(data);
  });

  // Handle taps that cold-started the app (notification tapped while app was killed)
  // Not supported on web
  if (Platform.OS !== 'web') {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, unknown>;
      openForNotification(data);
    });
  }

  return () => subscription.remove();
}
