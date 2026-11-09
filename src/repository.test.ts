import {beforeEach,describe,expect,it} from 'vitest';import {LocalTaskRepository,STORAGE_KEY} from './repository';
const v1={schemaVersion:1,tasks:[{id:'stable',title:'Alt',description:'',projectId:null,priority:2,scheduledDate:'2026-11-09',deadlineDate:'2026-11-20',recurrence:{kind:'weekly',weekday:1},completedAt:null,createdAt:'x',updatedAt:'x'}],projects:[],completionEvents:[{id:'e1',taskId:'stable',occurredAt:'2026-11-02T09:00:00Z',previousScheduledDate:'2026-11-02',resultingScheduledDate:'2026-11-09',undoneAt:null}]};
describe('v8-Migration',()=>{beforeEach(()=>localStorage.clear());it('migriert v1 idempotent mit IDs und Historie',()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));const repo=new LocalTaskRepository(),first=repo.load(),second=repo.parseImport(repo.export(first));expect(second).toEqual(first);expect(first).toMatchObject({schemaVersion:8,tasks:[{id:'stable',deadlineDate:'2026-11-20',recurrence:{kind:'weekdays',weekdays:[1]}}],completionEvents:[{id:'e1',taskId:'stable'}]})});it('überschreibt alten Speicher beim Laden nicht',()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));new LocalTaskRepository().load();expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).schemaVersion).toBe(1)});it('ungültiger Import ändert nichts',()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));expect(()=>new LocalTaskRepository().parseImport('{}')).toThrow();expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).tasks[0].id).toBe('stable')})});

