import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, addYears, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useStore } from '@/store/useStore';
import { useDayKey } from '@/lib/hooks';
import { formatInt, getLifeStats, parseBirthDate } from '@/lib/time';

const GUTTER = 30;

interface Layout {
  pitch: number;
  gap: number;
  cols: number;
  rows: number;
}

/** Pixel rect of day `i`. Fractional pitches are snapped to whole pixels so cells stay crisp. */
function rectOf(i: number, l: Layout): [number, number, number, number] {
  const c = i % l.cols;
  const r = Math.floor(i / l.cols);
  const x0 = Math.round(GUTTER + c * l.pitch);
  const x1 = Math.round(GUTTER + (c + 1) * l.pitch);
  const y0 = Math.round(r * l.pitch);
  const y1 = Math.round((r + 1) * l.pitch);
  return [x0, y0, Math.max(1, x1 - x0 - l.gap), Math.max(1, y1 - y0 - l.gap)];
}

/** Largest square cell pitch at which every day fits the box (or a readable fallback when it cannot). */
function computeLayout(total: number, width: number, height: number | null): Layout {
  const usable = Math.max(60, width - GUTTER - 4);
  const fits = (p: number) => {
    const cols = Math.max(1, Math.floor(usable / p));
    return { cols, rows: Math.ceil(total / cols) };
  };
  let pitch = 4;
  if (height !== null) {
    pitch = 2;
    for (let p = 14; p >= 2; p -= 0.25) {
      const { rows } = fits(p);
      if (Math.ceil(rows * p) <= height - 4) {
        pitch = p;
        break;
      }
    }
  } else {
    pitch = width < 480 ? 4 : 5;
  }
  const { cols, rows } = fits(pitch);
  return { pitch, gap: pitch >= 2 ? 1 : 0, cols, rows };
}

