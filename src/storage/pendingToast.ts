let pending: string | null = null;

export function setPendingToast(msg: string) {
  pending = msg;
}

export function consumePendingToast(): string | null {
  const msg = pending;
  pending = null;
  return msg;
}
