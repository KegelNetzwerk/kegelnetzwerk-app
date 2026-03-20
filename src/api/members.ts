import { apiFetch } from './client';
import type { Member } from '../models/Member';

export async function fetchMembers(): Promise<Member[]> {
  return apiFetch<Member[]>('/api/app/members');
}
