import { useEffect, useState } from 'preact/hooks';

// "Install app" support. Chrome/Edge/Samsung on Android and desktop fire
// `beforeinstallprompt`, which lets us show our own Install button. Safari
// (iPhone) and Firefox don't, so there we show the manual steps instead.

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Platform = 'ios' | 'android' | 'desktop';

export function platform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac but has touch.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Whether we're running as the installed app, plus a way to trigger the browser's install dialog. */
export function useInstall() {
  const [installed, setInstalled] = useState(standalone);
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    const mq = window.matchMedia('(display-mode: standalone)');
    const onMode = () => setInstalled(standalone());
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    mq.addEventListener('change', onMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener('change', onMode);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!evt) return false;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    setEvt(null); // a prompt event can only be used once
    return outcome === 'accepted';
  };

  return { installed, canPrompt: !!evt, install };
}
