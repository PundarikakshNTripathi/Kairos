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
    ctx.fillStyle = '#3f3f46'; // zinc-700
    ctx.fill();

    // 2. Future Days (Single pixel dot / subtle outline)
    ctx.beginPath();
    for (let index = daysLived + 1; index < totalDays; index++) {
      const r = Math.floor(index / cols);
      const c = index % cols;
      ctx.rect(c * (cellSize + gap), r * (cellSize + gap), 1, 1);
    }
    ctx.fillStyle = '#27272a'; // zinc-800
    ctx.fill();

    // 3. Current Day Highlight (Stark Red)
    if (daysLived >= 0 && daysLived < totalDays) {
      const r = Math.floor(daysLived / cols);
      const c = daysLived % cols;
      ctx.fillStyle = '#ef4444'; // red-500
      ctx.fillRect(c * (cellSize + gap), r * (cellSize + gap), cellSize, cellSize);
    }
  }, [birthDate]);

  return (
    <div className="flex justify-center py-4">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
