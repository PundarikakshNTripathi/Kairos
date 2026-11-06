import { useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Perspective } from '@/components/Perspective';

export function FocusBoard() {
  const priorities = useStore((s) => s.priorities);
  const setPriorities = useStore((s) => s.setPriorities);
  const listRef = useRef<HTMLDivElement>(null);

  const filled = priorities.filter((p) => p.trim()).length;

  const focusRow = (index: number) => {
    requestAnimationFrame(() => {
      listRef.current?.querySelectorAll<HTMLInputElement>('input')[index]?.focus();
    });
  };

  const update = (index: number, value: string) => {
    const next = [...priorities];
    next[index] = value;
    setPriorities(next);
  };

  const add = () => {
    setPriorities([...priorities, '']);
    focusRow(priorities.length);
  };

  const remove = (index: number) => {
    setPriorities(priorities.length > 1 ? priorities.filter((_, i) => i !== index) : ['']);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === priorities.length - 1) add();
      else focusRow(index + 1);
    } else if (e.key === 'Backspace' && priorities[index] === '' && priorities.length > 1) {
      e.preventDefault();
      remove(index);
      focusRow(Math.max(0, index - 1));
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div className="px-6 sm:px-8 pt-5 pb-1">
        <p className="eyebrow">Executive focus</p>
        <h2 className="font-display text-3xl leading-[1.05] mt-1.5">
          What deserves the days you have left?
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {filled === 0
            ? 'Nothing chosen yet. That is also a choice.'
            : filled <= 3
              ? `${filled} thing${filled === 1 ? '' : 's'}. Everything else is noise.`
              : `${filled} things. You cannot do ${filled} things. Cut it down.`}
        </p>
      </div>

      <div ref={listRef} className="px-6 sm:px-8 py-3 space-y-0.5" data-testid="priorities">
        {priorities.map((priority, i) => (
          <div key={i} className="group flex items-center gap-4 border-b border-border focus-within:border-primary transition-colors">
            <span className="font-mono text-xs text-muted-foreground group-focus-within:text-primary tnum">
              {String(i + 1).padStart(2, '0')}
            </span>
            <input
              value={priority}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              placeholder={i === 0 ? 'The one thing that matters most' : `Priority ${i + 1}`}
              aria-label={`Priority ${i + 1}`}
              maxLength={140}
              className="flex-1 min-w-0 bg-transparent py-2.5 text-lg font-light text-foreground placeholder:text-muted-foreground outline-none focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Delete priority ${i + 1}`}
              className="p-3 -mr-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 hover:text-primary transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="mt-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2"
        >
          <Plus className="h-3.5 w-3.5" /> Add priority
        </button>
      </div>

      <div className="mt-auto">
        <Perspective />
      </div>
    </div>
  );
}
