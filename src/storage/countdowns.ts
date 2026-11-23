import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TargetRule } from '../engine/calendar';

export type CountdownTemplate = 'weekend' | 'payday' | 'holiday' | 'vacation' | 'birthday' | 'exam' | 'custom';

export interface SavedCountdown {
  id: string;
  title: string;
  template: CountdownTemplate;
  rule: TargetRule;
  /** Holiday date taken from data that is not verified against an official source yet. */
  unverified?: boolean;
}

interface CountdownsState {
  items: SavedCountdown[];
  add: (c: Omit<SavedCountdown, 'id'>) => void;
  remove: (id: string) => void;
}

export const useCountdownsStore = create<CountdownsState>()(
  persist(
    (set) => ({
      items: [],
      add: (c) => set((s) => ({ items: [...s.items, { ...c, id: crypto.randomUUID() }] })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    }),
    { name: 'kose.countdowns', version: 1 },
  ),
);
