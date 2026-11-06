import { addDays } from './date';
import type { Task } from './types';

export const DEFAULT_WARNING_DAYS = 7;

export interface RadarGroup {
  key: string;
  title: string;
  description: string;
  tasks: Task[];
}

export interface DeadlineOverview {
  overdue: number;
  today: number;
  soon: number;
  planningConflicts: number;
}

export function isOpenTask(task: Task): boolean {
  return task.recurrence !== null || task.completedAt === null;
}

function dayNumber(day: string): number {
  const [year, month, date] = day.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, date) / 86_400_000);
}

/** Difference between two local YYYY-MM-DD calendar days, independent of DST. */
export function calendarDaysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

export function planningAfterDeadline(task: Task): boolean {
  return !!task.scheduledDate && !!task.deadlineDate &&
    task.scheduledDate > task.deadlineDate;
}

export function deadlineCountdown(deadline: string, today: string): string {
  const days = calendarDaysBetween(today, deadline);
  if (days === 0) return 'Heute fällig';
  if (days === 1) return 'Morgen fällig';
  if (days === -1) return 'Seit gestern überfällig';
  if (days < 0) return `${-days} Tage überfällig`;
  return `In ${days} Tagen fällig`;
}

export function deadlineState(deadline: string, today: string): 'overdue' | 'today' | 'soon' | 'later' {
  if (deadline < today) return 'overdue';
  if (deadline === today) return 'today';
  if (deadline <= addDays(today, DEFAULT_WARNING_DAYS)) return 'soon';
  return 'later';
}

function byPriorityThenDeadline(a: Task, b: Task): number {
  return a.priority - b.priority ||
    (a.deadlineDate ?? '9999-12-31').localeCompare(b.deadlineDate ?? '9999-12-31') ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id);
}

function byDeadlineThenPriority(a: Task, b: Task): number {
  return (a.deadlineDate ?? '9999-12-31').localeCompare(b.deadlineDate ?? '9999-12-31') ||
    a.priority - b.priority ||
    a.id.localeCompare(b.id);
}

/** Dashboard groups are mutually exclusive and never alter a task's planned day. */
export function todayRadarGroups(tasks: Task[], today: string): RadarGroup[] {
  const active = tasks.filter(isOpenTask);
  const critical = active.filter(task => task.deadlineDate !== null && task.deadlineDate <= today)
    .sort(byDeadlineThenPriority);
  const allocated = new Set(critical.map(task => task.id));

  const planned = active.filter(task => task.scheduledDate !== null &&
    task.scheduledDate <= today && !allocated.has(task.id)).sort(byPriorityThenDeadline);
  planned.forEach(task => allocated.add(task.id));

  const soon = active.filter(task => task.deadlineDate !== null &&
    task.deadlineDate > today && task.deadlineDate <= addDays(today, DEFAULT_WARNING_DAYS) &&
    !allocated.has(task.id)).sort(byDeadlineThenPriority);
  soon.forEach(task => allocated.add(task.id));

  const optional = active.filter(task => task.scheduledDate === null &&
    !allocated.has(task.id) && (task.deadlineDate === null ||
      task.deadlineDate > addDays(today, DEFAULT_WARNING_DAYS)))
    .sort(byPriorityThenDeadline).slice(0, 3);

  return [
    { key: 'critical', title: 'Unbedingt im Blick', description: 'Heute fällig oder bereits überfällig – unabhängig vom geplanten Arbeitstag.', tasks: critical },
    { key: 'planned', title: 'Für heute geplant', description: 'Deine bewusst eingeplanten Aufgaben und überfälligen Planungen.', tasks: planned },
    { key: 'soon', title: 'Bald fällig', description: 'Deadlines in den nächsten 7 Tagen, auch wenn noch kein Arbeitstag geplant ist.', tasks: soon },
    { key: 'optional', title: 'Wenn du noch Zeit hast', description: 'Maximal drei unverbindliche Vorschläge aus noch ungeplanten Aufgaben.', tasks: optional }
  ];
}

export function allDeadlineGroups(tasks: Task[], today: string): RadarGroup[] {
  const deadlines = tasks.filter(task => isOpenTask(task) && task.deadlineDate)
    .sort(byDeadlineThenPriority);
  const groups: RadarGroup[] = [
    { key: 'overdue', title: 'Überfällig', description: 'Diese Termine liegen bereits zurück.', tasks: deadlines.filter(t => t.deadlineDate! < today) },
    { key: 'today', title: 'Heute fällig', description: 'Spätester Erledigungstag ist heute.', tasks: deadlines.filter(t => t.deadlineDate === today) },
    { key: 'soon', title: 'In den nächsten 7 Tagen', description: 'Frühzeitig im Blick behalten – Planung bleibt unverändert.', tasks: deadlines.filter(t => t.deadlineDate! > today && t.deadlineDate! <= addDays(today, DEFAULT_WARNING_DAYS)) },
    { key: 'later', title: 'Langfristig', description: 'Weitere festgelegte Deadlines.', tasks: deadlines.filter(t => t.deadlineDate! > addDays(today, DEFAULT_WARNING_DAYS)) }
  ];
  return groups;
}

export function deadlineOverview(tasks: Task[], today: string): DeadlineOverview {
  const open = tasks.filter(isOpenTask);
  return {
    overdue: open.filter(t => t.deadlineDate !== null && t.deadlineDate < today).length,
    today: open.filter(t => t.deadlineDate === today).length,
    soon: open.filter(t => t.deadlineDate !== null && t.deadlineDate > today &&
      t.deadlineDate <= addDays(today, DEFAULT_WARNING_DAYS)).length,
    planningConflicts: open.filter(planningAfterDeadline).length
  };
}
