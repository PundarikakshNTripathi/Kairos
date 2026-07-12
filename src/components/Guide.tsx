import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Guide() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-16">
      <div className="space-y-4">
        <h2 className="text-4xl font-light tracking-tight text-primary">The Core Philosophy</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Kairos (meaning the right, critical, or opportune moment) was built to strip away the bloated features of modern productivity apps. It enforces a strict, visually commanding interface that contextualizes your daily tasks against the sheer scale of your entire lifespan.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-light tracking-wide">Why It Exists</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed">
            Most productivity apps lose the forest for the trees. By visually mapping out 90 years of your life as a grid, Kairos puts your daily microtasks into perspective. It creates a healthy sense of urgency. Each box represents a single day, and once it is gone, it is shaded out forever.
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-light tracking-wide">What It Solves</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed">
            It eliminates priority bloat. The Executive Focus board enforces a strict limit on your active priorities. The command palette journal offers instant, frictionless brain dumping. Everything works instantly offline via local storage.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-light tracking-wide">Hybrid Cloud Sync</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed">
            Kairos operates on a hybrid storage model. When you log a journal entry or update a priority, the data is instantly written to your browser's local IndexedDB for zero latency. In the background, it silently syncs this data to a remote Supabase PostgreSQL database, ensuring your progress is never lost and is available across all your devices.
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-light tracking-wide">Security Measures</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed">
            Security is treated as a first class feature. All data written to the database is protected by strict Row Level Security (RLS) policies, meaning no one else can read or modify your private logs. Furthermore, the application employs DOMPurify to aggressively sanitize any text before rendering it, creating absolute immunity against Cross Site Scripting (XSS) attacks.
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-4 border-t border-border/30">
        <h3 className="text-2xl font-light tracking-tight text-primary">How to Use It</h3>
        <ul className="space-y-4 text-muted-foreground">
          <li className="flex gap-4">
            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-mono font-bold shrink-0">1</div>
            <div>
              <strong className="text-foreground block">The Life Grid</strong>
              Hover over any box in the grid to see its date. The highlighted red box is today. Click any past or current box to open your daily journal.
            </div>
          </li>
          <li className="flex gap-4">
            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-mono font-bold shrink-0">2</div>
            <div>
              <strong className="text-foreground block">Executive Focus</strong>
              List your absolute top priorities on the right panel. Keep them concise. 
            </div>
          </li>
          <li className="flex gap-4">
            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-mono font-bold shrink-0">3</div>
            <div>
              <strong className="text-foreground block">Frictionless Journaling</strong>
              Press <kbd className="font-mono bg-muted text-muted-foreground px-1 py-0.5 rounded text-xs">Ctrl</kbd> + <kbd className="font-mono bg-muted text-muted-foreground px-1 py-0.5 rounded text-xs">K</kbd> anywhere in the app to instantly open today's journal and dump your thoughts.
            </div>
          </li>
          <li className="flex gap-4">
            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-mono font-bold shrink-0">4</div>
            <div>
              <strong className="text-foreground block">Historical Calendar & Logs</strong>
              Navigate to the Calendar view to see a visual timeline of your past entries. Search by exact dates, or click on any highlighted day to review or edit your historical notes.
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
