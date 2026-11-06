import { useStore } from '@/store/useStore';
import { useDayKey } from '@/lib/hooks';
import { formatInt, getLifeStats, getPerspectives } from '@/lib/time';

/** What the remaining days are actually made of. */
export function Perspective() {
  const birthDate = useStore((s) => s.birthDate);
  const lifespanYears = useStore((s) => s.lifespanYears);
  const dayKey = useDayKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = getLifeStats(birthDate, lifespanYears, new Date());
  if (!stats || stats.outlived) return null;
  void dayKey;
  const items = getPerspectives(stats);

  return (
    <section aria-label="What is left" className="border-t border-border">
      <div className="px-6 sm:px-8 pt-4">
        <p className="eyebrow">What is actually left</p>
      </div>
      <dl className="grid grid-cols-3 gap-px bg-border mt-3 border-t border-border" data-testid="perspective">
        {items.map((item) => (
          <div key={item.key} className="bg-card px-4 py-2.5" title={item.hint}>
            <dd className="font-mono tnum text-lg sm:text-xl text-foreground leading-none" data-testid={`persp-${item.key}`}>
              {formatInt(item.value)}
            </dd>
            <dt className="eyebrow mt-1.5 !text-[10px] !tracking-[0.14em]">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
