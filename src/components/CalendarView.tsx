import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  parseISO,
  isValid
} from 'date-fns';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchInput, setSearchInput] = useState('');
  const logs = useStore(state => state.logs);
  const openJournal = useStore(state => state.openJournal);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput) return;
    const parsedDate = parseISO(searchInput);
    if (isValid(parsedDate)) {
      setCurrentDate(parsedDate);
      openJournal(searchInput);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-4xl font-light tracking-tight text-primary">Calendar & Logs</h2>
          <p className="text-lg text-muted-foreground mt-2">
            Track your history. Jump to any day to view or edit its journal.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <Input 
            type="date" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full sm:w-auto"
            max={format(new Date(), 'yyyy-MM-dd')}
          />
          <Button type="submit" variant="secondary">
            <Search className="w-4 h-4 mr-2" />
            Jump
          </Button>
        </form>
      </div>

      <Card className="border-border/50 bg-card shadow-xl overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-light tracking-wide">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-border/30">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground uppercase tracking-widest border-r border-border/30 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const hasLog = !!logs[dateStr];
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isCurrentDay = isToday(day);

              return (
                <div 
                  key={day.toString()}
                  onClick={() => openJournal(dateStr)}
                  className={`
                    min-h-[100px] p-2 border-r border-b border-border/30 last:border-r-0 cursor-pointer transition-colors
                    ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                    ${isCurrentMonth ? 'bg-card hover:bg-muted/50' : 'bg-muted/10 text-muted-foreground/30 hover:bg-muted/30'}
                    ${isCurrentDay ? 'ring-2 ring-primary ring-inset' : ''}
                  `}
                  style={hasLog ? { backgroundColor: 'color-mix(in srgb, var(--journal-highlight) 5%, transparent)' } : {}}
                >
                  <div className="flex justify-between items-start">
                    <span className={`font-mono text-sm ${isCurrentDay ? 'text-primary font-bold' : isCurrentMonth ? 'text-foreground' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {hasLog && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--journal-highlight)' }} title="Journal Logged" />}
                  </div>
                  {hasLog && (
                    <div className="mt-2 text-xs truncate opacity-90 font-medium" style={{ color: 'var(--journal-highlight)' }}>
                      {logs[dateStr].substring(0, 30)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
