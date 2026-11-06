import {
  addDays,
  addYears,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';

export const DEFAULT_LIFESPAN_YEARS = 80;
export const MIN_LIFESPAN_YEARS = 30;
export const MAX_LIFESPAN_YEARS = 120;

export function clampLifespan(years: number): number {
  if (!Number.isFinite(years)) return DEFAULT_LIFESPAN_YEARS;
  return Math.min(MAX_LIFESPAN_YEARS, Math.max(MIN_LIFESPAN_YEARS, Math.round(years)));
}

/** Local date key in YYYY-MM-DD (never UTC, so "today" is always the user's today). */
export function dateKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function getCurrentDateKey(): string {
  return dateKey(new Date());
}

export function parseBirthDate(birthDate: string | null): Date | null {
  if (!birthDate) return null;
  const parsed = startOfDay(parseISO(birthDate));
  return isValid(parsed) ? parsed : null;
}

export function getDaysLived(birthDateString: string | null, now: Date = new Date()): number {
  const birth = parseBirthDate(birthDateString);
  if (!birth) return 0;
  return Math.max(0, differenceInCalendarDays(now, birth));
}

export interface LifeStats {
  birth: Date;
  /** Estimated final day (midnight at the start of the day you reach `lifespanYears`). */
  end: Date;
  lifespanYears: number;
  /** Number of day cells in the grid. */
  totalDays: number;
  /** Index of today in the grid (0 = birth day). May exceed totalDays - 1 if outlived. */
  daysLived: number;
  /** Whole calendar days left after today is over. */
  daysLeft: number;
  msLeft: number;
  msLived: number;
  fractionLived: number;
  outlived: boolean;
  ageYears: number;
}

export function getLifeStats(
  birthDateString: string | null,
  lifespanYears: number,
  now: Date = new Date(),
): LifeStats | null {
  const birth = parseBirthDate(birthDateString);
  if (!birth) return null;
  const years = clampLifespan(lifespanYears);
  const end = addYears(birth, years);
  const totalDays = Math.max(1, differenceInCalendarDays(end, birth));
  const daysLived = Math.max(0, differenceInCalendarDays(now, birth));
  const msTotal = end.getTime() - birth.getTime();
  const msLived = Math.max(0, now.getTime() - birth.getTime());
  const msLeft = Math.max(0, end.getTime() - now.getTime());
  return {
    birth,
    end,
    lifespanYears: years,
    totalDays,
    daysLived,
    daysLeft: Math.max(0, totalDays - daysLived - 1),
    msLeft,
    msLived,
    fractionLived: Math.min(1, msLived / msTotal),
    outlived: now.getTime() >= end.getTime(),
    ageYears: msLived / (365.2425 * 86_400_000),
  };
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  tenths: number;
}

export function splitCountdown(ms: number): Countdown {
  const safe = Math.max(0, ms);
  const totalTenths = Math.floor(safe / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);
  return { days, hours, minutes, seconds, tenths };
}

/** Milliseconds from `now` to the next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  return addDays(startOfDay(now), 1).getTime() - now.getTime();
}

/** Fraction (0..1) of today that is already gone. */
export function fractionOfDayGone(now: Date = new Date()): number {
  return 1 - msUntilMidnight(now) / 86_400_000;
}

/** Count of a given weekday (0 = Sunday ... 6 = Saturday) in (from, to]. */
export function countWeekdays(from: Date, to: Date, weekday: number): number {
  const days = differenceInCalendarDays(to, from);
  if (days <= 0) return 0;
  const first = (weekday - from.getDay() + 7) % 7 || 7;
  if (first > days) return 0;
  return 1 + Math.floor((days - first) / 7);
}

export interface Perspective {
  key: string;
  label: string;
  value: number;
  hint: string;
}

/** Concrete things that remain. Everything is derived from the days left. */
export function getPerspectives(stats: LifeStats, now: Date = new Date()): Perspective[] {
  const left = stats.daysLeft + 1; // today still counts as a day you can use
  const weekendsLeft = countWeekdays(now, stats.end, 6);
  const birthdaysLeft = Math.max(0, stats.lifespanYears - Math.floor(stats.ageYears) - 1);
  return [
    { key: 'weekends', label: 'Weekends', value: weekendsLeft, hint: 'Saturdays still ahead' },
    { key: 'birthdays', label: 'Birthdays', value: birthdaysLeft, hint: 'candles left to blow out' },
    { key: 'moons', label: 'Full moons', value: Math.floor(left / 29.530588), hint: 'you will see, at most' },
    { key: 'nights', label: 'Nights', value: left, hint: 'a third of it is spent unconscious' },
    { key: 'meals', label: 'Meals', value: left * 3, hint: 'at three a day' },
    { key: 'waking', label: 'Waking hours', value: left * 16, hint: 'with sleep taken out' },
  ];
}

export function formatInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
