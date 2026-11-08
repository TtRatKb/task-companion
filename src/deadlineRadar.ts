import { addDays } from './date';
import { deadlineWorkday } from './relativePlanning';
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
  const deadline=task.deadlineDate;
  if (!deadline) return false;
  const lastDay=deadlineWorkday(deadline);
  return (!!task.scheduledDate && task.scheduledDate > lastDay) ||
    (task.subtasks??[]).some(step=>!step.completed&&!!step.plannedDate&&step.plannedDate>lastDay);
}

export function deadlineCountdown(deadline: string, today: string): string {
  const days = calendarDaysBetween(today, deadlineWorkday(deadline));
  if (days === 0) return 'Heute fertigstellen';
  if (days === 1) return 'Morgen fertigstellen';
  if (days === -1) return 'Seit gestern fertig sein müssen';
  if (days < 0) return `${-days} Tage überfällig`;
  return `Noch ${days} Tage zum Fertigstellen`;
}

export function deadlineState(deadline: string, today: string): 'overdue' | 'today' | 'soon' | 'later' {
  const ready=deadlineWorkday(deadline);
  if (ready < today) return 'overdue';
  if (ready === today) return 'today';
  if (ready <= addDays(today, DEFAULT_WARNING_DAYS)) return 'soon';
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

/** Open tasks with an already missed last possible completion day.
 * A calendar event alone does not create overdue status. */
export function overdueOpenTasks(tasks:Task[],today:string):Task[]{
 return tasks.filter(task=>isOpenTask(task)&&task.deadlineDate!==null&&deadlineWorkday(task.deadlineDate)<today)
  .sort(byDeadlineThenPriority);
}

/** Dashboard groups are mutually exclusive and never alter a task's planned day. */
export function todayRadarGroups(tasks: Task[], today: string): RadarGroup[] {
  const active = tasks.filter(isOpenTask);
  const critical = active.filter(task => task.deadlineDate !== null && deadlineWorkday(task.deadlineDate) <= today)
    .sort(byDeadlineThenPriority);
  const allocated = new Set(critical.map(task => task.id));

  const planned = active.filter(task =>
    !allocated.has(task.id) &&
    ((task.scheduledDate !== null && task.scheduledDate <= today) ||
     (task.subtasks??[]).some(step=>!step.completed&&!!step.plannedDate&&step.plannedDate<=today)))
    .sort(byPriorityThenDeadline);
  planned.forEach(task => allocated.add(task.id));

  const soon = active.filter(task => task.deadlineDate !== null &&
    deadlineWorkday(task.deadlineDate)>today && deadlineWorkday(task.deadlineDate)<=addDays(today, DEFAULT_WARNING_DAYS) &&
    !allocated.has(task.id)).sort(byDeadlineThenPriority);
  soon.forEach(task => allocated.add(task.id));

  const optional = active.filter(task => task.scheduledDate === null &&
    !(task.subtasks??[]).some(step=>!step.completed&&!!step.plannedDate) &&
    !allocated.has(task.id) && (task.deadlineDate === null ||
      deadlineWorkday(task.deadlineDate) > addDays(today, DEFAULT_WARNING_DAYS)))
    .sort(byPriorityThenDeadline).slice(0, 3);

  return [
    { key: 'critical', title: 'Unbedingt im Blick', description: 'Heute fertigstellen oder bereits zu spät – die eingetragene Deadline bedeutet: Dann muss alles schon bereit sein.', tasks: critical },
    { key: 'planned', title: 'Für heute geplant', description: 'Deine Tagesaufgaben und noch offene Unteraufgaben, deren Arbeitstermin erreicht ist.', tasks: planned },
    { key: 'soon', title: 'Bald fällig', description: 'Die letzten möglichen Arbeitstage liegen in den nächsten 7 Tagen.', tasks: soon },
    { key: 'optional', title: 'Wenn du noch Zeit hast', description: 'Maximal drei unverbindliche Vorschläge aus noch ungeplanten Aufgaben.', tasks: optional }
  ];
}

export function allDeadlineGroups(tasks: Task[], today: string): RadarGroup[] {
  const deadlines = tasks.filter(task => isOpenTask(task) && task.deadlineDate)
    .sort(byDeadlineThenPriority);
  const groups: RadarGroup[] = [
    { key: 'overdue', title: 'Überfällig', description: 'Der letzte mögliche Fertigstellungstag liegt zurück.', tasks: deadlines.filter(t => deadlineWorkday(t.deadlineDate!) < today) },
    { key: 'today', title: 'Heute fertigstellen', description: 'Diese Aufgaben müssen ab morgen bereit sein.', tasks: deadlines.filter(t => deadlineWorkday(t.deadlineDate!) === today) },
    { key: 'soon', title: 'In den nächsten 7 Tagen', description: 'Fertigstellungstage in den nächsten 7 Tagen – Planung bleibt unverändert.', tasks: deadlines.filter(t => deadlineWorkday(t.deadlineDate!) > today && deadlineWorkday(t.deadlineDate!) <= addDays(today, DEFAULT_WARNING_DAYS)) },
    { key: 'later', title: 'Langfristig', description: 'Weitere festgelegte Deadlines.', tasks: deadlines.filter(t => deadlineWorkday(t.deadlineDate!) > addDays(today, DEFAULT_WARNING_DAYS)) }
  ];
  return groups;
}

export function deadlineOverview(tasks: Task[], today: string): DeadlineOverview {
  const open = tasks.filter(isOpenTask);
  return {
    overdue: open.filter(t => t.deadlineDate !== null && deadlineWorkday(t.deadlineDate) < today).length,
    today: open.filter(t => t.deadlineDate !== null && deadlineWorkday(t.deadlineDate) === today).length,
    soon: open.filter(t => t.deadlineDate !== null && deadlineWorkday(t.deadlineDate)>today &&
      deadlineWorkday(t.deadlineDate) <= addDays(today, DEFAULT_WARNING_DAYS)).length,
    planningConflicts: open.filter(planningAfterDeadline).length
  };
}
