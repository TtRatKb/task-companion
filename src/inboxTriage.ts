import {isValidDate} from './date';
import {isOpenTask} from './deadlineRadar';
import type {AppData,Priority,Task} from './types';

export type InboxTriagePatch = {
 projectId:string|null;
 priority:Priority;
 scheduledDate:string|null;
 deadlineDate:string|null;
};

export type InboxTriageResult =
 | {status:'saved';data:AppData}
 | {status:'conflict'|'missing'|'invalid';data:AppData};

/** A snapshot of the currently open Inbox, in original display order. */
export function inboxQueue(tasks:Task[]):string[] {
 return tasks.filter(t=>isOpenTask(t)&&t.projectId===null).map(t=>t.id);
}

/** A restricted, conflict-safe edit: never touch checklists, recurrence or time estimates. */
export function applyInboxTriage(
 data:AppData,taskId:string,expectedUpdatedAt:string,patch:InboxTriagePatch,at=new Date()
):InboxTriageResult {
 const task=data.tasks.find(t=>t.id===taskId);
 if(!task||!isOpenTask(task))return {status:'missing',data};
 if(task.updatedAt!==expectedUpdatedAt)return {status:'conflict',data};
 if((patch.projectId!==null&&!data.projects.some(p=>p.id===patch.projectId))||
    ![1,2,3,4].includes(patch.priority)||
    (patch.scheduledDate!==null&&!isValidDate(patch.scheduledDate))||
    (patch.deadlineDate!==null&&!isValidDate(patch.deadlineDate)))
  return {status:'invalid',data};
 const unchanged=task.projectId===patch.projectId&&task.priority===patch.priority&&
  task.scheduledDate===patch.scheduledDate&&task.deadlineDate===patch.deadlineDate;
 if(unchanged)return {status:'saved',data};
 return {
  status:'saved',
  data:{...data,tasks:data.tasks.map(t=>t.id===taskId?
   {...t,...patch,updatedAt:at.toISOString()}:t)}
 };
}
