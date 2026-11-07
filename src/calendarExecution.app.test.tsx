import {beforeEach,describe,expect,it,vi} from 'vitest';
import {render,screen,within,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {addDays,todayLocal} from './date';
import {emptyData,type Task} from './types';
import {STORAGE_KEY} from './repository';

const stamp='2026-11-01T08:00:00Z';
const task=(id:string,changes:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:2,scheduledDate:null,
 deadlineDate:null,recurrence:null,completedAt:null,createdAt:stamp,updatedAt:stamp,
 subtasks:[],...changes
});
const data=()=>({...emptyData(),
 projects:[{id:'math',name:'Mathematik',color:'#aabbcc',createdAt:stamp},
  {id:'religion',name:'Religion',color:'#aaca88',createdAt:stamp}],
 tasks:[
  task('exam',{title:'Klassenarbeit',projectId:'math',deadlineDate:addDays(todayLocal(),10),
   scheduledDate:todayLocal(),estimatedMinutes:90,subtasks:[
    {id:'class-time',title:'ClassTime einrichten',completed:false,plannedDate:todayLocal(),estimatedMinutes:45},
    {id:'done',title:'Erwartungshorizont',completed:true,plannedDate:todayLocal(),estimatedMinutes:30}
   ]}),
  task('inbox',{title:'Elternbrief',projectId:null,scheduledDate:todayLocal(),estimatedMinutes:15}),
  task('religion',{title:'Religion planen',projectId:'religion',scheduledDate:todayLocal()})
 ]});
