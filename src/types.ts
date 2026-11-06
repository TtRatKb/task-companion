export type Priority = 1 | 2 | 3 | 4;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface Task { id:string; title:string; description:string; projectId:string|null; priority:Priority; scheduledDate:string|null; deadlineDate:string|null; recurrence:null|{kind:'weekly';weekday:Weekday}; completedAt:string|null; createdAt:string; updatedAt:string }
export interface Project { id:string; name:string; color:string; createdAt:string }
export interface CompletionEvent { id:string; taskId:string; occurredAt:string; previousScheduledDate:string|null; resultingScheduledDate:string|null; undoneAt:string|null }
export interface AppData { schemaVersion:1; tasks:Task[]; projects:Project[]; completionEvents:CompletionEvent[] }
export const emptyData=():AppData=>({schemaVersion:1,tasks:[],projects:[],completionEvents:[]});
