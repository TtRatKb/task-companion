import {beforeEach,describe,expect,it} from 'vitest';import {LocalTaskRepository,STORAGE_KEY} from './repository';
const v1={schemaVersion:1,tasks:[{id:'stable',title:'Alt',description:'',projectId:null,priority:2,scheduledDate:'2026-11-09',deadlineDate:'2026-11-20',recurrence:{kind:'weekly',weekday:1},completedAt:null,createdAt:'x',updatedAt:'x'}],projects:[],completionEvents:[{id:'e1',taskId:'stable',occurredAt:'2026-11-02T09:00:00Z',previousScheduledDate:'2026-11-02',resultingScheduledDate:'2026-11-09',undoneAt:null}]};
describe('v3-Migration',()=>{beforeEach(()=>localStorage.clear());it('migriert v1 idempotent mit IDs und Historie',()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));const repo=new LocalTaskRepository(),first=repo.load(),second=repo.parseImport(repo.export(first));expect(second).toEqual(first);expect(first).toMatchObject({schemaVersion:3,tasks:[{id:'stable',deadlineDate:'2026-11-20',recurrence:{kind:'weekdays',weekdays:[1]}}],completionEvents:[{id:'e1',taskId:'stable'}]})});it('überschreibt alten Speicher beim Laden nicht',()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));new LocalTaskRepository().load();expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).schemaVersion).toBe(1)});it('ungültiger Import ändert nichts',()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));expect(()=>new LocalTaskRepository().parseImport('{}')).toThrow();expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).tasks[0].id).toBe('stable')})});

describe('v3 checklists and template backups',()=>{
 beforeEach(()=>localStorage.clear());
 it('imports schema v2, preserves task IDs and adds empty checklists',()=>{
  const older={...v1,schemaVersion:2,tasks:[{...v1.tasks[0],recurrence:{kind:'weekdays',weekdays:[1,3]}}]};
  const migrated=new LocalTaskRepository().parseImport(JSON.stringify(older));
  expect(migrated.schemaVersion).toBe(3);
  expect(migrated.tasks[0]).toMatchObject({id:'stable',subtasks:[],recurrence:{kind:'weekdays',weekdays:[1,3]}});
  expect(migrated.templates).toEqual([]);
 });
 it('round-trips templates, checkmarks, IDs, undo snapshots through JSON',()=>{
  const initial=new LocalTaskRepository().load();
  initial.templates=[{id:'template-1',name:'Klassenarbeit',description:'',steps:['Aufgaben','Drucken'],createdAt:'x',updatedAt:'x'}];
  initial.tasks=[{id:'task-1',title:'Test',description:'',projectId:null,priority:2,scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,createdAt:'x',updatedAt:'x',subtasks:[{id:'step-1',title:'Kopieren',completed:true}]}];
  initial.completionEvents=[{id:'event-1',taskId:'task-1',occurredAt:'2026-11-06T10:00:00Z',previousScheduledDate:null,resultingScheduledDate:null,previousCompletedAt:null,undoneAt:null,previousSubtasks:[{id:'step-1',title:'Kopieren',completed:true}]}];
  const repo=new LocalTaskRepository();
  expect(repo.parseImport(repo.export(initial))).toEqual(initial);
  repo.save(initial);expect(repo.load()).toEqual(initial);
 });
 it('rejects malformed checklist/template imports without damaging local data',()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));
  const repo=new LocalTaskRepository();
  const invalid={...repo.load(),templates:[{id:'t',name:'',description:'',steps:['ok'],createdAt:'x',updatedAt:'x'}]};
  expect(()=>repo.parseImport(JSON.stringify(invalid))).toThrow();
  expect(repo.load().tasks[0].id).toBe('stable');
 });
});
