import {beforeEach,describe,expect,it,vi} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {addDays,formatDate,todayLocal} from './date';
import {emptyData,type Task} from './types';
import {STORAGE_KEY} from './repository';

const stamp='2026-11-01T08:00:00Z';
const task=(id:string,values:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:2,
 scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,
 createdAt:stamp,updatedAt:stamp,subtasks:[],...values
});
const stored=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);
const seed=(tasks:Task[],budgets?:(number|null)[])=>
 localStorage.setItem(STORAGE_KEY,JSON.stringify({
  ...emptyData(),tasks,...(budgets?{weeklyBudgetMinutes:budgets}:{})
 }));
const details=()=>screen.getByRole('region',{name:/Tagesdetails/});
function day(date:string){
 const button=screen.getAllByRole('button').find(b=>
  b.getAttribute('aria-label')?.startsWith(formatDate(date)+':'));
 if(!button)throw Error('Kalendertag fehlt: '+date);
 return button;
}

describe('Monatskalender in Task Companion',()=>{
 beforeEach(()=>{localStorage.clear();location.hash='';vi.restoreAllMocks()});
 it('shows work separately from last completion day and actual required deadline',async()=>{
  const today=todayLocal(),needed=addDays(today,1);
  seed([task('exam',{title:'Klassenarbeit vorbereiten',
   scheduledDate:today,deadlineDate:needed,estimatedMinutes:90,
   subtasks:[{id:'step1',title:'ClassTime einrichten',completed:false,
    plannedDate:today,estimatedMinutes:45}]})]);
  location.hash='#calendar';
  render(<App/>);
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Dein Monat im Überblick'})).toBeInTheDocument());
  expect(screen.getByText('Arbeit eingeplant')).toBeInTheDocument();
  expect(screen.getByText('Spätestens fertig')).toBeInTheDocument();
  expect(screen.getByText('Bereits benötigt')).toBeInTheDocument();
  expect(within(details()).getAllByText('Eingeplanter Arbeitstag')).toHaveLength(2);
  expect(within(details()).getByText('Spätestens an diesem Tag fertigstellen')).toBeInTheDocument();
  expect(within(details()).getByRole('button',{name:'Aufgabe „ClassTime einrichten“ öffnen'})).toBeInTheDocument();
  await userEvent.setup().click(day(needed));
  expect(within(details()).getByText('An diesem Tag bereits benötigt')).toBeInTheDocument();
  expect(within(details()).getByText(/Letzter Fertigstellungstag:/)).toBeInTheDocument();
 });
 it('navigates months and resets to this month with selected day',async()=>{
  seed([]);
  const user=userEvent.setup();location.hash='#calendar';render(<App/>);
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Dein Monat im Überblick'})).toBeInTheDocument());
  const currentMonth=new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric',timeZone:'Europe/Berlin'})
   .format(new Date(todayLocal()+'T12:00:00Z'));
  expect(screen.getByText(currentMonth)).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Nächster Monat'}));
  expect(screen.getByText(/Für diesen Tag ist noch keine Arbeit/)).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Vorheriger Monat'}));
  expect(screen.getByText(currentMonth)).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Dieser Monat'}));
  expect(within(details()).getByText('Heute')).toBeInTheDocument();
 });
 it('creates a task on the selected day without modifying other tasks',async()=>{
  const today=todayLocal(),next=addDays(today,2);
  seed([task('old',{title:'Bestehende Aufgabe',scheduledDate:today})]);
  const user=userEvent.setup();location.hash='#calendar';render(<App/>);
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Dein Monat im Überblick'})).toBeInTheDocument());
  await user.click(day(next));
  await user.click(within(details()).getByRole('button',{name:'Aufgabe für diesen Tag'}));
  const editor=screen.getByRole('dialog',{name:'Aufgabe hinzufügen'});
  expect(within(editor).getByLabelText('Geplant')).toHaveValue(next);
  await user.type(within(editor).getByLabelText('Titel'),'Elternbrief vorbereiten');
  await user.click(within(editor).getByRole('button',{name:'Speichern'}));
  const tasks=stored().tasks;
  expect(tasks).toHaveLength(2);
  expect(tasks[0]).toMatchObject({id:'old',scheduledDate:today});
  expect(tasks[1]).toMatchObject({title:'Elternbrief vorbereiten',scheduledDate:next,deadlineDate:null});
 });
 it('confirms before breaking a relative planning date, retaining the original deadline',async()=>{
  const today=todayLocal(),planned=addDays(today,1),due=addDays(today,10);
  seed([task('exam',{title:'Klassenarbeit',deadlineDate:due,
   subtasks:[
    {id:'step',title:'ClassTime vorbereiten',completed:false,plannedDate:today,
     offset:{amount:10,unit:'days'},estimatedMinutes:30},
    {id:'sibling',title:'Layout prüfen',completed:false,plannedDate:addDays(today,3)}
   ]})]);
  location.hash='#calendar';render(<App/>);
  await waitFor(()=>expect(screen.getByLabelText('ClassTime vorbereiten Arbeitstag im Monatskalender')).toBeInTheDocument());
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
  fireEvent.change(screen.getByLabelText('ClassTime vorbereiten Arbeitstag im Monatskalender'),{target:{value:planned}});
  expect(confirm).toHaveBeenCalled();
  expect(stored().tasks[0].subtasks[0].plannedDate).toBe(today);
  expect(stored().tasks[0].subtasks[0].offset).toEqual({amount:10,unit:'days'});
  confirm.mockReturnValue(true);
  fireEvent.change(screen.getByLabelText('ClassTime vorbereiten Arbeitstag im Monatskalender'),{target:{value:planned}});
  expect(stored().tasks[0].subtasks[0].plannedDate).toBe(planned);
  expect(stored().tasks[0].subtasks[0].offset).toBeUndefined();
  expect(stored().tasks[0].subtasks[1].plannedDate).toBe(addDays(today,3));
  expect(stored().tasks[0].deadlineDate).toBe(due);
  await userEvent.setup().click(day(planned));
  expect(within(details()).getByRole('button',{name:'Aufgabe „ClassTime vorbereiten“ öffnen'})).toBeInTheDocument();
 });
 it('cancels a planned date on or after the actual needed-by day',async()=>{
  const today=todayLocal(),deadline=addDays(today,3);
  seed([task('exam',{title:'Klausur',scheduledDate:today,deadlineDate:deadline})]);
  location.hash='#calendar';render(<App/>);
  await waitFor(()=>expect(screen.getByLabelText('Klausur Arbeitstag im Monatskalender')).toBeInTheDocument());
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
  fireEvent.change(screen.getByLabelText('Klausur Arbeitstag im Monatskalender'),{target:{value:deadline}});
  expect(confirm).toHaveBeenCalled();
  expect(stored().tasks[0].scheduledDate).toBe(today);
  expect(stored().tasks[0].deadlineDate).toBe(deadline);
 });
 it('does not claim overload without a configured budget; links to weekly planner',async()=>{
  seed([task('unplanned',{title:'Ungeplant'})]);
  const user=userEvent.setup();location.hash='#calendar';render(<App/>);
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Dein Monat im Überblick'})).toBeInTheDocument());
  expect(screen.queryByText(/über deinem Wochenplanungs-Budget/)).not.toBeInTheDocument();
  await user.click(within(details()).getByRole('button',{name:'Ungeplante Aufgaben in der Wochenplanung ansehen'}));
  expect(screen.getByText('Deine Woche im Blick')).toBeInTheDocument();
  expect(screen.getByText('Ungeplant')).toBeInTheDocument();
 });
});
