import {describe,expect,it} from 'vitest';
import {focusedSteps,parentGroupsWithoutStepOnlyDuplicates,stepsDueNow} from './focusedSteps';
import {todayRadarGroups} from './deadlineRadar';
import type {Task} from './types';

const date='2026-11-07';
const task=(id:string,changes:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:3,scheduledDate:null,
 deadlineDate:null,recurrence:null,completedAt:null,createdAt:'2026-11-01T08:00:00Z',
 updatedAt:'2026-11-01T08:00:00Z',...changes
});
describe('Heute-Fokus mit individuell geplanten Unteraufgaben',()=>{
 it('shows only open steps scheduled for today or earlier, keeping tasks unchanged',()=>{
  const parent=task('Klassenarbeit',{subtasks:[
   {id:'yesterday',title:'EH erstellen',completed:false,plannedDate:'2026-11-06',estimatedMinutes:45},
   {id:'today',title:'ClassTime eintragen',completed:false,plannedDate:date,estimatedMinutes:30},
   {id:'tomorrow',title:'Kopieren',completed:false,plannedDate:'2026-11-08'},
   {id:'done',title:'Abgehakt',completed:true,plannedDate:date}
  ]});
  const due=stepsDueNow([parent],date);
  expect(due.overdue.map(s=>s.stepId)).toEqual(['yesterday']);
  expect(due.today.map(s=>s.stepId)).toEqual(['today']);
  expect(due.today[0]).toMatchObject({
   taskId:'Klassenarbeit',taskTitle:'Klassenarbeit',title:'ClassTime eintragen',
   completedCount:1,totalCount:4,estimatedMinutes:30
  });
  expect(parent.subtasks?.[1].completed).toBe(false);
 });
 it('excludes completed parent tasks and respects open recurring instances',()=>{
  const done=task('fertig',{completedAt:'2026-11-06T08:00:00Z',subtasks:[{id:'s1',title:'Versteckt',completed:false,plannedDate:date}]});
  const routine=task('Routine',{completedAt:'2026-11-06T08:00:00Z',recurrence:{kind:'weekdays',weekdays:[1,2,3]},
   subtasks:[{id:'s2',title:'Wiederholung',completed:false,plannedDate:date}]});
  expect(stepsDueNow([done,routine],date).today.map(s=>s.title)).toEqual(['Wiederholung']);
 });
 it('sorts overdue steps by date, then today steps by priority and stable subtask order',()=>{
  const items=[
   task('B',{priority:1,subtasks:[{id:'b2',title:'b2',completed:false,plannedDate:date},
     {id:'b1',title:'b1',completed:false,plannedDate:date}]}),
   task('A',{priority:2,subtasks:[{id:'a',title:'a',completed:false,plannedDate:date}]}),
   task('old',{priority:4,subtasks:[{id:'o',title:'old step',completed:false,plannedDate:'2026-11-01'}]})
  ];
  const found=focusedSteps(items,'2026-11-01',date);
  expect(found.map(s=>s.stepId)).toEqual(['o','b2','b1','a']);
  expect(focusedSteps(items,date,date).map(s=>s.stepId)).toEqual(['b2','b1','a']);
 });
 it('lets Upcoming display just the selected date, without assuming a parent task date',()=>{
  const parent=task('Prüfung',{scheduledDate:null,deadlineDate:'2026-11-27',subtasks:[
   {id:'a',title:'Aufgaben entwickeln',completed:false,plannedDate:'2026-11-12'},
   {id:'b',title:'ClassTime',completed:false,plannedDate:'2026-11-14'}
  ]});
  expect(focusedSteps([parent],'2026-11-12').map(s=>s.stepId)).toEqual(['a']);
  expect(focusedSteps([parent],'2026-11-13')).toEqual([]);
  expect(parent.scheduledDate).toBeNull();
 });
 it('removes step-only parents from Today grouping, but keeps real planned and urgent tasks',()=>{
  const step=()=>[{id:'s',title:'Aufgaben',completed:false,plannedDate:date}];
  const stepOnly=task('Only step',{subtasks:step()});
  const realDay=task('Whole task',{scheduledDate:date,subtasks:step()});
  const urgent=task('Urgent',{deadlineDate:'2026-11-08',subtasks:step()});
  const grouped=parentGroupsWithoutStepOnlyDuplicates(todayRadarGroups([stepOnly,realDay,urgent],date),date);
  expect(grouped.find(g=>g.key==='planned')?.tasks.map(t=>t.id)).toEqual(['Whole task']);
  expect(grouped.find(g=>g.key==='critical')?.tasks.map(t=>t.id)).toEqual(['Urgent']);
  expect(stepsDueNow([stepOnly,realDay,urgent],date).today).toHaveLength(3);
  expect(grouped.flatMap(g=>g.tasks).some(t=>t.id==='Only step')).toBe(false);
 });
});
