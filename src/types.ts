export type Priority = 1 | 2 | 3 | 4;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Recurrence = { kind:'weekdays'; weekdays:Weekday[] } | {kind:'interval';every:number;unit:'days'|'weeks'|'months';anchorDate:string}
export interface SubtaskOffset { amount:number; unit:'days'|'weeks'|'months'; direction?:'after'|'on' }
export interface Subtask { id:string; title:string; completed:boolean; offset?:SubtaskOffset; plannedDate?:string|null; estimatedMinutes?:number|null }
export interface Task { id:string; title:string; description:string; projectId:string|null; priority:Priority; scheduledDate:string|null; deadlineDate:string|null; eventDate?:string|null; recurrence:Recurrence|null; completedAt:string|null; createdAt:string; updatedAt:string; subtasks?:Subtask[]; estimatedMinutes?:number|null }
export interface TaskTemplate { id:string; name:string; description:string; steps:string[]; anchorKind?:'event'|'deadline'; createdAt:string; updatedAt:string }
export interface Project { id:string; name:string; color:string; createdAt:string }
export interface CompletionEvent { id:string; taskId:string; occurredAt:string; previousScheduledDate:string|null; resultingScheduledDate:string|null; previousCompletedAt:string|null; undoneAt:string|null; previousSubtasks?:Subtask[] }
export interface AppData { schemaVersion:7; tasks:Task[]; projects:Project[]; completionEvents:CompletionEvent[]; templates:TaskTemplate[]; weeklyBudgetMinutes:(number|null)[] }
export const emptyData=():AppData=>({schemaVersion:6,tasks:[],projects:[],completionEvents:[],templates:[],weeklyBudgetMinutes:[null,null,null,null,null,null,null]});
