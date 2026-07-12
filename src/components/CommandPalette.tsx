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
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      <DialogContent 
        overlayClassName="bg-black/40 backdrop-blur-[24px]"
        className="sm:max-w-2xl bg-[#111111]/90 backdrop-blur-2xl border border-zinc-800 rounded-xl p-0 overflow-hidden shadow-2xl shadow-black ring-0 top-[25%] translate-y-0" 
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command or log a thought..."
          className="min-h-[120px] w-full resize-none border-0 bg-transparent px-6 py-6 font-sans text-xl focus-visible:ring-0 text-zinc-200 placeholder:text-zinc-600 rounded-xl"
          autoFocus
        />
      </DialogContent>
    </Dialog>
  );
}
