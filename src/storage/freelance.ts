import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimeEntry } from '../engine/freelance';

export interface Client {
  id: string;
  name: string;
}
export interface Project {
  id: string;
  name: string;
  clientId: string;
  /** Optional ₺/hour for the report's amount column. */
  hourlyRate?: number | null;
}

interface FreelanceState {
  clients: Client[];
  projects: Project[];
  // shortcut: entries live in localStorage (~100 B each, fine for years of use); move to IndexedDB if it nears quota.
  entries: TimeEntry[];
  /** Reuses a client with the same name (case-insensitive) or creates one. */
  addProject: (name: string, clientName: string, hourlyRate: number | null) => void;
  setRate: (projectId: string, hourlyRate: number | null) => void;
  /** Deletes the project and its entries. */
  removeProject: (projectId: string) => void;
  addEntry: (e: Omit<TimeEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
}

export const useFreelanceStore = create<FreelanceState>()(
  persist(
    (set) => ({
      clients: [],
      projects: [],
      entries: [],
      addProject: (name, clientName, hourlyRate) =>
        set((s) => {
          const existing = s.clients.find((c) => c.name.toLocaleLowerCase('tr') === clientName.toLocaleLowerCase('tr'));
          const client = existing ?? { id: crypto.randomUUID(), name: clientName };
          return {
            clients: existing ? s.clients : [...s.clients, client],
            projects: [...s.projects, { id: crypto.randomUUID(), name, clientId: client.id, hourlyRate }],
          };
        }),
      setRate: (projectId, hourlyRate) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === projectId ? { ...p, hourlyRate } : p)) })),
      removeProject: (projectId) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== projectId),
          entries: s.entries.filter((e) => e.projectId !== projectId),
        })),
      addEntry: (e) => set((s) => ({ entries: [...s.entries, { ...e, id: crypto.randomUUID() }] })),
      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
    }),
    { name: 'kose.freelance', version: 1 },
  ),
);
