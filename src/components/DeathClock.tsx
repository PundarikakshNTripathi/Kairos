import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useNow } from '@/lib/hooks';
import { fractionOfDayGone, formatInt, getLifeStats, pad2, splitCountdown } from '@/lib/time';

function Unit({ value, label, big = false }: { value: string; label: string; big?: boolean }) {
  return (
    <div className="flex flex-col items-start">
      <span
        className={`font-mono tnum leading-none ${big ? 'text-3xl sm:text-4xl lg:text-5xl text-primary' : 'text-2xl sm:text-3xl lg:text-4xl text-foreground'}`}
      >
        {value}
      </span>
      <span className="eyebrow mt-2">{label}</span>
    </div>
  );
}

export function DeathClock() {
  const birthDate = useStore((s) => s.birthDate);
  const lifespanYears = useStore((s) => s.lifespanYears);
  const now = useNow(100);
  const stats = getLifeStats(birthDate, lifespanYears, now);

  // The tab itself keeps counting.
  const daysLeftLabel = stats ? (stats.outlived ? 'Borrowed time' : `${formatInt(stats.daysLeft)} days left`) : null;
  useEffect(() => {
    if (!daysLeftLabel) return;
    document.title = `${daysLeftLabel} · Kairos`;
    return () => {
      document.title = 'Kairos';
    };
  }, [daysLeftLabel]);

  const dread = stats ? stats.fractionLived.toFixed(3) : null;
  useEffect(() => {
    if (dread) document.documentElement.style.setProperty('--dread', dread);
  }, [dread]);

  if (!stats) return null;

  const cd = splitCountdown(stats.msLeft);
  const dayGone = fractionOfDayGone(now);
  const pctLived = (stats.fractionLived * 100).toFixed(4);
  const hoursLeftToday = (1 - dayGone) * 24;

  return (
    <section
      aria-label="Time remaining"
      className="w-full max-w-[1500px] border border-border bg-card/80 backdrop-blur-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="p-4 sm:p-5 lg:border-r border-border">
          {stats.outlived ? (
            <>
              <p className="eyebrow text-primary heartbeat">Estimate exceeded</p>
              <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] mt-3">
                Every day from here is <em className="text-primary">borrowed.</em>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-md">
                You passed {stats.lifespanYears} years {formatInt((now.getTime() - stats.end.getTime()) / 86_400_000)} days ago. Raise the estimate in settings, or use this one well.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">If you are lucky, you have</p>
              <h2 className="font-display leading-[0.9] mt-2 flex flex-wrap items-baseline gap-x-4">
                <span className="text-[clamp(3.25rem,min(9vw,14vh),7.5rem)] text-primary tnum" data-testid="days-left">
                  {formatInt(stats.daysLeft)}
                </span>
                <span className="text-3xl sm:text-4xl text-foreground/80 italic">days left.</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground [@media(max-height:820px)]:text-xs">
                Born {stats.birth.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}. Estimated end{' '}
                <span className="text-foreground">
                  {stats.end.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>{' '}
                (age {stats.lifespanYears}).
              </p>
            </>
          )}
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between gap-4 border-t lg:border-t-0 border-border">
          <div>
            <p className="eyebrow mb-3">Running out, live</p>
            <div className="flex flex-wrap gap-x-6 gap-y-4 sm:gap-x-9" data-testid="countdown">
              <Unit value={formatInt(cd.days)} label="days" />
              <Unit value={pad2(cd.hours)} label="hrs" />
              <Unit value={pad2(cd.minutes)} label="min" />
              <Unit value={`${pad2(cd.seconds)}.${cd.tenths}`} label="sec" big />
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between eyebrow mb-1.5">
                <span>Life spent</span>
                <span className="text-foreground tnum" data-testid="pct-lived">{pctLived}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Percent of life spent"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Number(pctLived)}
                className="h-1.5 w-full bg-muted overflow-hidden"
              >
                <div className="h-full bg-primary" style={{ width: `${pctLived}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between eyebrow mb-1.5">
                <span>Today, gone</span>
                <span className="text-foreground tnum" data-testid="pct-today">{(dayGone * 100).toFixed(2)}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground/70" style={{ width: `${dayGone * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 tnum [@media(max-height:820px)]:hidden">
                {Math.floor(hoursLeftToday)}h {pad2(Math.floor((hoursLeftToday % 1) * 60))}m of today remain. Whatever you do not do in them, you will never do.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
