export type Priority = 1 | 2 | 3 | 4;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface Recurrence { kind:'weekdays'; weekdays:Weekday[] }
/** A checklist belongs to exactly one task; never shared between templates/instances. */
export interface Subtask { id:string; title:string; completedAt:string|null }
export interface Task { id:string; title:string; description:string; projectId:string|null; priority:Priority; scheduledDate:string|null; deadlineDate:string|null; recurrence:Recurrence|null; subtasks:Subtask[]; completedAt:string|null; createdAt:string; updatedAt:string }
export interface TaskTemplate { id:string; name:string; title:string; description:string; priority:Priority; subtaskTitles:string[]; createdAt:string; updatedAt:string }
export interface Project { id:string; name:string; color:string; createdAt:string }
export interface CompletionEvent { id:string; taskId:string; occurredAt:string; previousScheduledDate:string|null; resultingScheduledDate:string|null; previousCompletedAt:string|null; previousSubtasks?:Subtask[]; undoneAt:string|null }
export interface AppData { schemaVersion:3; tasks:Task[]; projects:Project[]; templates:TaskTemplate[]; completionEvents:CompletionEvent[] }
export const emptyData=():AppData=>({schemaVersion:3,tasks:[],projects:[],templates:[],completionEvents:[]});
