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

interface AppState {
  user: User | null;
  profile: { username?: string, avatar_url?: string } | null;
  birthDate: string | null;
  theme: 'light' | 'dark';
  logs: Record<string, string>; // keyed by date string 'yyyy-MM-dd'
  priorities: string[];
  hasHydrated: boolean;
  
  setUser: (user: User | null) => void;
  setProfile: (profile: { username?: string, avatar_url?: string } | null) => void;
  fetchProfile: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  setBirthDate: (date: string | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
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
      theme: 'light',
      logs: {},
      priorities: ['', '', ''],
      hasHydrated: false,
      isJournalOpen: false,
      activeJournalDate: null,
      isProfileOpen: false,
      
      setUser: (user) => {
        set({ user });
        if (user) {
          get().fetchProfile();
          get().fetchLogs();
        } else {
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
      setTheme: (theme) => set({ theme }),
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
            const today = new Date().toISOString().split('T')[0];
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
      openJournal: (date) => set({ isJournalOpen: true, activeJournalDate: date || new Date().toISOString().split('T')[0] }),
      closeJournal: () => set({ isJournalOpen: false, activeJournalDate: null }),
    }),
    {
      name: 'kairos-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
