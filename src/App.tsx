import { useEffect, useState } from 'react';
import { Menu, Moon, PenLine, Settings, Sun, X } from 'lucide-react';
import { LifeGrid } from './components/LifeGrid';
import { FocusBoard } from './components/FocusBoard';
import { JournalModal } from './components/JournalModal';
import { ProfileModal } from './components/ProfileModal';
import { Guide } from './components/Guide';
import { CalendarView } from './components/CalendarView';
import { DeathClock } from './components/DeathClock';
import { Memento } from './components/Memento';
import { SettingsModal } from './components/SettingsModal';
import { LoginButton } from './components/LoginButton';
import { useStore } from './store/useStore';
import { useDayKey } from './lib/hooks';
import { supabase } from './lib/supabase';

type View = 'home' | 'calendar' | 'guide';
const NAV: { id: View; label: string }[] = [
  { id: 'home', label: 'Life' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'guide', label: 'Guide' },
];

export default function App() {
  const hasHydrated = useStore((s) => s.hasHydrated);
  const birthDate = useStore((s) => s.birthDate);
  const lastMementoDay = useStore((s) => s.lastMementoDay);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const setUser = useStore((s) => s.setUser);
  const [view, setView] = useState<View>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const dayKey = useDayKey();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // A new calendar day has started since the last time the memento was acknowledged.
  useEffect(() => {
    if (hasHydrated && birthDate && (!lastMementoDay || lastMementoDay < dayKey)) useStore.getState().openMemento();
  }, [hasHydrated, birthDate, lastMementoDay, dayKey]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, [setUser]);

  if (!hasHydrated) return null;

  const go = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const journalToday = () => useStore.getState().openJournal();

  return (
    <div className="min-h-screen flex flex-col items-center px-3 sm:px-5 pb-8">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[300] bg-primary text-primary-foreground px-3 py-2">
        Skip to content
      </a>

      <header className="w-full max-w-[1500px] flex items-center justify-between py-4 sm:py-5 [@media(max-height:820px)]:py-2.5">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="" className="size-7" />
          <span className="font-display text-3xl leading-none tracking-wide">Kairos</span>
        </div>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              aria-current={view === n.id ? 'page' : undefined}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] border-b-2 transition-colors ${
                view === n.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={journalToday}
            className="inline-flex items-center gap-2 border border-border px-3 h-8 font-mono text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            data-testid="journal-today"
          >
            <PenLine className="size-3.5" /> Write today <kbd className="text-[10px] opacity-70">Ctrl K</kbd>
          </button>
          <LoginButton />
          <button
            onClick={() => useStore.getState().setSettingsOpen(true)}
            aria-label="Settings"
            title="Settings"
            className="size-8 grid place-items-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            <Settings className="size-4" />
          </button>
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title="Toggle theme"
            className="size-8 grid place-items-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <LoginButton />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="size-11 grid place-items-center border border-border"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="md:hidden w-full max-w-[1500px] border border-border bg-card mb-3 p-2 flex flex-col" data-testid="mobile-menu">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`text-left px-3 py-3 font-mono text-sm uppercase tracking-[0.18em] ${view === n.id ? 'text-primary' : 'text-foreground'}`}
            >
              {n.label}
            </button>
          ))}
          <div className="h-px bg-border my-1" />
          <button className="text-left px-3 py-3 text-sm" onClick={() => { setMenuOpen(false); useStore.getState().setSettingsOpen(true); }}>
            Settings
          </button>
          <button className="text-left px-3 py-3 text-sm" onClick={() => { toggleTheme(); setMenuOpen(false); }}>
            Theme: {theme}
          </button>
        </div>
      )}

      <main id="main" className="w-full flex flex-col items-center gap-3 sm:gap-4 flex-1">
        {view === 'home' && birthDate && (
          <>
            <DeathClock />
            <div className="w-full max-w-[1500px] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-3 sm:gap-4 lg:flex-1 lg:min-h-[300px]">
              <section aria-label="Life in days" className="border border-border bg-card/80 backdrop-blur-sm flex flex-col min-h-0">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 sm:px-5 py-3 border-b border-border">
                  <p className="eyebrow">One square. One day. All of them.</p>
                  <ul className="flex items-center gap-4 eyebrow !tracking-[0.14em]" aria-label="Legend">
                    <li className="flex items-center gap-1.5"><i className="size-2 bg-foreground/30 inline-block" /> Gone</li>
                    <li className="flex items-center gap-1.5"><i className="size-2 bg-[var(--journal-highlight)] inline-block" /> Written</li>
                    <li className="flex items-center gap-1.5"><i className="size-2 bg-primary inline-block" /> Today</li>
                    <li className="flex items-center gap-1.5"><i className="size-2 border border-foreground/60 inline-block" /> Left</li>
                  </ul>
                </div>
                <div className="relative flex-1 min-h-0 p-2 sm:p-3">
                  <LifeGrid />
                </div>
              </section>
              <section aria-label="Focus" className="relative border border-border bg-card/80 backdrop-blur-sm min-h-0 lg:min-h-0">
                <div className="lg:absolute lg:inset-0"><FocusBoard /></div>
              </section>
            </div>
          </>
        )}
        {view === 'calendar' && <CalendarView />}
        {view === 'guide' && <Guide />}
      </main>

      <JournalModal />
      <ProfileModal />
      <SettingsModal />
      <Memento />

      <button
        className="md:hidden fixed bottom-5 right-4 size-12 grid place-items-center bg-primary text-primary-foreground shadow-2xl z-50"
        onClick={journalToday}
        aria-label="Write today's journal"
      >
        <PenLine className="size-5" />
      </button>
    </div>
  );
}
