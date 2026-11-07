import type {RadarGroup} from './deadlineRadar';
import {isOpenTask} from './deadlineRadar';
import type {Priority,Subtask,Task} from './types';

export interface FocusedStep {
 taskId:string;
 stepId:string;
 taskTitle:string;
 title:string;
 plannedDate:string;
 deadlineDate:string|null;
 projectId:string|null;
 priority:Priority;
 estimatedMinutes:number|null;
 stepIndex:number;
 completedCount:number;
 totalCount:number;
}

/** Project an existing task+subtask into the daily list; never duplicate or mutate stored data. */
export function focusedSteps(tasks:Task[], from:string, to=from):FocusedStep[] {
 const items:FocusedStep[]=[];
 for(const task of tasks){
  if(!isOpenTask(task))continue;
  const subtasks:Subtask[]=task.subtasks??[];
  for(let i=0;i<subtasks.length;i++){
   const step=subtasks[i];
   if(step.completed||!step.plannedDate||step.plannedDate<from||step.plannedDate>to)continue;
   items.push({
    taskId:task.id,stepId:step.id,title:step.title,taskTitle:task.title,
    plannedDate:step.plannedDate,deadlineDate:task.deadlineDate,projectId:task.projectId,
    priority:task.priority,estimatedMinutes:step.estimatedMinutes??null,
    stepIndex:i,completedCount:subtasks.filter(s=>s.completed).length,totalCount:subtasks.length
   });
  }
 }
 return items.sort((a,b)=>a.plannedDate.localeCompare(b.plannedDate)||
  a.priority-b.priority||a.taskTitle.localeCompare(b.taskTitle,'de')||
  a.stepIndex-b.stepIndex||a.stepId.localeCompare(b.stepId));
}

/** Separates already missed planned steps from ones that are scheduled for today. */
export function stepsDueNow(tasks:Task[],today:string):{overdue:FocusedStep[];today:FocusedStep[]} {
 const entries=focusedSteps(tasks,'0000-01-01',today);
 return {
  overdue:entries.filter(e=>e.plannedDate<today),
  today:entries.filter(e=>e.plannedDate===today)
 };
}

/**
 * Today contains each parent task at most once. An entry that showed up solely
 * because of a due subtask is represented by the focused step instead.
 * Tasks with their own scheduled date or actual deadline remain visible.
 */
export function parentGroupsWithoutStepOnlyDuplicates(groups:RadarGroup[],today:string):RadarGroup[] {
 return groups.map(group=>group.key==='planned'
  ? {...group,description:'Eigenständig eingeplante Hauptaufgaben; fällige Unteraufgaben stehen oben als einzelne Schritte.',tasks:group.tasks.filter(t=>t.scheduledDate!==null&&t.scheduledDate<=today)}
  : group);
}
