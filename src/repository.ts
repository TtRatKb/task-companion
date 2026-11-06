import {isValidDate} from './date';import {normalizeWeekdays} from './recurrence';import {emptyData,type AppData,type CompletionEvent,type Project,type Task} from './types';
export const STORAGE_KEY='task-companion:data';export interface TaskRepository{load():AppData;save(data:AppData):void;export(data:AppData):string;parseImport(json:string):AppData}
const nullableString=(v:unknown)=>v===null||typeof v==='string',dateOrNull=(v:unknown)=>v===null||(typeof v==='string'&&isValidDate(v));
export function migrateData(value:unknown):AppData{
 if(!value||typeof value!=='object')throw new Error('Ungültiges Datenformat.');const raw=value as Record<string,unknown>;
 if(raw.schemaVersion!==1&&raw.schemaVersion!==2)throw new Error('Nicht unterstützte Datenversion.');
 if(!Array.isArray(raw.tasks)||!Array.isArray(raw.projects)||!Array.isArray(raw.completionEvents))throw new Error('Unvollständige Sicherung.');
 const tasks=raw.tasks.map((item):Task=>{const t=item as Record<string,unknown>;let days:number[]=[];
  if(t.recurrence!==null){if(!t.recurrence||typeof t.recurrence!=='object')throw new Error('Ungültige Wiederholung.');const r=t.recurrence as Record<string,unknown>;if(r.kind==='weekly')days=[Number(r.weekday)];else if(r.kind==='weekdays'&&Array.isArray(r.weekdays))days=r.weekdays.map(Number);else throw new Error('Ungültige Wiederholung.')}
  const weekdays=normalizeWeekdays(days);if(t.recurrence!==null&&!weekdays.length)throw new Error('Leere Wiederholung.');
  if(typeof t.id!=='string'||typeof t.title!=='string'||typeof t.description!=='string'||!nullableString(t.projectId)||![1,2,3,4].includes(Number(t.priority))||!dateOrNull(t.scheduledDate)||!dateOrNull(t.deadlineDate)||!nullableString(t.completedAt)||typeof t.createdAt!=='string'||typeof t.updatedAt!=='string')throw new Error('Ungültige Aufgabe.');
  return{id:t.id,title:t.title,description:t.description,projectId:t.projectId as string|null,priority:Number(t.priority) as Task['priority'],scheduledDate:t.scheduledDate as string|null,deadlineDate:t.deadlineDate as string|null,recurrence:t.recurrence===null?null:{kind:'weekdays',weekdays},completedAt:t.completedAt as string|null,createdAt:t.createdAt,updatedAt:t.updatedAt}});
 if(new Set(tasks.map(t=>t.id)).size!==tasks.length)throw new Error('Doppelte Aufgaben-ID.');
 const projects=raw.projects.map((item):Project=>{const p=item as Record<string,unknown>;if(typeof p.id!=='string'||typeof p.name!=='string'||typeof p.color!=='string'||typeof p.createdAt!=='string')throw new Error('Ungültiges Projekt.');return p as unknown as Project});
 const completionEvents=raw.completionEvents.map((item):CompletionEvent=>{const e=item as Record<string,unknown>;if(typeof e.id!=='string'||typeof e.taskId!=='string'||typeof e.occurredAt!=='string'||!dateOrNull(e.previousScheduledDate)||!dateOrNull(e.resultingScheduledDate)||!nullableString(e.undoneAt))throw new Error('Ungültiger Abschluss.');return{id:e.id,taskId:e.taskId,occurredAt:e.occurredAt,previousScheduledDate:e.previousScheduledDate as string|null,resultingScheduledDate:e.resultingScheduledDate as string|null,previousCompletedAt:nullableString(e.previousCompletedAt)?e.previousCompletedAt as string|null:null,undoneAt:e.undoneAt as string|null}});
 return{schemaVersion:2,tasks,projects,completionEvents};
}
export function validateData(v:unknown):v is AppData{try{return migrateData(v).schemaVersion===2}catch{return false}}
export class LocalTaskRepository implements TaskRepository{
 constructor(private storage:Pick<Storage,'getItem'|'setItem'>=localStorage){}
 load(){const raw=this.storage.getItem(STORAGE_KEY);if(!raw)return emptyData();try{return migrateData(JSON.parse(raw))}catch{throw new Error('Gespeicherte Daten sind beschädigt. Sie wurden nicht überschrieben.')}}
 save(data:AppData){this.storage.setItem(STORAGE_KEY,JSON.stringify(migrateData(data)))}
 export(data:AppData){return JSON.stringify(migrateData(data),null,2)}
 parseImport(json:string){try{return migrateData(JSON.parse(json))}catch{throw new Error('Die Datei hat kein gültiges Task-Companion-Format.')}}
}
