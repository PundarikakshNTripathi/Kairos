/**
 * Journaling Interface
 *
 * Full-screen-capable writing surface for a single day. Entries are plain text and are only ever
 * written into the DOM as `textContent` (never parsed as HTML), so markup typed into an entry is
 * displayed literally and cannot execute.
 */
import { useEffect, useRef, useState } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ExternalLink, Maximize2, Minimize2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { formatInt, getCurrentDateKey, getLifeStats } from '@/lib/time';

export function JournalModal() {
  const isOpen = useStore((s) => s.isJournalOpen);
  const activeDate = useStore((s) => s.activeJournalDate);
  const closeJournal = useStore((s) => s.closeJournal);
  const openJournal = useStore((s) => s.openJournal);
  const setLog = useStore((s) => s.setLog);
  const logs = useStore((s) => s.logs);
  const birthDate = useStore((s) => s.birthDate);
  const lifespanYears = useStore((s) => s.lifespanYears);

  const [text, setText] = useState('');
  const [maximized, setMaximized] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const textRef = useRef('');
  const loadedFor = useRef<string | null>(null);
  // The day the text in the box belongs to. Saving is bound to this, never to derived state:
  // Safari fires `blur` while the textarea unmounts, at which point `activeDate` is already null.
  const editingDate = useRef<string | null>(null);
  const lastShownDate = useRef<string>(getCurrentDateKey());
  if (activeDate) lastShownDate.current = activeDate;

  // Keep showing the day being closed during the exit animation instead of flashing "today".
  const dateKey = activeDate || lastShownDate.current;

  // Load the day's text once per opening, not on every store change (that would clobber typing).
  useEffect(() => {
    if (isOpen) {
      if (loadedFor.current !== dateKey) {
        const initial = useStore.getState().logs[dateKey] || '';
        setText(initial);
        textRef.current = initial;
        loadedFor.current = dateKey;
        editingDate.current = dateKey;
        setSavedAt(null);
      }
    } else {
      loadedFor.current = null;
    }
  }, [isOpen, dateKey, logs]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openJournal(getCurrentDateKey());
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [openJournal]);

  const persist = () => {
    const key = editingDate.current;
    if (!key) return; // nothing is being edited (e.g. a late blur after close)
    const current = useStore.getState().logs[key] || '';
    if (textRef.current !== current) {
      setLog(key, textRef.current);
      setSavedAt(format(new Date(), 'HH:mm:ss'));
    }
  };

  const handleClose = () => {
    persist();
    editingDate.current = null;
    closeJournal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleClose();
    }
  };

  const handleOpenNewTab = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const doc = win.document;
    doc.title = `Journal ${dateKey}`;
    doc.body.style.cssText = 'font:16px/1.6 ui-monospace,monospace;background:#0a0908;color:#ece6da;padding:2rem;white-space:pre-wrap;max-width:70ch;margin:auto';
    doc.body.textContent = text || 'No entry for this day.';
  };

  const stats = getLifeStats(birthDate, lifespanYears);
  const day = parseISO(dateKey);
  const dayNumber = stats ? differenceInCalendarDays(day, stats.birth) + 1 : null;
  const isToday = dateKey === getCurrentDateKey();

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className={`${maximized ? '!max-w-[96vw] !w-[96vw] !h-[94vh]' : 'sm:!max-w-3xl w-[94vw] h-[72vh]'} bg-background border border-border p-0 gap-0 shadow-2xl flex flex-col !rounded-sm`}
      >
        <div className="px-5 py-4 border-b border-border flex justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="eyebrow">{isToday ? 'Today' : 'A day you already spent'}</p>
            <DialogTitle className="font-display !text-3xl sm:!text-4xl !leading-none mt-1.5">
              {format(day, 'EEEE, d MMMM yyyy')}
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px] text-muted-foreground mt-2">
              {dayNumber !== null && `Day ${formatInt(dayNumber)} of your life`}
              {stats && isToday && !stats.outlived && ` · ${formatInt(stats.daysLeft)} left after this one`}
            </DialogDescription>
          </div>
          <div className="flex gap-1 items-center shrink-0">
            <Button variant="ghost" size="icon-sm" aria-label={maximized ? 'Shrink' : 'Maximize'} onClick={() => setMaximized(!maximized)}>
              {maximized ? <Minimize2 /> : <Maximize2 />}
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Open in new tab" onClick={handleOpenNewTab}>
              <ExternalLink />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Save and close" onClick={handleClose} data-testid="journal-close">
              <X />
            </Button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            textRef.current = e.target.value;
          }}
          onKeyDown={handleKeyDown}
          onBlur={persist}
          placeholder={isToday ? 'What did this day hold? Write it before it is gone.' : 'What do you remember?'}
          aria-label="Journal entry"
          className="flex-1 min-h-0 w-full resize-none bg-transparent text-lg sm:text-xl font-light leading-relaxed p-5 sm:p-6 placeholder:text-muted-foreground outline-none"
          autoFocus
          data-testid="journal-text"
        />

        <div className="px-5 py-2.5 border-t border-border flex justify-between font-mono text-[11px] text-muted-foreground">
          <span><span className="hidden sm:inline">Enter saves and closes · Shift+Enter for a new line · </span>Esc closes</span>
          <span className="tnum" aria-live="polite">
            {savedAt ? `Saved ${savedAt}` : `${text.length} chars`}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
