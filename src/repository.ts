import {isValidDate} from './date';
import {intervalRecurrence,normalizeWeekdays} from './recurrence';
import {emptyData,type AppData,type CompletionEvent,type Project,type Subtask,type Task,type TaskTemplate,type Recurrence} from './types';

export const STORAGE_KEY='task-companion:data';
export interface TaskRepository{load():AppData;save(data:AppData):void;export(data:AppData):string;parseImport(json:string):AppData}
const nullableString=(v:unknown)=>v===null||typeof v==='string';
const dateOrNull=(v:unknown)=>v===null||(typeof v==='string'&&isValidDate(v));
const durationOrNull=(v:unknown)=>v===null||(typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=1440);
function parseMinutes(value:unknown,label:string):number|null|undefined {
 if(value===undefined)return undefined;
 if(!durationOrNull(value))throw new Error('Ungültige Zeitangabe bei '+label+'.');
 return value as number|null;
}
function parseBudgets(value:unknown):(number|null)[] {
 if(value===undefined)return [null,null,null,null,null,null,null];
 if(!Array.isArray(value)||value.length!==7||!value.every(durationOrNull))
  throw new Error('Ungültiges Wochenzeitbudget.');
 return [...value] as (number|null)[];
}
const safeRecord=(v:unknown):Record<string,unknown>=>{
 if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Ungültiger Datensatz.');
 return v as Record<string,unknown>;
};
function parseSubtasks(value:unknown):Subtask[]{
 if(value===undefined)return [];
 if(!Array.isArray(value))throw new Error('Ungültige Unteraufgaben.');
 const items=value.map(item=>{
  const s=safeRecord(item);
  if(typeof s.id!=='string'||!s.id||typeof s.title!=='string'||!s.title.trim()||typeof s.completed!=='boolean')
   throw new Error('Ungültige Unteraufgabe.');
  let offset:Subtask['offset'];
  if(s.offset!==undefined&&s.offset!==null){
   const o=safeRecord(s.offset);
   const direction=o.direction;
   const validDirection=direction===undefined||direction==='after'||direction==='on';
   const validAmount=direction==='on'?o.amount===0&&o.unit==='days':
    typeof o.amount==='number'&&Number.isInteger(o.amount)&&o.amount>=1&&o.amount<=999;
   if(!validDirection||!validAmount||!['days','weeks','months'].includes(String(o.unit)))
    throw new Error('Ungültiger relativer Termin einer Unteraufgabe.');
   offset={amount:Number(o.amount),unit:o.unit as 'days'|'weeks'|'months',
    ...(direction?{direction:direction as 'after'|'on'}:{})};
  }
  const estimatedMinutes=parseMinutes(s.estimatedMinutes,'Unteraufgabe');
  if(s.plannedDate!==undefined&&!dateOrNull(s.plannedDate))
   throw new Error('Ungültiges Datum einer Unteraufgabe.');
  return{id:s.id,title:s.title,completed:s.completed,
   ...(offset?{offset}:{}),
   ...(s.plannedDate!==undefined?{plannedDate:s.plannedDate as string|null}:{}),
   ...(estimatedMinutes!==undefined?{estimatedMinutes}:{})};
 });
 if(new Set(items.map(s=>s.id)).size!==items.length)throw new Error('Doppelte Unteraufgaben-ID.');
 return items;
}
function parseTemplates(value:unknown):TaskTemplate[]{
 if(value===undefined)return [];
 if(!Array.isArray(value))throw new Error('Ungültige Aufgabenvorlagen.');
 const templates=value.map(item=>{
  const t=safeRecord(item);
  if(typeof t.id!=='string'||!t.id||typeof t.name!=='string'||!t.name.trim()||typeof t.description!=='string'||!Array.isArray(t.steps)||!t.steps.every((s:unknown)=>typeof s==='string'&&!!s.trim())||typeof t.createdAt!=='string'||typeof t.updatedAt!=='string')
   throw new Error('Ungültige Aufgabenvorlage.');
  if(t.anchorKind!==undefined&&t.anchorKind!=='deadline'&&t.anchorKind!=='event')
   throw new Error('Ungültiger Datumstyp einer Vorlage.');
  const estimatedMinutes=parseMinutes(t.estimatedMinutes,'Vorlage');
  let stepEstimatesMinutes:(number|null)[]|undefined;
  if(t.stepEstimatesMinutes!==undefined){
   if(!Array.isArray(t.stepEstimatesMinutes)||t.stepEstimatesMinutes.length!==t.steps.length)
    throw new Error('Zeitangaben der Vorlage passen nicht zur Anzahl der Unteraufgaben.');
   stepEstimatesMinutes=t.stepEstimatesMinutes.map((value:unknown,index:number)=>{
    const minutes=parseMinutes(value,'Vorlagen-Unteraufgabe '+(index+1));
    if(minutes===undefined)throw new Error('Ungültige Zeitangabe in einer Vorlagen-Unteraufgabe.');
    return minutes;
   });
  }
  return{id:t.id,name:t.name,description:t.description,steps:[...(t.steps as string[])],
   ...(t.anchorKind?{anchorKind:t.anchorKind as 'event'|'deadline'}:{}),
   ...(estimatedMinutes!==undefined?{estimatedMinutes}:{}),
   ...(stepEstimatesMinutes!==undefined?{stepEstimatesMinutes}:{}),
   createdAt:t.createdAt,updatedAt:t.updatedAt};
 });
 if(new Set(templates.map(t=>t.id)).size!==templates.length)throw new Error('Doppelte Vorlagen-ID.');
 return templates;
}
export function migrateData(value:unknown):AppData{
 const raw=safeRecord(value);
 if(raw.schemaVersion!==1&&raw.schemaVersion!==2&&raw.schemaVersion!==3&&raw.schemaVersion!==4&&raw.schemaVersion!==5&&raw.schemaVersion!==6&&raw.schemaVersion!==7&&raw.schemaVersion!==8)throw new Error('Nicht unterstützte Datenversion.');
 if(!Array.isArray(raw.tasks)||!Array.isArray(raw.projects)||!Array.isArray(raw.completionEvents))throw new Error('Unvollständige Sicherung.');
 const tasks=raw.tasks.map((item):Task=>{
  const t=safeRecord(item);
  let parsedRecurrence:Recurrence|null=null;
  if(t.recurrence!==null){
   const r=safeRecord(t.recurrence);
   if(r.kind==='interval'){
    if(typeof r.every!=='number'||typeof r.unit!=='string'||typeof r.anchorDate!=='string')
     throw new Error('Ungültige Intervall-Wiederholung.');
    parsedRecurrence=intervalRecurrence(r.every,r.unit as 'days'|'weeks'|'months',r.anchorDate);
   }else{
    const days=r.kind==='weekly'?[Number(r.weekday)]:
     r.kind==='weekdays'&&Array.isArray(r.weekdays)?r.weekdays.map(Number):[];
    const weekdays=normalizeWeekdays(days);
    if(!weekdays.length)throw new Error('Leere oder ungültige Wiederholung.');
    parsedRecurrence={kind:'weekdays',weekdays};
   }
  }
  if(typeof t.id!=='string'||typeof t.title!=='string'||typeof t.description!=='string'||!nullableString(t.projectId)||![1,2,3,4].includes(Number(t.priority))||!dateOrNull(t.scheduledDate)||!dateOrNull(t.deadlineDate)||(t.eventDate!==undefined&&!dateOrNull(t.eventDate))||!nullableString(t.completedAt)||typeof t.createdAt!=='string'||typeof t.updatedAt!=='string')throw new Error('Ungültige Aufgabe.');
  return{id:t.id,title:t.title,description:t.description,projectId:t.projectId as string|null,priority:Number(t.priority) as Task['priority'],scheduledDate:t.scheduledDate as string|null,deadlineDate:t.deadlineDate as string|null,...(t.eventDate!==undefined?{eventDate:t.eventDate as string|null}:{}),recurrence:parsedRecurrence,completedAt:t.completedAt as string|null,createdAt:t.createdAt,updatedAt:t.updatedAt,subtasks:parseSubtasks(t.subtasks),...(t.estimatedMinutes!==undefined?{estimatedMinutes:parseMinutes(t.estimatedMinutes,'Aufgabe')}:{})};
 });
 if(new Set(tasks.map(t=>t.id)).size!==tasks.length)throw new Error('Doppelte Aufgaben-ID.');
 const projects=raw.projects.map((item):Project=>{
  const p=safeRecord(item);
  if(typeof p.id!=='string'||typeof p.name!=='string'||typeof p.color!=='string'||typeof p.createdAt!=='string')throw new Error('Ungültiges Projekt.');
  return{id:p.id,name:p.name,color:p.color,createdAt:p.createdAt};
 });
 const completionEvents=raw.completionEvents.map((item):CompletionEvent=>{
  const e=safeRecord(item);
  if(typeof e.id!=='string'||typeof e.taskId!=='string'||typeof e.occurredAt!=='string'||!dateOrNull(e.previousScheduledDate)||!dateOrNull(e.resultingScheduledDate)||!nullableString(e.undoneAt))throw new Error('Ungültiger Abschluss.');
  return{id:e.id,taskId:e.taskId,occurredAt:e.occurredAt,previousScheduledDate:e.previousScheduledDate as string|null,resultingScheduledDate:e.resultingScheduledDate as string|null,previousCompletedAt:nullableString(e.previousCompletedAt)?e.previousCompletedAt as string|null:null,undoneAt:e.undoneAt as string|null,previousSubtasks:e.previousSubtasks===undefined?undefined:parseSubtasks(e.previousSubtasks)};
 });
 return{schemaVersion:8,tasks,projects,completionEvents,templates:parseTemplates(raw.templates),weeklyBudgetMinutes:parseBudgets(raw.weeklyBudgetMinutes)};
}
export function validateData(v:unknown):v is AppData{try{return migrateData(v).schemaVersion===8}catch{return false}}
export class LocalTaskRepository implements TaskRepository{
 constructor(private storage:Pick<Storage,'getItem'|'setItem'>=localStorage){}
 load(){const raw=this.storage.getItem(STORAGE_KEY);if(!raw)return emptyData();try{return migrateData(JSON.parse(raw))}catch{throw new Error('Gespeicherte Daten sind beschädigt. Sie wurden nicht überschrieben.')}}
 save(data:AppData){this.storage.setItem(STORAGE_KEY,JSON.stringify(migrateData(data)))}
 export(data:AppData){return JSON.stringify(migrateData(data),null,2)}
 parseImport(json:string){try{return migrateData(JSON.parse(json))}catch{throw new Error('Die Datei hat kein gültiges Task-Companion-Format.')}}
}
