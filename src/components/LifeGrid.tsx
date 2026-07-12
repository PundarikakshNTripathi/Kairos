import React, { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { getDaysLived } from '@/lib/time';

export function LifeGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birthDate = useStore((state) => state.birthDate);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalDays = 90 * 365; // ~32,850
    const daysLived = getDaysLived(birthDate);

    const dpr = window.devicePixelRatio || 1;
    const cols = 365;
    const rows = 90;
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

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        const x = c * (cellSize + gap);
        const y = r * (cellSize + gap);
        
        if (index < daysLived) {
          ctx.fillStyle = '#3f3f46'; // zinc-700
          ctx.fillRect(x, y, cellSize, cellSize);
        } else if (index === daysLived) {
          ctx.fillStyle = '#ffffff'; // white
          ctx.fillRect(x, y, cellSize, cellSize);
        } else if (index < totalDays) {
          ctx.fillStyle = '#18181b'; // zinc-900
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }, [birthDate]);

  return (
    <div className="flex justify-center p-4">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
