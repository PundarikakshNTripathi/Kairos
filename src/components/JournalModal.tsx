/**
 * Journaling Interface & Data Presentation
 * 
 * A deeply integrated modal component handling the creation and visualization
 * of daily logs. Security features include aggressive sanitization of user input 
 * via DOMPurify to mitigate Cross-Site Scripting (XSS) vulnerabilities during 
 * HTML export and DOM injection.
 */
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DOMPurify from 'dompurify';

export function JournalModal() {
  const isJournalOpen = useStore((state) => state.isJournalOpen);
  const activeJournalDate = useStore((state) => state.activeJournalDate);
  const closeJournal = useStore((state) => state.closeJournal);
  const openJournal = useStore((state) => state.openJournal);
  const setLog = useStore((state) => state.setLog);
  const logs = useStore((state) => state.logs);

  const [text, setText] = useState('');
  const [maximized, setMaximized] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const dateToUse = activeJournalDate || today;

  useEffect(() => {
    if (isJournalOpen) {
      setText(logs[dateToUse] || '');
    }
  }, [isJournalOpen, dateToUse, logs]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openJournal(today);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [openJournal, today]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setLog(dateToUse, text);
      closeJournal();
    }
  };

  const handleOpenNewTab = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Journal - ${dateToUse}</title>
            <style>
              body { font-family: monospace; background: #000; color: #fff; padding: 2rem; white-space: pre-wrap; font-size: 16px; }
            </style>
          </head>
          <body>${DOMPurify.sanitize(text) || 'No entry for this day.'}</body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <Dialog open={isJournalOpen} onOpenChange={(open: boolean) => !open && closeJournal()}>
      <DialogContent className={`${maximized ? '!max-w-[95vw] !w-[95vw] !h-[95vh]' : 'sm:max-w-4xl w-[90vw] h-[70vh]'} bg-background/90 backdrop-blur-3xl border-border/50 p-0 shadow-2xl transition-all duration-300 flex flex-col`}>
        <DialogTitle className="sr-only">Daily Journal</DialogTitle>
        <div className="p-4 border-b border-border/30 flex justify-between items-center bg-muted/20">
          <span className="text-sm font-mono text-muted-foreground">Daily Journal // {dateToUse}</span>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground/50 mr-4">Press Enter to save</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMaximized(!maximized)}>
              {maximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleOpenNewTab}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Textarea
          value={text}
          onChange={(e: any) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setLog(dateToUse, text)} 
          placeholder="Log your thoughts, milestones, or notes..."
          className="flex-1 min-h-[300px] border-0 focus-visible:ring-0 resize-none bg-transparent text-lg font-light p-6 placeholder:text-muted-foreground/70 rounded-none"
          autoFocus
        />
      </DialogContent>
    </Dialog>
  );
}
