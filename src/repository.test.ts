import {beforeEach,describe,expect,it} from 'vitest';import {LocalTaskRepository,STORAGE_KEY} from './repository';
const v1={schemaVersion:1,tasks:[{id:'stable',title:'Alt',description:'',projectId:null,priority:2,scheduledDate:'2026-11-09',deadlineDate:'2026-11-20',recurrence:{kind:'weekly',weekday:1},completedAt:null,createdAt:'x',updatedAt:'x'}],projects:[],completionEvents:[{id:'e1',taskId:'stable',occurredAt:'2026-11-02T09:00:00Z',previousScheduledDate:'2026-11-02',resultingScheduledDate:'2026-11-09',undoneAt:null}]};
describe('v5-Migration',()=>{beforeEach(()=>localStorage.clear());it('migriert v1 idempotent mit IDs und Historie',()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));const repo=new LocalTaskRepository(),first=repo.load(),second=repo.parseImport(repo.export(first));expect(second).toEqual(first);expect(first).toMatchObject({schemaVersion:5,tasks:[{id:'stable',deadlineDate:'2026-11-20',recurrence:{kind:'weekdays',weekdays:[1]}}],completionEvents:[{id:'e1',taskId:'stable'}]})});it('überschreibt alten Speicher beim Laden nicht',()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));new LocalTaskRepository().load();expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).schemaVersion).toBe(1)});it('ungültiger Import ändert nichts',()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));expect(()=>new LocalTaskRepository().parseImport('{}')).toThrow();expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).tasks[0].id).toBe('stable')})});

