import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { BASE_URL } from '../../constants/api';

export function setupNotificationHandlers() {
  // Handle notification tap while app is running
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    const type = data?.type as string | undefined;

    if (type === 'event' && data.eventId) {
      // Open browser to the event detail page
      const url = `${BASE_URL}/events/${data.eventId}`;
      import('expo-linking').then(({ default: Linking }) => Linking.openURL(url));
    } else if (type === 'news') {
      const url = `${BASE_URL}/news`;
      import('expo-linking').then(({ default: Linking }) => Linking.openURL(url));
    } else if (type === 'vote') {
      const url = `${BASE_URL}/votes`;
      import('expo-linking').then(({ default: Linking }) => Linking.openURL(url));
    }
  });

  return () => subscription.remove();
}
