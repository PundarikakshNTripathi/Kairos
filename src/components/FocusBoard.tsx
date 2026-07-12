// React removed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { Plus, Download } from 'lucide-react';

export function FocusBoard() {
  const priorities = useStore((state) => state.priorities);
  const setPriorities = useStore((state) => state.setPriorities);

  const updatePriority = (index: number, value: string) => {
    const newPriorities = [...priorities];
    newPriorities[index] = value;
    setPriorities(newPriorities);
  };

  const addPriority = () => {
    setPriorities([...priorities, '']);
  };

  const exportData = () => {
    const state = useStore.getState();
    const data = JSON.stringify({ birthDate: state.birthDate, logs: state.logs, priorities: state.priorities });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kairos-backup.json';
    a.click();
  };

  return (
    <Card className="border-0 rounded-none shadow-none bg-transparent h-full flex flex-col">
      <CardHeader className="px-8 pt-8">
        <CardTitle className="text-2xl font-light tracking-widest text-primary flex justify-between items-center">
          <span>EXECUTIVE FOCUS</span>
          <Button variant="ghost" size="icon" onClick={exportData} title="Backup Data">
            <Download className="h-5 w-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-8 space-y-6">
        {priorities.map((priority, i) => (
          <div key={i} className="group flex items-center gap-4">
            <span className="text-muted-foreground/50 font-mono text-sm group-hover:text-primary transition-colors">
              {String(i + 1).padStart(2, '0')}
            </span>
            <Input
              value={priority}
              onChange={(e: any) => updatePriority(i, e.target.value)}
              placeholder={`Priority ${i + 1}`}
              className="border-0 border-b border-border/50 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary px-0 text-xl font-light text-foreground placeholder:text-muted-foreground/30 transition-colors"
            />
          </div>
        ))}
        <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary" onClick={addPriority}>
          <Plus className="mr-2 h-4 w-4" /> Add Priority
        </Button>
      </CardContent>
    </Card>
  );
}
