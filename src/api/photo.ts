import { BASE_URL } from '../../constants/api';
import { getStoredToken } from '../storage/credentials';

export async function uploadPhoto(localUri: string): Promise<{ url: string }> {
  const token = await getStoredToken();
  const form = new FormData();
  form.append('photo', { uri: localUri, type: 'image/jpeg', name: 'photo.jpg' } as unknown as Blob);

  const res = await fetch(`${BASE_URL}/api/app/upload-photo`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  if (!res.ok) throw new Error('Photo upload failed');
  return res.json();
}
