import { differenceInDays, startOfDay, parseISO } from 'date-fns';

export function getDaysLived(birthDateString: string | null): number {
  if (!birthDateString) return 0;
  
  // startOfDay ensures timezone-agnostic comparison for the day boundaries
  const birthDate = startOfDay(parseISO(birthDateString));
  const today = startOfDay(new Date());
  
  return Math.max(0, differenceInDays(today, birthDate));
}

export function getCurrentDateKey(): string {
  // Returns local date string in YYYY-MM-DD format
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
