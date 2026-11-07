import {beforeEach,describe,expect,it,vi} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {emptyData,type Task,type TaskTemplate} from './types';
import {STORAGE_KEY} from './repository';

const stamp='2026-11-07T08:00:00Z';
const task=(id:string,title:string,changes:Partial<Task>={}):Task=>({
 id,title,description:'',projectId:null,priority:2,scheduledDate:null,deadlineDate:null,
 recurrence:null,completedAt:null,createdAt:stamp,updatedAt:stamp,...changes
});
const setup=()=>{
 const data={...emptyData(),tasks:[
  task('src','Klassenarbeit',{deadlineDate:'2026-11-27',subtasks:[
   {id:'s1',title:'Aufgaben schreiben',completed:false,plannedDate:'2026-11-13',estimatedMinutes:80},
   {id:'s2',title:'ClassTime einrichten',completed:true,plannedDate:'2026-11-24',offset:{amount:3,unit:'days'},estimatedMinutes:45},
   {id:'s3',title:'Material kopieren',completed:false,plannedDate:'2026-11-26'}
  ]}),
  task('dest','Korrektur vorbereiten',{deadlineDate:'2026-12-04',subtasks:[
   {id:'d1',title:'Daten sammeln',completed:false}
  ]})
 ]};
 localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
};
const saved=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);
describe('Unteraufgaben sortieren, einklappen und verschieben',()=>{
 beforeEach(()=>{localStorage.clear();location.hash='';vi.restoreAllMocks()});
 it('collapses and reopens a long checklist without modifying cloud/JSON data',async()=>{
  setup();const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('ClassTime einrichten')).toBeInTheDocument());
  const initial=saved();
  await user.click(screen.getByRole('button',{name:'Unteraufgaben von Klassenarbeit einklappen'}));
  expect(screen.queryByText('ClassTime einrichten')).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Unteraufgaben von Klassenarbeit ausklappen'})).toHaveAttribute('aria-expanded','false');
  expect(saved()).toEqual(initial);
  await user.click(screen.getByRole('button',{name:'Unteraufgaben von Klassenarbeit ausklappen'}));
  expect(screen.getByText('ClassTime einrichten')).toBeInTheDocument();
 });
 it('moves a step to a different task with the same date, and undo restores its deadline offset',async()=>{
  setup();const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('ClassTime einrichten')).toBeInTheDocument());
  await user.click(screen.getByRole('button',{name:'„ClassTime einrichten“ aus „Klassenarbeit“ verschieben'}));
  let dialog=screen.getByRole('dialog',{name:'Unteraufgabe verschieben'});
  await user.selectOptions(within(dialog).getByLabelText('Zielaufgabe'),'dest');
  expect(within(dialog).getByText(/relative Verknüpfung lösen/)).toBeInTheDocument();
  expect(within(dialog).getByText(/Relativen Abstand übernehmen/)).toBeInTheDocument();
  expect(within(dialog).getByText(/01\. Dez/)).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button',{name:'Unteraufgabe verschieben'}));
  const moved=saved();
  expect(moved.tasks[0].subtasks.map((s:{id:string})=>s.id)).toEqual(['s1','s3']);
  expect(moved.tasks[1].subtasks[1]).toMatchObject({id:'s2',title:'ClassTime einrichten',
   plannedDate:'2026-11-24',completed:true,estimatedMinutes:45});
  expect(moved.tasks[1].subtasks[1].offset).toBeUndefined();
  await user.click(screen.getByRole('button',{name:'Rückgängig'}));
  expect(saved().tasks[0].subtasks[1]).toEqual(setupStep);
  expect(saved().tasks[1].subtasks.map((s:{id:string})=>s.id)).toEqual(['d1']);
 });
 it('uses the destination deadline only if user explicitly selects relative rescheduling',async()=>{
  setup();const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('ClassTime einrichten')).toBeInTheDocument());
  await user.click(screen.getByRole('button',{name:'„ClassTime einrichten“ aus „Klassenarbeit“ verschieben'}));
  const dialog=screen.getByRole('dialog',{name:'Unteraufgabe verschieben'});
  await user.selectOptions(within(dialog).getByLabelText('Zielaufgabe'),'dest');
  await user.click(within(dialog).getByRole('radio',{name:/Relativen Abstand übernehmen/}));
  await user.click(within(dialog).getByRole('button',{name:'Unteraufgabe verschieben'}));
  expect(saved().tasks[1].subtasks[1]).toMatchObject({id:'s2',plannedDate:'2026-12-01',
   offset:{amount:3,unit:'days'},estimatedMinutes:45,completed:true});
 });
 it('reorders subtasks in a regular task editor and preserves per-step metadata',async()=>{
  setup();const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('Klassenarbeit')).toBeInTheDocument());
  await user.click(screen.getByText('Klassenarbeit').closest('button')!);
  const editor=screen.getByRole('dialog',{name:'Aufgabe bearbeiten'});
  await user.click(within(editor).getByRole('button',{name:'Unteraufgabe 2 nach oben'}));
  expect(within(editor).getByLabelText('Unteraufgabe 1')).toHaveValue('ClassTime einrichten');
  await user.click(within(editor).getByRole('button',{name:'Speichern'}));
  const steps=saved().tasks[0].subtasks;
  expect(steps.map((s:{id:string})=>s.id)).toEqual(['s2','s1','s3']);
  expect(steps[0].offset).toEqual({amount:3,unit:'days'});
  expect(steps[0].plannedDate).toBe('2026-11-24');
  expect(steps[0].completed).toBe(true);
 });
 it('reorders template steps and persists the resulting order, not checkbox previews',async()=>{
  const tpl:TaskTemplate={id:'tpl',name:'Klassenarbeit',description:'',
   steps:['Aufgaben schreiben – 2 Wochen vorher','ClassTime – {Deadline} - 3 Tage','Kopieren'],
   createdAt:stamp,updatedAt:stamp};
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),templates:[tpl]}));
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  await user.click(screen.getByRole('button',{name:'Bearbeiten'}));
  const dialog=screen.getByRole('dialog',{name:'Vorlage bearbeiten'});
  await user.click(within(dialog).getByRole('button',{name:'Unteraufgabe 3 nach oben'}));
  expect(within(dialog).getByLabelText('Unteraufgabe 2')).toHaveValue('Kopieren');
  await user.click(within(dialog).getByRole('button',{name:/Vorlage speichern/}));
  expect(saved().templates[0].steps).toEqual([tpl.steps[0],tpl.steps[2],tpl.steps[1]]);
 });
 it('accepts drag-and-drop reorder in the template editor without changing step text',async()=>{
  const tpl:TaskTemplate={id:'tpl-drag',name:'Korrektur',description:'',
   steps:['Schritt A','Schritt B','Schritt C'],createdAt:stamp,updatedAt:stamp};
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),templates:[tpl]}));
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  await user.click(screen.getByRole('button',{name:'Bearbeiten'}));
  const dialog=screen.getByRole('dialog',{name:'Vorlage bearbeiten'});
  const dataTransfer={effectAllowed:'none',dropEffect:'none',setData:vi.fn(),getData:vi.fn()};
  const source=within(dialog).getByRole('button',{name:'Unteraufgabe 3 ziehen'});
  const target=within(dialog).getByLabelText('Unteraufgabe 1').closest('.template-visual-row')!;
  fireEvent.dragStart(source,{dataTransfer});
  fireEvent.dragOver(target,{dataTransfer});
  fireEvent.drop(target,{dataTransfer});
  fireEvent.dragEnd(source,{dataTransfer});
  expect(within(dialog).getByLabelText('Unteraufgabe 1')).toHaveValue('Schritt C');
  await user.click(within(dialog).getByRole('button',{name:/Vorlage speichern/}));
  expect(saved().templates[0].steps).toEqual(['Schritt C','Schritt A','Schritt B']);
 });

 it('saves draft changes first when transferring from an open task editor',async()=>{
  setup();const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('Klassenarbeit')).toBeInTheDocument());
  await user.click(screen.getByText('Klassenarbeit').closest('button')!);
  const editor=screen.getByRole('dialog',{name:'Aufgabe bearbeiten'});
  await user.type(within(editor).getByLabelText('Beschreibung'),'Mit ClassTime');
  await user.click(within(editor).getByRole('button',{name:'Unteraufgabe 2 speichern und in andere Aufgabe verschieben'}));
  const dialog=screen.getByRole('dialog',{name:'Unteraufgabe verschieben'});
  expect(saved().tasks[0].description).toBe('Mit ClassTime');
  await user.selectOptions(within(dialog).getByLabelText('Zielaufgabe'),'dest');
  await user.click(within(dialog).getByRole('button',{name:'Unteraufgabe verschieben'}));
  expect(saved().tasks[0].description).toBe('Mit ClassTime');
  expect(saved().tasks[1].subtasks.map((s:{id:string})=>s.id)).toContain('s2');
 });
});

const setupStep={id:'s2',title:'ClassTime einrichten',completed:true,plannedDate:'2026-11-24',
 offset:{amount:3,unit:'days'},estimatedMinutes:45};
