import { apiFetch } from './client';
import { syncGuests } from './guests';
import { BASE_URL } from '../../constants/api';
import { getStoredToken } from '../storage/credentials';
import type { ResultEntry } from '../models/Result';

export class InvalidParticipantsError extends Error {
  readonly type = 'InvalidParticipantsError' as const;
  invalidClientIds: string[];
  constructor(invalidClientIds: string[]) {
    super('INVALID_PARTICIPANTS');
    this.invalidClientIds = invalidClientIds;
    // Babel/Metro can break `instanceof` for Error subclasses — fix the prototype chain.
    Object.setPrototypeOf(this, InvalidParticipantsError.prototype);
  }
}

interface UploadEntry {
  clientId: string;
  memberId?: number;
  guestId?: number;
  partId: number;
  gopId: number;
  value: number;
  date: string;
  sessionGroup: number;
}

export async function uploadResults(entries: ResultEntry[]): Promise<void> {
  if (entries.length === 0) return;

  // Sync any guests that don't yet have a server ID, then build the upload payload
  const guestEntries = entries.filter((e) => e.guestLocalId !== null);
  let guestList = guestEntries.length > 0 ? await syncGuests() : [];
  const serverIdByLocalId = new Map(
    guestList.filter((g) => g.serverId !== undefined).map((g) => [g.id, g.serverId!]),
  );

  const uploadable: UploadEntry[] = [];

  for (const e of entries) {
    if (e.memberId !== null) {
      uploadable.push({
        clientId: e.id,
        memberId: e.memberId,
        partId: e.partId,
        gopId: e.gameId,
        value: e.value,
        date: e.timestamp,
        sessionGroup: e.sessionGroup,
      });
    } else if (e.guestLocalId !== null) {
      const serverId = serverIdByLocalId.get(e.guestLocalId);
      if (serverId !== undefined) {
        uploadable.push({
          clientId: e.id,
          guestId: serverId,
          partId: e.partId,
          gopId: e.gameId,
          value: e.value,
          date: e.timestamp,
          sessionGroup: e.sessionGroup,
        });
      }
      // If serverId is still unknown (sync failed), skip for now — will retry next flush
    }
  }

  if (uploadable.length === 0) return;

  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/api/app/upload-results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(uploadable),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (res.status === 422 && body?.error === 'INVALID_PARTICIPANTS') {
      throw new InvalidParticipantsError(body.invalidClientIds ?? []);
    }
    throw new Error(body ? JSON.stringify(body) : `HTTP ${res.status}`);
  }
}

export async function deleteResults(clientIds: string[]): Promise<void> {
  if (clientIds.length === 0) return;
  await apiFetch('/api/app/delete-results', {
    method: 'POST',
    body: JSON.stringify({ clientIds }),
  });
}
