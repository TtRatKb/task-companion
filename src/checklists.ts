import type { AppData, Subtask, Task, TaskTemplate } from './types';

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
export function makeTemplate(name:string, description:string, steps:string[], now=new Date()):TaskTemplate {
 const cleaned=steps.map(s=>s.trim()).filter(Boolean);
 if(!name.trim())throw new Error('Die Vorlage braucht einen Namen.');
 return {id:createId(),name:name.trim(),description:description.trim(),steps:cleaned,createdAt:now.toISOString(),updatedAt:now.toISOString()};
}
export function templateFromTask(task:Task, name=task.title):TaskTemplate {
 return makeTemplate(name,task.description,(task.subtasks??[]).map(s=>s.title));
}
export function taskFromTemplate(template:TaskTemplate, projectId:string|null, now=new Date()):Task {
 const timestamp=now.toISOString();
 return {id:createId(),title:template.name,description:template.description,projectId,priority:4,
  scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,createdAt:timestamp,updatedAt:timestamp,
  subtasks:template.steps.map(title=>({id:createId(),title,completed:false}))};
}
export function freshSubtask(title:string):Subtask {
 return {id:createId(),title:title.trim(),completed:false};
}
