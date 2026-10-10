// Notification permission + Chrome's Periodic Background Sync, which lets the
// installed app wake up now and then (Chrome decides how often, roughly
// daily) and check offers without being opened. No push server involved.

const TAG = 'refresh-offers';
const SIX_HOURS = 6 * 60 * 60 * 1000;

type PeriodicReg = ServiceWorkerRegistration & {
  periodicSync?: {
    register(tag: string, opts: { minInterval: number }): Promise<void>;
    unregister(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
};

export type Background = 'on' | 'not-installed' | 'unsupported' | 'off';

export const notificationsSupported = () => 'Notification' in window && 'serviceWorker' in navigator;
export const permission = (): NotificationPermission | 'unsupported' =>
  notificationsSupported() ? Notification.permission : 'unsupported';

async function registration(): Promise<PeriodicReg | null> {
  if (!('serviceWorker' in navigator)) return null;
  return (await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), 3000)),
  ])) as PeriodicReg | null;
}

export async function backgroundStatus(): Promise<Background> {
  const reg = await registration();
  if (!reg?.periodicSync) return 'unsupported';
  try {
    const tags = await reg.periodicSync.getTags();
    if (tags.includes(TAG)) return 'on';
    const st = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
    return st.state === 'granted' ? 'off' : 'not-installed';
  } catch {
    return 'unsupported';
  }
}

/** Ask for notification permission and turn on background checks where the browser allows it. */
export async function enableAlerts(): Promise<{ permission: NotificationPermission | 'unsupported'; background: Background }> {
  if (!notificationsSupported()) return { permission: 'unsupported', background: 'unsupported' };
  const perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (perm !== 'granted') return { permission: perm, background: await backgroundStatus() };
  const reg = await registration();
  try {
    await reg?.periodicSync?.register(TAG, { minInterval: SIX_HOURS });
  } catch {
    // Not installed / not allowed — the app still checks whenever it's opened.
  }
  return { permission: perm, background: await backgroundStatus() };
}

export async function disableBackground() {
  const reg = await registration();
  try {
    await reg?.periodicSync?.unregister(TAG);
  } catch {}
}

export async function showNotification(title: string, options: NotificationOptions) {
  if (permission() !== 'granted') return;
  const reg = await registration();
  if (reg) await reg.showNotification(title, options);
  else new Notification(title, options);
}