describe('v5 checklists and template backups',()=>{
 beforeEach(()=>localStorage.clear());
 it('imports schema v2, preserves task IDs and adds empty checklists',()=>{
  const older={...v1,schemaVersion:2,tasks:[{...v1.tasks[0],recurrence:{kind:'weekdays',weekdays:[1,3]}}]};
  const migrated=new LocalTaskRepository().parseImport(JSON.stringify(older));
  expect(migrated.schemaVersion).toBe(5);
  expect(migrated.tasks[0]).toMatchObject({id:'stable',subtasks:[],recurrence:{kind:'weekdays',weekdays:[1,3]}});
  expect(migrated.templates).toEqual([]);
 });
 it('round-trips templates, checkmarks, IDs, undo snapshots through JSON',()=>{
  const initial=new LocalTaskRepository().load();
  initial.templates=[{id:'template-1',name:'Klassenarbeit',description:'',steps:['Aufgaben – 2 Wochen vorher','Drucken – {Deadline} - 1 Tag'],createdAt:'x',updatedAt:'x'}];
  initial.tasks=[{id:'task-1',title:'Test',description:'',projectId:null,priority:2,scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,createdAt:'x',updatedAt:'x',subtasks:[{id:'step-1',title:'Kopieren',completed:true,plannedDate:'2026-11-09',offset:{amount:1,unit:'days'}}]}];
  initial.completionEvents=[{id:'event-1',taskId:'task-1',occurredAt:'2026-11-06T10:00:00Z',previousScheduledDate:null,resultingScheduledDate:null,previousCompletedAt:null,undoneAt:null,previousSubtasks:[{id:'step-1',title:'Kopieren',completed:true,plannedDate:'2026-11-09',offset:{amount:1,unit:'days'}}]}];
  const repo=new LocalTaskRepository();
  expect(repo.parseImport(repo.export(initial))).toEqual(initial);
  repo.save(initial);expect(repo.load()).toEqual(initial);
 });
 it('migrates schema v3 documents and keeps existing checklists',()=>{
  const previous={...new LocalTaskRepository().load(),schemaVersion:3,
   tasks:[{id:'old',title:'Alt',description:'',projectId:null,priority:4,scheduledDate:null,deadlineDate:'2026-11-10',recurrence:null,completedAt:null,createdAt:'x',updatedAt:'x',
     subtasks:[{id:'s1',title:'Kopieren',completed:false}]}]};
  const updated=new LocalTaskRepository().parseImport(JSON.stringify(previous));
  expect(updated.schemaVersion).toBe(5);
  expect(updated.tasks[0].subtasks?.[0].id).toBe('s1');
 });
 it('does not accept a future schema version that this client cannot understand',()=>{
  const future={...new LocalTaskRepository().load(),schemaVersion:6};
  expect(()=>new LocalTaskRepository().parseImport(JSON.stringify(future))).toThrow();
 });
 it('migrates the v4 cloud format and retains timing information',()=>{
  const previous={...new LocalTaskRepository().load(),schemaVersion:4,
   tasks:[{id:'task',title:'Test',description:'',projectId:null,priority:2,
    scheduledDate:'2026-11-09',deadlineDate:'2026-11-10',recurrence:null,
    completedAt:null,createdAt:'x',updatedAt:'x',
    subtasks:[{id:'s1',title:'Kopieren',completed:false,plannedDate:'2026-11-08',offset:{amount:2,unit:'days'}}]}]};
  delete (previous as {weeklyBudgetMinutes?:unknown}).weeklyBudgetMinutes;
  const updated=new LocalTaskRepository().parseImport(JSON.stringify(previous));
  expect(updated.schemaVersion).toBe(5);
  expect(updated.tasks[0].subtasks?.[0].offset).toEqual({amount:2,unit:'days'});
  expect(updated.weeklyBudgetMinutes).toEqual([null,null,null,null,null,null,null]);
 });
 it('round trips estimated minutes and individual day budgets through JSON',()=>{
  const repo=new LocalTaskRepository();
  const data=repo.load();
  data.weeklyBudgetMinutes=[120,180,90,120,60,0,null];
  data.tasks=[{id:'t',title:'Test',description:'',projectId:null,priority:1,
   scheduledDate:'2026-11-09',deadlineDate:null,recurrence:null,completedAt:null,
   createdAt:'x',updatedAt:'x',estimatedMinutes:105,
   subtasks:[{id:'s',title:'Teil',completed:false,plannedDate:'2026-11-09',estimatedMinutes:45}]}];
  repo.save(data);
  expect(repo.load()).toEqual(data);
  expect(repo.parseImport(repo.export(data))).toEqual(data);
 });
 it('rejects invalid workload settings without overwriting local storage',()=>{
  const repo=new LocalTaskRepository();
  const data=repo.load();
  const invalidBudget={...data,weeklyBudgetMinutes:[120,-20,null,null,null,null,null]};
  expect(()=>repo.parseImport(JSON.stringify(invalidBudget))).toThrow();
  const invalidDuration={...data,tasks:[{id:'t',title:'Test',description:'',projectId:null,priority:1,
   scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,
   createdAt:'x',updatedAt:'x',estimatedMinutes:-30}]};
  expect(()=>repo.parseImport(JSON.stringify(invalidDuration))).toThrow();
  expect(repo.load().tasks).toEqual([]);
 });
 it('rejects unsafe offsets without modifying local content',()=>{
  const task={id:'test',title:'Unverändert',description:'',projectId:null,priority:4,scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,createdAt:'x',updatedAt:'x',
   subtasks:[{id:'s1',title:'Schritt',completed:false,offset:{amount:-100,unit:'months'}}]};
  const invalid={...new LocalTaskRepository().load(),tasks:[task]};
  expect(()=>new LocalTaskRepository().parseImport(JSON.stringify(invalid))).toThrow();
 });
 it('rejects malformed checklist/template imports without damaging local data',()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));
  const repo=new LocalTaskRepository();
  const invalid={...repo.load(),templates:[{id:'t',name:'',description:'',steps:['ok'],createdAt:'x',updatedAt:'x'}]};
  expect(()=>repo.parseImport(JSON.stringify(invalid))).toThrow();
  expect(repo.load().tasks[0].id).toBe('stable');
 });
});