const seed=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(data()));
const stored=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);
const details=()=>screen.getByRole('region',{name:/Tagesdetails/});
describe('Monatskalender: Aufgaben erledigen und gezielt anzeigen (v1.8)',()=>{
 beforeEach(()=>{localStorage.clear();location.hash='#calendar';vi.restoreAllMocks()});
 it('checks a single ClassTime step and undoes without finishing its parent or losing the deadline',async()=>{
  seed();const user=userEvent.setup();render(<App/>);
  const finish=await screen.findByRole('button',{name:'„ClassTime einrichten“ im Kalender erledigen'});
  await user.click(finish);
  expect(within(details()).queryByRole('button',{name:'„ClassTime einrichten“ im Kalender erledigen'})).not.toBeInTheDocument();
  expect(stored().tasks[0].subtasks.map((s:{completed:boolean})=>s.completed)).toEqual([true,true]);
  expect(stored().tasks[0].completedAt).toBeNull();
  expect(stored().tasks[0].deadlineDate).toBe(addDays(todayLocal(),10));
  expect(stored().tasks[1].scheduledDate).toBe(todayLocal());
  await user.click(screen.getByRole('button',{name:'Rückgängig'}));
  expect(screen.getByRole('button',{name:'„ClassTime einrichten“ im Kalender erledigen'})).toBeInTheDocument();
  expect(stored().tasks[0].subtasks[0].completed).toBe(false);
 });
 it('shows finished steps only when requested and lets them be reopened directly',async()=>{
  seed();const user=userEvent.setup();render(<App/>);
  await screen.findByRole('heading',{name:'Dein Monat im Überblick'});
  const initial=stored();
  expect(within(details()).queryByText('Erwartungshorizont')).not.toBeInTheDocument();
  await user.click(screen.getByRole('checkbox',{name:'Erledigte anzeigen'}));
  expect(within(details()).getByText('Erwartungshorizont')).toBeInTheDocument();
  expect(within(details()).getByRole('button',{name:'„Erwartungshorizont“ im Kalender wieder öffnen'})).toBeInTheDocument();
  expect(stored()).toEqual(initial);
  await user.click(within(details()).getByRole('button',{name:'„Erwartungshorizont“ im Kalender wieder öffnen'}));
  expect(stored().tasks[0].subtasks[1].completed).toBe(false);
  expect(within(details()).getByRole('button',{name:'„Erwartungshorizont“ im Kalender erledigen'})).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Rückgängig'}));
  expect(stored().tasks[0].subtasks[1].completed).toBe(true);
  expect(within(details()).getByRole('button',{name:'„Erwartungshorizont“ im Kalender wieder öffnen'})).toBeInTheDocument();
 });
 it('filters monthly details, workload and backlog to one project and optionally the Inbox',async()=>{
  seed();const user=userEvent.setup();render(<App/>);
  await screen.findByRole('heading',{name:'Dein Monat im Überblick'});
  const initial=stored();
  const selection=screen.getByRole('combobox',{name:'Kalender nach Projekt filtern'});
  await user.selectOptions(selection,'math');
  expect(within(details()).getByRole('button',{name:'Aufgabe „ClassTime einrichten“ öffnen'})).toBeInTheDocument();
  expect(within(details()).queryByRole('button',{name:'Aufgabe „Elternbrief“ öffnen'})).not.toBeInTheDocument();
  expect(within(details()).queryByRole('button',{name:'Aufgabe „Religion planen“ öffnen'})).not.toBeInTheDocument();
  await user.selectOptions(selection,'inbox');
  expect(within(details()).getByRole('button',{name:'Aufgabe „Elternbrief“ öffnen'})).toBeInTheDocument();
  expect(within(details()).queryByRole('button',{name:'Aufgabe „ClassTime einrichten“ öffnen'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Alle Projekte zeigen'}));
  expect(within(details()).getByRole('button',{name:'Aufgabe „Religion planen“ öffnen'})).toBeInTheDocument();
  expect(stored()).toEqual(initial);
 });
 it('finishes a nonrecurring parent from the calendar and offers exact undo',async()=>{
  seed();const user=userEvent.setup();render(<App/>);
  await user.click(await screen.findByRole('button',{name:'„Elternbrief“ im Kalender erledigen'}));
  expect(stored().tasks[1].completedAt).not.toBeNull();
  expect(stored().completionEvents).toHaveLength(1);
  expect(within(details()).queryByRole('button',{name:'„Elternbrief“ im Kalender erledigen'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('checkbox',{name:'Erledigte anzeigen'}));
  expect(within(details()).getByText('Elternbrief')).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Rückgängig'}));
  expect(stored().tasks[1].completedAt).toBeNull();
  expect(within(details()).getByRole('button',{name:'„Elternbrief“ im Kalender erledigen'})).toBeInTheDocument();
 });
 it('asks for confirmation when completing a recurring task with child dates',async()=>{
  const today=todayLocal(),deadline=addDays(today,13);
  const fixture={...emptyData(),tasks:[task('repeat',{title:'Wiederkehrende KA',
   scheduledDate:today,deadlineDate:deadline,
   recurrence:{kind:'interval',every:1,unit:'weeks',anchorDate:today},
   subtasks:[{id:'s',title:'ClassTime vorbereiten',completed:true,
    plannedDate:addDays(today,2),estimatedMinutes:30}]
  })]};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(fixture));
  const user=userEvent.setup();render(<App/>);
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
  await user.click(await screen.findByRole('button',{name:'„Wiederkehrende KA“ im Kalender erledigen'}));
  expect(confirm).toHaveBeenCalled();
  expect(stored().tasks[0].scheduledDate).toBe(today);
  confirm.mockReturnValue(true);
  await user.click(screen.getByRole('button',{name:'„Wiederkehrende KA“ im Kalender erledigen'}));
  expect(stored().tasks[0].scheduledDate).toBe(addDays(today,7));
  expect(stored().tasks[0].deadlineDate).toBe(deadline);
  expect(stored().tasks[0].subtasks[0]).toMatchObject({
   completed:false,plannedDate:addDays(today,2),estimatedMinutes:30
  });
  await user.click(screen.getByRole('button',{name:'Rückgängig'}));
  expect(stored().tasks[0].scheduledDate).toBe(today);
  expect(stored().tasks[0].subtasks[0].completed).toBe(true);
 });
});
