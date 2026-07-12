import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function FocusBoard() {
  return (
    <Card className="w-full max-w-md mx-auto bg-transparent border-border rounded-none shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-mono tracking-widest text-muted-foreground uppercase text-center">
          Executive Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <span className="font-mono text-muted-foreground text-xs">{i}.</span>
            <Input 
              placeholder={`Priority ${i}`} 
              className="bg-transparent border-b border-x-0 border-t-0 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 font-sans"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
