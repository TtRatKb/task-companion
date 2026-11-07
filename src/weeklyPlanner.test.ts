import {describe,expect,it} from 'vitest';
import {addDays} from './date';
import {emptyData,type Task} from './types';
import {formatDuration,mondayOf,moveWorkItem,unscheduledEntries,violatesDeadline,weekDays,workEntries} from './weeklyPlanner';

const monday='2026-11-09';
const task=(id:string,fields:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:4,scheduledDate:monday,
 deadlineDate:null,recurrence:null,completedAt:null,createdAt:'2026-11-01T10:00:00Z',
 updatedAt:'2026-11-01T10:00:00Z',...fields
});

describe('Wochenplanung und Zeitbudget',()=>{
 it('starts every week on Monday, including Sunday and DST boundaries',()=>{
  expect(mondayOf('2026-11-07')).toBe('2026-11-02');
  expect(mondayOf('2026-11-08')).toBe('2026-11-02');
  expect(mondayOf('2026-11-09')).toBe('2026-11-09');
  expect(mondayOf('2027-01-01')).toBe('2026-12-28');
  expect(mondayOf('2026-03-29')).toBe('2026-03-23');
 });
 it('tallies only explicit estimates without double-counting a parent and its subtasks',()=>{
  const master=task('Klassenarbeit',{
   estimatedMinutes:180,subtasks:[
    {id:'one',title:'Aufgaben erstellen',completed:false,plannedDate:monday,estimatedMinutes:60},
    {id:'two',title:'Erwartungshorizont',completed:false,plannedDate:addDays(monday,1),estimatedMinutes:45},
    {id:'three',title:'Schon erledigt',completed:true,plannedDate:monday,estimatedMinutes:90},
    {id:'four',title:'Noch ohne Zeit',completed:false,plannedDate:monday}
   ]
  });
  const mondayEntries=workEntries([master]).filter(e=>e.date===monday);
  expect(mondayEntries.map(e=>e.title)).toEqual(['Klassenarbeit','Aufgaben erstellen','Noch ohne Zeit']);
  expect(mondayEntries.find(e=>e.kind==='task')?.estimatedMinutes).toBeNull();
  const days=weekDays([master],monday,[120,120,null,null,null,null,null]);
  expect(days[0]).toMatchObject({knownMinutes:60,unestimated:2,overBudget:false});
  expect(days[1]).toMatchObject({knownMinutes:45,unestimated:0});
  expect(days.reduce((n,d)=>n+d.knownMinutes,0)).toBe(105);
 });
 it('counts a parent estimate when no subtask estimate exists',()=>{
  const days=weekDays([task('Unterricht vorbereiten',{estimatedMinutes:90,
   subtasks:[{id:'a',title:'Lesen',completed:false,plannedDate:addDays(monday,2)}]})],
   monday,[60,null,null,null,null,null,null]);
  expect(days[0].knownMinutes).toBe(90);
  expect(days[0].overBudget).toBe(true);
  expect(days[2].unestimated).toBe(1);
 });
 it('shows overload only for explicitly configured budgets',()=>{
  const tasks=[task('A',{estimatedMinutes:120}),task('B',{estimatedMinutes:30})];
  const without=weekDays(tasks,monday,[null,null,null,null,null,null,null]);
  expect(without[0].knownMinutes).toBe(150);
  expect(without[0].overBudget).toBe(false);
  const limited=weekDays(tasks,monday,[120,null,null,null,null,null,null]);
  expect(limited[0].overBudget).toBe(true);
  expect(weekDays(tasks,monday,[0,null,null,null,null,null,null])[0].overBudget).toBe(true);
  expect(formatDuration(150)).toBe('2 Std. 30 Min.');
  expect(formatDuration(60)).toBe('1 Std.');
  expect(formatDuration(25)).toBe('25 Min.');
 });
 it('does not auto-plan tasks without an assigned date',()=>{
  const items=[task('Inbox',{scheduledDate:null,estimatedMinutes:60}),
   task('With steps',{scheduledDate:null,subtasks:[{id:'s',title:'Noch offen',completed:false,estimatedMinutes:30}]})];
  expect(workEntries(items)).toEqual([]);
  expect(unscheduledEntries(items).map(x=>x.title)).toEqual(['Inbox','With steps','Noch offen']);
 });
 it('reschedules the selected subtask only, breaking the relative deadline link but not moving deadlines',()=>{
  const item=task('Prüfung',{scheduledDate:monday,deadlineDate:'2026-11-27',estimatedMinutes:90,
   subtasks:[{id:'s1',title:'ClassTime',completed:false,plannedDate:'2026-11-24',
    offset:{amount:3,unit:'days'},estimatedMinutes:45}]});
  const original={...emptyData(),tasks:[item]};
  const moved=moveWorkItem(original,item.id,'s1','2026-11-23',new Date('2026-11-07T10:00:00Z'));
  expect(moved.tasks[0].subtasks?.[0]).toMatchObject({plannedDate:'2026-11-23',estimatedMinutes:45});
  expect(moved.tasks[0].subtasks?.[0].offset).toBeUndefined();
  expect(moved.tasks[0].deadlineDate).toBe('2026-11-27');
  expect(moved.tasks[0].scheduledDate).toBe(monday);
  expect(original.tasks[0].subtasks?.[0].offset).toEqual({amount:3,unit:'days'});
  expect(moveWorkItem(original,item.id,undefined,'2026-11-16').tasks[0].scheduledDate).toBe('2026-11-16');
  expect(moveWorkItem(original,item.id,'s1',null).tasks[0].subtasks?.[0].plannedDate).toBeNull();
 });
 it('never modifies finished tasks or finished subtasks',()=>{
  const done=task('Abgeschlossen',{completedAt:'2026-11-08T10:00:00Z',estimatedMinutes:60});
  expect(workEntries([done])).toEqual([]);
  const parent=task('Offen',{subtasks:[{id:'done',title:'Erledigt',completed:true,
    plannedDate:monday,estimatedMinutes:60}]});
  const data={...emptyData(),tasks:[parent]};
  expect(workEntries([parent]).map(e=>e.title)).toEqual(['Offen']);
  expect(moveWorkItem(data,'Offen','done',addDays(monday,1))).toBe(data);
 });
 it('warns when a manually moved workday falls on or after the needed-by date',()=>{
  const entry=workEntries([task('Abgabe',{deadlineDate:'2026-11-10'})])[0];
  expect(violatesDeadline(entry,'2026-11-09')).toBe(false);
  expect(violatesDeadline(entry,'2026-11-10')).toBe(true);
  expect(violatesDeadline(entry,'2026-11-11')).toBe(true);
  expect(violatesDeadline(entry,null)).toBe(false);
 });
});
