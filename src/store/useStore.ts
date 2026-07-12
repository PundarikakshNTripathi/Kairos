import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from './storage';

export interface LogEntry {
  id: string;
  text: string;
  timestamp: number;
}

interface AppState {
  birthDate: string | null;
  logs: Record<string, LogEntry[]>; // keyed by date string 'yyyy-MM-dd'
  priorities: [string, string, string];
  hasHydrated: boolean;
  
  setBirthDate: (date: string) => void;
  addLog: (dateKey: string, text: string) => void;
  updatePriority: (index: 0 | 1 | 2, text: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      birthDate: null,
      logs: {},
      priorities: ['', '', ''],
      hasHydrated: false,
      
      setBirthDate: (date) => set({ birthDate: date }),
      addLog: (dateKey, text) => set((state) => ({
        logs: {
          ...state.logs,
          [dateKey]: [
            ...(state.logs[dateKey] || []),
            { id: crypto.randomUUID(), text, timestamp: Date.now() }
          ]
        }
      })),
      updatePriority: (index, text) => set((state) => {
        const newPriorities = [...state.priorities] as [string, string, string];
        newPriorities[index] = text;
        return { priorities: newPriorities };
      }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'kairos-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
