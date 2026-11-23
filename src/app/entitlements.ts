import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Everything Pro gates. One list so pricing copy and gates stay in sync. */
export type ProFeature =
  | 'freelance'
  | 'presentation'
  | 'multi'
  | 'history'
  | 'export'
  | 'themes'
  | 'cornerSettings'
  | 'shortcuts'
  | 'autostart';

type Source = 'dev' | 'license';

interface ProState {
  pro: boolean;
  source: Source | null;
  grant: (source: Source) => void;
  revoke: () => void;
}

/** Device-local entitlement. The license adapter (phase 7) is the only other writer. */
export const useProStore = create<ProState>()(
  persist(
    (set) => ({
      pro: false,
      source: null,
      grant: (source) => set({ pro: true, source }),
      revoke: () => set({ pro: false, source: null }),
    }),
    { name: 'kose.pro', version: 1 },
  ),
);

/** The single gate for Pro features. */
export function useEntitlements() {
  const pro = useProStore((s) => s.pro);
  // Every feature is in the one Pro plan today; `feature` keeps call sites ready for plan tiers.
  return { pro, can: (feature: ProFeature) => (void feature, pro) };
}

/**
 * Development unlock: open the app with ?gelistirici=<VITE_DEV_PRO_KEY>.
 * Does nothing unless that key is set at build time; never set it for production builds.
 */
export function tryDevUnlock(search: string, key: string | undefined = import.meta.env.VITE_DEV_PRO_KEY) {
  if (key && new URLSearchParams(search).get('gelistirici') === key) useProStore.getState().grant('dev');
}