describe('v6 checklists and template backups',()=>{
 beforeEach(()=>localStorage.clear());
 it('does not create undefined optional completion fields from old backups',()=>{
  const data=new LocalTaskRepository().parseImport(JSON.stringify(v1));
  expect(data.completionEvents[0]).not.toHaveProperty('previousSubtasks');
 });
 it('imports schema v2, preserves task IDs and adds empty checklists',()=>{
  const older={...v1,schemaVersion:2,tasks:[{...v1.tasks[0],recurrence:{kind:'weekdays',weekdays:[1,3]}}]};
  const migrated=new LocalTaskRepository().parseImport(JSON.stringify(older));
  expect(migrated.schemaVersion).toBe(8);
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
  expect(updated.schemaVersion).toBe(8);
  expect(updated.tasks[0].subtasks?.[0].id).toBe('s1');
 });
 it('does not accept a future schema version that this client cannot understand',()=>{
  const future={...new LocalTaskRepository().load(),schemaVersion:9};
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
  expect(updated.schemaVersion).toBe(8);
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
 it('upgrades v5 data without changing old weekday recurrence, checklists or templates',()=>{
  const repo=new LocalTaskRepository();
  const previous={...repo.load(),schemaVersion:5,
   tasks:[{id:'stable-old',title:'Schulroutine',description:'',projectId:null,priority:2,
    scheduledDate:'2026-11-07',deadlineDate:'2026-11-15',
    recurrence:{kind:'weekdays',weekdays:[1,3,5]},completedAt:null,
    createdAt:'x',updatedAt:'x',
    subtasks:[{id:'sub',title:'Kopieren',completed:true,plannedDate:'2026-11-06'}]}],
   templates:[{id:'tpl',name:'Klausur',description:'',steps:['Aufgaben schreiben'],createdAt:'x',updatedAt:'x'}]};
  const updated=repo.parseImport(JSON.stringify(previous));
  expect(updated.schemaVersion).toBe(8);
  expect(updated.tasks[0]).toMatchObject({id:'stable-old',deadlineDate:'2026-11-15',
   recurrence:{kind:'weekdays',weekdays:[1,3,5]},subtasks:[{id:'sub',completed:true}]});
  expect(updated.templates).toEqual(previous.templates);
 });
 it('round-trips daily weekly and monthly interval rules to local storage and backup',()=>{
  const repo=new LocalTaskRepository(),data=repo.load();
  const base={id:'a',title:'Test',description:'',projectId:null,priority:3,
   scheduledDate:'2026-11-15',deadlineDate:null,completedAt:null,createdAt:'x',updatedAt:'x'};
  data.tasks=[
   {...base,id:'days',recurrence:{kind:'interval',unit:'days',every:3,anchorDate:'2026-11-07'}},
   {...base,id:'weeks',recurrence:{kind:'interval',unit:'weeks',every:2,anchorDate:'2026-11-15'}},
   {...base,id:'months',recurrence:{kind:'interval',unit:'months',every:1,anchorDate:'2026-10-31'}}
  ] as typeof data.tasks;
  repo.save(data);
  expect(repo.load()).toEqual({...data,tasks:data.tasks.map(t=>({...t,subtasks:[]}))});
  expect(repo.parseImport(repo.export(data))).toEqual(repo.load());
 });
 it('rejects invalid or unfamiliar recurrence rules before overwriting local/cloud data',()=>{
  const repo=new LocalTaskRepository();const data=repo.load();
  const old={...data,tasks:[{id:'a',title:'Test',description:'',projectId:null,priority:2,
   scheduledDate:'2026-11-07',deadlineDate:null,completedAt:null,createdAt:'x',updatedAt:'x',
   recurrence:{kind:'interval',every:2,unit:'weeks',anchorDate:'2026-11-07'}}]};
  repo.save(repo.parseImport(JSON.stringify(old)));
  for(const bad of [
   {kind:'interval',every:0,unit:'weeks',anchorDate:'2026-11-07'},
   {kind:'interval',every:1.5,unit:'days',anchorDate:'2026-11-07'},
   {kind:'interval',every:2,unit:'hours',anchorDate:'2026-11-07'},
   {kind:'interval',every:2,unit:'months',anchorDate:'2026-02-31'},
   {kind:'weekly2',weekdays:[2,4]}
  ]){
   const invalid={...old,tasks:[{...old.tasks[0],recurrence:bad}]};
   expect(()=>repo.parseImport(JSON.stringify(invalid))).toThrow();
  }
  expect(repo.load().tasks[0].recurrence).toEqual(old.tasks[0].recurrence);
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
 it('übernimmt v7-Daten mit bestehenden Deadline- und Ereignis-Aufgaben ohne Änderungen',()=>{
  const repo=new LocalTaskRepository();
  const snapshot={...repo.load(),schemaVersion:7,
   tasks:[{id:'exam',title:'Klassenarbeit',description:'',projectId:null,priority:2,
    scheduledDate:null,deadlineDate:null,eventDate:'2026-11-27',recurrence:null,
    completedAt:null,createdAt:'x',updatedAt:'x',
    subtasks:[{id:'mark',title:'Korrektur',completed:false,plannedDate:'2026-12-11',offset:{amount:2,unit:'weeks',direction:'after'}}]}],
   templates:[{id:'legacy-exam',name:'Prüfung',description:'',anchorKind:'event',
    steps:['Korrektur – 2 Wochen danach'],createdAt:'x',updatedAt:'x'}]};
  const result=repo.parseImport(JSON.stringify(snapshot));
  expect(result.schemaVersion).toBe(8);
  expect(result.tasks[0]).toMatchObject({id:'exam',deadlineDate:null,eventDate:'2026-11-27',
   subtasks:[{id:'mark',plannedDate:'2026-12-11'}]});
  expect(result.templates[0]).toEqual(snapshot.templates[0]);
  expect(result.templates[0].estimatedMinutes).toBeUndefined();
 });
 it('übernimmt Vorlagenminuten in JSON/Cloud-Daten und lehnt unpassende Schätzungen ab',()=>{
  const repo=new LocalTaskRepository();
  const data=repo.load();
  data.templates=[{id:'minutes',name:'Klassenarbeit',description:'',steps:['Aufgaben','Korrigieren'],
   estimatedMinutes:120,stepEstimatesMinutes:[30,90],createdAt:'x',updatedAt:'x'}];
  repo.save(data);
  expect(repo.load()).toEqual(data);
  expect(repo.parseImport(repo.export(data))).toEqual(data);
  const invalid={...data,templates:[{...data.templates[0],stepEstimatesMinutes:[45]}]};
  expect(()=>repo.parseImport(JSON.stringify(invalid))).toThrow();
  invalid.templates=[{...data.templates[0],stepEstimatesMinutes:[-5,90]}];
  expect(()=>repo.parseImport(JSON.stringify(invalid))).toThrow();
  expect(repo.load()).toEqual(data);
 });

});
