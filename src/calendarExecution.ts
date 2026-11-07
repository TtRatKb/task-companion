import {toggleSubtask} from './checklists';
import {completeTask,undoCompletion} from './domain';
import {isOpenTask} from './deadlineRadar';
import type {AppData,Task} from './types';

export type CalendarExecutionStatus='changed'|'conflict'|'invalid'|'blocked';
export type CalendarExecutionMode='complete'|'reopen';
export type CalendarExecutionReceipt=
 |{kind:'step';taskId:string;stepId:string;expectedComplete:boolean;version:string;title:string}
 |{kind:'task';taskId:string;eventId:string;version:string;title:string};
export type CalendarExecutionResult={
 status:CalendarExecutionStatus;data:AppData;receipt?:CalendarExecutionReceipt
};

/** Explicit checked state is safer than blind toggling during concurrent cloud updates. */
export function executeCalendarItem(
 data:AppData,taskId:string,stepId:string|undefined,expectedVersion:string,
 mode:CalendarExecutionMode,now=new Date()
):CalendarExecutionResult {
 const task=data.tasks.find(t=>t.id===taskId);
 if(!task||!isOpenTask(task))return {status:'invalid',data};
 if(task.updatedAt!==expectedVersion)return {status:'conflict',data};
 if(stepId){
  const step=task.subtasks?.find(s=>s.id===stepId);
  if(!step||step.completed!==(mode==='reopen'))return {status:'invalid',data};
  const next=toggleSubtask(data,taskId,stepId,now);
  if(next===data)return {status:'invalid',data};
  const changed=next.tasks.find(t=>t.id===taskId)!;
  return {status:'changed',data:next,receipt:{
   kind:'step',taskId,stepId,expectedComplete:mode==='complete',
   version:changed.updatedAt,title:step.title
  }};
 }
 if(mode!=='complete')return {status:'invalid',data};
 const next=completeTask(data,taskId,now);
 if(next===data)return {status:'blocked',data};
 const event=next.completionEvents.at(-1)!;
 const changed=next.tasks.find(t=>t.id===taskId)!;
 return {status:'changed',data:next,
  receipt:{kind:'task',taskId,eventId:event.id,version:changed.updatedAt,title:task.title}};
}

/** Undo only the exact action made by this calendar. Never overwrite later changes. */
export function undoCalendarExecution(data:AppData,receipt:CalendarExecutionReceipt,now=new Date()):CalendarExecutionResult {
 const task=data.tasks.find(t=>t.id===receipt.taskId);
 if(!task||task.updatedAt!==receipt.version)return {status:'conflict',data};
 if(receipt.kind==='step'){
  const step=task.subtasks?.find(s=>s.id===receipt.stepId);
  if(!step||step.completed!==receipt.expectedComplete)return {status:'conflict',data};
  const next=toggleSubtask(data,receipt.taskId,receipt.stepId,now);
  return next===data?{status:'conflict',data}:{status:'changed',data:next};
 }
 const event=data.completionEvents.find(e=>e.id===receipt.eventId);
 if(!event||event.undoneAt)return {status:'conflict',data};
 const next=undoCompletion(data,receipt.eventId,now);
 return next===data?{status:'conflict',data}:{status:'changed',data:next};
}
