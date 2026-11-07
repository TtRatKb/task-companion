import {beforeEach,describe,expect,it} from 'vitest';
import {render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {addDays,todayLocal} from './date';
import {STORAGE_KEY} from './repository';
import {emptyData,type Task} from './types';

const now='2026-11-01T10:00:00Z';
const task=(id:string,fields:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:2,
 scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,
 createdAt:now,updatedAt:now,...fields
});
const saved=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);
describe('Heute-Fokus im Task Companion',()=>{
 beforeEach(()=>{localStorage.clear();location.hash=''});
 it('shows concrete due steps once, hides future steps, and preserves the parent',async()=>{
  const today=todayLocal();
  const parent=task('Klassenarbeit Mathe 7b',{deadlineDate:addDays(today,24),subtasks:[
   {id:'old',title:'Aufgaben auswählen',completed:false,plannedDate:addDays(today,-2),estimatedMinutes:60},
   {id:'now',title:'ClassTime einrichten',completed:false,plannedDate:today,estimatedMinutes:45},
   {id:'later',title:'Kopieren',completed:false,plannedDate:addDays(today,2)}
  ]});
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks:[parent]}));
  location.hash='#today';render(<App/>);
  await waitFor(()=>expect(screen.getByRole('heading',{name:/Überfällige Arbeitsschritte/})).toBeInTheDocument());
  expect(screen.getByRole('heading',{name:/Heute anstehende Unteraufgaben/})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/„ClassTime einrichten“ erledigen/})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/„Aufgaben auswählen“ erledigen/})).toBeInTheDocument();
  expect(screen.queryByText('Kopieren')).not.toBeInTheDocument();
  expect(screen.getAllByRole('button',{name:'Hauptaufgabe „Klassenarbeit Mathe 7b“ öffnen'})).toHaveLength(2);
  expect(screen.queryByText('Alles im Blick')).not.toBeInTheDocument();
  const user=userEvent.setup();
  await user.click(screen.getByRole('button',{name:/„ClassTime einrichten“ erledigen/}));
  expect(screen.queryByRole('button',{name:/„ClassTime einrichten“ erledigen/})).not.toBeInTheDocument();
  expect(saved().tasks[0].subtasks.map((s:{completed:boolean})=>s.completed)).toEqual([false,true,false]);
  expect(saved().tasks[0].completedAt).toBeNull();
  expect(saved().tasks[0].deadlineDate).toBe(addDays(today,24));
  await user.click(screen.getByRole('button',{name:'Rückgängig'}));
  expect(screen.getByRole('button',{name:/„ClassTime einrichten“ erledigen/})).toBeInTheDocument();
  expect(saved().tasks[0].subtasks[1].completed).toBe(false);
 });
 it('does not duplicate a step checkbox under a separately scheduled parent',async()=>{
  const today=todayLocal();
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks:[
   task('Große Vorbereitung',{scheduledDate:today,subtasks:[
    {id:'today-step',title:'Layout prüfen',completed:false,plannedDate:today}
   ]})
  ]}));
  location.hash='#today';render(<App/>);
  await waitFor(()=>expect(screen.getByRole('button',{name:/„Layout prüfen“ erledigen/})).toBeInTheDocument());
  expect(screen.getAllByText('Layout prüfen')).toHaveLength(1);
  expect(screen.getByRole('button',{name:'„Große Vorbereitung“ abschließen'})).toBeInTheDocument();
  const user=userEvent.setup();
  await user.click(screen.getByRole('button',{name:'Hauptaufgabe „Große Vorbereitung“ öffnen'}));
  expect(screen.getByRole('dialog',{name:'Aufgabe bearbeiten'})).toBeInTheDocument();
  expect(within(screen.getByRole('dialog')).getByLabelText('Unteraufgabe 1')).toHaveValue('Layout prüfen');
 });
 it('includes future individual steps in Upcoming even when the parent is not scheduled',async()=>{
  const today=todayLocal();
  const planned=addDays(today,3);
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks:[task('Prüfungsbogen',{
   deadlineDate:addDays(today,15),scheduledDate:null,subtasks:[
    {id:'step1',title:'Erwartungshorizont schreiben',completed:false,plannedDate:planned},
    {id:'step2',title:'Schon erledigt',completed:true,plannedDate:planned}
   ]})]}));
  location.hash='#upcoming';render(<App/>);
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Unteraufgaben für diesen Tag'})).toBeInTheDocument());
  expect(screen.getByRole('button',{name:/„Erwartungshorizont schreiben“ erledigen/})).toBeInTheDocument();
  expect(screen.queryByText('Schon erledigt')).not.toBeInTheDocument();
  const user=userEvent.setup();
  await user.click(screen.getByRole('button',{name:/„Erwartungshorizont schreiben“ erledigen/}));
  expect(screen.queryByRole('button',{name:/„Erwartungshorizont schreiben“ erledigen/})).not.toBeInTheDocument();
  expect(saved().tasks[0].scheduledDate).toBeNull();
  expect(saved().tasks[0].subtasks[0].completed).toBe(true);
 });
 it('does not show completed nonrecurring tasks or already finished steps',async()=>{
  const today=todayLocal();
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks:[
   task('Abgeschlossen',{completedAt:now,subtasks:[
    {id:'s1',title:'Hidden done parent',completed:false,plannedDate:today}
   ]}),
   task('Noch offen',{subtasks:[
    {id:'s2',title:'Finished step',completed:true,plannedDate:today}
   ]})
  ]}));
  location.hash='#today';render(<App/>);
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Heute'})).toBeInTheDocument());
  expect(screen.queryByText('Hidden done parent')).not.toBeInTheDocument();
  expect(screen.queryByText('Finished step')).not.toBeInTheDocument();
 });
});
