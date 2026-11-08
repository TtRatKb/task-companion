import {beforeEach,describe,expect,it} from 'vitest';
import {render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {addDays,todayLocal} from './date';
import {emptyData,type Task} from './types';
import {STORAGE_KEY} from './repository';

const now='2026-11-01T12:00:00.000Z';
const today=todayLocal();
const past=addDays(today,-14);
const stepDue=addDays(today,-3);
function task(id:string,changes:Partial<Task>={}):Task{
 return {id,title:id,description:'',projectId:null,priority:3,scheduledDate:null,
  deadlineDate:null,recurrence:null,completedAt:null,
  createdAt:now,updatedAt:now,...changes};
}
const saved=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);
const seed=(tasks:Task[])=>localStorage.setItem(STORAGE_KEY,JSON.stringify({
 ...emptyData(),tasks,
 projects:[{id:'school',name:'Schule',color:'#5b8def',createdAt:now}]
}));

describe('Übergeordnete Aufgaben mit Unteraufgaben sichtbar halten',()=>{
 beforeEach(()=>{localStorage.clear();location.hash=''});
 const exam=()=>task('Klassenarbeit Mathematik 7b',{projectId:'school',eventDate:past,
  subtasks:[
   {id:'a',title:'Aufgaben vorbereiten',completed:true,plannedDate:addDays(today,-20),estimatedMinutes:90},
   {id:'b',title:'Klassenarbeiten korrigieren',completed:false,plannedDate:stepDue,estimatedMinutes:180},
   {id:'c',title:'Klassenarbeiten zurückgeben',completed:false,plannedDate:addDays(today,7)}
  ]
 });
 it('zeigt die vorhandene Klassenarbeits-Hauptaufgabe trotz vergangenem Ereignistag samt 1/3 und allen Schritten',async()=>{
  seed([exam()]);
  const user=userEvent.setup();
  location.hash='#bundles';
  render(<App/>);
  const packageHeading=await screen.findByRole('heading',{name:'Deine Aufgabenpakete'});
  expect(packageHeading).toBeInTheDocument();
  const card=screen.getByRole('article',{name:'Aufgabenpaket Klassenarbeit Mathematik 7b'});
  expect(within(card).getByRole('button',{name:'Klassenarbeit Mathematik 7b'})).toBeInTheDocument();
  expect(within(card).getByRole('progressbar',{name:'Fortschritt von Klassenarbeit Mathematik 7b'}))
   .toHaveAttribute('aria-valuenow','1');
  expect(within(card).getByText('1/3')).toBeInTheDocument();
  expect(within(card).getByText('1 überfälliger Schritt')).toBeInTheDocument();
  expect(within(card).getByText('Aufgaben vorbereiten')).toBeInTheDocument();
  expect(within(card).getByText('Klassenarbeiten korrigieren')).toBeInTheDocument();
  expect(within(card).getByText('Klassenarbeiten zurückgeben')).toBeInTheDocument();
  expect(within(card).getByText('Ereignis '+new Intl.DateTimeFormat('de-DE').format(new Date(past+'T12:00:00Z'))))
   .toBeInTheDocument();
  expect(within(card).getByRole('checkbox',{name:'Aufgaben vorbereiten erledigt (Klassenarbeit Mathematik 7b)'})).toBeChecked();
  expect(within(card).getByRole('checkbox',{name:'Klassenarbeiten korrigieren erledigt (Klassenarbeit Mathematik 7b)'})).not.toBeChecked();
  expect(saved().tasks).toHaveLength(1);
  expect(saved().tasks[0].eventDate).toBe(past);
  await user.click(within(card).getByRole('button',{name:'Klassenarbeit Mathematik 7b'}));
  const editor=screen.getByRole('dialog',{name:'Aufgabe bearbeiten'});
  expect(within(editor).getByLabelText('Titel')).toHaveValue('Klassenarbeit Mathematik 7b');
  expect(within(editor).getByLabelText('Ereignisdatum')).toHaveValue(past);
 });
 it('verändert beim Abhaken eines überfälligen Schritts sofort den Fortschritt, nicht die Elternaufgabe',async()=>{
  seed([exam()]);
  const user=userEvent.setup();location.hash='#bundles';render(<App/>);
  const card=await screen.findByRole('article',{name:'Aufgabenpaket Klassenarbeit Mathematik 7b'});
  await user.click(within(card).getByRole('checkbox',{name:'Klassenarbeiten korrigieren erledigt (Klassenarbeit Mathematik 7b)'}));
  expect(within(card).getByText('2/3')).toBeInTheDocument();
  expect(within(card).queryByText('1 überfälliger Schritt')).toBeNull();
  expect(saved().tasks[0].subtasks.map((s:{completed:boolean})=>s.completed)).toEqual([true,true,false]);
  expect(saved().tasks[0].completedAt).toBeNull();
  await user.click(within(card).getByRole('checkbox',{name:'Klassenarbeiten zurückgeben erledigt (Klassenarbeit Mathematik 7b)'}));
  expect(within(card).getByText('3/3')).toBeInTheDocument();
  expect(within(card).getByRole('button',{name:'Hauptaufgabe abschließen'})).toBeInTheDocument();
  expect(saved().tasks[0].completedAt).toBeNull();
  await user.click(within(card).getByRole('button',{name:'Hauptaufgabe abschließen'}));
  await waitFor(()=>expect(screen.queryByRole('article',{name:'Aufgabenpaket Klassenarbeit Mathematik 7b'})).not.toBeInTheDocument());
  expect(saved().tasks[0].completedAt).not.toBeNull();
  await user.click(screen.getByRole('checkbox',{name:/Abgeschlossene anzeigen/}));
  const closed=screen.getByRole('article',{name:'Aufgabenpaket Klassenarbeit Mathematik 7b'});
  expect(within(closed).getByText('Hauptaufgabe abgeschlossen')).toBeInTheDocument();
 });
 it('zeigt in Heute eine Verknüpfung mit der bestehenden Hauptaufgabe und navigiert zur Gesamtübersicht',async()=>{
  seed([exam()]);
  const user=userEvent.setup();location.hash='#today';render(<App/>);
  const preview=await screen.findByRole('region',{name:'Laufende Aufgabenpakete'});
  expect(within(preview).getByText('Klassenarbeit Mathematik 7b')).toBeInTheDocument();
  expect(within(preview).getByText('1/3 erledigt')).toBeInTheDocument();
  expect(within(preview).getByText('1 Schritt überfällig')).toBeInTheDocument();
  expect(within(preview).getByRole('button',{name:'Alle 1 ansehen'})).toBeInTheDocument();
  await user.click(within(preview).getByRole('button',{name:'Alle 1 ansehen'}));
  expect(screen.getByRole('heading',{name:'Deine Aufgabenpakete'})).toBeInTheDocument();
  expect(screen.getByRole('article',{name:'Aufgabenpaket Klassenarbeit Mathematik 7b'})).toBeInTheDocument();
  expect(saved().tasks).toHaveLength(1);
 });
 it('zeigt auch Hauptaufgaben ohne Projektzuordnung, sofern sie Unteraufgaben haben',async()=>{
  seed([task('Private Vorbereitung',{subtasks:[
   {id:'p',title:'Einpacken',completed:false,plannedDate:addDays(today,2)}
  ]})]);
  location.hash='#bundles';render(<App/>);
  const card=await screen.findByRole('article',{name:'Aufgabenpaket Private Vorbereitung'});
  expect(within(card).getByText('Einpacken')).toBeInTheDocument();
  expect(saved().tasks[0].projectId).toBeNull();
 });
});
