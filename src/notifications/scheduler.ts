import * as Notifications from 'expo-notifications';
import { subHours, isFuture } from 'date-fns';
import type { AppEvent } from '../api/events';
import { getNotificationState } from '../storage/notificationState';
import i18n from '../i18n';

const NOTIFY_BEFORE_HOURS = 24;

export async function scheduleEventDeadlineNotifications(events: AppEvent[]) {
  const state = await getNotificationState();
  if (!state.enabled.events) return;

  for (const event of events) {
    if (event.hasCancelled) continue;

    const deadline = new Date(event.cancelDeadline);
    const notifyAt = subHours(deadline, NOTIFY_BEFORE_HOURS);

    if (!isFuture(notifyAt)) continue;

    const identifier = `event-deadline-${event.id}`;

    // Cancel existing before rescheduling
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: i18n.t('notifications.push.eventTitle'),
        body: i18n.t('notifications.push.eventBody', { subject: event.subject }),
        data: { type: 'event', eventId: event.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyAt },
    });
  }
}

export async function cancelEventDeadlineNotification(eventId: number) {
  await Notifications.cancelScheduledNotificationAsync(`event-deadline-${eventId}`).catch(() => {});
}
