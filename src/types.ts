export type Priority = 1 | 2 | 3 | 4;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface Recurrence { kind:'weekdays'; weekdays:Weekday[] }
export interface SubtaskOffset { amount:number; unit:'days'|'weeks'|'months' }
export interface Subtask { id:string; title:string; completed:boolean; offset?:SubtaskOffset; plannedDate?:string|null }
export interface Task { id:string; title:string; description:string; projectId:string|null; priority:Priority; scheduledDate:string|null; deadlineDate:string|null; recurrence:Recurrence|null; completedAt:string|null; createdAt:string; updatedAt:string; subtasks?:Subtask[] }
export interface TaskTemplate { id:string; name:string; description:string; steps:string[]; createdAt:string; updatedAt:string }
export interface Project { id:string; name:string; color:string; createdAt:string }
export interface CompletionEvent { id:string; taskId:string; occurredAt:string; previousScheduledDate:string|null; resultingScheduledDate:string|null; previousCompletedAt:string|null; undoneAt:string|null; previousSubtasks?:Subtask[] }
export interface AppData { schemaVersion:4; tasks:Task[]; projects:Project[]; completionEvents:CompletionEvent[]; templates:TaskTemplate[] }
export const emptyData=():AppData=>({schemaVersion:4,tasks:[],projects:[],completionEvents:[],templates:[]});
