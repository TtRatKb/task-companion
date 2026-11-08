import {beforeEach,describe,expect,it} from 'vitest';
import {render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {addDays,todayLocal} from './date';
import {emptyData,type Task} from './types';
import {STORAGE_KEY} from './repository';

const day=todayLocal();
const overdue1=addDays(day,-8),overdue2=addDays(day,-2);
function task(id:string,changes:Partial<Task>={}):Task {
 return {id,title:id,description:'',projectId:null,priority:4,
  scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,
  createdAt:'2026-11-01T08:00:00Z',updatedAt:'2026-11-01T08:00:00Z',...changes};
}
function seed(tasks:Task[]){
 localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks}));
}

describe('Offene überfällige Aufgaben immer oben',()=>{
 beforeEach(()=>{localStorage.clear();location.hash=''});
 it('pinnt alte Deadlines im Eingang, in Heute, Anstehend und Radar über den normalen Inhalt',async()=>{
  seed([
   task('Normaler Task'),
   task('Zweite alte Deadline',{deadlineDate:overdue2}),
   task('Erste alte Deadline',{deadlineDate:overdue1,priority:4}),
   task('Ereignis ohne Abgabe',{eventDate:overdue1}),
   task('Schon erledigt',{deadlineDate:overdue1,completedAt:'2026-11-01T10:00:00Z'})
  ]);
  const user=userEvent.setup();render(<App/>);
  for(const nav of ['Eingang','Heute','Anstehend','Deadline-Radar']){
   await user.click(screen.getByRole('button',{name:nav}));
   const pinned=await screen.findByRole('region',{name:'Überfällige Aufgaben und Unteraufgaben'});
   expect(pinned).toBeInTheDocument();
   expect(within(pinned).getByRole('heading',{name:/Überfällige Aufgaben/})).toBeInTheDocument();
   expect(within(pinned).getByText('Erste alte Deadline')).toBeInTheDocument();
   expect(within(pinned).getByText('Zweite alte Deadline')).toBeInTheDocument();
   const titles=Array.from(pinned.querySelectorAll('.task-row .task-content strong')).map(x=>x.textContent);
   expect(titles).toEqual(['Erste alte Deadline','Zweite alte Deadline']);
   expect(within(pinned).queryByText('Schon erledigt')).toBeNull();
   expect(within(pinned).queryByText('Ereignis ohne Abgabe')).toBeNull();
   const content=pinned.closest('.content');
   expect(content?.firstElementChild).toBe(pinned);
  }
 });
 it('pinnt auch überfällige Nachbereitungs-Schritte ohne falsche Hauptdeadline',async()=>{
  seed([task('Klassenarbeit 7b',{eventDate:overdue1,subtasks:[
   {id:'overdue',title:'Arbeiten korrigieren',completed:false,plannedDate:overdue2,estimatedMinutes:120},
   {id:'future',title:'Eltern informieren',completed:false,plannedDate:addDays(day,3)},
   {id:'done',title:'Fertig',completed:true,plannedDate:overdue1}
  ]})]);
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Heute'}));
  const pinned=await screen.findByRole('region',{name:'Überfällige Aufgaben und Unteraufgaben'});
  expect(within(pinned).getByText('Arbeiten korrigieren')).toBeInTheDocument();
  expect(within(pinned).queryByText('Eltern informieren')).toBeNull();
  expect(within(pinned).queryByText('Fertig')).toBeNull();
  expect(within(pinned).queryByRole('heading',{name:/Überfällige Aufgaben \d/})).toBeNull();
  expect(within(pinned).getByRole('heading',{name:/Überfällige Unteraufgaben/})).toBeInTheDocument();
  const content=pinned.closest('.content');
  expect(content?.firstElementChild).toBe(pinned);
 });
 it('entfernt die Deadline nach dem Abhaken sofort aus der Überfällig-Sektion',async()=>{
  seed([task('Nicht vergessen',{deadlineDate:overdue2})]);
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Heute'}));
  const pinned=await screen.findByRole('region',{name:'Überfällige Aufgaben und Unteraufgaben'});
  await user.click(within(pinned).getByRole('button',{name:'„Nicht vergessen“ abschließen'}));
  await waitFor(()=>expect(screen.queryByRole('region',{name:'Überfällige Aufgaben und Unteraufgaben'})).not.toBeInTheDocument());
 });
});
