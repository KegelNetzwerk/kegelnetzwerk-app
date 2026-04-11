import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import i18n from '../i18n';
import { getQueue, enqueue, dequeue } from '../storage/syncQueue';
import { markSynced, removeResult } from '../storage/resultPackage';
import { uploadResults, type InvalidParticipantsError } from '../api/results';
import type { ResultEntry } from '../models/Result';

function isInvalidParticipantsError(e: unknown): e is InvalidParticipantsError {
  return (
    typeof e === 'object' &&
    e !== null &&
    (e as any).type === 'InvalidParticipantsError' &&
    Array.isArray((e as any).invalidClientIds)
  );
}

function showInvalidParticipantsAlert(
  queue: ResultEntry[],
  invalidIds: string[],
  onConfirm: () => void,
) {
  const invalidEntries = queue.filter((q) => invalidIds.includes(q.id));
  const names = [...new Set(
    invalidEntries.map((q) =>
      q.guestName ?? i18n.t('sync.invalidParticipantsFallback', { id: q.memberId }),
    ),
  )];
  Alert.alert(
    i18n.t('sync.invalidParticipantsTitle'),
    i18n.t('sync.invalidParticipantsMessage', { names: names.join(', ') }),
    [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      { text: i18n.t('sync.removeEntries'), style: 'destructive', onPress: onConfirm },
    ],
  );
}

/** Standalone flush — safe to call outside React (e.g. AppState handler). */
export async function flushQueue(): Promise<void> {
  const queue = await getQueue();
  if (queue.length === 0) return;
  try {
    await uploadResults(queue);
  } catch (e) {
    if (isInvalidParticipantsError(e)) {
      const invalidIds = e.invalidClientIds;
      showInvalidParticipantsAlert(queue, invalidIds, async () => {
        await dequeue(invalidIds);
        for (const id of invalidIds) await removeResult(id);
      });
      return;
    }
    throw e;
  }
  const ids = queue.map((e) => e.id);
  await dequeue(ids);
  await markSynced(ids);
}

export function useSyncQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    const queue = await getQueue();
    setPendingCount(queue.length);
  }, []);

  const addToQueue = useCallback(async (entry: ResultEntry) => {
    await enqueue([entry]);
    setPendingCount((n) => n + 1);
  }, []);

  const flush = useCallback(async () => {
    if (syncing) return;
    const queue = await getQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    try {
      await uploadResults(queue);
      const ids = queue.map((e) => e.id);
      await dequeue(ids);
      await markSynced(ids);
      setPendingCount(0);
    } catch (e) {
      if (isInvalidParticipantsError(e)) {
        const invalidIds = e.invalidClientIds;
        showInvalidParticipantsAlert(queue, invalidIds, async () => {
          await dequeue(invalidIds);
          for (const id of invalidIds) await removeResult(id);
          setPendingCount((n) => Math.max(0, n - invalidIds.length));
        });
      } else {
        console.warn('[SyncQueue] Upload failed, will retry on next flush:', e);
      }
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  return { pendingCount, syncing, refreshCount, addToQueue, flush };
}
