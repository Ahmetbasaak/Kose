import { create } from 'zustand';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

/** Chromium's install prompt, captured at startup so a button can show it later. */
export const useInstallStore = create<{ prompt: InstallPromptEvent | null }>(() => ({ prompt: null }));

export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    useInstallStore.setState({ prompt: e as InstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => useInstallStore.setState({ prompt: null }));
}

export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches;
export const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
