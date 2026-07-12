import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from './storage';

interface AppState {
  birthDate: string | null;
  logs: Record<string, string>; // keyed by date string 'yyyy-MM-dd'
  priorities: string[];
  hasHydrated: boolean;
  
  setBirthDate: (date: string) => void;
  setLog: (dateKey: string, text: string) => void;
  setPriorities: (priorities: string[]) => void;
  setHasHydrated: (state: boolean) => void;
  isJournalOpen: boolean;
  activeJournalDate: string | null;
  openJournal: (date?: string) => void;
  closeJournal: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      birthDate: null,
      logs: {},
      priorities: ['', '', ''],
      hasHydrated: false,
      isJournalOpen: false,
      activeJournalDate: null,
      
      setBirthDate: (date) => set({ birthDate: date }),
      setLog: (dateKey, text) => set((state) => ({
        logs: { ...state.logs, [dateKey]: text }
      })),
      setPriorities: (priorities) => set({ priorities }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
      openJournal: (date) => set({ isJournalOpen: true, activeJournalDate: date || new Date().toISOString().split('T')[0] }),
      closeJournal: () => set({ isJournalOpen: false, activeJournalDate: null }),
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
