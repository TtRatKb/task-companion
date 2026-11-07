import {describe,expect,it} from 'vitest';
import {inboxQueue,applyInboxTriage} from './inboxTriage';
import {emptyData,type Task} from './types';

const stamp='2026-11-07T08:00:00Z';
const makeTask=(id:string,fields:Partial<Task>={}):Task=>({
 id,title:id,description:'Anmerkung',projectId:null,priority:4,
 scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,
 createdAt:stamp,updatedAt:stamp,
 subtasks:[{id:'sub-1',title:'Kopieren',completed:true,plannedDate:'2026-11-10',
  estimatedMinutes:45,offset:{amount:2,unit:'days'}}],
 estimatedMinutes:120,
 ...fields
});
const seed=()=>({...emptyData(),
 projects:[{id:'mathe',name:'Mathe',color:'#123456',createdAt:stamp}],
 tasks:[makeTask('eins'),makeTask('zwei'),makeTask('projekt',{projectId:'mathe'}),
  makeTask('erledigt',{completedAt:stamp})]});
const patch={projectId:'mathe',priority:1 as const,scheduledDate:'2026-11-08',deadlineDate:'2026-11-12'};

describe('Inbox-Turbo Datenintegrität',()=>{
 it('bildet eine stabile Warteschlange nur aus offenen Eingangsaufgaben',()=>{
  const data=seed();
  expect(inboxQueue(data.tasks)).toEqual(['eins','zwei']);
  expect(data.tasks.map(t=>t.id)).toEqual(['eins','zwei','projekt','erledigt']);
 });
 it('ändert ausschließlich Projekt, Priorität und Daten und erhält Checklisten sowie Historie',()=>{
  const data=seed();
  const changed=applyInboxTriage(data,'eins',stamp,patch,new Date('2026-11-07T10:00:00Z'));
  expect(changed.status).toBe('saved');
  expect(changed.data.tasks[0]).toEqual({...data.tasks[0],...patch,updatedAt:'2026-11-07T10:00:00.000Z'});
  expect(changed.data.tasks[1]).toBe(data.tasks[1]);
  expect(changed.data.tasks[0].subtasks).toEqual(data.tasks[0].subtasks);
  expect(changed.data.tasks[0].estimatedMinutes).toBe(120);
  expect(data.tasks[0].projectId).toBeNull();
 });
 it('lässt eine Aufgabe ohne Änderung in der Inbox und verändert dabei keine gespeicherten Daten',()=>{
  const data=seed();
  const original=data.tasks[0];
  const result=applyInboxTriage(data,'eins',stamp,{
   projectId:null,priority:4,scheduledDate:null,deadlineDate:null
  });
  expect(result).toEqual({status:'saved',data});
  expect(result.data.tasks[0]).toBe(original);
 });
 it('verweigert Überschreiben, wenn die Aufgabe zwischenzeitlich in der Cloud geändert wurde',()=>{
  const data=seed();
  data.tasks[0]={...data.tasks[0],updatedAt:'2026-11-07T09:00:00Z',title:'Anderer Titel'};
  const result=applyInboxTriage(data,'eins',stamp,patch);
  expect(result.status).toBe('conflict');
  expect(result.data).toBe(data);
  expect(data.tasks[0].title).toBe('Anderer Titel');
 });
 it('verweigert Bearbeitungen fehlender, erledigter oder ungültiger Aufgaben',()=>{
  const data=seed();
  expect(applyInboxTriage(data,'nicht-da',stamp,patch).status).toBe('missing');
  expect(applyInboxTriage(data,'erledigt',stamp,patch).status).toBe('missing');
  expect(applyInboxTriage(data,'eins',stamp,{...patch,projectId:'does-not-exist'}).status).toBe('invalid');
  expect(applyInboxTriage(data,'eins',stamp,{...patch,scheduledDate:'2026-02-31'}).status).toBe('invalid');
  expect(applyInboxTriage(data,'eins',stamp,{...patch,priority:7 as 1}).status).toBe('invalid');
 });
 it('berührt die Deadline nicht, wenn nur ein Arbeitstag zugeteilt wird',()=>{
  const data=seed();
  data.tasks[0]={...data.tasks[0],deadlineDate:'2026-11-19'};
  const result=applyInboxTriage(data,'eins',stamp,{
   projectId:null,priority:4,scheduledDate:'2026-11-09',deadlineDate:'2026-11-19'
  });
  expect(result.data.tasks[0].deadlineDate).toBe('2026-11-19');
  expect(result.data.tasks[0].scheduledDate).toBe('2026-11-09');
 });
});
