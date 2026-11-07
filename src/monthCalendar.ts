import {addDays,isValidDate,weekday} from './date';
import {isOpenTask} from './deadlineRadar';
import {deadlineWorkday} from './relativePlanning';
import {workEntries,type WeekEntry} from './weeklyPlanner';
import type {Task} from './types';

export type CalendarItem=
 | {kind:'work';date:string;key:string;taskId:string;taskUpdatedAt:string;entry:WeekEntry}
 | {kind:'ready'|'required';date:string;key:string;taskId:string;taskUpdatedAt:string;title:string;deadlineDate:string;priority:Task['priority'];projectId:string|null};

export function monthStart(month:string):string {
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('Ungültiger Kalendermonat.');
 return month+'-01';
}
export function monthShift(month:string,delta:number):string {
 const date=monthStart(month);
 if(!Number.isInteger(delta))throw new Error('Ungültige Monatsverschiebung.');
 const [y,m]=date.split('-').map(Number);
 const n=new Date(Date.UTC(y,m-1+delta,1,12));
 return n.toISOString().slice(0,7);
}
export function monthLast(month:string):string {
 return addDays(monthShift(month,1)+'-01',-1);
}
/** Monday-first calendar, including real (muted) dates of adjacent months. */
export function monthGridDates(month:string):string[] {
 const first=monthStart(month),last=monthLast(month);
 const monday=addDays(first,-((weekday(first)+6)%7));
 const days=1+Math.floor((Date.UTC(Number(last.slice(0,4)),Number(last.slice(5,7))-1,Number(last.slice(8)))-
  Date.UTC(Number(monday.slice(0,4)),Number(monday.slice(5,7))-1,Number(monday.slice(8))))/86_400_000);
 const padded=Math.ceil(days/7)*7;
 return Array.from({length:padded},(_,index)=>addDays(monday,index));
}
export function selectedDateAfterShift(previousDay:string,nextMonth:string):string {
 monthStart(nextMonth);
 if(!isValidDate(previousDay))return nextMonth+'-01';
 const day=Number(previousDay.slice(8,10));
 return nextMonth+'-'+String(Math.min(day,Number(monthLast(nextMonth).slice(8,10)))).padStart(2,'0');
}
/** Entries are projections of existing work days and ready-by deadlines; never mutate Tasks. */
export function monthCalendarItems(tasks:Task[],month:string):CalendarItem[] {
 const first=monthGridDates(month)[0];
 const last=monthGridDates(month).at(-1)!;
 const versions=new Map(tasks.map(t=>[t.id,t.updatedAt]));
 const entries:CalendarItem[]=workEntries(tasks)
  .filter(entry=>entry.date>=first&&entry.date<=last)
  .map(entry=>({kind:'work' as const,date:entry.date,key:entry.key,taskId:entry.taskId,
   taskUpdatedAt:versions.get(entry.taskId)??'',entry}));
 for(const task of tasks){
  if(!isOpenTask(task)||!task.deadlineDate)continue;
  const required=task.deadlineDate,ready=deadlineWorkday(required);
  if(ready>=first&&ready<=last)entries.push({
   kind:'ready',date:ready,key:'ready:'+task.id,taskId:task.id,
   taskUpdatedAt:task.updatedAt,title:task.title,deadlineDate:required,
   priority:task.priority,projectId:task.projectId
  });
  if(required>=first&&required<=last)entries.push({
   kind:'required',date:required,key:'required:'+task.id,taskId:task.id,
   taskUpdatedAt:task.updatedAt,title:task.title,deadlineDate:required,
   priority:task.priority,projectId:task.projectId
  });
 }
 const kindOrder={ready:0,work:1,required:2};
 return entries.sort((a,b)=>a.date.localeCompare(b.date)||kindOrder[a.kind]-kindOrder[b.kind]||
  (a.kind==='work'?a.entry.priority:a.priority)-(b.kind==='work'?b.entry.priority:b.priority)||
  (a.kind==='work'&&b.kind==='work'&&a.taskId===b.taskId?
   (a.entry.kind==='task'?0:1)-(b.entry.kind==='task'?0:1):0)||
  a.key.localeCompare(b.key));
}
export function dayCalendarItems(items:CalendarItem[],day:string):CalendarItem[] {
 return items.filter(item=>item.date===day);
}
export function monthCalendarSummary(items:CalendarItem[],month:string){
 const actual=items.filter(item=>item.date.slice(0,7)===month);
 const work=actual.filter((i):i is Extract<CalendarItem,{kind:'work'}>=>i.kind==='work');
 return {
  workCount:work.length,
  readyCount:actual.filter(i=>i.kind==='ready').length,
  knownMinutes:work.reduce((total,item)=>total+(item.entry.estimatedMinutes??0),0),
  unestimated:work.filter(item=>item.entry.estimatedMinutes===null).length
 };
}
export function budgetForDay(date:string,budgets:(number|null)[]):number|null {
 return budgets[(weekday(date)+6)%7]??null;
}
