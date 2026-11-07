import {isOpenTask} from './deadlineRadar';
import {dateBeforeDeadline} from './relativePlanning';
import type {AppData,Subtask,Task} from './types';

/** Pure, ID-based reorder: works for both persisted subtasks and draft template rows. */
export function reorderById<T extends {id:string}>(items:readonly T[],movingId:string,targetId:string):T[] {
 const from=items.findIndex(item=>item.id===movingId);
 const to=items.findIndex(item=>item.id===targetId);
 if(from<0||to<0||from===to)return items as T[];
 const result=[...items], [moving]=result.splice(from,1);
 result.splice(to,0,moving);
 return result;
}

export function stepUpDown<T extends {id:string}>(items:readonly T[],id:string,direction:-1|1):T[] {
 const index=items.findIndex(item=>item.id===id);
 const other=index+direction;
 if(index<0||other<0||other>=items.length)return items as T[];
 return reorderById(items,id,items[other].id);
}

export type TransferDateChoice='keep'|'rebase';
export interface TransferReceipt {
 fromTaskId:string;toTaskId:string;step:Subtask;sourceIndex:number;
 sourceVersion:string;destinationVersion:string;
}
export type TransferResult={
 status:'moved'|'conflict'|'invalid'|'missing';
 data:AppData;
 receipt?:TransferReceipt;
};

function updated(task:Task,subtasks:Subtask[],at:string):Task {
 return {...task,subtasks,updatedAt:at};
}

/**
 * Transfer the original step ID, checkbox, duration, date and offset safely.
 * Default 'keep': original workday unchanged, relative link removed.
 * Explicit 'rebase': retain offset, calculate a NEW date from destination deadline.
 * Revision checks prevent updates based on an old, pre-sync move dialog.
 */
export function transferSubtask(
 data:AppData,fromTaskId:string,stepId:string,toTaskId:string,choice:TransferDateChoice,
 expectedFrom:string,expectedTo:string,at=new Date()
):TransferResult {
 const source=data.tasks.find(t=>t.id===fromTaskId);
 const dest=data.tasks.find(t=>t.id===toTaskId);
 if(!source||!dest||!isOpenTask(source)||!isOpenTask(dest))
  return {status:'missing',data};
 if(source.updatedAt!==expectedFrom||dest.updatedAt!==expectedTo)
  return {status:'conflict',data};
 const index=source.subtasks?.findIndex(s=>s.id===stepId)??-1;
 const step=index>=0?source.subtasks![index]:undefined;
 if(!step||source.id===dest.id||dest.subtasks?.some(s=>s.id===step.id)||
    (choice!=='keep'&&choice!=='rebase')||
    (choice==='rebase'&&(!step.offset||!dest.deadlineDate)))
  return {status:'invalid',data};
 const moved:Subtask=choice==='rebase'&&step.offset&&dest.deadlineDate
  ? {...step,plannedDate:dateBeforeDeadline(dest.deadlineDate,step.offset)}
  : step.offset?{...step,offset:undefined}:step;
 const timestamp=at.toISOString();
 const nextSource=updated(source,(source.subtasks??[]).filter(s=>s.id!==stepId),timestamp);
 const nextDest=updated(dest,[...(dest.subtasks??[]),moved],timestamp);
 return {
  status:'moved',
  data:{...data,tasks:data.tasks.map(task=>task.id===source.id?nextSource:task.id===dest.id?nextDest:task)},
  receipt:{fromTaskId,toTaskId,step:{...step},sourceIndex:index,sourceVersion:timestamp,destinationVersion:timestamp}
 };
}

/** Conservative undo: never overwrite either task if it has changed since transfer. */
export function undoSubtaskTransfer(data:AppData,receipt:TransferReceipt,at=new Date()):TransferResult {
 const source=data.tasks.find(t=>t.id===receipt.fromTaskId);
 const dest=data.tasks.find(t=>t.id===receipt.toTaskId);
 if(!source||!dest)return {status:'missing',data};
 if(source.updatedAt!==receipt.sourceVersion||dest.updatedAt!==receipt.destinationVersion)
  return {status:'conflict',data};
 if(source.subtasks?.some(step=>step.id===receipt.step.id)||
   !dest.subtasks?.some(step=>step.id===receipt.step.id))
  return {status:'invalid',data};
 const restored=[...(source.subtasks??[])];
 restored.splice(Math.min(receipt.sourceIndex,restored.length),0,receipt.step);
 const timestamp=at.toISOString();
 return {status:'moved',data:{...data,tasks:data.tasks.map(task=>
  task.id===source.id?updated(task,restored,timestamp):
  task.id===dest.id?updated(task,(task.subtasks??[]).filter(s=>s.id!==receipt.step.id),timestamp):task
 )}};
}
