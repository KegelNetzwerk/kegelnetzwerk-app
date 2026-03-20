import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { fetchActivity } from '../api/activity';
import {
  getNotificationState,
  updateLastChecked,
  appendNotificationLog,
} from '../storage/notificationState';

export const BACKGROUND_FETCH_TASK = 'kn-background-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const state = await getNotificationState();
    const since = state.lastChecked ?? new Date(0).toISOString();

    const activity = await fetchActivity(since);
    const now = new Date().toISOString();
    await updateLastChecked(now);

    if (state.enabled.news && activity.newNewsCount > 0) {
      const title = 'Neue Neuigkeit';
      const body = activity.latestNewsTitle
        ? `„${activity.latestNewsTitle}"`
        : `${activity.newNewsCount} neue Neuigkeit(en)`;
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { type: 'news' } },
        trigger: null,
      });
      await appendNotificationLog({ id: `news-${now}`, type: 'news', title, body, timestamp: now });
    }

    if (state.enabled.votes && activity.newVotesCount > 0) {
      const title = 'Neue Abstimmung';
      const body = activity.latestVoteTitle
        ? `„${activity.latestVoteTitle}"`
        : `${activity.newVotesCount} neue Abstimmung(en)`;
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { type: 'vote' } },
        trigger: null,
      });
      await appendNotificationLog({ id: `vote-${now}`, type: 'vote', title, body, timestamp: now });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetch() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // Already registered or not supported
  }
}
