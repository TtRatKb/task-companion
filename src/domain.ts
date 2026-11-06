import { nextWeekday, todayLocal } from './date';
import type { AppData, Task } from './types';
export const id=()=>crypto.randomUUID();
export function completeTask(data:AppData,taskId:string,now=new Date()):AppData {
 const task=data.tasks.find(t=>t.id===taskId); if(!task||task.completedAt)return data;
 const occurredAt=now.toISOString(); const day=todayLocal(now); const next=task.recurrence?nextWeekday(day,task.recurrence.weekday):null;
 const changed:Task={...task,completedAt:task.recurrence?null:occurredAt,scheduledDate:task.recurrence?next:task.scheduledDate,updatedAt:occurredAt};
 return {...data,tasks:data.tasks.map(t=>t.id===taskId?changed:t),completionEvents:[...data.completionEvents,{id:id(),taskId,occurredAt,previousScheduledDate:task.scheduledDate,resultingScheduledDate:next,undoneAt:null}]};
}
export function undoCompletion(data:AppData,eventId:string,now=new Date()):AppData {
 const event=data.completionEvents.find(e=>e.id===eventId); if(!event||event.undoneAt)return data; const stamp=now.toISOString();
 return {...data,tasks:data.tasks.map(t=>t.id===event.taskId?{...t,completedAt:null,scheduledDate:event.previousScheduledDate,updatedAt:stamp}:t),completionEvents:data.completionEvents.map(e=>e.id===eventId?{...e,undoneAt:stamp}:e)};
}
