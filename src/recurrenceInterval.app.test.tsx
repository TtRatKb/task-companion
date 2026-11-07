import {beforeEach,describe,expect,it} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {todayLocal} from './date';
import {emptyData,type Task} from './types';
import {STORAGE_KEY} from './repository';

const stamp='2026-11-01T08:00:00Z';
const sample=(changes:Partial<Task>={}):Task=>({
 id:'routine',title:'Klassenbuch kontrollieren',description:'',projectId:null,priority:3,
 scheduledDate:null,deadlineDate:null,recurrence:null,completedAt:null,
 createdAt:stamp,updatedAt:stamp,subtasks:[],...changes
});
const stored=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);

describe('Flexible Intervallwiederholung im Aufgabeneditor',()=>{
 beforeEach(()=>{localStorage.clear();location.hash=''});
 it('creates a biweekly task via German quick entry without changing its title',async()=>{
  const user=userEvent.setup();render(<App/>);
  await user.keyboard('q');
  const capture=screen.getByLabelText('Aufgabe schnell erfassen');
  await user.type(capture,'Klassenbuch prüfen alle zwei Wochen #P2{Enter}');
  expect(screen.getByText('Klassenbuch prüfen')).toBeInTheDocument();
  expect(screen.getByText('Alle 2 Wochen')).toBeInTheDocument();
  expect(stored().tasks[0]).toMatchObject({
   title:'Klassenbuch prüfen',priority:2,scheduledDate:todayLocal(),
   recurrence:{kind:'interval',every:2,unit:'weeks',anchorDate:todayLocal()}
  });
 });
 it('offers day/week/month intervals with editable cadence and next-date preview',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks:[sample()]}));
  const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('Klassenbuch kontrollieren')).toBeInTheDocument());
  await user.click(screen.getByText('Klassenbuch kontrollieren').closest('button')!);
  const dialog=screen.getByRole('dialog',{name:'Aufgabe bearbeiten'});
  await user.selectOptions(within(dialog).getByLabelText('Wiederholung'),'interval-months');
  expect(within(dialog).getByLabelText('Wiederholungsabstand')).toHaveValue(1);
  fireEvent.change(within(dialog).getByLabelText('Geplant'),{target:{value:'2026-11-15'}});
  expect(within(dialog).getByText('Jeden Monat')).toBeInTheDocument();
  expect(within(dialog).getByText(/Danach:/)).toHaveTextContent('Dez');
  await user.click(within(dialog).getByRole('button',{name:'Speichern'}));
  expect(stored().tasks[0].recurrence).toEqual({
   kind:'interval',every:1,unit:'months',anchorDate:'2026-11-15'
  });
  expect(stored().tasks[0].scheduledDate).toBe('2026-11-15');
 });
 it('retains an anchored monthly cadence when editing another property',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks:[sample({
   scheduledDate:'2026-11-30',deadlineDate:'2026-12-18',
   recurrence:{kind:'interval',every:1,unit:'months',anchorDate:'2026-10-31'},
   subtasks:[{id:'s1',title:'Vorbereiten',completed:false,
    plannedDate:'2026-12-10',offset:{amount:8,unit:'days'}}]
  })]}));
  const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('Klassenbuch kontrollieren')).toBeInTheDocument());
  await user.click(screen.getByText('Klassenbuch kontrollieren').closest('button')!);
  const dialog=screen.getByRole('dialog');
  await user.type(within(dialog).getByLabelText('Beschreibung'),'Freitags im Lehrerzimmer');
  expect(within(dialog).getByText(/Danach:/)).toHaveTextContent('Dez');
  await user.click(within(dialog).getByRole('button',{name:'Speichern'}));
  expect(stored().tasks[0].recurrence).toEqual({
   kind:'interval',every:1,unit:'months',anchorDate:'2026-10-31'
  });
  expect(stored().tasks[0].deadlineDate).toBe('2026-12-18');
  expect(stored().tasks[0].subtasks[0].plannedDate).toBe('2026-12-10');
 });
 it('reanchors deliberately when the user chooses a new starting workday',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks:[sample({
   scheduledDate:'2026-11-30',
   recurrence:{kind:'interval',every:1,unit:'months',anchorDate:'2026-10-31'}
  })]}));
  const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('Klassenbuch kontrollieren')).toBeInTheDocument());
  await user.click(screen.getByText('Klassenbuch kontrollieren').closest('button')!);
  const dialog=screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Geplant'),{target:{value:'2026-12-15'}});
  await user.click(within(dialog).getByRole('button',{name:'Speichern'}));
  expect(stored().tasks[0].recurrence).toEqual({
   kind:'interval',every:1,unit:'months',anchorDate:'2026-12-15'
  });
 });
 it('preserves existing weekday routines and allows switching back from intervals',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),tasks:[sample({
   scheduledDate:'2026-11-09',recurrence:{kind:'weekdays',weekdays:[1,3,5]}
  })]}));
  const user=userEvent.setup();render(<App/>);
  await waitFor(()=>expect(screen.getByText('Klassenbuch kontrollieren')).toBeInTheDocument());
  await user.click(screen.getByText('Klassenbuch kontrollieren').closest('button')!);
  const dialog=screen.getByRole('dialog');
  expect(within(dialog).getByLabelText('Wiederholung')).toHaveValue('custom');
  await user.selectOptions(within(dialog).getByLabelText('Wiederholung'),'interval-weeks');
  fireEvent.change(within(dialog).getByLabelText('Wiederholungsabstand'),{target:{value:'3'}});
  await user.selectOptions(within(dialog).getByLabelText('Wiederholung'),'workdays');
  await user.click(within(dialog).getByRole('button',{name:'Speichern'}));
  expect(stored().tasks[0].recurrence).toEqual({kind:'weekdays',weekdays:[1,2,3,4,5]});
 });
});
