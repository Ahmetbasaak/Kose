import type { ComponentType } from 'react';
import { SimpleSetup } from './simple/SimpleSetup';
import { WorkSetup } from './work/WorkSetup';
import { CountdownsSetup } from './countdowns/CountdownsSetup';
import { MeetingSetup } from './meeting/MeetingSetup';
import { BreakSetup } from './break/BreakSetup';
import { StudentSetup } from './student/StudentSetup';

export type ModeId = 'simple' | 'work' | 'countdowns' | 'meeting' | 'break' | 'student' | 'freelance' | 'presentation';

export interface ModeDef {
  id: ModeId;
  /** URL segment under /mod/ */
  slug: string;
  pro: boolean;
  /** Missing = not built yet; the card shows "Yakında". */
  Setup?: ComponentType;
}

export const modes: ModeDef[] = [
  { id: 'simple', slug: 'sayac', pro: false, Setup: SimpleSetup },
  { id: 'work', slug: 'mesai', pro: false, Setup: WorkSetup },
  { id: 'countdowns', slug: 'geri-sayim', pro: false, Setup: CountdownsSetup },
  { id: 'meeting', slug: 'toplanti', pro: false, Setup: MeetingSetup },
  { id: 'break', slug: 'mola', pro: false, Setup: BreakSetup },
  { id: 'student', slug: 'ogrenci', pro: false, Setup: StudentSetup },
  { id: 'freelance', slug: 'serbest', pro: true },
  { id: 'presentation', slug: 'sunum', pro: true },
];

export const modeBySlug = (slug: string | undefined) => modes.find((m) => m.slug === slug);
export const modeById = (id: ModeId) => modes.find((m) => m.id === id)!;
