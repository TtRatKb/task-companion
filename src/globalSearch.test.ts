import {describe,expect,it} from 'vitest';
import {emptyData,type AppData,type Task,type TaskTemplate} from './types';
import {searchAll,normalizeSearch,DEFAULT_SEARCH_FILTERS,type SearchFilters} from './globalSearch';

const stamp='2026-11-07T08:00:00Z';
const task=(id:string,changes:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:4,
 scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,
 createdAt:stamp,updatedAt:stamp,...changes
});
const template=(id:string,changes:Partial<TaskTemplate>={}):TaskTemplate=>({
 id,name:id,description:'',steps:[],createdAt:stamp,updatedAt:stamp,...changes
});
const data=():AppData=>({...emptyData(),
 projects:[
  {id:'mathe',name:'Mathematik 7b',color:'#456789',createdAt:stamp},
  {id:'religion',name:'Religion 9',color:'#111111',createdAt:stamp}
 ],
 tasks:[
  task('class',{title:'Klassenarbeit vorbereiten',projectId:'mathe',priority:2,
   deadlineDate:'2026-11-27',description:'Prüfung zur Bruchrechnung',
   subtasks:[
    {id:'s1',title:'ClassTime einrichten',completed:false,plannedDate:'2026-11-15'},
    {id:'s2',title:'Erwartungshorizont erstellen',completed:true}
   ]}),
  task('lesson',{title:'Unterrichtsplanung',projectId:'religion',priority:1,
   description:'Thema Islam und Gottesbilder'}),
  task('done',{title:'Alte Klassenarbeit',projectId:'mathe',priority:1,
   completedAt:'2026-10-30T09:00:00Z',
   subtasks:[{id:'done-s',title:'ClassTime korrigieren',completed:true}]}),
  task('inbox',{title:'Elternbrief',projectId:null,priority:3}),
  task('weekly',{title:'Wöchentliche Aufgabe',projectId:'mathe',
   completedAt:'2026-11-06T09:00:00Z',recurrence:{kind:'weekdays',weekdays:[1]}})
 ],
 templates:[template('tpl',{name:'Klassenarbeit {Fach} vorbereiten',
  steps:['Aufgaben erstellen – 2 Wochen vorher','ClassTime vorbereiten']})]
});
const run=(changes:Partial<SearchFilters>={})=>searchAll(data(),{...DEFAULT_SEARCH_FILTERS,...changes});

describe('Globale Suche und Schnellfilter',()=>{
 it('finds matching subtask text even when parent title does not contain the query',()=>{
  const results=run({query:'ClassTime'});
  expect(results.map(x=>x.id)).toEqual(['tpl','class']);
  const entry=results.find(x=>x.id==='class');
  expect(entry?.kind).toBe('task');
  if(entry?.kind==='task'){
   expect(entry.matchedSteps).toEqual(['ClassTime einrichten']);
   expect(entry.task.title).toBe('Klassenarbeit vorbereiten');
  }
 });
 it('finds templates by step text, including placeholders in names',()=>{
  expect(run({query:'2 Wochen vorher'}).map(x=>x.id)).toEqual(['tpl']);
  expect(run({query:'{Fach}'}).map(x=>x.id)).toEqual(['tpl']);
  expect(run({query:'brUchrechnung'}).map(x=>x.id)).toEqual(['class']);
 });
 it('supports umlauts, accents, ß, upper/lowercase and multiple terms independent of word order',()=>{
  expect(normalizeSearch('GRÜẞE   FÜR DİCH')).toBe('grusse fur dich');
  expect(run({query:'BRUCHRECHNUNG Klassenarbeit'}).map(x=>x.id)).toEqual(['class']);
  expect(run({query:'MATHEmatik classTIME'}).map(x=>x.id)).toEqual(['class']);
  expect(run({query:'GOTtESBILDER islam'}).map(x=>x.id)).toEqual(['lesson']);
 });
 it('filters by open/done and honors recurring tasks as active',()=>{
  expect(run({query:'Klassenarbeit'}).map(x=>x.id)).toEqual(['tpl','class']);
  expect(run({query:'Klassenarbeit',status:'done'}).map(x=>x.id)).toEqual(['done']);
  expect(run({query:'Klassenarbeit',status:'all'}).map(x=>x.id)).toEqual(['tpl','class','done']);
  expect(run({query:'Wöchentlich',status:'open'}).map(x=>x.id)).toEqual(['weekly']);
  expect(run({query:'Wöchentlich',status:'done'})).toHaveLength(0);
 });
 it('filters project, Inbox, priority and results kind without inventing values for templates',()=>{
  expect(run({query:'Klassenarbeit',project:'mathe'}).map(x=>x.id)).toEqual(['class']);
  expect(run({query:'',project:'inbox'}).map(x=>x.id)).toEqual(['inbox']);
  expect(run({query:'ClassTime',kind:'tasks'}).map(x=>x.id)).toEqual(['class']);
  expect(run({query:'ClassTime',kind:'templates'}).map(x=>x.id)).toEqual(['tpl']);
  expect(run({query:'ClassTime',priority:2}).map(x=>x.id)).toEqual(['class']);
  expect(run({query:'ClassTime',priority:1})).toHaveLength(0);
  expect(run({kind:'templates',status:'done'})).toHaveLength(0);
 });
 it('orders exact title before description or subtask hits, then prioritizes tasks',()=>{
  const fixture=data();
  fixture.tasks.unshift(task('exact',{title:'ClassTime',priority:4}));
  const hits=searchAll(fixture,{...DEFAULT_SEARCH_FILTERS,query:'ClassTime'});
  expect(hits[0].id).toBe('exact');
  expect(hits.map(h=>h.id)).toEqual(['exact','tpl','class']);
 });
 it('does not mutate tasks, templates or original ordering',()=>{
  const fixture=data();
  const original=JSON.stringify(fixture);
  searchAll(fixture,{...DEFAULT_SEARCH_FILTERS,query:'ClassTime',status:'all'});
  searchAll(fixture,{...DEFAULT_SEARCH_FILTERS,project:'mathe'});
  expect(JSON.stringify(fixture)).toBe(original);
 });
});
