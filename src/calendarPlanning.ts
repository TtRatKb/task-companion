import {isValidDate} from './date';
import {isOpenTask} from './deadlineRadar';
import {moveWorkItem,unscheduledEntries,workEntries,type WeekEntry} from './weeklyPlanner';
import type {AppData,SubtaskOffset,Task} from './types';

export interface PlanningEntry {
 entry:WeekEntry;
 version:string;
}
/** Never use a drag payload to directly select a task: resolve it against live data. */
export function findPlanningEntry(tasks:Task[],key:string):PlanningEntry|null {
 const item=[...workEntries(tasks),...unscheduledEntries(tasks)].find(entry=>entry.key===key);
 const parent=item&&tasks.find(t=>t.id===item.taskId);
 return item&&parent&&isOpenTask(parent)?{entry:item,version:parent.updatedAt}:null;
}

export function calendarBacklog(tasks:Task[]):PlanningEntry[] {
 const lookup=new Map(tasks.map(task=>[task.id,task]));
 return unscheduledEntries(tasks)
  .map(entry=>({entry,version:lookup.get(entry.taskId)?.updatedAt??''}))
  .sort((a,b)=>(a.entry.deadlineDate??'9999-12-31').localeCompare(b.entry.deadlineDate??'9999-12-31')
   ||a.entry.priority-b.entry.priority||a.entry.title.localeCompare(b.entry.title,'de')||a.entry.key.localeCompare(b.entry.key));
}

export type CalendarPlanStatus='moved'|'unchanged'|'conflict'|'invalid';
export interface CalendarPlanReceipt {
 key:string;taskId:string;subtaskId?:string;previousDate:string|null;
 previousPlannedDate?:string|null;
 previousOffset?:SubtaskOffset;
 resultDate:string;resultVersion:string;title:string;
}
export interface CalendarPlanResult {status:CalendarPlanStatus;data:AppData;receipt?:CalendarPlanReceipt}

/** The only calendar move commit path, shared by dragging, click-to-plan and date inputs. */
export function scheduleCalendarWork(
 data:AppData,key:string,expectedVersion:string,newDate:string,at=new Date()
):CalendarPlanResult {
 if(!isValidDate(newDate))return {status:'invalid',data};
 const source=findPlanningEntry(data.tasks,key);
 if(!source)return {status:'invalid',data};
 if(source.version!==expectedVersion)return {status:'conflict',data};
 if(source.entry.date===newDate)return {status:'unchanged',data};
 const {taskId,subtaskId,title,date}=source.entry;
 const parent=data.tasks.find(t=>t.id===taskId)!;
 const step=subtaskId?parent.subtasks?.find(s=>s.id===subtaskId):undefined;
 if(subtaskId&&!step)return {status:'invalid',data};
 const next=moveWorkItem(data,taskId,subtaskId,newDate,at);
 if(next===data)return {status:'invalid',data};
 const changed=next.tasks.find(t=>t.id===taskId)!;
 return {
  status:'moved',data:next,
  receipt:{key,taskId,subtaskId,previousDate:date||null,previousPlannedDate:step?.plannedDate,
   previousOffset:step?.offset?{...step.offset}:undefined,
   resultDate:newDate,resultVersion:changed.updatedAt,title}
 };
}
/** Restores exactly the previous date and relative deadline binding; never touches concurrent edits. */
export function undoCalendarSchedule(data:AppData,receipt:CalendarPlanReceipt,at=new Date()):CalendarPlanResult {
 const parent=data.tasks.find(t=>t.id===receipt.taskId);
 if(!parent||parent.updatedAt!==receipt.resultVersion||!isOpenTask(parent))
  return {status:'conflict',data};
 const timestamp=at.toISOString();
 let changed:Task;
 if(receipt.subtaskId){
  const step=parent.subtasks?.find(s=>s.id===receipt.subtaskId);
  if(!step||step.completed||step.plannedDate!==receipt.resultDate||step.offset!==undefined)
   return {status:'conflict',data};
  changed={...parent,updatedAt:timestamp,
   subtasks:parent.subtasks?.map(s=>s.id===receipt.subtaskId
    ?{...s,plannedDate:receipt.previousPlannedDate,offset:receipt.previousOffset}:s)};
 }else{
  if(parent.scheduledDate!==receipt.resultDate)return {status:'conflict',data};
  changed={...parent,updatedAt:timestamp,scheduledDate:receipt.previousDate};
 }
 return {status:'moved',data:{...data,tasks:data.tasks.map(t=>t.id===parent.id?changed:t)}};
}
