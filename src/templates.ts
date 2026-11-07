import type { Priority, Subtask, Task, TaskTemplate } from './types';
import { id } from './domain';

export interface TemplateDraft {
  name: string;
  title: string;
  description: string;
  priority: Priority;
  subtaskTitles: string[];
}

export const exampleClassTestTemplate = (): TemplateDraft => ({
  name: 'Klassenarbeit vorbereiten',
  title: 'Klassenarbeit vorbereiten',
  description: '',
  priority: 2,
  subtaskTitles: [
    'Themen und Kompetenzen festlegen',
    'Aufgaben zusammenstellen',
    'Erwartungshorizont erstellen',
    'Differenzierung und Zeitbedarf prüfen',
    'Druckvorlage kontrollieren',
    'Kopien anfertigen'
  ]
});

export function draftFromTask(task: Pick<Task, 'title'|'description'|'priority'|'subtasks'>): TemplateDraft {
  return {
    name: task.title,
    title: task.title,
    description: task.description,
    priority: task.priority,
    subtaskTitles: task.subtasks.map(subtask => subtask.title)
  };
}

export function templateToTaskDraft(
  template: TaskTemplate,
  projectId: string|null
): Pick<Task, 'title'|'description'|'priority'|'projectId'|'scheduledDate'|'deadlineDate'|'recurrence'|'subtasks'> {
  return {
    title: template.title,
    description: template.description,
    priority: template.priority,
    projectId,
    scheduledDate: null,
    deadlineDate: null,
    recurrence: null,
    subtasks: template.subtaskTitles.map(title => ({
      id: id(),
      title,
      completedAt: null
    }))
  };
}

export function templateToRecord(draft: TemplateDraft, existing?: TaskTemplate, now = new Date()): TaskTemplate {
  const time = now.toISOString();
  return {
    id: existing?.id ?? id(),
    name: draft.name.trim(),
    title: draft.title.trim(),
    description: draft.description,
    priority: draft.priority,
    subtaskTitles: draft.subtaskTitles.map(title => title.trim()).filter(Boolean),
    createdAt: existing?.createdAt ?? time,
    updatedAt: time
  };
}

export function checklistProgress(subtasks: readonly Subtask[]): {done:number;total:number;percentage:number} {
  const total = subtasks.length;
  const done = subtasks.filter(task => task.completedAt !== null).length;
  return {done,total,percentage:total?Math.round(done/total*100):0};
}
