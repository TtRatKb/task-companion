import {describe,expect,it,vi} from 'vitest';
import {checklistProgress,makeTemplate,taskFromTemplate,templateFromTask,toggleSubtask} from './checklists';
import {completeTask,undoCompletion} from './domain';
import {emptyData,type Task} from './types';

let nextId=0;
vi.stubGlobal('crypto',{randomUUID:()=>`generated-${++nextId}`});
const sample=():Task=>({
 id:'task-a',title:'Klassenarbeit Mathematik',description:'',projectId:null,priority:2,
 scheduledDate:'2026-11-09',deadlineDate:'2026-11-15',recurrence:null,completedAt:null,
 createdAt:'2026-11-06T09:00:00Z',updatedAt:'2026-11-06T09:00:00Z',
 subtasks:[{id:'step-a',title:'Aufgaben auswählen',completed:true},{id:'step-b',title:'Kopien anfertigen',completed:false}]
});
describe('Unteraufgaben und Vorlagen',()=>{
 it('zeigt Fortschritt und ändert nur die angeklickte Unteraufgabe',()=>{
  const original=sample();
  const previous={...emptyData(),tasks:[original]};
  expect(checklistProgress(original)).toEqual({done:1,total:2});
  const updated=toggleSubtask(previous,'task-a','step-b');
  expect(updated.tasks[0].subtasks?.map(s=>s.completed)).toEqual([true,true]);
  expect(checklistProgress(updated.tasks[0])).toEqual({done:2,total:2});
  expect(previous.tasks[0].subtasks?.map(s=>s.completed)).toEqual([true,false]);
  expect(toggleSubtask(previous,'task-a','missing')).toBe(previous);
 });
 it('erstellt eigenständige Task-Instanzen ohne kopierte Deadlines und mit frischen IDs',()=>{
  const template=templateFromTask(sample());
  const first=taskFromTemplate(template,'math7');
  const second=taskFromTemplate(template,'math7');
  expect(template.steps).toEqual(['Aufgaben auswählen','Kopien anfertigen']);
  expect(first).toMatchObject({projectId:'math7',scheduledDate:null,deadlineDate:null,completedAt:null});
  expect(first.subtasks?.map(s=>s.completed)).toEqual([false,false]);
  expect(first.id).not.toBe(second.id);
  expect(first.subtasks?.[0].id).not.toBe(second.subtasks?.[0].id);
  first.subtasks![0].completed=true;
  expect(second.subtasks?.[0].completed).toBe(false);
 });
 it('bereinigt Leerzeilen und verwirft einen leeren Vorlagennamen',()=>{
  expect(makeTemplate('  Klassenarbeit  ','  Wiederkehrend  ',['  Planung  ',' ','Kopieren']).steps).toEqual(['Planung','Kopieren']);
  expect(()=>makeTemplate(' ','',[])).toThrow();
 });
 it('setzt bei wiederkehrenden Aufgaben alle Unteraufgaben zurück und macht Undo vollständig',()=>{
  const original={...sample(),recurrence:{kind:'weekdays' as const,weekdays:[1,2,3,4,5] as Array<1|2|3|4|5>}};
  const input={...emptyData(),tasks:[original]};
  const finished=completeTask(input,'task-a',new Date('2026-11-09T09:00:00+01:00'));
  expect(finished.tasks[0].subtasks?.map(s=>s.completed)).toEqual([false,false]);
  expect(finished.tasks[0].scheduledDate).toBe('2026-11-10');
  const undone=undoCompletion(finished,finished.completionEvents[0].id,new Date('2026-11-09T11:00:00+01:00'));
  expect(undone.tasks[0].subtasks?.map(s=>s.completed)).toEqual([true,false]);
  expect(undone.tasks[0].scheduledDate).toBe('2026-11-09');
 });
 it('erlaubt keine Änderungen an abgeschlossenen einmaligen Aufgaben',()=>{
  const completed={...sample(),completedAt:'2026-11-09T08:00:00Z'};
  const input={...emptyData(),tasks:[completed]};
  expect(toggleSubtask(input,'task-a','step-a')).toBe(input);
 });
});
