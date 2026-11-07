import {addDays,weekday} from './date';
import {isOpenTask} from './deadlineRadar';
import {deadlineWorkday} from './relativePlanning';
import type {AppData,Task} from './types';

export type WeekEntry={
 key:string;taskId:string;subtaskId?:string;date:string;title:string;parentTitle?:string;
 estimatedMinutes:number|null;kind:'task'|'subtask';priority:Task['priority'];
 deadlineDate:string|null;relative:boolean;projectId:string|null;
};

export interface WorkDay {
 date:string;
 entries:WeekEntry[];
 knownMinutes:number;
 unestimated:number;
 budgetMinutes:number|null;
 overBudget:boolean;
}

export function mondayOf(date:string):string {
 const day=weekday(date);
 return addDays(date,-((day+6)%7));
}

export function formatDuration(minutes:number):string {
 const hours=Math.floor(minutes/60),remaining=minutes%60;
 if(hours===0)return `${remaining} Min.`;
 if(remaining===0)return `${hours} Std.`;
 return `${hours} Std. ${remaining} Min.`;
}

/**
 * Parent tasks are never counted twice with separately estimated subtasks.
 * Parent estimatedMinutes applies to the whole task ONLY if no open subtask
 * has its own estimate; otherwise the subtasks own the workload figures.
 * Undated steps are never distributed or assumed to occur on the parent day.
 */
export function workEntries(tasks:Task[]):WeekEntry[] {
 return tasks.filter(isOpenTask).flatMap(task=>{
  const subtasks=(task.subtasks??[]).filter(s=>!s.completed);
  const estimatedSteps=subtasks.some(s=>s.estimatedMinutes!==undefined&&s.estimatedMinutes!==null);
  const entries:WeekEntry[]=[];
  if(task.scheduledDate){
   entries.push({
    key:`task:${task.id}`,taskId:task.id,date:task.scheduledDate,title:task.title,
    estimatedMinutes:estimatedSteps?null:task.estimatedMinutes??null,kind:'task',
    priority:task.priority,deadlineDate:task.deadlineDate,relative:false,projectId:task.projectId
   });
  }
  for(const step of subtasks){
   if(!step.plannedDate)continue;
   entries.push({
    key:`subtask:${task.id}:${step.id}`,taskId:task.id,subtaskId:step.id,
    date:step.plannedDate,title:step.title,parentTitle:task.title,
    estimatedMinutes:step.estimatedMinutes??null,kind:'subtask',priority:task.priority,
    deadlineDate:task.deadlineDate,relative:!!step.offset,projectId:task.projectId
   });
  }
  return entries;
 });
}

export function unscheduledEntries(tasks:Task[]):WeekEntry[] {
 return tasks.filter(isOpenTask).flatMap(task=>{
  const subtasks=(task.subtasks??[]).filter(s=>!s.completed);
  const estimatedSteps=subtasks.some(s=>s.estimatedMinutes!==undefined&&s.estimatedMinutes!==null);
  const entries:WeekEntry[]=[];
  if(!task.scheduledDate)
   entries.push({
    key:`task:${task.id}`,taskId:task.id,date:'',title:task.title,
    estimatedMinutes:estimatedSteps?null:task.estimatedMinutes??null,
    kind:'task',priority:task.priority,deadlineDate:task.deadlineDate,
    relative:false,projectId:task.projectId
   });
  for(const step of subtasks)if(!step.plannedDate)
   entries.push({
    key:`subtask:${task.id}:${step.id}`,taskId:task.id,subtaskId:step.id,
    date:'',title:step.title,parentTitle:task.title,estimatedMinutes:step.estimatedMinutes??null,
    kind:'subtask',priority:task.priority,deadlineDate:task.deadlineDate,
    relative:!!step.offset,projectId:task.projectId
   });
  return entries;
 });
}

export function weekDays(tasks:Task[],monday:string,budgets:(number|null)[]):WorkDay[] {
 const entries=workEntries(tasks);
 return Array.from({length:7},(_,i)=>{
  const date=addDays(monday,i);
  const dayEntries=entries.filter(e=>e.date===date)
   .sort((a,b)=>a.priority-b.priority||a.title.localeCompare(b.title,'de'));
  const knownMinutes=dayEntries.reduce((total,e)=>total+(e.estimatedMinutes??0),0);
  const unestimated=dayEntries.filter(e=>e.estimatedMinutes===null).length;
  const budgetMinutes=budgets[i]??null;
  return {date,entries:dayEntries,knownMinutes,unestimated,budgetMinutes,
   overBudget:budgetMinutes!==null&&knownMinutes>budgetMinutes};
 });
}

export function moveWorkItem(data:AppData,taskId:string,subtaskId:string|undefined,newDate:string|null,at=new Date()):AppData {
 const task=data.tasks.find(t=>t.id===taskId);
 if(!task || !isOpenTask(task))return data;
 const timestamp=at.toISOString();
 if(subtaskId){
  const step=task.subtasks?.find(s=>s.id===subtaskId);
  if(!step||step.completed)return data;
  if(step.plannedDate===newDate&&step.offset===undefined)return data;
  return {...data,tasks:data.tasks.map(t=>t.id===taskId?{
   ...t,updatedAt:timestamp,
   subtasks:t.subtasks?.map(s=>s.id===subtaskId?{...s,plannedDate:newDate,offset:undefined}:s)
  }:t)};
 }
 if(task.scheduledDate===newDate)return data;
 return {...data,tasks:data.tasks.map(t=>t.id===taskId?{...t,scheduledDate:newDate,updatedAt:timestamp}:t)};
}

export function violatesDeadline(entry:WeekEntry,newDate:string|null):boolean {
 return !!newDate&&!!entry.deadlineDate&&newDate>deadlineWorkday(entry.deadlineDate);
}
