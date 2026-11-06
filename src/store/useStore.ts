/**
 * Global State Management & Hybrid Synchronization
 * 
 * Implements a unified data layer using Zustand. 
 * State is eagerly persisted to IndexedDB (localforage) to ensure immediate 
 * local responsiveness (Optimistic UI updates), and asynchronously synced 
 * to the remote Supabase PostgreSQL database to ensure data persistence 
 * across devices.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

import type { User } from '@supabase/supabase-js';
import { clampLifespan, DEFAULT_LIFESPAN_YEARS, getCurrentDateKey } from '../lib/time';

interface AppState {
  user: User | null;
  profile: { username?: string, avatar_url?: string } | null;
  birthDate: string | null;
  theme: 'light' | 'dark';
  /** Expected lifespan used to size the grid. Local-only preference. */
  lifespanYears: number;
  /** Last calendar day the daily memento was acknowledged (yyyy-MM-dd). */
  lastMementoDay: string | null;
  isMementoOpen: boolean;
  isSettingsOpen: boolean;
  logs: Record<string, string>; // keyed by date string 'yyyy-MM-dd'
  priorities: string[];
  hasHydrated: boolean;
  
  setUser: (user: User | null) => void;
  setProfile: (profile: { username?: string, avatar_url?: string } | null) => void;
  fetchProfile: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  setBirthDate: (date: string | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLifespanYears: (years: number) => void;
  openMemento: () => void;
  acknowledgeMemento: () => void;
  setSettingsOpen: (open: boolean) => void;
  importData: (raw: string) => { ok: boolean; error?: string };
  setLog: (dateKey: string, text: string) => void;
  setPriorities: (priorities: string[]) => void;
  setHasHydrated: (state: boolean) => void;
  isJournalOpen: boolean;
  activeJournalDate: string | null;
  openJournal: (date?: string) => void;
  closeJournal: () => void;
  isProfileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      birthDate: null,
      theme: 'dark',
      lifespanYears: DEFAULT_LIFESPAN_YEARS,
      lastMementoDay: null,
      isMementoOpen: false,
      isSettingsOpen: false,
      logs: {},
      priorities: ['', '', ''],
      hasHydrated: false,
      isJournalOpen: false,
      activeJournalDate: null,
      isProfileOpen: false,
      
      setUser: (user) => {
        const previousUser = get().user;
        set({ user });
        if (user) {
          get().fetchProfile();
          get().fetchLogs();
        } else if (previousUser) {
          // Only wipe synced data on a real sign-out, never on the initial anonymous session check.
          set({ profile: null, logs: {} });
        }
      },
      setProfile: (profile) => set({ profile }),
      setProfileOpen: (open) => set({ isProfileOpen: open }),
      fetchProfile: async () => {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('username, avatar_url, birthdate').eq('id', user.id).single();
          if (data) {
            set({ profile: data });
            if (data.birthdate) set({ birthDate: data.birthdate });
          }
        }
      },
      fetchLogs: async () => {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase.from('daily_logs').select('log_date, journal_text, priorities').eq('user_id', user.id);
          if (data && !error) {
            const logs: Record<string, string> = {};
            let latestPriorities = get().priorities;
            let latestDate = '';
            
            data.forEach((row) => {
              if (row.journal_text) {
                logs[row.log_date] = row.journal_text;
              }
              if (row.priorities && row.log_date > latestDate) {
                latestPriorities = row.priorities;
                latestDate = row.log_date;
              }
            });
            
            set((state) => ({ 
              logs: { ...state.logs, ...logs },
              priorities: latestDate ? latestPriorities : state.priorities
            }));
          }
        }
      },
      setTheme: (theme) => {
        // Flip the class synchronously so canvas drawing (which reads CSS variables) sees the new palette.
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
      setLifespanYears: (years) => set({ lifespanYears: clampLifespan(years) }),
      openMemento: () => set({ isMementoOpen: true }),
      acknowledgeMemento: () => set({ isMementoOpen: false, lastMementoDay: getCurrentDateKey() }),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      importData: (raw) => {
        try {
          const data = JSON.parse(raw);
          if (!data || typeof data !== 'object') return { ok: false, error: 'Not a Kairos backup.' };
          const next: Partial<AppState> = {};
          if (typeof data.birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)) next.birthDate = data.birthDate;
          if (data.logs && typeof data.logs === 'object') {
            const logs: Record<string, string> = {};
            for (const [k, v] of Object.entries(data.logs)) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'string') logs[k] = v;
            }
            next.logs = { ...get().logs, ...logs };
          }
          if (Array.isArray(data.priorities)) next.priorities = data.priorities.filter((p: unknown) => typeof p === 'string');
          if (typeof data.lifespanYears === 'number') next.lifespanYears = clampLifespan(data.lifespanYears);
          if (Object.keys(next).length === 0) return { ok: false, error: 'Nothing recognisable in that file.' };
          set(next);
          return { ok: true };
        } catch {
          return { ok: false, error: 'That file is not valid JSON.' };
        }
      },
      setBirthDate: (date) => {
        set({ birthDate: date });
        if (supabase) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) supabase!.from('profiles').upsert({ id: user.id, birthdate: date }).then(({ error }) => { if (error) console.error('Profile sync error:', error); });
          });
        }
      },
      setLog: (dateKey, text) => {
        set((state) => ({ logs: { ...state.logs, [dateKey]: text } }));
        if (supabase) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) supabase!.from('daily_logs').upsert({ 
              user_id: user.id, 
              log_date: dateKey, 
              journal_text: text,
              priorities: get().priorities
            }, { onConflict: 'user_id,log_date' }).then(({ error }) => { if (error) console.error('Journal sync error:', error); });
          });
        }
      },
      setPriorities: (priorities) => {
        set({ priorities });
        if (supabase) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            const today = getCurrentDateKey();
            if (user) supabase!.from('daily_logs').upsert({ 
              user_id: user.id, 
              log_date: today, 
              journal_text: get().logs[today] || null,
              priorities 
            }, { onConflict: 'user_id,log_date' }).then(({ error }) => { if (error) console.error('Priority sync error:', error); });
          });
        }
      },
      setHasHydrated: (state) => set({ hasHydrated: state }),
      openJournal: (date) => set({ isJournalOpen: true, activeJournalDate: date || getCurrentDateKey() }),
      closeJournal: () => set({ isJournalOpen: false, activeJournalDate: null }),
    }),
    {
      name: 'kairos-storage',
      // Persist data and preferences only, never transient UI flags or the auth user.
      partialize: (state) => ({
        birthDate: state.birthDate,
        theme: state.theme,
        lifespanYears: state.lifespanYears,
        lastMementoDay: state.lastMementoDay,
        logs: state.logs,
        priorities: state.priorities,
        profile: state.profile,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
