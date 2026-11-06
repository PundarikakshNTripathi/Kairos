import { useEffect, useRef } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useStore } from '@/store/useStore';
import { formatInt, getCurrentDateKey, getLifeStats } from '@/lib/time';

/** Shown once per calendar day: a day was spent, here is what is left. */
export function Memento() {
  const isOpen = useStore((s) => s.isMementoOpen);
  const birthDate = useStore((s) => s.birthDate);
  const lifespanYears = useStore((s) => s.lifespanYears);
  const lastDay = useStore((s) => s.lastMementoDay);
  const priorities = useStore((s) => s.priorities);
  const acknowledge = useStore((s) => s.acknowledgeMemento);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') acknowledge();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, acknowledge]);

  const stats = getLifeStats(birthDate, lifespanYears);
  if (!isOpen || !stats) return null;

  const today = new Date();
  const away = lastDay ? differenceInCalendarDays(parseISO(getCurrentDateKey()), parseISO(lastDay)) : 1;
  const gone = Math.max(1, away);
  const chosen = priorities.map((p) => p.trim()).filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="memento-title"
      data-testid="memento"
      className="fixed inset-0 z-[200] bg-background flex items-center justify-center p-6 overflow-y-auto"
    >
      <div className="w-full max-w-3xl py-10">
        <p className="eyebrow reveal" style={{ animationDelay: '0.1s' }}>
          {format(today, 'EEEE, d MMMM yyyy')}
        </p>
        <h2 id="memento-title" className="font-display text-5xl sm:text-7xl leading-[0.95] mt-4 reveal" style={{ animationDelay: '0.3s' }}>
          {gone === 1 ? 'Yesterday is gone.' : `${gone} days are gone.`}
        </h2>

        {stats.outlived ? (
          <p className="mt-8 text-xl text-muted-foreground reveal" style={{ animationDelay: '0.6s' }}>
            You are past the estimate. Today is a gift you did not have to be given.
          </p>
        ) : (
          <div className="mt-10 reveal" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-baseline gap-5 sm:gap-8 flex-wrap font-display tnum">
              <span className="struck text-4xl sm:text-6xl" aria-label="previous count">
                {formatInt(stats.daysLeft + gone)}
              </span>
              <span className="text-6xl sm:text-9xl text-primary leading-none" data-testid="memento-days">
                {formatInt(stats.daysLeft)}
              </span>
            </div>
            <p className="eyebrow mt-3">days left, at best</p>
          </div>
        )}

        <div className="mt-12 border-t border-border pt-6 reveal" style={{ animationDelay: '1.1s' }}>
          {chosen.length > 0 ? (
            <>
              <p className="eyebrow">You said these matter</p>
              <ol className="mt-3 space-y-1.5">
                {chosen.map((p, i) => (
                  <li key={i} className="flex gap-4 text-xl font-light">
                    <span className="font-mono text-sm text-primary pt-1.5 tnum">{String(i + 1).padStart(2, '0')}</span>
                    {p}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-xl font-light text-muted-foreground">
              You have not decided what matters. Another day will pass either way.
            </p>
          )}
        </div>

        <button
          ref={buttonRef}
          type="button"
          onClick={acknowledge}
          className="mt-12 group inline-flex items-center gap-3 border border-primary bg-primary text-primary-foreground px-6 py-3 font-mono text-sm uppercase tracking-[0.2em] hover:bg-transparent hover:text-primary transition-colors reveal"
          style={{ animationDelay: '1.4s' }}
          data-testid="memento-dismiss"
        >
          Begin today <span aria-hidden>→</span>
        </button>
        <p className="mt-4 text-xs text-muted-foreground font-mono reveal" style={{ animationDelay: '1.5s' }}>
          Press Esc to continue
        </p>
      </div>
    </div>
  );
}
