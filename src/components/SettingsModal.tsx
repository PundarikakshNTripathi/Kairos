import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { MAX_LIFESPAN_YEARS, MIN_LIFESPAN_YEARS } from '@/lib/time';

/** Birthdate + lifespan. Used for first-run onboarding (required) and later edits. */
export function SettingsModal() {
  const isOpen = useStore((s) => s.isSettingsOpen);
  const setOpen = useStore((s) => s.setSettingsOpen);
  const birthDate = useStore((s) => s.birthDate);
  const lifespanYears = useStore((s) => s.lifespanYears);
  const setBirthDate = useStore((s) => s.setBirthDate);
  const setLifespanYears = useStore((s) => s.setLifespanYears);
  const importData = useStore((s) => s.importData);
  const acknowledgeMemento = useStore((s) => s.acknowledgeMemento);
  const hasHydrated = useStore((s) => s.hasHydrated);

  const [dob, setDob] = useState('');
  const [years, setYears] = useState(lifespanYears);
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const firstRun = !birthDate;
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (hasHydrated && !birthDate) useStore.getState().setSettingsOpen(true);
  }, [hasHydrated, birthDate]);

  // Fill the form once per opening. Depending on the stored values here would wipe the status message
  // (e.g. "Backup restored") as soon as a restore changes them.
  useEffect(() => {
    if (!isOpen) return;
    const s = useStore.getState();
    setDob(s.birthDate || '');
    setYears(s.lifespanYears);
    setStatus('');
  }, [isOpen]);

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(dob) && dob <= today && dob >= '1900-01-01';

  const save = () => {
    if (!valid) return;
    setBirthDate(dob);
    setLifespanYears(years);
    if (firstRun) acknowledgeMemento(); // don't greet someone with a "yesterday is gone" they never lived here
    setOpen(false);
  };

  const exportData = () => {
    const s = useStore.getState();
    const blob = new Blob(
      [JSON.stringify({ birthDate: s.birthDate, lifespanYears: s.lifespanYears, logs: s.logs, priorities: s.priorities }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kairos-backup-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Backup downloaded.');
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const result = importData(await file.text());
    if (result.ok) {
      // Show what was restored in the form instead of leaving stale values behind.
      const s = useStore.getState();
      setDob(s.birthDate || '');
      setYears(s.lifespanYears);
    }
    setStatus(result.ok ? 'Backup restored.' : result.error || 'Import failed.');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && firstRun) return; setOpen(open); }}>
      <DialogContent showCloseButton={!firstRun} className="sm:max-w-md p-6 gap-5 border border-border">
        <div>
          <p className="eyebrow">{firstRun ? 'Before anything else' : 'Settings'}</p>
          <DialogTitle className="font-display !text-4xl !leading-[1.05] mt-2">
            {firstRun ? 'When were you born?' : 'Your numbers'}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm">
            {firstRun
              ? 'Kairos turns this date into the squares of your life. It is stored on this device unless you sign in.'
              : 'Everything on screen is computed from these two values.'}
          </DialogDescription>
        </div>

        <label className="flex flex-col gap-2">
          <span className="eyebrow">Date of birth</span>
          <Input
            type="date"
            value={dob}
            min="1900-01-01"
            max={today}
            onChange={(e) => setDob(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            className="h-10 font-mono"
            aria-label="Date of birth"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="eyebrow flex justify-between">
            <span>Expected lifespan</span>
            <span className="text-foreground tnum" data-testid="lifespan-value">{years} years</span>
          </span>
          <input
            type="range"
            min={MIN_LIFESPAN_YEARS}
            max={MAX_LIFESPAN_YEARS}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            aria-label="Expected lifespan in years"
            className="w-full accent-[var(--primary)]"
          />
          <span className="text-xs text-muted-foreground">
            Average life expectancy is roughly 73 worldwide, higher in wealthy countries. Guess honestly, not hopefully.
          </span>
        </label>

        <Button onClick={save} disabled={!valid} className="h-10 text-sm font-mono uppercase tracking-[0.18em]" data-testid="settings-save">
          {firstRun ? 'Show me my life' : 'Save'}
        </Button>

        {!firstRun && (
          <div className="border-t border-border pt-4 flex flex-col gap-3">
            <p className="eyebrow">Your data</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportData} className="flex-1 h-9">
                <Download className="size-3.5" /> Export backup
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="flex-1 h-9">
                <Upload className="size-3.5" /> Restore backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                data-testid="import-input"
                onChange={(e) => onImport(e.target.files?.[0])}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-muted-foreground"
              onClick={() => { setOpen(false); useStore.getState().openMemento(); }}
            >
              Replay today's memento
            </Button>
            {status && <p role="status" className="text-xs text-primary">{status}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
