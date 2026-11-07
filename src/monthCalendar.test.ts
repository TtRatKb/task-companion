import {describe,expect,it} from 'vitest';
import {emptyData,type Task} from './types';
import {
 budgetForDay,dayCalendarItems,monthCalendarItems,monthCalendarSummary,
 monthGridDates,monthLast,monthShift,selectedDateAfterShift
} from './monthCalendar';

const stamp='2026-11-01T09:00:00Z';
const task=(id:string,values:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:3,
 scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,
 createdAt:stamp,updatedAt:stamp,...values
});

describe('Monatskalender – unveränderliche Kalenderprojektion',()=>{
 it('starts Monday, ends Sunday, and handles year/month edges',()=>{
  const november=monthGridDates('2026-11');
  expect(november[0]).toBe('2026-10-26');
  expect(november.at(-1)).toBe('2026-12-06');
  expect(november).toHaveLength(42);
  expect(monthShift('2026-12',1)).toBe('2027-01');
  expect(monthShift('2027-01',-1)).toBe('2026-12');
  expect(monthLast('2024-02')).toBe('2024-02-29');
  expect(monthLast('2025-02')).toBe('2025-02-28');
 });
 it('keeps a selected day where possible, and clamps to shorter months',()=>{
  expect(selectedDateAfterShift('2026-01-31','2026-02')).toBe('2026-02-28');
  expect(selectedDateAfterShift('2024-01-31','2024-02')).toBe('2024-02-29');
  expect(selectedDateAfterShift('2026-11-07','2026-12')).toBe('2026-12-07');
  expect(selectedDateAfterShift('garbage','2026-11')).toBe('2026-11-01');
 });
 it('rejects invalid month strings instead of producing misleading dates',()=>{
  for(const month of ['2026-13','2026-00','2026-1','abc', '2026-11-01'])
   expect(()=>monthGridDates(month)).toThrow();
 });
 it('shows the parent scheduled work and its separately scheduled step exactly once each',()=>{
  const items=monthCalendarItems([task('exam',{
   title:'Klassenarbeit',scheduledDate:'2026-11-07',estimatedMinutes:180,deadlineDate:'2026-11-27',
   subtasks:[
    {id:'step1',title:'ClassTime',completed:false,plannedDate:'2026-11-07',estimatedMinutes:45},
    {id:'step2',title:'Erwartungshorizont',completed:false,plannedDate:'2026-11-10',estimatedMinutes:60},
    {id:'done',title:'Schon fertig',completed:true,plannedDate:'2026-11-07'}
   ]
  })],'2026-11');
  const today=dayCalendarItems(items,'2026-11-07');
  expect(today.filter(x=>x.kind==='work')).toHaveLength(2);
  expect(today.filter(x=>x.kind==='work').map(x=>x.key)).toEqual(['task:exam','subtask:exam:step1']);
  expect(items.some(x=>x.kind==='work'&&x.entry.title==='Schon fertig')).toBe(false);
  const summary=monthCalendarSummary(items,'2026-11');
  expect(summary.workCount).toBe(3);
  expect(summary.knownMinutes).toBe(105); // parent estimate suppressed by estimated subtasks
  expect(summary.unestimated).toBe(1);
 });
 it('separates the last possible work day from the day the task is already needed',()=>{
  const items=monthCalendarItems([task('exam',{title:'Klassenarbeit',
   deadlineDate:'2026-11-27',scheduledDate:'2026-11-13'})],'2026-11');
  expect(dayCalendarItems(items,'2026-11-26').map(x=>x.kind)).toEqual(['ready']);
  expect(dayCalendarItems(items,'2026-11-27').map(x=>x.kind)).toEqual(['required']);
  expect(dayCalendarItems(items,'2026-11-13').map(x=>x.kind)).toEqual(['work']);
  expect(monthCalendarSummary(items,'2026-11').readyCount).toBe(1);
 });
 it('shows cross-month ready-by and required markers in neighboring calendar cells',()=>{
  const items=monthCalendarItems([task('exam',{deadlineDate:'2026-12-01'})],'2026-11');
  expect(dayCalendarItems(items,'2026-11-30').map(x=>x.kind)).toEqual(['ready']);
  expect(dayCalendarItems(items,'2026-12-01').map(x=>x.kind)).toEqual(['required']);
  expect(monthCalendarSummary(items,'2026-11').readyCount).toBe(1);
 });
 it('ignores finished one-time tasks, completed steps and unrelated future occurrences',()=>{
  const done=task('closed',{completedAt:stamp,scheduledDate:'2026-11-11',deadlineDate:'2026-11-12'});
  const next=task('recurring',{scheduledDate:'2026-11-16',
   recurrence:{kind:'interval',every:2,unit:'weeks',anchorDate:'2026-11-02'},
   subtasks:[{id:'step',title:'Heute',completed:false,plannedDate:'2026-11-10'}]});
  const items=monthCalendarItems([done,next],'2026-11');
  expect(items.some(x=>x.taskId==='closed')).toBe(false);
  expect(items.filter(x=>x.kind==='work'&&x.taskId==='recurring')).toHaveLength(2);
  expect(items.some(x=>x.kind==='work'&&x.date==='2026-11-30')).toBe(false);
 });
 it('uses the existing weekday budget pattern, Monday through Sunday',()=>{
  const budgets=[60,90,120,180,30,0,null];
  expect(budgetForDay('2026-11-09',budgets)).toBe(60);
  expect(budgetForDay('2026-11-14',budgets)).toBe(0);
  expect(budgetForDay('2026-11-15',budgets)).toBeNull();
 });
 it('does not modify IDs, dates, deadlines, offsets, budgets or recurring rules',()=>{
  const app={...emptyData(),weeklyBudgetMinutes:[60,60,60,60,60,null,null],
   tasks:[task('exam',{scheduledDate:'2026-11-15',deadlineDate:'2026-11-27',
    subtasks:[{id:'a',title:'Aufgaben',completed:false,plannedDate:'2026-11-13',offset:{amount:2,unit:'weeks'}}]})]};
  const original=JSON.stringify(app);
  const items=monthCalendarItems(app.tasks,'2026-11');
  dayCalendarItems(items,'2026-11-13');
  monthCalendarSummary(items,'2026-11');
  expect(JSON.stringify(app)).toBe(original);
 });
});
