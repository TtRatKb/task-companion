import {beforeEach,describe,expect,it} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {emptyData,type TaskTemplate} from './types';
import {STORAGE_KEY} from './repository';

const template:TaskTemplate={
 id:'school-1',name:'Klassenarbeit vorbereiten',description:'ClassTime-Checkliste',
 steps:['Aufgaben erstellen – 2 Wochen vorher','ClassTime einrichten – {Deadline} - 3 Tage','Material kopieren – am Vortag'],
 createdAt:'x',updatedAt:'x'
};
const seed=()=>({...emptyData(),templates:[template]});

describe('Rückwärtsplanung im Aufgabeneditor',()=>{
 beforeEach(()=>{localStorage.clear();location.hash=''});
 it('plant von der konkreten Deadline rückwärts und überträgt Termine in gespeicherte Schritte',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify(seed()));
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  await user.click(screen.getByRole('button',{name:'Aufgabe erstellen'}));
  const editor=screen.getByRole('dialog',{name:'Aufgabe hinzufügen'});
  expect(within(editor).getByLabelText('Unteraufgabe 1')).toHaveValue('Aufgaben erstellen');
  expect(within(editor).getByLabelText('Unteraufgabe 2')).toHaveValue('ClassTime einrichten');
  expect(within(editor).getByLabelText('Termin Unteraufgabe 1')).toHaveValue('');
  fireEvent.change(within(editor).getByLabelText('Deadline'),{target:{value:'2026-11-27'}});
  expect(within(editor).getByLabelText('Termin Unteraufgabe 1')).toHaveValue('2026-11-13');
  expect(within(editor).getByLabelText('Termin Unteraufgabe 2')).toHaveValue('2026-11-24');
  expect(within(editor).getByLabelText('Termin Unteraufgabe 3')).toHaveValue('2026-11-26');
  expect(within(editor).getByText(/Spätestens am/)).toBeInTheDocument();
  await user.click(within(editor).getByRole('button',{name:'Speichern'}));
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(saved.templates[0]).toEqual(template);
  expect(saved.tasks[0].subtasks.map((s:{plannedDate:string})=>s.plannedDate))
   .toEqual(['2026-11-13','2026-11-24','2026-11-26']);
  expect(saved.tasks[0].subtasks[0].offset).toEqual({amount:2,unit:'weeks'});
  expect(saved.tasks[0].deadlineDate).toBe('2026-11-27');
 });
 it('fragt beim Verschieben einer bestehenden Deadline, ob relative Daten neu geplant werden sollen',async()=>{
  const stored={...seed(),tasks:[{
   id:'a',title:'Klassenarbeit vorbereiten',description:'',projectId:null,priority:2,
   scheduledDate:null,deadlineDate:'2026-11-27',recurrence:null,completedAt:null,createdAt:'x',updatedAt:'x',
   subtasks:[{id:'s1',title:'Aufgaben erstellen',completed:false,plannedDate:'2026-11-13',offset:{amount:2,unit:'weeks'}},
    {id:'s2',title:'Individuell',completed:false,plannedDate:'2026-11-18'}]
  }]};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(stored));
  const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('Klassenarbeit vorbereiten')).toBeInTheDocument());
  await user.click(screen.getByText('Klassenarbeit vorbereiten').closest('button')!);
  const editor=screen.getByRole('dialog');
  fireEvent.change(within(editor).getByLabelText('Deadline'),{target:{value:'2026-12-04'}});
  expect(within(editor).getByRole('button',{name:'Speichern'})).toBeDisabled();
  expect(within(editor).getByText(/Unteraufgaben neu planen/)).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).tasks[0].deadlineDate).toBe('2026-11-27');
  await user.click(within(editor).getByRole('button',{name:'Neue Termine übernehmen'}));
  expect(within(editor).getByLabelText('Termin Unteraufgabe 1')).toHaveValue('2026-11-20');
  expect(within(editor).getByLabelText('Termin Unteraufgabe 2')).toHaveValue('2026-11-18');
  await user.click(within(editor).getByRole('button',{name:'Speichern'}));
  const data=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(data.tasks[0].deadlineDate).toBe('2026-12-04');
  expect(data.tasks[0].subtasks[0].plannedDate).toBe('2026-11-20');
  expect(data.tasks[0].subtasks[1].plannedDate).toBe('2026-11-18');
 });
 it('erlaubt, alte Termine bei verschobener Deadline ausdrücklich beizubehalten',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...seed(),tasks:[{
    id:'a',title:'ClassTime',description:'',projectId:null,priority:4,scheduledDate:null,
    deadlineDate:'2026-11-27',recurrence:null,completedAt:null,createdAt:'x',updatedAt:'x',
    subtasks:[{id:'s1',title:'Prüfen',completed:false,plannedDate:'2026-11-24',offset:{amount:3,unit:'days'}}]
  }]}));
  const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('ClassTime')).toBeInTheDocument());
  await user.click(screen.getByText('ClassTime').closest('button')!);
  const dialog=screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Deadline'),{target:{value:'2026-12-04'}});
  await user.click(within(dialog).getByRole('button',{name:'Bisherige Termine behalten'}));
  await user.click(within(dialog).getByRole('button',{name:'Speichern'}));
  const data=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(data.tasks[0].subtasks[0].plannedDate).toBe('2026-11-24');
 });
 it('löst eine individuelle manuelle Terminwahl von der relativen Kopplung',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...seed(),tasks:[{
    id:'a',title:'ClassTime',description:'',projectId:null,priority:4,scheduledDate:null,
    deadlineDate:'2026-11-27',recurrence:null,completedAt:null,createdAt:'x',updatedAt:'x',
    subtasks:[{id:'s1',title:'Prüfen',completed:false,plannedDate:'2026-11-24',offset:{amount:3,unit:'days'}}]
  }]}));
  const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('ClassTime')).toBeInTheDocument());
  await user.click(screen.getByText('ClassTime').closest('button')!);
  const dialog=screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Termin Unteraufgabe 1'),{target:{value:'2026-11-19'}});
  await user.click(within(dialog).getByRole('button',{name:'Speichern'}));
  const data=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(data.tasks[0].subtasks[0].plannedDate).toBe('2026-11-19');
  expect(data.tasks[0].subtasks[0].offset).toBeUndefined();
 });
});
