import {todayLocal} from './date';import {nextOccurrence} from './recurrence';import type {AppData,Task} from './types';
export const id=()=>crypto.randomUUID();
export function completeTask(data:AppData,taskId:string,now=new Date()):AppData{
 const task=data.tasks.find(t=>t.id===taskId);if(!task||(!task.recurrence&&task.completedAt))return data;const occurredAt=now.toISOString(),day=todayLocal(now);
 if(task.recurrence){const duplicate=data.completionEvents.some(e=>e.taskId===taskId&&!e.undoneAt&&todayLocal(new Date(e.occurredAt))===day);if(duplicate||(task.scheduledDate!==null&&task.scheduledDate>day))return data}
 const next=task.recurrence?nextOccurrence(day,task.recurrence):null;const changed:Task={...task,completedAt:occurredAt,scheduledDate:task.recurrence?next:task.scheduledDate,subtasks:task.recurrence?task.subtasks?.map(s=>({...s,completed:false})):task.subtasks,updatedAt:occurredAt};
 return{...data,tasks:data.tasks.map(t=>t.id===taskId?changed:t),completionEvents:[...data.completionEvents,{id:id(),taskId,occurredAt,previousScheduledDate:task.scheduledDate,resultingScheduledDate:next,previousCompletedAt:task.completedAt,previousSubtasks:task.subtasks?.map(s=>({...s})),undoneAt:null}]};
}
export function undoCompletion(data:AppData,eventId:string,now=new Date()):AppData{
 const event=data.completionEvents.find(e=>e.id===eventId);if(!event||event.undoneAt)return data;const task=data.tasks.find(t=>t.id===event.taskId);const newer=data.completionEvents.some(e=>e.taskId===event.taskId&&!e.undoneAt&&e.occurredAt>event.occurredAt);
 if(!task||newer||(task.recurrence&&task.scheduledDate!==event.resultingScheduledDate))return data;const stamp=now.toISOString();
 return{...data,tasks:data.tasks.map(t=>t.id===event.taskId?{...t,completedAt:event.previousCompletedAt,scheduledDate:event.previousScheduledDate,subtasks:event.previousSubtasks??t.subtasks,updatedAt:stamp}:t),completionEvents:data.completionEvents.map(e=>e.id===eventId?{...e,undoneAt:stamp}:e)};
}
