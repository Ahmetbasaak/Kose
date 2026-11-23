import { lazy, type ComponentType } from 'react';
import type { ProFeature } from '../app/entitlements';

// Each setup screen is its own chunk, loaded when that mode is opened.
const SimpleSetup = lazy(() => import('./simple/SimpleSetup').then((m) => ({ default: m.SimpleSetup })));
const WorkSetup = lazy(() => import('./work/WorkSetup').then((m) => ({ default: m.WorkSetup })));
const CountdownsSetup = lazy(() =>
  import('./countdowns/CountdownsSetup').then((m) => ({ default: m.CountdownsSetup })),
);
const MeetingSetup = lazy(() => import('./meeting/MeetingSetup').then((m) => ({ default: m.MeetingSetup })));
const BreakSetup = lazy(() => import('./break/BreakSetup').then((m) => ({ default: m.BreakSetup })));
const StudentSetup = lazy(() => import('./student/StudentSetup').then((m) => ({ default: m.StudentSetup })));
const PresentationSetup = lazy(() =>
  import('./presentation/PresentationSetup').then((m) => ({ default: m.PresentationSetup })),
);
const FreelanceSetup = lazy(() => import('./freelance/FreelanceSetup').then((m) => ({ default: m.FreelanceSetup })));
const MultiSetup = lazy(() => import('./multi/MultiSetup').then((m) => ({ default: m.MultiSetup })));

export type ModeId =
  'simple' | 'work' | 'countdowns' | 'meeting' | 'break' | 'student' | 'freelance' | 'presentation' | 'multi';

export interface ModeDef {
  id: ModeId;
  /** URL segment under /mod/ */
  slug: string;
  /** The Pro feature this mode needs; null = free. */
  pro: ProFeature | null;
  /** Missing = not built yet; the card shows "Yakında". */
  Setup?: ComponentType;
}

export const modes: ModeDef[] = [
  { id: 'simple', slug: 'sayac', pro: null, Setup: SimpleSetup },
  { id: 'work', slug: 'mesai', pro: null, Setup: WorkSetup },
  { id: 'countdowns', slug: 'geri-sayim', pro: null, Setup: CountdownsSetup },
  { id: 'meeting', slug: 'toplanti', pro: null, Setup: MeetingSetup },
  { id: 'break', slug: 'mola', pro: null, Setup: BreakSetup },
  { id: 'student', slug: 'ogrenci', pro: null, Setup: StudentSetup },
  { id: 'freelance', slug: 'serbest', pro: 'freelance', Setup: FreelanceSetup },
  { id: 'presentation', slug: 'sunum', pro: 'presentation', Setup: PresentationSetup },
  { id: 'multi', slug: 'coklu', pro: 'multi', Setup: MultiSetup },
];

export const modeBySlug = (slug: string | undefined) => modes.find((m) => m.slug === slug);
export const modeById = (id: ModeId) => modes.find((m) => m.id === id)!;
