import { beforeEach, describe, expect, it } from 'vitest';
import { LocalTaskRepository, STORAGE_KEY } from './repository';
import { emptyData } from './types';

const v1 = {
  schemaVersion: 1,
  tasks: [{
    id: 'stable', title: 'Alt', description: '', projectId: null, priority: 2,
    scheduledDate: '2026-11-09', deadlineDate: '2026-11-20',
    recurrence: {kind:'weekly',weekday:1},completedAt:null,
    createdAt:'x',updatedAt:'x'
  }],
  projects: [],
  completionEvents: [{
    id: 'e1',taskId:'stable',occurredAt:'2026-11-02T09:00:00Z',
    previousScheduledDate:'2026-11-02',resultingScheduledDate:'2026-11-09',undoneAt:null
  }]
};
const v2 = {
  schemaVersion:2,
  tasks:[{
    id:'stable-v2',title:'Alter Arbeitsauftrag',description:'',
    projectId:null,priority:3,scheduledDate:null,deadlineDate:'2026-12-05',
    recurrence:null,completedAt:null,createdAt:'x',updatedAt:'x'
  }],
  projects:[],
  completionEvents:[]
};

describe('v3-Migration und Sicherungen', () => {
  beforeEach(() => localStorage.clear());
  it('migriert v1 mit alter Wochenregel idempotent und erhält IDs und Historie', () => {
    localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));
    const repo=new LocalTaskRepository(),first=repo.load(),second=repo.parseImport(repo.export(first));
    expect(second).toEqual(first);
    expect(first).toMatchObject({
      schemaVersion:3,templates:[],
      tasks:[{id:'stable',deadlineDate:'2026-11-20',subtasks:[],
        recurrence:{kind:'weekdays',weekdays:[1]}}],
      completionEvents:[{id:'e1',taskId:'stable'}]
    });
  });
  it('migriert Cloud- und JSON-Sicherungen aus v2 ohne Datenverlust', () => {
    const data = new LocalTaskRepository().parseImport(JSON.stringify(v2));
    expect(data).toMatchObject({
      schemaVersion:3,templates:[],
      tasks:[{id:'stable-v2',title:'Alter Arbeitsauftrag',subtasks:[],deadlineDate:'2026-12-05'}]
    });
  });
  it('überschreibt die originalen lokalen Daten beim Lesen nicht', () => {
    localStorage.setItem(STORAGE_KEY,JSON.stringify(v2));
    new LocalTaskRepository().load();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).schemaVersion).toBe(2);
  });
  it('sichert und lädt v3 mit Häkchen und unabhängigen Vorlagen', () => {
    const data=emptyData();
    data.tasks.push({
      id:'a',title:'Klassenarbeit',description:'',projectId:null,priority:1,
      scheduledDate:null,deadlineDate:'2026-12-01',recurrence:null,
      subtasks:[{id:'s1',title:'Erwartungshorizont',completedAt:'2026-11-06T09:00:00Z'}],
      completedAt:null,createdAt:'x',updatedAt:'x'
    });
    data.templates.push({
      id:'tpl',name:'Klassenarbeit',title:'Klassenarbeit vorbereiten',
      description:'',priority:2,subtaskTitles:['Aufgaben','Kopieren'],
      createdAt:'x',updatedAt:'x'
    });
    const repo=new LocalTaskRepository();
    repo.save(data);
    expect(repo.load()).toEqual(data);
    expect(repo.parseImport(repo.export(data))).toEqual(data);
  });
  it('verwirft ungültige Unteraufgaben und Vorlagen ohne lokalen Speicher zu überschreiben', () => {
    const repo=new LocalTaskRepository();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(v2));
    const invalid={...emptyData(),tasks:[{
      id:'a',title:'Etwas',description:'',projectId:null,priority:3,
      scheduledDate:null,deadlineDate:null,recurrence:null,subtasks:[
        {id:'dup',title:'Ein Schritt',completedAt:null},
        {id:'dup',title:'Doppelt',completedAt:null}
      ],completedAt:null,createdAt:'x',updatedAt:'x'
    }]};
    expect(()=>repo.parseImport(JSON.stringify(invalid))).toThrow();
    expect(()=>repo.parseImport(JSON.stringify({...emptyData(),templates:[{id:'bad'}]}))).toThrow();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).schemaVersion).toBe(2);
  });
  it('ungültiger Import überschreibt keine Daten', () => {
    localStorage.setItem(STORAGE_KEY,JSON.stringify(v1));
    expect(()=>new LocalTaskRepository().parseImport('{}')).toThrow();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).tasks[0].id).toBe('stable');
  });
});
