import { create } from 'zustand';
import { config } from '../../app/config';
import { isPro } from '../../app/entitlements';
import { CORNER_SIZES, usePrefsStore } from '../../storage/prefs';

interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

const api = () =>
  (window as unknown as { documentPictureInPicture?: DocumentPictureInPicture }).documentPictureInPicture;

export const isPipSupported = (): boolean => api() !== undefined;

/** The open Document PiP window, if any. Not persisted: a reload closes it. */
export const usePipStore = create<{ win: Window | null }>(() => ({ win: null }));

function copyStyles(target: Document) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const style = target.createElement('style');
      style.textContent = Array.from(sheet.cssRules, (r) => r.cssText).join('\n');
      target.head.append(style);
    } catch {
      // Cross-origin sheet: link it instead of reading its rules.
      if (sheet.href) {
        const link = target.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        target.head.append(link);
      }
    }
  }
}

/** Must be called from a user gesture (click). */
export async function openPip(): Promise<Window> {
  const open = usePipStore.getState().win;
  if (open) return open;
  const size = CORNER_SIZES[isPro() ? usePrefsStore.getState().cornerSize : 'm'];
  const win = await api()!.requestWindow(size);
  copyStyles(win.document);
  win.document.documentElement.lang = document.documentElement.lang;
  win.document.title = config.name;
  win.document.body.classList.add('pip-body');
  win.addEventListener('pagehide', () => usePipStore.setState({ win: null }), { once: true });
  usePipStore.setState({ win });
  return win;
}

export const closePip = () => usePipStore.getState().win?.close();
