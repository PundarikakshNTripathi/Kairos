import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store/useStore';
import { getCurrentDateKey } from '@/lib/time';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const addLog = useStore((state) => state.addLog);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.ctrlKey && e.shiftKey && e.code === 'Space')) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        addLog(getCurrentDateKey(), text.trim());
      }
      setText('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl bg-black/60 backdrop-blur-xl border-border rounded-none p-0 overflow-hidden shadow-none" hideClose>
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Brain dump..."
          className="min-h-[120px] w-full resize-none border-0 bg-transparent px-6 py-6 font-sans text-lg focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
          autoFocus
        />
      </DialogContent>
    </Dialog>
  );
}
