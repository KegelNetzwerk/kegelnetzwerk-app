import { apiFetch } from './client';
import { getGuests, saveGuests } from '../storage/guests';
import type { Guest } from '../models/Guest';

interface ServerGuest {
  id: number;
  nickname: string;
  firstName: string;
  lastName: string;
}

/**
 * Pushes local guests that lack a serverId to the server, merges server IDs back,
 * and persists the updated guest list. Returns the updated guest list.
 */
export async function syncGuests(): Promise<Guest[]> {
  const guests = await getGuests();
  const needsSync = guests.filter((g) => g.serverId === undefined);

  if (needsSync.length === 0) return guests;

  const serverIdMap = new Map<string, number>();

  await Promise.all(
    needsSync.map(async (g) => {
      try {
        const result = await apiFetch<ServerGuest>('/api/app/guests', {
          method: 'POST',
          body: JSON.stringify({
            nickname: g.nickname,
            firstName: g.firstName ?? '',
            lastName: g.lastName ?? '',
          }),
        });
        serverIdMap.set(g.id, result.id);
      } catch {
        // Skip on error — will retry on next sync
      }
    }),
  );

  const updated = guests.map((g) =>
    serverIdMap.has(g.id) ? { ...g, serverId: serverIdMap.get(g.id) } : g,
  );

  await saveGuests(updated);
  return updated;
}

/**
 * Fetches the server-side guest list for the club and merges it with local guests.
 * Useful on login to pick up guests created on other devices.
 */
export async function pullGuests(): Promise<Guest[]> {
  const [serverGuests, localGuests] = await Promise.all([
    apiFetch<ServerGuest[]>('/api/app/guests'),
    getGuests(),
  ]);

  // Build a map of existing local guests by serverId and by nickname
  const byServerId = new Map(localGuests.filter((g) => g.serverId).map((g) => [g.serverId!, g]));
  const byNickname = new Map(localGuests.map((g) => [g.nickname.toLowerCase(), g]));

  const merged: Guest[] = [...localGuests];

  for (const sg of serverGuests) {
    if (byServerId.has(sg.id)) {
      // Already known locally — ensure serverId is set (it is)
      continue;
    }
    const localMatch = byNickname.get(sg.nickname.toLowerCase());
    if (localMatch) {
      // Same nickname exists locally without serverId — link it
      const idx = merged.findIndex((g) => g.id === localMatch.id);
      if (idx !== -1) merged[idx] = { ...merged[idx], serverId: sg.id };
    } else {
      // New guest from server — add as a local guest
      merged.push({
        id: `server-${sg.id}`,
        serverId: sg.id,
        nickname: sg.nickname,
        firstName: sg.firstName || undefined,
        lastName: sg.lastName || undefined,
      });
    }
  }

  // Remove local guests whose serverId is no longer on the server (deleted or promoted)
  const serverIdSet = new Set(serverGuests.map((sg) => sg.id));
  const filtered = merged.filter((g) => !g.serverId || serverIdSet.has(g.serverId));

  await saveGuests(filtered);
  return filtered;
}
