import { describe, expect, it } from 'vitest';
import {
  checklistProgress, draftFromTask, exampleClassTestTemplate, templateToRecord, templateToTaskDraft
} from './templates';
import type { Task } from './types';
const original = exampleClassTestTemplate();

describe('Wiederverwendbare Vorlagen',()=>{
 it('stellt ein bearbeitbares Beispiel für Klassenarbeiten bereit',()=>{
  expect(original.subtaskTitles).toContain('Erwartungshorizont erstellen');
  expect(original.name).toBe('Klassenarbeit vorbereiten');
 });
 it('erzeugt unabhängige Aufgaben mit neuen Unteraufgaben-IDs und leeren Häkchen',()=>{
  const record=templateToRecord(original,undefined,new Date('2026-11-07T09:00:00Z'));
  const a=templateToTaskDraft(record,'math');
  const b=templateToTaskDraft(record,'math');
  expect(a.projectId).toBe('math');
  expect(a.deadlineDate).toBeNull();
  expect(a.subtasks.every(item=>item.completedAt===null)).toBe(true);
  expect(a.subtasks.map(s=>s.title)).toEqual(original.subtaskTitles);
  expect(new Set([...a.subtasks,...b.subtasks].map(step=>step.id)).size).toBe(a.subtasks.length+b.subtasks.length);
  a.subtasks[0].completedAt='2026-11-07T11:00:00Z';
  expect(b.subtasks[0].completedAt).toBeNull();
  expect(record.subtaskTitles[0]).toBe(original.subtaskTitles[0]);
 });
 it('bewahrt eine Vorlagen-ID beim Bearbeiten',()=>{
  const time=new Date('2026-11-07T09:00:00Z');
  const prior=templateToRecord(original,undefined,time);
  const later=templateToRecord({...original,name:'KA neu',subtaskTitles:['Schritt 1','Schritt 2']},prior,new Date('2026-11-07T10:00:00Z'));
  expect(later.id).toBe(prior.id);
  expect(later.createdAt).toBe(prior.createdAt);
  expect(later.subtaskTitles).toEqual(['Schritt 1','Schritt 2']);
 });
 it('speichert nur Titel, nicht Häkchen, in einer Vorlage aus einer Aufgabe',()=>{
  const task:Pick<Task,'title'|'description'|'priority'|'subtasks'>={
   title:'Neue Klassenarbeit',description:'Material vorbereiten',priority:2,
   subtasks:[{id:'a',title:'Drucken',completedAt:'2026-11-07T11:00:00Z'}]
  };
  expect(draftFromTask(task)).toMatchObject({name:'Neue Klassenarbeit',subtaskTitles:['Drucken']});
 });
 it('gibt Fortschritt auch bei leeren Checklisten korrekt an',()=>{
  expect(checklistProgress([])).toEqual({done:0,total:0,percentage:0});
  expect(checklistProgress([
   {id:'a',title:'Eins',completedAt:'2026-11-07T10:00:00Z'},
   {id:'b',title:'Zwei',completedAt:null}
  ])).toEqual({done:1,total:2,percentage:50});
 });
});
