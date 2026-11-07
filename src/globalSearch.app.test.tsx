import {beforeEach,describe,expect,it} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {STORAGE_KEY} from './repository';
import {emptyData,type Task,type TaskTemplate} from './types';

const stamp='2026-11-07T08:00:00Z';
const task=(id:string,changes:Partial<Task>={}):Task=>({
 id,title:id,description:'',projectId:null,priority:3,
 scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,
 createdAt:stamp,updatedAt:stamp,...changes
});
const template:TaskTemplate={id:'tpl',name:'Klassenarbeit {Fach}',description:'ClassTime-Vorlage',
 steps:['Aufgaben entwickeln – 2 Wochen vorher','Erwartungshorizont erstellen'],
 createdAt:stamp,updatedAt:stamp};
function seed(){
 const data={...emptyData(),projects:[{id:'school',name:'Mathe 7b',color:'#554433',createdAt:stamp}],
 tasks:[
  task('class',{title:'Klassenarbeit vorbereiten',projectId:'school',priority:1,description:'Bruchrechnung',
   subtasks:[{id:'step1',title:'ClassTime einrichten',completed:false,plannedDate:'2026-11-13'},
    {id:'step2',title:'Material drucken',completed:true,plannedDate:'2026-11-26'}]}),
  task('note',{title:'Elternbrief verschicken',priority:3}),
  task('past',{title:'Alte Prüfung',completedAt:stamp,priority:2,description:'ClassTime'})
 ],templates:[template]};
 localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
 return data;
}
const stored=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);
async function openSearch(user:ReturnType<typeof userEvent.setup>){
 await user.click(screen.getByRole('button',{name:'Suche'}));
 const input=screen.getByRole('searchbox',{name:'Aufgaben und Vorlagen suchen'});
 await waitFor(()=>expect(input).toHaveFocus());
 return input;
}

describe('Globale Suche in Task Companion',()=>{
 beforeEach(()=>{localStorage.clear();location.hash=''});
 it('opens via slash, searches nested steps, and opens the parent task without changing data',async()=>{
  const data=seed();const user=userEvent.setup();render(<App/>);
  await user.keyboard('/');
  const input=screen.getByRole('searchbox',{name:'Aufgaben und Vorlagen suchen'});
  await waitFor(()=>expect(input).toHaveFocus());
  await user.type(input,'ClassTime');
  expect(screen.getByRole('button',{name:'Aufgabe „Klassenarbeit vorbereiten“ bearbeiten'})).toBeInTheDocument();
  expect(screen.getByText('ClassTime einrichten')).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Vorlage „Klassenarbeit {Fach}“ bearbeiten'})).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Aufgabe „Klassenarbeit vorbereiten“ bearbeiten'}));
  const editor=screen.getByRole('dialog',{name:'Aufgabe bearbeiten'});
  expect(within(editor).getByLabelText('Unteraufgabe 1')).toHaveValue('ClassTime einrichten');
  await user.click(within(editor).getByRole('button',{name:'Abbrechen'}));
  expect(stored()).toEqual(data);
 });
 it('supports Cmd/Ctrl+K and filters completed tasks separately from open tasks and templates',async()=>{
  seed();render(<App/>);
  fireEvent.keyDown(document,{key:'k',ctrlKey:true});
  const input=screen.getByRole('searchbox',{name:'Aufgaben und Vorlagen suchen'});
  await waitFor(()=>expect(input).toHaveFocus());
  const user=userEvent.setup();
  await user.type(input,'ClassTime');
  expect(screen.queryByRole('button',{name:'Aufgabe „Alte Prüfung“ bearbeiten'})).not.toBeInTheDocument();
  await user.selectOptions(screen.getByRole('combobox',{name:'Erledigungsstatus filtern'}),'done');
  expect(screen.getByRole('button',{name:'Aufgabe „Alte Prüfung“ bearbeiten'})).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Vorlage „Klassenarbeit {Fach}“ bearbeiten'})).not.toBeInTheDocument();
  await user.selectOptions(screen.getByRole('combobox',{name:'Erledigungsstatus filtern'}),'all');
  expect(screen.getByRole('button',{name:'Vorlage „Klassenarbeit {Fach}“ bearbeiten'})).toBeInTheDocument();
 });
 it('combines project and priority filters, resets them without editing records',async()=>{
  const data=seed();const user=userEvent.setup();render(<App/>);
  const input=await openSearch(user);
  await user.selectOptions(screen.getByRole('combobox',{name:'Projekt filtern'}),'school');
  await user.selectOptions(screen.getByRole('combobox',{name:'Priorität filtern'}),'1');
  expect(screen.getByRole('button',{name:'Aufgabe „Klassenarbeit vorbereiten“ bearbeiten'})).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Aufgabe „Elternbrief verschicken“ bearbeiten'})).not.toBeInTheDocument();
  await user.type(input,'unbekannter Begriff');
  expect(screen.getByText('Keine passenden Einträge')).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Alle Filter zurücksetzen'}));
  expect(screen.getByRole('button',{name:'Aufgabe „Elternbrief verschicken“ bearbeiten'})).toBeInTheDocument();
  expect(stored()).toEqual(data);
 });
 it('opens a matching template directly in the full visual template editor',async()=>{
  seed();const user=userEvent.setup();render(<App/>);
  const input=await openSearch(user);
  await user.type(input,'Erwartungshorizont');
  expect(screen.getByText('Erwartungshorizont erstellen')).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Vorlage „Klassenarbeit {Fach}“ bearbeiten'}));
  const dialog=screen.getByRole('dialog',{name:'Vorlage bearbeiten'});
  expect(within(dialog).getByLabelText('Unteraufgabe 2')).toHaveValue('Erwartungshorizont erstellen');
  await user.click(within(dialog).getByRole('button',{name:/Vorlage speichern/}));
  expect(stored().templates[0].id).toBe('tpl');
  expect(stored().templates[0].steps).toEqual(template.steps);
 });
 it('does not intercept typing slash while capturing a task or within an editor',async()=>{
  seed();const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Aufgabe'}));
  const quick=screen.getByRole('textbox');
  quick.focus();
  await user.keyboard('Mathe / Religion');
  expect(screen.queryByRole('searchbox',{name:'Aufgaben und Vorlagen suchen'})).not.toBeInTheDocument();
  expect(quick).toHaveValue('Mathe / Religion');
 });
 it('can open search again with keyboard shortcut from the search view',async()=>{
  seed();const user=userEvent.setup();render(<App/>);
  const input=await openSearch(user);
  await user.type(input,'Elternbrief');
  input.blur();
  fireEvent.keyDown(document,{key:'k',metaKey:true});
  await waitFor(()=>expect(input).toHaveFocus());
  expect(input).toHaveValue('Elternbrief');
  await user.keyboard('{Escape}');
  expect(input).toHaveValue('');
 });
});
