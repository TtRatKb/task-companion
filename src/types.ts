export type Priority = 1 | 2 | 3 | 4;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface Recurrence { kind:'weekdays'; weekdays:Weekday[] }
export interface Task { id:string; title:string; description:string; projectId:string|null; priority:Priority; scheduledDate:string|null; deadlineDate:string|null; recurrence:Recurrence|null; completedAt:string|null; createdAt:string; updatedAt:string }
export interface Project { id:string; name:string; color:string; createdAt:string }
export interface CompletionEvent { id:string; taskId:string; occurredAt:string; previousScheduledDate:string|null; resultingScheduledDate:string|null; previousCompletedAt:string|null; undoneAt:string|null }
export interface AppData { schemaVersion:2; tasks:Task[]; projects:Project[]; completionEvents:CompletionEvent[] }
export const emptyData=():AppData=>({schemaVersion:2,tasks:[],projects:[],completionEvents:[]});
