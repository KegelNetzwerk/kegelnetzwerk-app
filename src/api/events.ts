import { apiFetch } from './client';

export interface AppEvent {
  id: number;
  subject: string;
  date: string; // ISO
  cancelDeadline: string; // ISO
  hasCancelled: boolean;
}

export async function fetchEvents(): Promise<AppEvent[]> {
  return apiFetch<AppEvent[]>('/api/app/events');
}
