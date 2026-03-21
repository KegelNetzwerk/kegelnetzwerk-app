import { BASE_URL } from '../../constants/api';

export interface Club {
  id: number;
  name: string;
  pic: string | null;
}

export async function fetchClubs(): Promise<Club[]> {
  const res = await fetch(`${BASE_URL}/api/app/clubs/list`);
  if (!res.ok) throw new Error('Failed to fetch clubs');
  return res.json();
}

export interface LoginResponse {
  token: string;
  memberId: number;
  nickname: string;
  role: string;
  clubId: number;
  farbe1: string; // hex without #, e.g. "005982"
  farbe2: string;
  farbe3: string;
  bg1: number;   // 0 = fullbg.jpg, 1 = fullbg_alt.jpg, 2 = fullbg_neutral.jpg
}

export async function login(clubName: string, nickname: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/api/app/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clubName, nickname, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  return res.json();
}
