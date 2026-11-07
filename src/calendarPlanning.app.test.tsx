import {beforeEach,describe,expect,it,vi} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {addDays,formatDate,todayLocal} from './date';
import {emptyData,type Task} from './types';
import {STORAGE_KEY} from './repository';

const stamp='2026-11-01T08:00:00Z';
const task=(id:string,fields:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:2,scheduledDate:null,
 deadlineDate:null,recurrence:null,completedAt:null,createdAt:stamp,updatedAt:stamp,
 subtasks:[],...fields
});
const seed=(tasks:Task[])=>localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks}));
const saved=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);
function calendarDay(date:string):HTMLButtonElement {
 const result=screen.getAllByRole('button').find(button=>
  button.getAttribute('aria-label')?.startsWith(formatDate(date)+':'));
 if(!result)throw new Error('Kalendertag nicht sichtbar '+date);
 return result as HTMLButtonElement;
}
const fakeTransfer=()=>({effectAllowed:'none',dropEffect:'none',setData:vi.fn(),getData:vi.fn()});

describe('Monatskalender: Aufgaben direkt beplanen (v1.7)',()=>{
 beforeEach(()=>{localStorage.clear();location.hash='#calendar';vi.restoreAllMocks()});
 it('shows dated and undated work separately and lets a parent be scheduled by clicking a date',async()=>{
  const today=todayLocal(),planned=addDays(today,2),needed=addDays(today,12);
  seed([
   task('exam',{title:'Klassenarbeit',deadlineDate:needed,subtasks:[
    {id:'step',title:'Aufgaben zusammenstellen',completed:false,plannedDate:null,estimatedMinutes:60}
   ]}),
   task('other',{title:'Elternbrief',scheduledDate:today})
  ]);
  const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Dein Monat im Überblick'})).toBeInTheDocument());
  const pool=screen.getByRole('region',{name:'Aufgaben ohne Arbeitstag'});
  expect(within(pool).getByText('Ohne Arbeitstag')).toBeInTheDocument();
  expect(within(pool).getByRole('button',{name:'„Klassenarbeit“ Termin wählen'})).toBeInTheDocument();
  expect(within(pool).getByRole('button',{name:'„Aufgaben zusammenstellen“ Termin wählen'})).toBeInTheDocument();
  expect(within(pool).queryByRole('button',{name:'„Elternbrief“ Termin wählen'})).not.toBeInTheDocument();
  await user.click(within(pool).getByRole('button',{name:'„Klassenarbeit“ Termin wählen'}));
  expect(screen.getByText('Jetzt Kalendertag auswählen:')).toBeInTheDocument();
  await user.click(calendarDay(planned));
  expect(saved().tasks[0].scheduledDate).toBe(planned);
  expect(saved().tasks[0].subtasks[0].plannedDate).toBeNull();
  expect(saved().tasks[0].deadlineDate).toBe(needed);
  expect(saved().tasks[1].scheduledDate).toBe(today);
  expect(screen.queryByText('Jetzt Kalendertag auswählen:')).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Rückgängig'})).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Rückgängig'}));
  expect(saved().tasks[0].scheduledDate).toBeNull();
  expect(saved().tasks[0].deadlineDate).toBe(needed);
 });
 it('drags an undated subtask onto a day, leaving other tasks and deadlines untouched',async()=>{
  const today=todayLocal(),chosen=addDays(today,1),needed=addDays(today,10);
  seed([task('exam',{title:'Klassenarbeit',deadlineDate:needed,subtasks:[
   {id:'step',title:'ClassTime einrichten',completed:false,plannedDate:null,estimatedMinutes:45},
   {id:'other',title:'Erwartungshorizont',completed:false,plannedDate:addDays(today,3)}
  ]})]);
  render(<App/>);
  await waitFor(()=>expect(screen.getByRole('region',{name:'Aufgaben ohne Arbeitstag'})).toBeInTheDocument());
  const handle=screen.getByRole('button',{name:'„ClassTime einrichten“ auf einen Kalendertag ziehen'});
  const transfer=fakeTransfer();
  fireEvent.dragStart(handle,{dataTransfer:transfer});
  expect(transfer.setData).toHaveBeenCalledWith('text/plain','task-companion:subtask:exam:step');
  const drop=calendarDay(chosen);
  fireEvent.dragOver(drop,{dataTransfer:transfer});
  expect(drop).toHaveClass('plan-hover');
  fireEvent.drop(drop,{dataTransfer:transfer});
  fireEvent.dragEnd(handle,{dataTransfer:transfer});
  expect(saved().tasks[0].subtasks[0]).toMatchObject({id:'step',plannedDate:chosen,estimatedMinutes:45,completed:false});
  expect(saved().tasks[0].subtasks[1].plannedDate).toBe(addDays(today,3));
  expect(saved().tasks[0].deadlineDate).toBe(needed);
  expect(screen.getByRole('button',{name:'Rückgängig'})).toBeInTheDocument();
 });
 it('dragging an existing relative step asks before unlinking; undo restores its offset',async()=>{
  const today=todayLocal(),target=addDays(today,2),needed=addDays(today,14);
  seed([task('exam',{title:'Klassenarbeit',deadlineDate:needed,subtasks:[
   {id:'step',title:'ClassTime',completed:false,plannedDate:today,
    offset:{amount:14,unit:'days'},estimatedMinutes:35}
  ]})]);
  render(<App/>);
  await waitFor(()=>expect(screen.getByRole('button',{name:'„ClassTime“ auf einen Kalendertag ziehen'})).toBeInTheDocument());
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
  const handle=screen.getByRole('button',{name:'„ClassTime“ auf einen Kalendertag ziehen'});
  const transfer=fakeTransfer();
  fireEvent.dragStart(handle,{dataTransfer:transfer});
  fireEvent.dragOver(calendarDay(target),{dataTransfer:transfer});
  fireEvent.drop(calendarDay(target),{dataTransfer:transfer});
  expect(confirm).toHaveBeenCalled();
  expect(saved().tasks[0].subtasks[0].offset).toEqual({amount:14,unit:'days'});
  expect(saved().tasks[0].subtasks[0].plannedDate).toBe(today);
  confirm.mockReturnValue(true);
  fireEvent.dragStart(handle,{dataTransfer:transfer});
  fireEvent.drop(calendarDay(target),{dataTransfer:transfer});
  await waitFor(()=>expect(saved().tasks[0].subtasks[0].plannedDate).toBe(target));
  expect(saved().tasks[0].subtasks[0].offset).toBeUndefined();
  await userEvent.setup().click(screen.getByRole('button',{name:'Rückgängig'}));
  expect(saved().tasks[0].subtasks[0].plannedDate).toBe(today);
  expect(saved().tasks[0].subtasks[0].offset).toEqual({amount:14,unit:'days'});
  expect(saved().tasks[0].deadlineDate).toBe(needed);
 });
 it('supports scheduling without dragging and cancels the mode by Escape',async()=>{
  seed([task('undated',{title:'Planung erstellen'})]);
  const user=userEvent.setup();render(<App/>);
  const button=await screen.findByRole('button',{name:'„Planung erstellen“ Termin wählen'});
  await user.click(button);
  expect(screen.getByText('Jetzt Kalendertag auswählen:')).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByText('Jetzt Kalendertag auswählen:')).not.toBeInTheDocument();
  expect(saved().tasks[0].scheduledDate).toBeNull();
  await user.click(button);
  await user.click(calendarDay(todayLocal()));
  expect(saved().tasks[0].scheduledDate).toBe(todayLocal());
 });
 it('blocks dates beyond the ready-by day unless explicitly confirmed',async()=>{
  const today=todayLocal(),needed=addDays(today,3);
  seed([task('urgent',{title:'Abgabe vorbereiten',deadlineDate:needed})]);
  const user=userEvent.setup();render(<App/>);
  await user.click(await screen.findByRole('button',{name:'„Abgabe vorbereiten“ Termin wählen'}));
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
  await user.click(calendarDay(needed));
  expect(confirm).toHaveBeenCalled();
  expect(saved().tasks[0].scheduledDate).toBeNull();
  expect(screen.getByText('Jetzt Kalendertag auswählen:')).toBeInTheDocument();
  confirm.mockReturnValue(true);
  await user.click(calendarDay(needed));
  expect(saved().tasks[0].scheduledDate).toBe(needed);
  expect(saved().tasks[0].deadlineDate).toBe(needed);
 });
 it('folds the backlog and does not change persisted tasks',async()=>{
  seed([task('undated',{title:'Ungeplante Aufgabe'})]);
  const initial=saved();
  const user=userEvent.setup();render(<App/>);
  const pool=await screen.findByRole('region',{name:'Aufgaben ohne Arbeitstag'});
  await user.click(within(pool).getByRole('button',{name:/Ohne Arbeitstag/}));
  expect(within(pool).queryByRole('button',{name:'„Ungeplante Aufgabe“ Termin wählen'})).not.toBeInTheDocument();
  await user.click(within(pool).getByRole('button',{name:/Ohne Arbeitstag/}));
  expect(within(pool).getByRole('button',{name:'„Ungeplante Aufgabe“ Termin wählen'})).toBeInTheDocument();
  expect(saved()).toEqual(initial);
 });
});
