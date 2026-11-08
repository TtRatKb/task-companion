import type { AppData, Subtask, Task, TaskTemplate } from './types';
import {parseAndResolveStep,templateAnchorKind,templateStepFromSubtask} from './relativePlanning';

const createId = () => crypto.randomUUID();
export function checklistProgress(task: Task): { done: number; total: number } {
 const items=task.subtasks??[];
 return {done:items.filter(s=>s.completed).length,total:items.length};
}
export function toggleSubtask(data: AppData, taskId: string, subtaskId: string, now=new Date()): AppData {
 const task=data.tasks.find(t=>t.id===taskId);
 if(!task || (task.completedAt && !task.recurrence) || !(task.subtasks??[]).some(s=>s.id===subtaskId)) return data;
 return {...data,tasks:data.tasks.map(t=>t.id===taskId?{...t,subtasks:t.subtasks?.map(s=>s.id===subtaskId?{...s,completed:!s.completed}:s),updatedAt:now.toISOString()}:t)};
}
export interface TemplateEstimateOptions {
 estimatedMinutes?:number|null;
 stepEstimatesMinutes?:(number|null)[];
}
export function makeTemplate(
 name:string,description:string,steps:string[],now=new Date(),
 anchorKind?:'event'|'deadline',estimates:TemplateEstimateOptions={}
):TaskTemplate {
 const cleanSteps=steps.map((text,index)=>({text:text.trim(),minutes:estimates.stepEstimatesMinutes?.[index]??null}))
  .filter(row=>!!row.text);
 if(!name.trim())throw new Error('Die Vorlage braucht einen Namen.');
 const minutes=estimates.estimatedMinutes??null;
 const stepMinutes=cleanSteps.map(row=>row.minutes);
 return {id:createId(),name:name.trim(),description:description.trim(),steps:cleanSteps.map(row=>row.text),
  ...(anchorKind?{anchorKind}:{}),
  ...(minutes!==null?{estimatedMinutes:minutes}:{}),
  ...(stepMinutes.some(value=>value!==null)?{stepEstimatesMinutes:stepMinutes}:{}),
  createdAt:now.toISOString(),updatedAt:now.toISOString()};
}
export function templateFromTask(task:Task,name=task.title):TaskTemplate {
 return makeTemplate(name,task.description,(task.subtasks??[]).map(templateStepFromSubtask),new Date(),
  task.eventDate?'event':undefined,{
   estimatedMinutes:task.estimatedMinutes??null,
   stepEstimatesMinutes:(task.subtasks??[]).map(step=>step.estimatedMinutes??null)
  });
}
export function taskFromTemplate(template:TaskTemplate,projectId:string|null,now=new Date()):Task {
 const timestamp=now.toISOString();
 return {id:createId(),title:template.name,description:template.description,projectId,priority:4,
  scheduledDate:null,deadlineDate:null,...(templateAnchorKind(template)==='event'?{eventDate:null}:{}),
  recurrence:null,completedAt:null,createdAt:timestamp,updatedAt:timestamp,
  ...(template.estimatedMinutes!==undefined?{estimatedMinutes:template.estimatedMinutes}:{}),
  subtasks:template.steps.map((raw,index)=>({id:createId(),...parseAndResolveStep(raw,null),completed:false,
   ...(template.stepEstimatesMinutes?.[index]!=null?{estimatedMinutes:template.stepEstimatesMinutes[index]}:{})}))};
}
export function freshSubtask(title:string):Subtask {
 return {id:createId(),...parseAndResolveStep(title,null),completed:false};
}
