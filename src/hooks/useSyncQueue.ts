import { useState, useCallback } from 'react';
import { getQueue, enqueue, dequeue } from '../storage/syncQueue';
import { markSynced } from '../storage/resultPackage';
import { uploadResults } from '../api/results';
import type { ResultEntry } from '../models/Result';

/** Standalone flush — safe to call outside React (e.g. AppState handler). */
export async function flushQueue(): Promise<void> {
  const queue = await getQueue();
  if (queue.length === 0) return;
  await uploadResults(queue);
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
    } catch {
      // Will retry on next flush
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  return { pendingCount, syncing, refreshCount, addToQueue, flush };
}
