import {describe,expect,it} from 'vitest';
import {taskBundles} from './taskBundles';
import type {Task} from './types';

const today='2026-11-08';
const task=(id:string,changes:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:3,scheduledDate:null,
 deadlineDate:null,recurrence:null,completedAt:null,
 createdAt:'2026-11-01T08:00:00Z',updatedAt:'2026-11-01T08:00:00Z',
 ...changes
});
const steps=(prefix:string,dates:(string|null)[],completed:number[]=[])=>
 dates.map((day,index)=>({id:prefix+index,title:prefix+index,completed:completed.includes(index),plannedDate:day}));

describe('Hauptaufgaben / Aufgabenpakete',()=>{
 it('zeigt Hauptaufgabe nach dem Ereignistag mit Fortschritt und überfälliger Nachbereitung',()=>{
  const parent=task('Klassenarbeit Mathe 7b',{eventDate:'2026-10-24',subtasks:[
   ...steps('s',['2026-10-14','2026-11-01','2026-11-12'],[0])
  ]});
  const [bundle]=taskBundles([parent],today);
  expect(bundle).toMatchObject({status:'overdue',total:3,done:1,remaining:2,
   parentDeadlineOverdue:false, nextDate:'2026-11-12'});
  expect(bundle.overdueSteps.map(step=>step.id)).toEqual(['s1']);
  expect(parent.deadlineDate).toBeNull();
  expect(parent.eventDate).toBe('2026-10-24');
 });
 it('listet fertige Unteraufgaben weiterhin im Gesamtfortschritt und behält Hauptaufgabe offen',()=>{
  const doneSteps=task('Klassenarbeit',{eventDate:'2026-10-15',subtasks:steps('e',['2026-10-12','2026-11-01'],[0,1])});
  expect(taskBundles([doneSteps],today)).toMatchObject([{status:'ready',done:2,total:2,remaining:0}]);
  expect(doneSteps.completedAt).toBeNull();
 });
 it('sortiert offene Pakete mit alten Schrittterminen nach oben, ohne Datensätze zu duplizieren',()=>{
  const older=task('older',{subtasks:steps('old',['2026-10-03','2026-12-01'])});
  const newer=task('newer',{subtasks:steps('new',['2026-11-01'])});
  const incoming=task('incoming',{subtasks:steps('next',['2026-11-10'])});
  const eventOnly=task('event-only',{eventDate:'2026-10-01',subtasks:steps('ev',[null])});
  const completed=task('completed',{completedAt:'2026-10-14T10:00:00Z',subtasks:steps('c',[null],[0])});
  const noChecklist=task('normal');
  const input=[incoming,completed,eventOnly,noChecklist,newer,older];
  expect(taskBundles(input,today).map(b=>b.task.id)).toEqual(['older','newer','incoming','event-only']);
  expect(taskBundles(input,today,true).at(-1)?.task.id).toBe('completed');
  expect(input.map(t=>t.id)).toEqual(['incoming','completed','event-only','normal','newer','older']);
  expect(taskBundles(input,today).every(b=>b.task===input.find(t=>t.id===b.task.id))).toBe(true);
 });
 it('unterscheidet echte Eltern-Deadlines von bloßen Ereignistagen',()=>{
  const parent=task('deadline',{deadlineDate:'2026-11-08',subtasks:steps('s',[null])});
  expect(taskBundles([parent],today)[0].parentDeadlineOverdue).toBe(true);
  const event=task('event',{eventDate:'2026-11-01',subtasks:steps('s',[null])});
  expect(taskBundles([event],today)[0].parentDeadlineOverdue).toBe(false);
  expect(taskBundles([event],today)[0].status).toBe('unscheduled');
 });
});
