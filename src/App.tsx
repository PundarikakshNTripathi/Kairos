import React, { useEffect } from 'react';
import { LifeGrid } from './components/LifeGrid';
import { FocusBoard } from './components/FocusBoard';
import { CommandPalette } from './components/CommandPalette';
import { useStore } from './store/useStore';

function App() {
  const hasHydrated = useStore((state) => state.hasHydrated);
  const birthDate = useStore((state) => state.birthDate);
  const setBirthDate = useStore((state) => state.setBirthDate);

  useEffect(() => {
    // Temporary for scaffolding: if no birthdate is set after hydration, set one just for preview.
    // In a real app we'd show an onboarding screen here.
    if (hasHydrated && !birthDate) {
      setBirthDate('1995-01-01');
    }
  }, [hasHydrated, birthDate, setBirthDate]);

  if (!hasHydrated) {
    return null; // Prevent UI flickering during hydration
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col dark">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-border">
        <h1 className="text-xl font-bold font-sans tracking-tight uppercase">Kairos</h1>
        <div className="text-xs font-mono text-muted-foreground">
          Ctrl+K to log
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left side: Life Grid */}
        <div className="flex-1 border-r border-border p-6 overflow-auto bg-black">
          <div className="mb-6 flex justify-between items-baseline">
            <h2 className="text-sm font-mono tracking-widest text-muted-foreground uppercase">Life Grid</h2>
            <span className="text-xs font-mono text-muted-foreground">90 Years</span>
          </div>
          <LifeGrid />
        </div>

        {/* Right side: Focus Board */}
        <div className="w-full lg:w-[400px] p-6 flex flex-col bg-[#050505]">
          <FocusBoard />
        </div>
      </main>

      <CommandPalette />
    </div>
  );
}

export default App;