function ageLabel(birth: Date, day: Date): string {
  let years = day.getFullYear() - birth.getFullYear();
  let months = day.getMonth() - birth.getMonth();
  if (day.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years}y ${months}m`;
}

interface Hover {
  index: number;
  x: number;
  y: number;
}

export function LifeGrid() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birthDate = useStore((s) => s.birthDate);
  const lifespanYears = useStore((s) => s.lifespanYears);
  const logs = useStore((s) => s.logs);
  const theme = useStore((s) => s.theme);
  const openJournal = useStore((s) => s.openJournal);
  const dayKey = useDayKey();

  const [box, setBox] = useState<{ w: number; h: number; desktop: boolean }>({ w: 800, h: 600, desktop: true });
  const [hover, setHover] = useState<Hover | null>(null);

  // `dayKey` participates so the grid re-derives itself when midnight passes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => getLifeStats(birthDate, lifespanYears, new Date()), [birthDate, lifespanYears, dayKey]);
  const total = stats?.totalDays ?? 0;
  const layout = useMemo(
    () => computeLayout(total || 1, box.w, box.desktop ? box.h : null),
    [total, box.w, box.h, box.desktop],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight, desktop: mq.matches });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    mq.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      mq.removeEventListener('change', measure);
    };
  }, []);

  const logIndices = useMemo(() => {
    const set = new Set<number>();
    const birth = parseBirthDate(birthDate);
    if (!birth) return set;
    for (const key of Object.keys(logs)) {
      if (!logs[key]) continue;
      const idx = differenceInCalendarDays(parseISO(key), birth);
      if (idx >= 0 && idx < total) set.add(idx);
    }
    return set;
  }, [logs, birthDate, total]);

  const canvasWidth = Math.ceil(GUTTER + layout.cols * layout.pitch);
  const canvasHeight = Math.ceil(layout.rows * layout.pitch);
  const today = stats ? Math.min(stats.daysLived, total - 1) : 0;
  const cellRect = useCallback((i: number) => rectOf(i, layout), [layout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stats) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const css = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const past = v('--grid-past', '#888');
    const pastAlpha = Number(v('--grid-past-alpha', '0.25'));
    const future = v('--grid-future', '#888');
    const futureAlpha = Number(v('--grid-future-alpha', '0.5'));
    const primary = v('--primary', '#f33');
    const amber = v('--journal-highlight', '#fa0');
    const muted = v('--muted-foreground', '#888');

    const { cols, pitch } = layout;
    const elapsed = Math.min(stats.daysLived, total);

    // Days already gone: solid, dim.
    ctx.globalAlpha = pastAlpha;
    ctx.fillStyle = past;
    ctx.beginPath();
    for (let i = 0; i < elapsed; i++) {
      if (logIndices.has(i)) continue;
      const [x, y, w, h] = rectOf(i, layout);
      ctx.rect(x, y, w, h);
    }
    ctx.fill();

    // Days you wrote something down.
    ctx.globalAlpha = 1;
    ctx.fillStyle = amber;
    ctx.beginPath();
    // Small cells get a 1px halo so a written day is findable at a glance.
    for (const i of logIndices) {
      const [x, y, w, h] = rectOf(i, layout);
      const halo = w < 4 ? 1 : 0;
      ctx.rect(x - halo, y - halo, w + halo * 2, h + halo * 2);
    }
    ctx.fill();

    // Days that remain: empty boxes, waiting.
    ctx.globalAlpha = futureAlpha;
    ctx.strokeStyle = future;
    ctx.fillStyle = future;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = elapsed + 1; i < total; i++) {
      const [x, y, w, h] = rectOf(i, layout);
      if (w >= 3) ctx.rect(x + 0.5, y + 0.5, w - 1, h - 1);
      else ctx.rect(x, y, w, h);
    }
    if (layout.pitch >= 3) ctx.stroke();
    else ctx.fill();

    // The last day.
    ctx.globalAlpha = 1;
    ctx.fillStyle = primary;
    const [lx, ly, lw, lh] = rectOf(total - 1, layout);
    ctx.fillRect(lx, ly, lw, lh);

    const nowY = Math.floor(Math.min(stats.daysLived, total - 1) / cols) * pitch;
    // Age ruler in the gutter.
    ctx.font = '9px "Geist Mono Variable", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = muted;
    ctx.strokeStyle = muted;
    for (let age = 0; age < stats.lifespanYears; age += 10) {
      const idx = differenceInCalendarDays(addYears(stats.birth, age), stats.birth);
      if (idx >= total) continue;
      const y = Math.floor(idx / cols) * pitch;
      if (Math.abs(y - nowY) < 11) continue; // keep the NOW marker readable
      ctx.globalAlpha = 0.9;
      ctx.fillText(String(age), GUTTER - 7, y - 1);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(GUTTER - 4, y + 0.5);
      ctx.lineTo(GUTTER, y + 0.5);
      ctx.stroke();
    }
    // "NOW" marker on today's row.
    ctx.globalAlpha = 1;
    ctx.fillStyle = primary;
    ctx.textAlign = 'right';
    ctx.fillText('NOW', GUTTER - 2, nowY - 1);
  }, [stats, layout, logIndices, canvasWidth, canvasHeight, total, theme]);

  const indexAt = (clientX: number, clientY: number): number | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const px = clientX - rect.left - GUTTER;
    const py = clientY - rect.top;
    if (px < 0 || py < 0) return null;
    const c = Math.floor(px / layout.pitch + 1e-9);
    const r = Math.floor(py / layout.pitch + 1e-9);
    if (c >= layout.cols) return null;
    const i = r * layout.cols + c;
    return i >= 0 && i < total ? i : null;
  };

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const i = indexAt(e.clientX, e.clientY);
    setHover(i === null ? null : { index: i, x: e.clientX, y: e.clientY });
  };

  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!stats) return;
    const i = indexAt(e.clientX, e.clientY);
    if (i !== null && i <= stats.daysLived) openJournal(format(addDays(stats.birth, i), 'yyyy-MM-dd'));
  };

  if (!stats) return null;

  const hoverDate = hover ? addDays(stats.birth, hover.index) : null;
  const hoverKey = hoverDate ? format(hoverDate, 'yyyy-MM-dd') : null;
  const hoverDelta = hover ? hover.index - stats.daysLived : 0;
  const hoverText = hoverKey && logs[hoverKey] ? logs[hoverKey] : '';

  return (
    <div ref={wrapRef} className="relative lg:absolute lg:inset-2 w-full min-h-[360px] lg:min-h-0 overflow-hidden flex items-start justify-center">
      <div
        className="relative"
        style={{ width: canvasWidth, height: canvasHeight }}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onClick={onClick}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Your life as ${formatInt(total)} squares, one per day. ${formatInt(Math.min(stats.daysLived, total))} are gone, ${formatInt(stats.daysLeft)} remain.`}
          className={`block ${hover && hover.index <= stats.daysLived ? 'cursor-pointer' : 'cursor-default'}`}
          data-testid="life-canvas"
        />
        {/* Today */}
        <span
          className="now-cell pointer-events-none"
          style={{ left: cellRect(today)[0] - 1, top: cellRect(today)[1] - 1, width: cellRect(today)[2] + 2, height: cellRect(today)[3] + 2 }}
          data-testid="now-cell"
        />
        <span
          className="now-ring"
          style={{ left: cellRect(today)[0], top: cellRect(today)[1], width: cellRect(today)[2], height: cellRect(today)[3] }}
        />
        {hover && (
          <span
            className="absolute pointer-events-none border border-foreground"
            style={{ left: cellRect(hover.index)[0] - 1, top: cellRect(hover.index)[1] - 1, width: cellRect(hover.index)[2] + 2, height: cellRect(hover.index)[3] + 2 }}
          />
        )}
      </div>

      {hover && hoverDate && createPortal(
        <div
          className="fixed pointer-events-none z-[100] w-60 border border-border bg-popover text-popover-foreground px-3.5 py-3 shadow-[0_8px_40px_rgba(0,0,0,.55)]"
          style={{
            top: Math.min(hover.y + 18, window.innerHeight - 150),
            left: Math.min(hover.x + 18, window.innerWidth - 256),
          }}
          data-testid="grid-tooltip"
        >
          <div className="font-mono text-[11px] uppercase tracking-widest text-primary">
            {format(hoverDate, 'EEE d MMM yyyy')}
          </div>
          <div className="font-display text-2xl leading-tight mt-1">
            {hoverDelta === 0
              ? 'Today. It is passing.'
              : hoverDelta < 0
                ? `${formatInt(-hoverDelta)} ${hoverDelta === -1 ? 'day' : 'days'} ago`
                : `In ${formatInt(hoverDelta)} ${hoverDelta === 1 ? 'day' : 'days'}`}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground mt-1">
            Age {ageLabel(stats.birth, hoverDate)} · day {formatInt(hover.index + 1)} of {formatInt(total)}
          </div>
          <div className="text-xs text-muted-foreground mt-2 leading-snug">
            {hover.index === total - 1
              ? 'The estimated last day.'
              : hoverDelta > 0
                ? 'Not yours yet. It may never be.'
                : hoverText
                  ? `“${hoverText.slice(0, 70)}${hoverText.length > 70 ? '…' : ''}”`
                  : hoverDelta < 0
                    ? 'Gone. Nothing was written down. Click to add something.'
                    : 'Click to write today down.'}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
