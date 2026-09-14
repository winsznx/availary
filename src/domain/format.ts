import type { Weekday } from './types';
import { WEEKDAY_LABEL } from './labels';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatAgeAtStart(months: number): string {
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${years} years` : `${years} years ${rest} months`;
}

export function formatWeekdays(weekdays: Weekday[]): string {
  const order: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const present = order.filter((d) => weekdays.includes(d));
  const contiguousWeekdays =
    present.length === 5 &&
    ['mon', 'tue', 'wed', 'thu', 'fri'].every((d) => weekdays.includes(d as Weekday));
  if (contiguousWeekdays) return 'Mon to Fri';
  return present.map((d) => WEEKDAY_LABEL[d]).join(', ');
}

export function formatScheduleMode(mode: 'FULL_TIME' | 'PART_TIME' | 'FLEXIBLE'): string {
  switch (mode) {
    case 'FULL_TIME':
      return 'full day';
    case 'PART_TIME':
      return 'part day';
    case 'FLEXIBLE':
      return 'flexible';
  }
}
