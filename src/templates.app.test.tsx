import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { STORAGE_KEY } from './repository';

describe('Vorlagen und Checklisten im Alltag',()=>{
 beforeEach(()=>{localStorage.clear();location.hash='#templates';});

 it('erstellt aus einer Beispielvorlage eine Aufgabe, hakt Schritte ab und erzeugt weitere unabhängige Kopien',async()=>{
  const user=userEvent.setup();
  render(<App/>);
  await user.click(screen.getByRole('button',{name:/Beispiel „Klassenarbeit vorbereiten“/}));
  const templateEditor=screen.getByRole('dialog');
  expect(within(templateEditor).getByLabelText('Name der Vorlage')).toHaveValue('Klassenarbeit vorbereiten');
  expect(within(templateEditor).getByLabelText('Vorlagenschritt 3')).toHaveValue('Erwartungshorizont erstellen');
  await user.click(within(templateEditor).getByRole('button',{name:'Vorlage speichern'}));

  await waitFor(()=>expect(screen.getByRole('button',{name:'Aufgabe erstellen'})).toBeInTheDocument());
  await user.click(screen.getByRole('button',{name:'Aufgabe erstellen'}));
  const taskEditor=screen.getByRole('dialog');
  const title=within(taskEditor).getByLabelText('Titel');
  await user.clear(title);await user.type(title,'KA Mathematik 7 vorbereiten');
  fireEvent.change(within(taskEditor).getByLabelText('Deadline'),{target:{value:'2026-12-11'}});
  expect(within(taskEditor).getByLabelText('Unteraufgabe 3')).toHaveValue('Erwartungshorizont erstellen');
  await user.click(within(taskEditor).getByRole('button',{name:'Speichern'}));

  await waitFor(()=>expect(screen.getByText('KA Mathematik 7 vorbereiten')).toBeInTheDocument());
  await user.click(screen.getByRole('button',{name:/Unteraufgaben für „KA Mathematik 7 vorbereiten“ anzeigen/}));
  await user.click(screen.getByRole('checkbox',{name:'Themen und Kompetenzen festlegen'}));
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(saved.schemaVersion).toBe(3);
  expect(saved.templates).toHaveLength(1);
  expect(saved.tasks).toHaveLength(1);
  expect(saved.tasks[0].subtasks).toHaveLength(6);
  expect(saved.tasks[0].subtasks[0].completedAt).not.toBeNull();

  await user.click(screen.getByRole('button',{name:'Aus Vorlage erstellen'}));
  await user.click(screen.getByRole('button',{name:/Klassenarbeit vorbereiten · 6 Schritte/}));
  await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Speichern'}));
  const second=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(second.tasks).toHaveLength(2);
  expect(second.tasks[0].subtasks[0].completedAt).not.toBeNull();
  expect(second.tasks[1].subtasks.every((step:{completedAt:string|null})=>step.completedAt===null)).toBe(true);
  expect(new Set([...second.tasks[0].subtasks,...second.tasks[1].subtasks].map((step:{id:string})=>step.id)).size).toBe(12);
  expect(second.templates[0].subtaskTitles).toHaveLength(6);
 });

 it('lässt Aufgaben als Vorlagen speichern ohne eine vorhandene Aufgabe zu ersetzen',async()=>{
  location.hash='#inbox';
  const user=userEvent.setup();render(<App/>);
  await user.keyboard('q');
  await user.type(screen.getByLabelText('Aufgabe schnell erfassen'),'Klassenfahrt organisieren{Enter}');
  await user.keyboard('{Escape}');
  await user.click(screen.getByText('Klassenfahrt organisieren'));
  const editor=screen.getByRole('dialog');
  await user.type(within(editor).getByLabelText('Neue Unteraufgabe'),'Jugendherberge anfragen{Enter}');
  await user.click(within(editor).getByRole('button',{name:/Als Vorlage/}));
  const templateEditor=screen.getByRole('dialog');
  expect(within(templateEditor).getByLabelText('Vorlagenschritt 1')).toHaveValue('Jugendherberge anfragen');
  await user.click(within(templateEditor).getByRole('button',{name:'Vorlage speichern'}));
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(saved.tasks).toHaveLength(1);
  expect(saved.tasks[0].subtasks).toEqual([]); // Changes were saved only to the template.
  expect(saved.templates).toHaveLength(1);
  expect(saved.templates[0].name).toBe('Klassenfahrt organisieren');
 });

 it('löscht nur die Vorlage und lässt bereits erzeugte Aufgaben erhalten',async()=>{
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:/Beispiel/}));
  await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Vorlage speichern'}));
  await user.click(screen.getByRole('button',{name:'Aufgabe erstellen'}));
  await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Speichern'}));
  await waitFor(()=>expect(screen.getByText('Klassenarbeit vorbereiten')).toBeInTheDocument());
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  const spy=window.confirm;
  window.confirm=()=>true;
  try{
   await user.click(screen.getByRole('button',{name:/Vorlage „Klassenarbeit vorbereiten“ löschen/}));
   const state=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
   expect(state.templates).toHaveLength(0);
   expect(state.tasks).toHaveLength(1);
   expect(state.tasks[0].subtasks).toHaveLength(6);
  }finally{window.confirm=spy;}
 });
});
