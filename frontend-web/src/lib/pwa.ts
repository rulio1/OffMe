const INSTALL_DISMISS_KEY = 'offme-pwa-install-dismissed';

export function isIos(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  );
}

export function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isInstallBannerDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(INSTALL_DISMISS_KEY) === '1';
}

export function dismissInstallBanner(): void {
  localStorage.setItem(INSTALL_DISMISS_KEY, '1');
}

export function shouldShowIosInstallBanner(): boolean {
  return isIos() && !isInStandaloneMode() && !isInstallBannerDismissed();
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}