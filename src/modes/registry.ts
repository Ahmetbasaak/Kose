import type { ComponentType } from 'react';
import type { ProFeature } from '../app/entitlements';
import { SimpleSetup } from './simple/SimpleSetup';
import { WorkSetup } from './work/WorkSetup';
import { CountdownsSetup } from './countdowns/CountdownsSetup';
import { MeetingSetup } from './meeting/MeetingSetup';
import { BreakSetup } from './break/BreakSetup';
import { StudentSetup } from './student/StudentSetup';
import { PresentationSetup } from './presentation/PresentationSetup';
import { FreelanceSetup } from './freelance/FreelanceSetup';
import { MultiSetup } from './multi/MultiSetup';

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
