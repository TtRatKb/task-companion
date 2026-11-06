import { calendarDaysBetween, isOpenTask } from './deadlineRadar';
import { todayLocal } from './date';
import type { Task } from './types';

export const REMINDER_SETTINGS_KEY = 'task-companion:reminder-settings-v1';
export const REMINDER_SENT_KEY = 'task-companion:reminder-sent-v1';
export const REMINDER_LEADS = [7, 3, 1, 0] as const;

export interface ReminderSettings {
  enabled: boolean;
  leadDays: number[];
  time: string; // HH:MM in Europe/Berlin
}

export const defaultReminderSettings = (): ReminderSettings => ({
  enabled: false,
  leadDays: [3, 1, 0],
  time: '09:00'
});

export function normalizeReminderSettings(value: unknown): ReminderSettings {
  const defaults = defaultReminderSettings();
  if (!value || typeof value !== 'object') return defaults;
  const raw = value as Record<string, unknown>;
  const leadDays = Array.isArray(raw.leadDays)
    ? [...new Set(raw.leadDays.filter(
      (v): v is number => typeof v === 'number' && REMINDER_LEADS.some(lead => lead === v)
    ))].sort((a, b) => b - a)
    : defaults.leadDays;
  return {
    enabled: raw.enabled === true,
    leadDays,
    time: typeof raw.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time)
      ? raw.time
      : defaults.time
  };
}

export function loadReminderSettings(storage: Pick<Storage, 'getItem'> = localStorage): ReminderSettings {
  try {
    const raw = storage.getItem(REMINDER_SETTINGS_KEY);
    return raw ? normalizeReminderSettings(JSON.parse(raw)) : defaultReminderSettings();
  } catch { return defaultReminderSettings(); }
}

export function writeReminderSettings(
  settings: ReminderSettings, storage: Pick<Storage, 'setItem'> = localStorage
): ReminderSettings {
  const normalized = normalizeReminderSettings(settings);
  storage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
}

export interface ReminderCandidate {
  id: string;
  title: string;
  deadlineDate: string;
  daysUntil: number;
  key: string;
}

export function reminderKey(task: Task, daysUntil: number): string {
  return [task.id, task.deadlineDate, daysUntil].join('|');
}

export function berlinTime(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(now);
}

export function remindersDue(
  tasks: Task[],
  now: Date,
  settings: ReminderSettings,
  sent: ReadonlySet<string> = new Set()
): ReminderCandidate[] {
  if (!settings.enabled || berlinTime(now) < settings.time) return [];
  const today = todayLocal(now);
  return tasks.filter(task => isOpenTask(task) && task.deadlineDate !== null)
    .flatMap(task => {
      const daysUntil = calendarDaysBetween(today, task.deadlineDate!);
      if (!settings.leadDays.includes(daysUntil)) return [];
      if (task.completedAt && task.recurrence &&
          todayLocal(new Date(task.completedAt)) === today) return [];
      const key = reminderKey(task, daysUntil);
      return sent.has(key) ? [] : [{
        id: task.id,
        title: task.title,
        deadlineDate: task.deadlineDate!,
        daysUntil,
        key
      }];
    })
    .sort((a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title, 'de'));
}

export function reminderText(daysUntil: number): string {
  if (daysUntil === 0) return 'Die Deadline ist heute.';
  if (daysUntil === 1) return 'Die Deadline ist morgen.';
  return `Die Deadline ist in ${daysUntil} Tagen.`;
}
