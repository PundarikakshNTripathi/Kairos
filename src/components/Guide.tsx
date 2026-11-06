const STEPS = [
  {
    title: 'Read the clock',
    body: 'The number at the top is the number of days between today and the end of the lifespan you chose. It is a guess, and the real figure may be smaller. The live counter beneath it never stops, including while you read this.',
  },
  {
    title: 'Study the grid',
    body: 'Every square is one day. Dim squares are gone. Amber squares are days you wrote something down. The pulsing red square is today. The empty outlines are what remain. Hover any square to see its date and your age on it; click a past one to read or write that day.',
  },
  {
    title: 'Choose what matters',
    body: 'The Executive Focus list has no hard cap, but it will tell you when you have too many. Press Enter to add a row, Backspace on an empty row to remove it.',
  },
  {
    title: 'Write it down',
    body: 'Press Ctrl+K (Cmd+K on Mac) anywhere to open today. Enter saves and closes; Shift+Enter adds a line. Entries save when you leave the box, too.',
  },
  {
    title: 'Meet the memento',
    body: 'Once per calendar day, before anything else, Kairos shows how many days you have left now compared with yesterday, plus the priorities you wrote. Esc dismisses it. You can replay it from Settings.',
  },
];

const FACTS = [
  ['Storage', 'Everything is written to this browser first, so the app never waits on the network. If you sign in, entries are also synced to Supabase behind Row Level Security.'],
  ['Backup', 'Settings has Export and Restore. Restoring merges journal entries and replaces birthdate, lifespan and priorities.'],
  ['Privacy', 'Journal entries are plain text and are only ever shown as text, never parsed as HTML, so anything you type is displayed literally and cannot run. No analytics, no trackers.'],
  ['Accuracy', 'Days are counted by calendar date in your local timezone. Your expected lifespan is a setting, not a prediction.'],
];

export function Guide() {
  return (
    <div className="w-full max-w-4xl pb-16 reveal">
      <p className="eyebrow">Kairos (καιρός): the critical moment</p>
      <h2 className="font-display text-5xl sm:text-7xl leading-[0.95] mt-3">
        A tool for people who would rather <em className="text-primary">know.</em>
      </h2>
      <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
        Most productivity software helps you do more. Kairos asks a harder question first: out of the days you have, which ones are you willing to spend on this? It shows your whole life at once and keeps the number in front of you.
      </p>

      <ol className="mt-12 border-t border-border">
        {STEPS.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[3rem_1fr] sm:grid-cols-[5rem_1fr] gap-4 py-6 border-b border-border">
            <span className="font-mono text-primary tnum text-sm pt-1.5">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="font-display text-3xl">{s.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="eyebrow mt-12 mb-4">Under the hood</h3>
      <dl className="grid sm:grid-cols-2 gap-px bg-border border border-border">
        {FACTS.map(([k, v]) => (
          <div key={k} className="bg-card p-5">
            <dt className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">{k}</dt>
            <dd className="mt-2 text-sm text-muted-foreground leading-relaxed">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
