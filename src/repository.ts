import { isValidDate } from './date';
import { normalizeWeekdays } from './recurrence';
import { emptyData, type AppData, type CompletionEvent, type Project, type Subtask, type Task, type TaskTemplate } from './types';

export const STORAGE_KEY = 'task-companion:data';
export interface TaskRepository {
  load(): AppData;
  save(data: AppData): void;
  export(data: AppData): string;
  parseImport(json: string): AppData;
}

const nullableString = (v: unknown): v is string|null => v === null || typeof v === 'string';
const dateOrNull = (v: unknown) => v === null || (typeof v === 'string' && isValidDate(v));
const isPriority = (value: unknown): value is Task['priority'] =>
  typeof value === 'number' && [1, 2, 3, 4].includes(value);
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ungültiges Datenobjekt.');
  return value as Record<string, unknown>;
}
function uniqueIds(items: { id: string }[], label: string) {
  if (new Set(items.map(x => x.id)).size !== items.length)
    throw new Error('Doppelte ' + label + '-ID.');
}
function parseSubtasks(input: unknown): Subtask[] {
  if (!Array.isArray(input)) throw new Error('Ungültige Unteraufgaben.');
  const subtasks = input.map((value): Subtask => {
    const entry = object(value);
    if (typeof entry.id !== 'string' || !entry.id || typeof entry.title !== 'string' ||
        !entry.title.trim() || !nullableString(entry.completedAt))
      throw new Error('Ungültige Unteraufgabe.');
    return { id: entry.id, title: entry.title, completedAt: entry.completedAt };
  });
  uniqueIds(subtasks, 'Unteraufgaben');
  return subtasks;
}

export function migrateData(value: unknown): AppData {
  const raw = object(value);
  if (raw.schemaVersion !== 1 && raw.schemaVersion !== 2 && raw.schemaVersion !== 3)
    throw new Error('Nicht unterstützte Datenversion.');
  if (!Array.isArray(raw.tasks) || !Array.isArray(raw.projects) || !Array.isArray(raw.completionEvents))
    throw new Error('Unvollständige Sicherung.');

  const tasks = raw.tasks.map((item): Task => {
    const t = object(item);
    let days: number[] = [];
    if (t.recurrence !== null) {
      const rule = object(t.recurrence);
      if (rule.kind === 'weekly') days = [Number(rule.weekday)];
      else if (rule.kind === 'weekdays' && Array.isArray(rule.weekdays)) days = rule.weekdays.map(Number);
      else throw new Error('Ungültige Wiederholung.');
    }
    const weekdays = normalizeWeekdays(days);
    if (t.recurrence !== null && !weekdays.length) throw new Error('Leere Wiederholung.');
    if (typeof t.id !== 'string' || !t.id || typeof t.title !== 'string' ||
        typeof t.description !== 'string' || !nullableString(t.projectId) ||
        !isPriority(t.priority) || !dateOrNull(t.scheduledDate) ||
        !dateOrNull(t.deadlineDate) || !nullableString(t.completedAt) ||
        typeof t.createdAt !== 'string' || typeof t.updatedAt !== 'string')
      throw new Error('Ungültige Aufgabe.');
    const subtasks = raw.schemaVersion === 3 ? parseSubtasks(t.subtasks) : [];
    return {
      id: t.id, title: t.title, description: t.description,
      projectId: t.projectId, priority: t.priority,
      scheduledDate: t.scheduledDate as string|null,
      deadlineDate: t.deadlineDate as string|null,
      recurrence: t.recurrence === null ? null : { kind: 'weekdays', weekdays },
      subtasks,
      completedAt: t.completedAt, createdAt: t.createdAt, updatedAt: t.updatedAt
    };
  });
  uniqueIds(tasks, 'Aufgaben');

  const projects = raw.projects.map((item): Project => {
    const p = object(item);
    if (typeof p.id !== 'string' || !p.id || typeof p.name !== 'string' ||
        typeof p.color !== 'string' || typeof p.createdAt !== 'string')
      throw new Error('Ungültiges Projekt.');
    return { id: p.id, name: p.name, color: p.color, createdAt: p.createdAt };
  });
  uniqueIds(projects, 'Projekt');

  const templates: TaskTemplate[] = raw.schemaVersion === 3
    ? (() => {
      if (!Array.isArray(raw.templates)) throw new Error('Ungültige Vorlagen.');
      const results = raw.templates.map((item): TaskTemplate => {
        const t = object(item);
        if (typeof t.id !== 'string' || !t.id || typeof t.name !== 'string' || !t.name.trim() ||
            typeof t.title !== 'string' || !t.title.trim() ||
            typeof t.description !== 'string' || !isPriority(t.priority) ||
            !Array.isArray(t.subtaskTitles) || !t.subtaskTitles.every(x => typeof x === 'string' && x.trim()) ||
            typeof t.createdAt !== 'string' || typeof t.updatedAt !== 'string')
          throw new Error('Ungültige Aufgabenvorlage.');
        return {
          id: t.id, name: t.name, title: t.title, description: t.description,
          priority: t.priority, subtaskTitles: [...t.subtaskTitles], createdAt: t.createdAt,
          updatedAt: t.updatedAt
        };
      });
      uniqueIds(results, 'Vorlagen');
      return results;
    })()
    : [];

  const completionEvents = raw.completionEvents.map((item): CompletionEvent => {
    const e = object(item);
    if (typeof e.id !== 'string' || typeof e.taskId !== 'string' ||
        typeof e.occurredAt !== 'string' || !dateOrNull(e.previousScheduledDate) ||
        !dateOrNull(e.resultingScheduledDate) || !nullableString(e.undoneAt))
      throw new Error('Ungültiger Abschluss.');
    const previousSubtasks = e.previousSubtasks === undefined ? undefined : parseSubtasks(e.previousSubtasks);
    return {
      id: e.id, taskId: e.taskId, occurredAt: e.occurredAt,
      previousScheduledDate: e.previousScheduledDate as string|null,
      resultingScheduledDate: e.resultingScheduledDate as string|null,
      previousCompletedAt: nullableString(e.previousCompletedAt) ? e.previousCompletedAt : null,
      ...(previousSubtasks === undefined ? {} : { previousSubtasks }),
      undoneAt: e.undoneAt
    };
  });
  uniqueIds(completionEvents, 'Ereignis');
  return { schemaVersion: 3, tasks, projects, templates, completionEvents };
}
export function validateData(v: unknown): v is AppData {
  try { return migrateData(v).schemaVersion === 3; } catch { return false; }
}
export class LocalTaskRepository implements TaskRepository {
  constructor(private storage: Pick<Storage,'getItem'|'setItem'> = localStorage) {}
  load() {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    try { return migrateData(JSON.parse(raw)); }
    catch { throw new Error('Gespeicherte Daten sind beschädigt. Sie wurden nicht überschrieben.'); }
  }
  save(data: AppData) { this.storage.setItem(STORAGE_KEY, JSON.stringify(migrateData(data))); }
  export(data: AppData) { return JSON.stringify(migrateData(data), null, 2); }
  parseImport(json: string) {
    try { return migrateData(JSON.parse(json)); }
    catch { throw new Error('Die Datei hat kein gültiges Task-Companion-Format.'); }
  }
}
