import {isOpenTask} from './deadlineRadar';
import type {Subtask,Task} from './types';

export type BundleStatus='overdue'|'today'|'upcoming'|'ready'|'unscheduled'|'finished';
export interface TaskBundle {
 task:Task;
 done:number;
 total:number;
 remaining:number;
 overdueSteps:Subtask[];
 dueTodaySteps:Subtask[];
 nextDate:string|null;
 status:BundleStatus;
 /** The event day is informational. Only real deadlines or open missed steps make this package overdue. */
 parentDeadlineOverdue:boolean;
}

/** One projection per saved parent task; never creates copies or alters planned dates. */
export function taskBundles(tasks:Task[],today:string,includeCompleted=false):TaskBundle[]{
 const bundles:TaskBundle[]=[];
 for(const task of tasks){
  const steps=task.subtasks??[];
  if(steps.length===0||(!includeCompleted&&!isOpenTask(task)))continue;
  const done=steps.filter(step=>step.completed).length;
  const open=steps.filter(step=>!step.completed);
  const overdueSteps=open.filter(step=>step.plannedDate!=null&&step.plannedDate<today)
   .sort((a,b)=>(a.plannedDate??'').localeCompare(b.plannedDate??'')||a.id.localeCompare(b.id));
  const dueTodaySteps=open.filter(step=>step.plannedDate===today);
  const nextDate=open.filter(step=>step.plannedDate!=null&&step.plannedDate>=today)
   .map(step=>step.plannedDate!).sort()[0]??null;
  // In Task Companion a deadline is the date on which work must *already be ready*.
  const parentDeadlineOverdue=!!task.deadlineDate&&task.deadlineDate<=today;
  const finished=!isOpenTask(task);
  const status:BundleStatus=finished?'finished':
   overdueSteps.length||parentDeadlineOverdue?'overdue':
   dueTodaySteps.length?'today':
   nextDate?'upcoming':open.length===0?'ready':'unscheduled';
  bundles.push({task,done,total:steps.length,remaining:open.length,overdueSteps,dueTodaySteps,nextDate,status,parentDeadlineOverdue});
 }
 const order:Record<BundleStatus,number>={overdue:0,today:1,upcoming:2,ready:3,unscheduled:4,finished:5};
 return bundles.sort((a,b)=>order[a.status]-order[b.status]||
  (a.status==='overdue'?(a.overdueSteps[0]?.plannedDate??a.task.deadlineDate??'9999-12-31')
    .localeCompare(b.overdueSteps[0]?.plannedDate??b.task.deadlineDate??'9999-12-31'):0)||
  (a.nextDate??'9999-12-31').localeCompare(b.nextDate??'9999-12-31')||
  a.task.priority-b.task.priority||a.task.title.localeCompare(b.task.title,'de')||
  a.task.id.localeCompare(b.task.id));
}
