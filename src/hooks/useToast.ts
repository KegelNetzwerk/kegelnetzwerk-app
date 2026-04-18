import { useState, useRef } from 'react';
import type { ToastItem } from '../components/Toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function showToast(message: string) {
    const id = String(++toastIdRef.current);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => removeToast(id), 2500);
  }

  return { toasts, showToast };
}
