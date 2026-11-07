import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {addDays,todayLocal} from './date';
import {emptyData,type Task} from './types';
import {mondayOf} from './weeklyPlanner';
import {STORAGE_KEY} from './repository';

const monday=()=>mondayOf(todayLocal());
function task(id:string,fields:Partial<Task>={}):Task{
 return {id,title:id,description:'',projectId:null,priority:2,scheduledDate:monday(),
  deadlineDate:null,recurrence:null,completedAt:null,
  createdAt:'2026-11-01T08:00:00Z',updatedAt:'2026-11-01T08:00:00Z',...fields};
}
const stored=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);

describe('Wochenplanung im Browser',()=>{
 beforeEach(()=>{localStorage.clear();location.hash=''});
 afterEach(()=>vi.restoreAllMocks());
 it('shows separate task and subtask items and clearly distinguishes unknown estimates',async()=>{
  const data={...emptyData(),tasks:[
   task('Klassenarbeit vorbereiten',{estimatedMinutes:180,subtasks:[
    {id:'a',title:'ClassTime einrichten',completed:false,plannedDate:monday(),estimatedMinutes:45},
    {id:'b',title:'Material kopieren',completed:false,plannedDate:addDays(monday(),1)}
   ]}),
   task('Elternbrief',{scheduledDate:addDays(monday(),1),estimatedMinutes:30})
  ]};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Wochenplanung'}));
  expect(screen.getByRole('heading',{name:'Deine Woche im Blick'})).toBeInTheDocument();
  expect(screen.getByText('ClassTime einrichten')).toBeInTheDocument();
  expect(screen.getByText('Material kopieren')).toBeInTheDocument();
  expect(screen.getByText('Elternbrief')).toBeInTheDocument();
  expect(screen.getByText(/1 Std. 15 Min. geschätzt/)).toBeInTheDocument();
  expect(screen.getAllByText('Dauer offen').length).toBeGreaterThanOrEqual(1);
  expect(stored().tasks[0].estimatedMinutes).toBe(180);
 });
 it('persists a chosen budget and marks overload only after the user sets it',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks:[task('Unterricht',{estimatedMinutes:120})]}));
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Wochenplanung'}));
  expect(screen.queryByText(/über Budget/)).not.toBeInTheDocument();
  const budget=screen.getByLabelText('Zeitbudget Mo');
  fireEvent.change(budget,{target:{value:'60'}});
  fireEvent.blur(budget);
  await waitFor(()=>expect(stored().weeklyBudgetMinutes[0]).toBe(60));
  expect(screen.getByText(/Mindestens 1 Std. über Budget/)).toBeInTheDocument();
  expect(stored().tasks[0].scheduledDate).toBe(monday());
 });
 it('lets the user move a relative subtask but does not silently move the deadline or sibling',async()=>{
  vi.spyOn(window,'confirm').mockReturnValue(true);
  const data={...emptyData(),tasks:[task('Klassenarbeit',{
   deadlineDate:addDays(monday(),18),
   subtasks:[
    {id:'relative',title:'ClassTime',completed:false,
     plannedDate:monday(),offset:{amount:18,unit:'days'},estimatedMinutes:45},
    {id:'manual',title:'Erwartungshorizont',completed:false,
     plannedDate:addDays(monday(),2),estimatedMinutes:60}
   ]
  })]};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Wochenplanung'}));
  const input=screen.getByLabelText('ClassTime Arbeitstag');
  fireEvent.change(input,{target:{value:addDays(monday(),3)}});
  await waitFor(()=>expect(stored().tasks[0].subtasks[0].plannedDate).toBe(addDays(monday(),3)));
  expect(stored().tasks[0].subtasks[0].offset).toBeUndefined();
  expect(stored().tasks[0].subtasks[1].plannedDate).toBe(addDays(monday(),2));
  expect(stored().tasks[0].deadlineDate).toBe(addDays(monday(),18));
  expect(window.confirm).toHaveBeenCalled();
 });
 it('cancelling a date past deadline leaves the old date and reverse planning intact',async()=>{
  vi.spyOn(window,'confirm').mockReturnValue(false);
  const deadline=addDays(monday(),1);
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks:[
   task('Fertig morgen',{deadlineDate:deadline})
  ]}));
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Wochenplanung'}));
  fireEvent.change(screen.getByLabelText('Fertig morgen Arbeitstag'),{target:{value:deadline}});
  expect(stored().tasks[0].scheduledDate).toBe(monday());
  expect(stored().tasks[0].deadlineDate).toBe(deadline);
  expect(window.confirm).toHaveBeenCalled();
 });
 it('supports estimating parent and subtask duration through the existing task editor',async()=>{
  const data={...emptyData(),tasks:[task('Großer Auftrag',{subtasks:[
   {id:'s1',title:'Teilaufgabe',completed:false,plannedDate:monday()}
  ]})]};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Wochenplanung'}));
  await user.click(screen.getByRole('button',{name:'Großer Auftrag'}));
  const editor=screen.getByRole('dialog');
  fireEvent.change(within(editor).getByLabelText('Dauer Aufgabe in Minuten'),{target:{value:'120'}});
  fireEvent.change(within(editor).getByLabelText('Dauer Unteraufgabe 1 in Minuten'),{target:{value:'45'}});
  await user.click(within(editor).getByRole('button',{name:'Speichern'}));
  expect(stored().tasks[0].estimatedMinutes).toBe(120);
  expect(stored().tasks[0].subtasks[0].estimatedMinutes).toBe(45);
  expect(screen.getByText(/45 Min. geschätzt/)).toBeInTheDocument();
 });
 it('shows unscheduled tasks and enables date assignment without changing their deadline',async()=>{
  const data={...emptyData(),tasks:[task('Ungeplant',{
   scheduledDate:null,estimatedMinutes:30,deadlineDate:addDays(monday(),21)
  })]};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Wochenplanung'}));
  const unscheduled=screen.getByText('Ohne Arbeitstag').closest('section')!;
  fireEvent.change(within(unscheduled).getByLabelText('Ungeplant Arbeitstag'),{target:{value:addDays(monday(),1)}});
  await waitFor(()=>expect(stored().tasks[0].scheduledDate).toBe(addDays(monday(),1)));
  expect(stored().tasks[0].deadlineDate).toBe(addDays(monday(),21));
 });
});
