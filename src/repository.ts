import { DATE_RE } from './date';
import { emptyData, type AppData, type CompletionEvent, type Project, type Task } from './types';
export const STORAGE_KEY='task-companion:data';
export interface TaskRepository { load():AppData; save(data:AppData):void; export(data:AppData):string; parseImport(json:string):AppData }
const isStringOrNull=(v:unknown):v is string|null=>v===null||typeof v==='string';
export function validateData(v:unknown):v is AppData {
  if(!v||typeof v!=='object') return false; const d=v as Partial<AppData>;
  if(d.schemaVersion!==1||!Array.isArray(d.tasks)||!Array.isArray(d.projects)||!Array.isArray(d.completionEvents)) return false;
  const ids=new Set<string>();
  return d.tasks.every((t:Task)=>!!t&&typeof t.id==='string'&&!ids.has(t.id)&&!!ids.add(t.id)&&typeof t.title==='string'&&typeof t.description==='string'&&isStringOrNull(t.projectId)&&[1,2,3,4].includes(t.priority)&&isStringOrNull(t.scheduledDate)&&(!t.scheduledDate||DATE_RE.test(t.scheduledDate))&&isStringOrNull(t.deadlineDate)&&(!t.deadlineDate||DATE_RE.test(t.deadlineDate))&&isStringOrNull(t.completedAt)&&typeof t.createdAt==='string'&&typeof t.updatedAt==='string'&&(t.recurrence===null||(t.recurrence?.kind==='weekly'&&Number.isInteger(t.recurrence.weekday)&&t.recurrence.weekday>=0&&t.recurrence.weekday<=6)))&&
    d.projects.every((p:Project)=>!!p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.color==='string'&&typeof p.createdAt==='string')&&
    d.completionEvents.every((e:CompletionEvent)=>!!e&&typeof e.id==='string'&&typeof e.taskId==='string'&&typeof e.occurredAt==='string'&&isStringOrNull(e.previousScheduledDate)&&isStringOrNull(e.resultingScheduledDate)&&isStringOrNull(e.undoneAt));
}
export class LocalTaskRepository implements TaskRepository {
  constructor(private storage:Pick<Storage,'getItem'|'setItem'>=localStorage){}
  load(){ const raw=this.storage.getItem(STORAGE_KEY); if(!raw)return emptyData(); try {const v:unknown=JSON.parse(raw); if(validateData(v))return v;}catch{} throw new Error('Gespeicherte Daten sind beschädigt. Sie wurden nicht überschrieben.'); }
  save(data:AppData){this.storage.setItem(STORAGE_KEY,JSON.stringify(data))}
  export(data:AppData){return JSON.stringify(data,null,2)}
  parseImport(json:string){const value:unknown=JSON.parse(json);if(!validateData(value))throw new Error('Die Datei hat kein gültiges Task-Companion-Format.');return value}
}
