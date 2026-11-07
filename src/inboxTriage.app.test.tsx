import {beforeEach,describe,expect,it} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {todayLocal} from './date';
import {emptyData,type Task} from './types';
import {STORAGE_KEY} from './repository';

const date='2026-11-07T08:00:00Z';
function task(id:string,fields:Partial<Task>={}):Task{
 return {id,title:id,description:'',projectId:null,priority:4,
  scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,
  createdAt:date,updatedAt:date,subtasks:[{id:id+'-step',title:'Checkliste',completed:false}],...fields};
}
const initial=()=>({...emptyData(),
 projects:[{id:'school',name:'Schule',color:'#555555',createdAt:date}],
 tasks:[task('Erste Aufgabe'),task('Zweite Aufgabe'),task('Dritte Aufgabe')]});
const saved=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);
async function start(){
 const user=userEvent.setup();
 render(<App/>);
 await waitFor(()=>expect(screen.getByText('Erste Aufgabe')).toBeInTheDocument());
 await user.click(screen.getByRole('button',{name:/Eingang aufräumen/}));
 return user;
}

describe('Inbox-Turbo in der Anwendung',()=>{
 beforeEach(()=>{localStorage.clear();location.hash=''});
 it('sortiert mehrere Aufgaben nacheinander ohne andere Aufgaben zu überschreiben',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify(initial()));
  const user=await start();
  let dialog=screen.getByRole('dialog',{name:'Erste Aufgabe'});
  expect(within(dialog).getByText(/1 von 3/)).toBeInTheDocument();
  await user.selectOptions(within(dialog).getByLabelText('Projekt wählen'),'school');
  await user.click(within(dialog).getByRole('button',{name:'Priorität P1'}));
  fireEvent.change(within(dialog).getByLabelText('Arbeitstag wählen'),{target:{value:'2026-11-12'}});
  await user.click(within(dialog).getByRole('button',{name:/Speichern & nächste/}));
  dialog=screen.getByRole('dialog',{name:'Zweite Aufgabe'});
  await user.click(within(dialog).getByRole('button',{name:/Überspringen/}));
  dialog=screen.getByRole('dialog',{name:'Dritte Aufgabe'});
  await user.click(within(dialog).getByRole('button',{name:/Weiter ohne Änderung/}));
  expect(screen.getByRole('dialog',{name:/Durchlauf abgeschlossen/})).toBeInTheDocument();
  expect(within(screen.getByRole('dialog',{name:/Durchlauf abgeschlossen/})).getByText('2',{selector:'strong'})).toBeInTheDocument();
  expect(saved().tasks[0]).toMatchObject({projectId:'school',priority:1,scheduledDate:'2026-11-12'});
  expect(saved().tasks[0].subtasks).toEqual(initial().tasks[0].subtasks);
  expect(saved().tasks[1]).toEqual(initial().tasks[1]);
  expect(saved().tasks[2]).toEqual(initial().tasks[2]);
  await user.click(screen.getByRole('button',{name:/Zurück zum Eingang/}));
  // A and only A has left Inbox; saved-but-unassigned items are never hidden.
  expect(screen.queryByText('Erste Aufgabe')).not.toBeInTheDocument();
  expect(screen.getByText('Zweite Aufgabe')).toBeInTheDocument();
  expect(screen.getByText('Dritte Aufgabe')).toBeInTheDocument();
 });
 it('allows keyboard-first priority, day shortcuts, skip and Enter save',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify(initial()));
  const user=await start();
  let dialog=screen.getByRole('dialog',{name:'Erste Aufgabe'});
  await user.keyboard('2');
  expect(within(dialog).getByRole('button',{name:'Priorität P2'})).toHaveAttribute('aria-pressed','true');
  await user.keyboard('h');
  expect(within(dialog).getByLabelText('Arbeitstag wählen')).toHaveValue(todayLocal());
  await user.keyboard('{Enter}');
  dialog=screen.getByRole('dialog',{name:'Zweite Aufgabe'});
  expect(saved().tasks[0].priority).toBe(2);
  expect(saved().tasks[0].scheduledDate).toBe(todayLocal());
  await user.keyboard('s');
  dialog=screen.getByRole('dialog',{name:'Dritte Aufgabe'});
  await user.keyboard('0');
  expect(within(dialog).getByLabelText('Arbeitstag wählen')).toHaveValue('');
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(saved().tasks[1].scheduledDate).toBeNull();
  expect(saved().tasks[2].scheduledDate).toBeNull();
 });
 it('never saves unfinished changes when closed',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify(initial()));
  const user=await start();
  const dialog=screen.getByRole('dialog',{name:'Erste Aufgabe'});
  await user.click(within(dialog).getByRole('button',{name:'Priorität P1'}));
  fireEvent.change(within(dialog).getByLabelText('Deadline wählen'),{target:{value:'2026-11-30'}});
  await user.click(within(dialog).getByRole('button',{name:/Schließen/}));
  expect(saved().tasks).toEqual(initial().tasks);
  expect(screen.getByText('Erste Aufgabe')).toBeInTheDocument();
 });
 it('never captures shortcut letters while a form control is receiving input',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify(initial()));
  const user=await start();
  const dialog=screen.getByRole('dialog',{name:'Erste Aufgabe'});
  const input=within(dialog).getByLabelText('Arbeitstag wählen');
  input.focus();
  await user.keyboard('s');
  expect(screen.getByRole('dialog',{name:'Erste Aufgabe'})).toBeInTheDocument();
  expect(saved().tasks[0].scheduledDate).toBeNull();
 });
 it('starts with an empty screen and cannot erase previously completed tasks',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),
   tasks:[task('Bereits fertig',{completedAt:date})]}));
  render(<App/>);
  await waitFor(()=>expect(screen.getByRole('button',{name:/Eingang aufräumen/})).toBeDisabled());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(saved().tasks).toHaveLength(1);
 });
});
