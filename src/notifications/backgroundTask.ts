import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { fetchActivity } from '../api/activity';
import {
  getNotificationState,
  updateLastChecked,
  appendNotificationLog,
} from '../storage/notificationState';
import i18n from '../i18n';

export const BACKGROUND_FETCH_TASK = 'kn-background-fetch';

export async function checkAndNotify(): Promise<void> {
  const state = await getNotificationState();
  const since = state.lastChecked ?? new Date(0).toISOString();

  const activity = await fetchActivity(since);
  const now = new Date().toISOString();
  await updateLastChecked(now);

  if (state.enabled.news && activity.newNewsCount > 0) {
    const title = i18n.t('notifications.push.newsTitle');
    const body = activity.latestNewsTitle
      ? i18n.t('notifications.push.newsBody', { title: activity.latestNewsTitle })
      : i18n.t('notifications.push.newsBodyCount', { count: activity.newNewsCount });
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { type: 'news', newsId: activity.latestNewsId } },
      trigger: null,
    });
    await appendNotificationLog({ id: `news-${now}`, type: 'news', title, body, timestamp: now });
  }

  if (state.enabled.votes && activity.newVotesCount > 0) {
    const title = i18n.t('notifications.push.voteTitle');
    const body = activity.latestVoteTitle
      ? i18n.t('notifications.push.voteBody', { title: activity.latestVoteTitle })
      : i18n.t('notifications.push.voteBodyCount', { count: activity.newVotesCount });
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { type: 'vote', voteId: activity.latestVoteId } },
      trigger: null,
    });
    await appendNotificationLog({ id: `vote-${now}`, type: 'vote', title, body, timestamp: now });
  }

  if (state.enabled.payoff && activity.newPayoffCount > 0) {
    const title = i18n.t('notifications.push.payoffTitle');
    const body = i18n.t('notifications.push.payoffBody');
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { type: 'payoff' } },
      trigger: null,
    });
    await appendNotificationLog({ id: `payoff-${now}`, type: 'payoff', title, body, timestamp: now });
  }
}

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await checkAndNotify();
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
