import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';

export function FocusBoard() {
  const priorities = useStore((state) => state.priorities);
  const updatePriority = useStore((state) => state.updatePriority);

  return (
    <Card className="w-full max-w-md mx-auto bg-transparent border-border rounded-none shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-mono tracking-widest text-muted-foreground uppercase text-center">
          Executive Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <span className="font-mono text-muted-foreground text-xs">{i + 1}.</span>
            <Input 
              placeholder={`Priority ${i + 1}`} 
              className="bg-transparent border-b border-x-0 border-t-0 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 font-sans"
              value={priorities[i as 0 | 1 | 2]}
              onChange={(e) => updatePriority(i as 0 | 1 | 2, e.target.value)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
