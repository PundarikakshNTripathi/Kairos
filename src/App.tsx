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

export default function App() {
  const hasHydrated = useStore((state) => state.hasHydrated);
  const birthDate = useStore((state) => state.birthDate);
  const setBirthDate = useStore((state) => state.setBirthDate);
  const [dateInput, setDateInput] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

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
    </div>
  );
}
