import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { getDaysLived } from '@/lib/time';
import { addDays, format } from 'date-fns';

export function LifeGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birthDate = useStore((state) => state.birthDate);
  const openJournal = useStore((state) => state.openJournal);
  const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, dateStr: string, isFuture: boolean } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalDays = 32872; // ~90 years
    const daysLived = getDaysLived(birthDate);

    const dpr = window.devicePixelRatio || 1;
    const cols = 365;
    const rows = Math.ceil(totalDays / cols);
    const cellSize = 2;
    const gap = 1;
    const width = cols * (cellSize + gap);
    const height = rows * (cellSize + gap);
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 1. Elapsed Days (Muted Dark Gray)
    ctx.beginPath();
    for (let index = 0; index < daysLived; index++) {
      const r = Math.floor(index / cols);
      const c = index % cols;
      ctx.rect(c * (cellSize + gap), r * (cellSize + gap), cellSize, cellSize);
    }
// Unused variable removed
    ctx.fillStyle = '#3f3f46';
    ctx.fill();

    // 2. Future Days (Single pixel dot / subtle outline)
    ctx.beginPath();
    for (let index = daysLived + 1; index < totalDays; index++) {
      const r = Math.floor(index / cols);
      const c = index % cols;
      ctx.rect(c * (cellSize + gap), r * (cellSize + gap), 1, 1);
    }
    ctx.fillStyle = '#27272a';
    ctx.fill();

    // 3. Current Day Highlight (Stark Red or Primary)
    if (daysLived >= 0 && daysLived < totalDays) {
      const r = Math.floor(daysLived / cols);
      const c = daysLived % cols;
      ctx.fillStyle = '#ef4444'; // Red or dynamic theme color could be placed here
      ctx.fillRect(c * (cellSize + gap), r * (cellSize + gap), cellSize, cellSize);
    }
  }, [birthDate]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!birthDate) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellSize = 2;
    const gap = 1;
    const cols = 365;

    const c = Math.floor(x / (cellSize + gap));
    const r = Math.floor(y / (cellSize + gap));

    const totalDays = 32872;
    const index = r * cols + c;

    if (index >= 0 && index < totalDays && c < cols) {
      // Create date without mutating birthDate directly in an unsafe timezone manner
      const [year, month, day] = birthDate.split('-');
      const birthDateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const hoveredDateObj = addDays(birthDateObj, index);
      const dateStr = format(hoveredDateObj, 'yyyy-MM-dd');
      const daysLived = getDaysLived(birthDate);
      
      setHoverInfo({
        x: e.clientX,
        y: e.clientY,
        dateStr,
        isFuture: index > daysLived,
      });
    } else {
      setHoverInfo(null);
    }
  };

  const handleMouseLeave = () => setHoverInfo(null);

  const handleClick = () => {
    if (hoverInfo && !hoverInfo.isFuture) {
      openJournal(hoverInfo.dateStr);
    }
  };

  return (
    <>
      <div className="flex justify-center py-4 w-full h-full overflow-auto custom-scrollbar">
        <canvas 
          ref={canvasRef} 
          className="block cursor-pointer" 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
      </div>
      {hoverInfo && (
        <div 
          className="fixed pointer-events-none z-[100] bg-popover/95 text-popover-foreground backdrop-blur-xl px-4 py-3 rounded-lg text-sm shadow-2xl border border-border/50 transition-opacity"
          style={{ top: hoverInfo.y + 20, left: hoverInfo.x + 20 }}
        >
          <div className="font-mono text-primary font-semibold tracking-tight mb-1">{hoverInfo.dateStr}</div>
          <div className="text-muted-foreground/80 text-xs">
            {hoverInfo.isFuture ? 'Future Day' : 'Click to view / edit journal'}
          </div>
        </div>
      )}
    </>
  );
}
