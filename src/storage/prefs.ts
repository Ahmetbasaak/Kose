import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Corner = 'tl' | 'tr' | 'br' | 'bl';

interface PrefsState {
  corner: Corner;
  setCorner: (c: Corner) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist((set) => ({ corner: 'br', setCorner: (corner) => set({ corner }) }), { name: 'kose.prefs', version: 1 }),
);
