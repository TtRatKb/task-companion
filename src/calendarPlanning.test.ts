import {describe,expect,it} from 'vitest';
import {emptyData,type AppData,type Task} from './types';
import {calendarBacklog,findPlanningEntry,scheduleCalendarWork,undoCalendarSchedule} from './calendarPlanning';

const stamp='2026-11-01T08:00:00Z';
const now=new Date('2026-11-07T10:00:00Z');
const later=new Date('2026-11-07T11:00:00Z');
function task(id:string,fields:Partial<Task>={}):Task{
 return {id,title:id,description:'',projectId:null,priority:3,
  scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,createdAt:stamp,updatedAt:stamp,
  subtasks:[],...fields};
}
function fixture():AppData {
 return {...emptyData(),tasks:[
  task('exam',{title:'Klassenarbeit',priority:2,deadlineDate:'2026-11-27',subtasks:[
   {id:'draft',title:'Aufgaben erstellen',completed:false,plannedDate:null,estimatedMinutes:90},
   {id:'relative',title:'ClassTime einrichten',completed:false,plannedDate:'2026-11-13',
    offset:{amount:2,unit:'weeks'},estimatedMinutes:45},
   {id:'done',title:'Schon erledigt',completed:true,plannedDate:null}
  ]}),
  task('inbox',{title:'Elternbrief',priority:1,scheduledDate:null}),
  task('scheduled',{title:'Bereits geplant',scheduledDate:'2026-11-15'}),
  task('closed',{title:'Abgeschlossen',completedAt:stamp}),
  task('weekly',{title:'Routine',scheduledDate:null,
   recurrence:{kind:'weekdays',weekdays:[1,3,5]},completedAt:stamp})
 ]};
}
describe('Monatskalender direkt beplanen',()=>{
 it('shows only open, unplanned parent and child work sorted by deadline and urgency',()=>{
  const data=fixture();
  const pool=calendarBacklog(data.tasks);
  expect(pool.map(i=>i.entry.key)).toEqual([
   'subtask:exam:draft','task:exam','task:inbox','task:weekly'
  ]);
  expect(pool[0].entry).toMatchObject({title:'Aufgaben erstellen',estimatedMinutes:90,deadlineDate:'2026-11-27'});
  expect(pool.some(i=>i.entry.key.includes('done')||i.entry.key.includes('closed'))).toBe(false);
 });
 it('plans an undated subtask without touching its parent deadline or sibling dates',()=>{
  const initial=fixture(),serial=JSON.stringify(initial);
  const found=findPlanningEntry(initial.tasks,'subtask:exam:draft')!;
  const result=scheduleCalendarWork(initial,found.entry.key,found.version,'2026-11-14',now);
  expect(result.status).toBe('moved');
  expect(result.data.tasks[0].subtasks?.[0]).toMatchObject({id:'draft',title:'Aufgaben erstellen',plannedDate:'2026-11-14',estimatedMinutes:90});
  expect(result.data.tasks[0].subtasks?.[1]).toEqual(initial.tasks[0].subtasks?.[1]);
  expect(result.data.tasks[0].deadlineDate).toBe('2026-11-27');
  expect(result.data.tasks[1]).toBe(initial.tasks[1]);
  expect(result.data.schemaVersion).toBe(8);
  expect(JSON.stringify(initial)).toBe(serial);
 });
 it('replans a relative step only when explicitly instructed, and undo restores the old offset',()=>{
  const initial=fixture(),item=findPlanningEntry(initial.tasks,'subtask:exam:relative')!;
  const result=scheduleCalendarWork(initial,item.entry.key,item.version,'2026-11-18',now);
  expect(result.status).toBe('moved');
  expect(result.data.tasks[0].subtasks?.[1]).toMatchObject({id:'relative',plannedDate:'2026-11-18',offset:undefined});
  expect(result.data.tasks[0].subtasks?.[1].estimatedMinutes).toBe(45);
  const undo=undoCalendarSchedule(result.data,result.receipt!,later);
  expect(undo.status).toBe('moved');
  expect(undo.data.tasks[0].subtasks?.[1]).toEqual(initial.tasks[0].subtasks?.[1]);
  expect(undo.data.tasks[0].updatedAt).toBe(later.toISOString());
 });
 it('moves a parent task and can undo without altering its child schedule',()=>{
  const initial=fixture(),item=findPlanningEntry(initial.tasks,'task:inbox')!;
  const moved=scheduleCalendarWork(initial,item.entry.key,item.version,'2026-11-20',now);
  expect(moved.status).toBe('moved');
  expect(moved.data.tasks[1].scheduledDate).toBe('2026-11-20');
  const restored=undoCalendarSchedule(moved.data,moved.receipt!,later);
  expect(restored.data.tasks[1].scheduledDate).toBeNull();
  expect(restored.data.tasks[1].subtasks).toEqual(initial.tasks[1].subtasks);
 });
 it('allows removing the work date by date-input, preserving an undo receipt',()=>{
  const initial=fixture();
  const item=findPlanningEntry(initial.tasks,'task:scheduled')!;
  const cleared=scheduleCalendarWork(initial,item.entry.key,item.version,null,now);
  expect(cleared.status).toBe('moved');
  expect(cleared.data.tasks[2].scheduledDate).toBeNull();
  const restored=undoCalendarSchedule(cleared.data,cleared.receipt!,later);
  expect(restored.data.tasks[2].scheduledDate).toBe('2026-11-15');
 });
 it('rejects stale versions, invalid dates, missing and completed steps without changing data',()=>{
  const initial=fixture();
  expect(scheduleCalendarWork(initial,'subtask:exam:draft','old','2026-11-10',now)).toMatchObject({status:'conflict',data:initial});
  expect(scheduleCalendarWork(initial,'subtask:exam:draft',stamp,'2026-11-31',now)).toMatchObject({status:'invalid',data:initial});
  expect(scheduleCalendarWork(initial,'task:closed',stamp,'2026-11-10',now)).toMatchObject({status:'invalid',data:initial});
  expect(scheduleCalendarWork(initial,'subtask:exam:done',stamp,'2026-11-10',now)).toMatchObject({status:'invalid',data:initial});
  expect(scheduleCalendarWork(initial,'other:missing',stamp,'2026-11-10',now)).toMatchObject({status:'invalid',data:initial});
 });
 it('accepts existing date as an unchanged no-op with no new save or offset loss',()=>{
  const initial=fixture();
  const unchanged=scheduleCalendarWork(initial,'subtask:exam:relative',stamp,'2026-11-13',now);
  expect(unchanged.status).toBe('unchanged');
  expect(unchanged.data).toBe(initial);
  expect(initial.tasks[0].subtasks?.[1].offset).toEqual({amount:2,unit:'weeks'});
 });
 it('does not undo against a later change, missing task or altered step',()=>{
  const initial=fixture(),moved=scheduleCalendarWork(initial,'subtask:exam:draft',stamp,'2026-11-12',now);
  const changed={...moved.data,tasks:moved.data.tasks.map(t=>t.id==='exam'?{...t,updatedAt:'2026-11-07T10:30:00Z'}:t)};
  expect(undoCalendarSchedule(changed,moved.receipt!).status).toBe('conflict');
  expect(undoCalendarSchedule({...moved.data,tasks:moved.data.tasks.filter(t=>t.id!=='exam')},moved.receipt!).status).toBe('conflict');
  expect(changed.tasks[0].subtasks?.[0].plannedDate).toBe('2026-11-12');
 });
});
