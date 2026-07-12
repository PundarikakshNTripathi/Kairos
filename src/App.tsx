import { useEffect, useState } from 'react';
import { LifeGrid } from './components/LifeGrid';
import { FocusBoard } from './components/FocusBoard';
import { JournalModal } from './components/JournalModal';
import { useStore } from './store/useStore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Moon, Sun } from 'lucide-react';

import { LoginButton } from './components/LoginButton';
import { supabase } from './lib/supabase';

export default function App() {
  const hasHydrated = useStore((state) => state.hasHydrated);
  const birthDate = useStore((state) => state.birthDate);
  const setBirthDate = useStore((state) => state.setBirthDate);
  const setUser = useStore((state) => state.setUser);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const [dateInput, setDateInput] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Listen for Supabase Auth changes globally
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const handleSaveBirthDate = () => {
    if (dateInput) {
      setBirthDate(dateInput);
    }
  };

  if (!hasHydrated) return null; 

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center pt-8 p-4 selection:bg-primary selection:text-primary-foreground transition-colors duration-500">
      
      <Dialog open={!birthDate} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogTitle>Welcome to Kairos</DialogTitle>
          <DialogDescription>
            Enter your date of birth to initialize your life grid.
          </DialogDescription>
          <div className="flex gap-2 mt-4">
            <Input 
              type="date" 
              value={dateInput} 
              onChange={(e: any) => setDateInput(e.target.value)} 
              max={format(new Date(), 'yyyy-MM-dd')}
            />
            <Button onClick={handleSaveBirthDate}>Start</Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="w-full max-w-7xl flex justify-between items-center mb-8 px-2">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="Kairos Logo" className="w-8 h-8 rounded-md" />
          <h1 className="text-2xl font-light tracking-widest uppercase">Kairos</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-muted-foreground/60 hidden sm:inline-block">Press Ctrl+K to Journal</span>
          <LoginButton />
          <Button variant="outline" size="sm" onClick={() => { setDateInput(birthDate || ''); setBirthDate(null); }}>
            Edit Birthdate
          </Button>
          <Button variant="outline" size="icon" className="rounded-full bg-card" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start h-[80vh]">
        <div className="h-full border border-border/50 rounded-2xl bg-card shadow-2xl overflow-hidden relative">
          <LifeGrid />
        </div>
        <div className="h-full border border-border/50 rounded-2xl bg-card shadow-2xl overflow-hidden">
          <FocusBoard />
        </div>
      </div>
      <JournalModal />
      <Button 
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-primary text-primary-foreground flex items-center justify-center"
        onClick={() => useStore.getState().openJournal(format(new Date(), 'yyyy-MM-dd'))}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pen-tool"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
      </Button>
    </div>
  );
}
