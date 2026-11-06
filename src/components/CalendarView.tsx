import { useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameMonth,
  isToday,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseBirthDate } from '@/lib/time';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView() {
  const [cursor, setCursor] = useState(new Date());
  const [jump, setJump] = useState('');
  const logs = useStore((s) => s.logs);
  const birthDate = useStore((s) => s.birthDate);
  const openJournal = useStore((s) => s.openJournal);

  const birth = parseBirthDate(birthDate);
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(cursor);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });
  const monthKey = format(monthStart, 'yyyy-MM');
  const writtenThisMonth = Object.keys(logs).filter((k) => k.startsWith(monthKey) && logs[k]).length;
  const totalWritten = Object.values(logs).filter(Boolean).length;
  const canGoBack = !birth || isAfter(monthStart, startOfMonth(birth));
  const canGoForward = isAfter(startOfMonth(today), monthStart);

  const handleJump = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const parsed = parseISO(jump);
    if (!isValid(parsed) || isAfter(parsed, today)) return;
    setCursor(parsed);
    openJournal(jump);
  };

  return (
    <div className="w-full max-w-5xl pb-16 reveal">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow">The days you can still touch</p>
          <h2 className="font-display text-5xl sm:text-6xl leading-none mt-2">Calendar</h2>
          <p className="text-sm text-muted-foreground mt-3">
            <span className="text-foreground tnum">{totalWritten}</span> days written down in total.{' '}
            <span className="text-foreground tnum">{writtenThisMonth}</span> this month.
          </p>
        </div>
        <form onSubmit={handleJump} className="flex gap-2">
          <Input
            type="date"
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            max={format(today, 'yyyy-MM-dd')}
            min={birthDate || undefined}
            aria-label="Jump to date"
            className="h-9 font-mono w-44"
          />
          <Button type="submit" variant="outline" className="h-9 px-4 font-mono text-xs uppercase tracking-widest" disabled={!jump}>
            Open
          </Button>
        </form>
      </div>

      <div className="border border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display text-3xl" data-testid="month-title">{format(cursor, 'MMMM yyyy')}</h3>
          <div className="flex gap-1.5">
            <Button variant="outline" size="icon" className="size-10 sm:size-8" aria-label="Previous month" disabled={!canGoBack} onClick={() => setCursor(subMonths(cursor, 1))}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" className="h-10 sm:h-8 px-3 font-mono text-xs uppercase tracking-widest" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="size-10 sm:size-8" aria-label="Next month" disabled={!canGoForward} onClick={() => setCursor(addMonths(cursor, 1))}>
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center eyebrow">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const entry = logs[key];
            const inMonth = isSameMonth(day, monthStart);
            const future = isAfter(day, today);
            const before = birth ? day < birth : false;
            const disabled = future || before;
            const now = isToday(day);
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => openJournal(key)}
                aria-label={`${format(day, 'EEEE d MMMM yyyy')}${entry ? ', has an entry' : ''}${future ? ', not yet' : ''}`}
                data-has-log={entry ? 'true' : undefined}
                data-today={now ? 'true' : undefined}
                className={`relative text-left min-h-[64px] sm:min-h-[104px] p-1.5 sm:p-2.5 border-r border-b border-border [&:nth-child(7n)]:border-r-0 transition-colors focus-visible:z-10 ${
                  disabled ? 'cursor-not-allowed text-muted-foreground/40 bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,var(--border)_6px,var(--border)_7px)] opacity-60' : 'hover:bg-accent'
                } ${!inMonth && !disabled ? 'opacity-45' : ''} ${now ? 'shadow-[inset_0_0_0_2px_var(--primary)]' : ''}`}
              >
                <span className={`font-mono text-xs sm:text-sm tnum ${now ? 'text-primary font-bold' : ''}`}>{format(day, 'd')}</span>
                {entry && (
                  <>
                    <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[var(--journal-highlight)]" />
                    <span className="hidden sm:block mt-2 text-xs leading-snug text-[var(--journal-highlight)] line-clamp-3 break-words">
                      {entry}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 font-mono">Hatched days have not happened. You cannot write in them yet.</p>
    </div>
  );
}
