import {beforeEach,describe,expect,it,vi} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {emptyData,type TaskTemplate} from './types';
import {STORAGE_KEY} from './repository';

const stamp='2026-11-07T09:00:00Z';
const template:TaskTemplate={
 id:'tpl-1',name:'Klassenarbeit {Fach} vorbereiten',
 description:'Ablauf für {Klasse}',
 steps:['Aufgaben zusammenstellen – 2 Wochen vorher','ClassTime vorbereiten – {Deadline} - 3 Tage'],
 createdAt:stamp,updatedAt:stamp
};
const stored=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)!);
const seed=(templates:TaskTemplate[]=[])=>
 localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),templates}));

describe('Intuitiver Vorlageneditor und kontextuelle Hilfe',()=>{
 beforeEach(()=>{localStorage.clear();location.hash='';vi.restoreAllMocks()});
 const openNew=async()=>{
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  await user.click(screen.getByRole('button',{name:'Neue Vorlage'}));
  return user;
 };
 it('erstellt eine visuelle Hauptaufgabe und einzelne Unteraufgaben, inkl. Enter und Backspace',async()=>{
  const user=await openNew();
  const dialog=screen.getByRole('dialog',{name:'Neue Vorlage erstellen'});
  expect(within(dialog).getByRole('button',{name:'Hauptaufgabe als Vorschau abhaken'})).toBeInTheDocument();
  expect(within(dialog).getByRole('button',{name:'Unteraufgabe 1 als Vorschau abhaken'})).toBeInTheDocument();
  await user.type(within(dialog).getByLabelText('Vorlagenname'),'Klassenarbeit');
  const row1=within(dialog).getByLabelText('Unteraufgabe 1');
  await user.type(row1,'Aufgaben auswählen{Enter}');
  await waitFor(()=>expect(within(dialog).getByLabelText('Unteraufgabe 2')).toBeInTheDocument());
  await user.type(within(dialog).getByLabelText('Unteraufgabe 2'),'Erwartungshorizont{Enter}');
  await waitFor(()=>expect(within(dialog).getByLabelText('Unteraufgabe 3')).toBeInTheDocument());
  const empty=within(dialog).getByLabelText('Unteraufgabe 3');
  fireEvent.keyDown(empty,{key:'Backspace',code:'Backspace'});
  expect(within(dialog).queryByLabelText('Unteraufgabe 3')).not.toBeInTheDocument();
  await user.click(within(dialog).getByRole('button',{name:'Unteraufgabe 1 als Vorschau abhaken'}));
  expect(within(dialog).getByRole('button',{name:'Unteraufgabe 1 als Vorschau abhaken'})).toHaveAttribute('aria-pressed','true');
  await user.click(within(dialog).getByRole('button',{name:/Vorlage speichern/}));
  await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(stored().templates).toHaveLength(1);
  expect(stored().templates[0].steps).toEqual(['Aufgaben auswählen','Erwartungshorizont']);
  expect(stored().templates[0]).not.toHaveProperty('checked');
  await user.click(screen.getByRole('button',{name:'Aufgabe erstellen'}));
  const taskDialog=screen.getByRole('dialog',{name:'Aufgabe hinzufügen'});
  expect(within(taskDialog).getByLabelText('Unteraufgabe 1 erledigt')).not.toBeChecked();
 });
 it('fügt Platzhalter und relative Zeitangaben per anklickbarer Hilfe am Cursor ein',async()=>{
  const user=await openNew();
  const dialog=screen.getByRole('dialog',{name:'Neue Vorlage erstellen'});
  const title=within(dialog).getByLabelText('Vorlagenname');
  await user.type(title,'Klassenarbeit ');
  await user.click(within(dialog).getByRole('button',{name:'{Fach}'}));
  await waitFor(()=>expect(title).toHaveValue('Klassenarbeit {Fach}'));
  const step=within(dialog).getByLabelText('Unteraufgabe 1');
  await user.type(step,'ClassTime einrichten');
  await user.click(within(dialog).getByRole('button',{name:'2 Wochen vorher'}));
  await waitFor(()=>expect(step).toHaveValue('ClassTime einrichten – 2 Wochen vorher'));
  expect(within(dialog).getByText(/Zeitpunkt:/)).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button',{name:/Vorlage speichern/}));
  expect(stored().templates[0].name).toBe('Klassenarbeit {Fach}');
  expect(stored().templates[0].steps).toEqual(['ClassTime einrichten – 2 Wochen vorher']);
 });
 it('bearbeitet bestehende Vorlagen ohne die Reihenfolge oder Relativtermine zu verlieren',async()=>{
  seed([template]);
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  await user.click(screen.getByRole('button',{name:'Bearbeiten'}));
  const dialog=screen.getByRole('dialog',{name:'Vorlage bearbeiten'});
  expect(within(dialog).getByLabelText('Vorlagenname')).toHaveValue(template.name);
  expect(within(dialog).getByLabelText('Unteraufgabe 1')).toHaveValue(template.steps[0]);
  expect(within(dialog).getByLabelText('Unteraufgabe 2')).toHaveValue(template.steps[1]);
  expect(within(dialog).getAllByText(/Zeitpunkt:/)).toHaveLength(2);
  await user.type(within(dialog).getByLabelText('Unteraufgabe 2'),' ergänzt');
  await user.click(within(dialog).getByRole('button',{name:/Vorlage speichern/}));
  expect(stored().templates).toHaveLength(1);
  expect(stored().templates[0].id).toBe(template.id);
  expect(stored().templates[0].steps[0]).toBe(template.steps[0]);
  expect(stored().templates[0].steps[1]).toBe(template.steps[1]+' ergänzt');
 });
 it('verhindert den unbeabsichtigten Verlust geänderter Vorlagen',async()=>{
  seed();
  const user=await openNew();
  const dialog=screen.getByRole('dialog');
  await user.type(within(dialog).getByLabelText('Vorlagenname'),'Klassenarbeit');
  vi.spyOn(window,'confirm').mockReturnValue(false);
  await user.click(within(dialog).getByRole('button',{name:'Schließen'}));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(stored().templates).toEqual([]);
  vi.mocked(window.confirm).mockReturnValue(true);
  await user.click(within(dialog).getByRole('button',{name:'Schließen'}));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 });
 it('zeigt Termin-Hilfe im normalen Aufgabeneditor und übernimmt Beispiele in Unteraufgaben',async()=>{
  seed();
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Aufgabe'}));
  await user.click(screen.getByRole('button',{name:'Weitere Einstellungen'}));
  const dialog=screen.getByRole('dialog',{name:'Aufgabe hinzufügen'});
  expect(within(dialog).getByLabelText('Hilfe für Aufgaben')).toBeInTheDocument();
  await user.type(within(dialog).getByLabelText('Titel'),'Klassenarbeit vorbereiten');
  await user.type(within(dialog).getByLabelText('Neue Unteraufgabe'),'ClassTime eintragen');
  await user.click(within(dialog).getByRole('button',{name:'2 Wochen vorher'}));
  await waitFor(()=>expect(within(dialog).getByLabelText('Neue Unteraufgabe')).toHaveValue('ClassTime eintragen – 2 Wochen vorher'));
  await user.keyboard('{Enter}');
  await waitFor(()=>expect(within(dialog).getByLabelText('Unteraufgabe 1')).toHaveValue('ClassTime eintragen'));
  fireEvent.change(within(dialog).getByLabelText('Deadline'),{target:{value:'2026-11-27'}});
  await user.click(within(dialog).getByRole('button',{name:'Speichern'}));
  expect(stored().tasks[0].subtasks[0].offset).toEqual({amount:2,unit:'weeks'});
  expect(stored().tasks[0].subtasks[0].plannedDate).toBe('2026-11-13');
 });
 it('behält Hilfe für Vorlagen innerhalb des geöffneten Editors und zeigt den Klassenarbeitsablauf',async()=>{
  await openNew();
  const dialog=screen.getByRole('dialog',{name:'Neue Vorlage erstellen'});
  const help=within(dialog).getByLabelText('Hilfe für Vorlagen');
  expect(within(help).getByText(/Beispiel: Klassenarbeit/)).toBeInTheDocument();
  expect(within(help).getByText(/Nur Klasse abfragen/)).toBeInTheDocument();
  expect(within(help).getAllByText(/Zeitanker/).length).toBeGreaterThan(0);
  expect(within(dialog).getByLabelText('Unteraufgabe 1')).toBeInTheDocument();
 });
 it('fragt die Deadline beim Verwenden einer Klassenarbeitsvorlage ab und plant ihre Schritte relativ dazu',async()=>{
  seed([template]);
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  await user.click(screen.getByRole('button',{name:'Aufgabe erstellen'}));
  const useDialog=screen.getByRole('dialog',{name:'Vorlage ausfüllen'});
  await user.type(within(useDialog).getByLabelText('Fach'),'Mathematik');
  await user.type(within(useDialog).getByLabelText('Klasse'),'7b');
  fireEvent.change(within(useDialog).getByLabelText('Deadline beim Verwenden der Vorlage'),{target:{value:'2026-11-27'}});
  await user.click(within(useDialog).getByRole('button',{name:'Weiter zum Aufgabeneditor'}));
  const editor=screen.getByRole('dialog',{name:'Aufgabe hinzufügen'});
  expect(within(editor).getByLabelText('Titel')).toHaveValue('Klassenarbeit Mathematik vorbereiten');
  expect(within(editor).getByLabelText('Deadline')).toHaveValue('2026-11-27');
  expect(within(editor).getByLabelText('Termin Unteraufgabe 1')).toHaveValue('2026-11-13');
  expect(within(editor).getByLabelText('Termin Unteraufgabe 2')).toHaveValue('2026-11-24');
 });

 it('verwendet bei Klassenarbeiten den Ereignistag statt einer falschen Deadline und legt Nachbereitung danach',async()=>{
  const exam:TaskTemplate={
   id:'exam-after',name:'Klassenarbeit {Klasse}',description:'',
   steps:['Papierarbeit drucken 3 Tage vorher','Nachschreibtermin entscheiden am {Deadline}',
    'Über Nachschreibarbeit entscheiden 2 Tage danach',
    'Klassenarbeiten bewerten bis 2 Wochen nach {Deadline}',
    'Kompetenzraster ausdrucken bis 2 Wochen nach {Deadline}',
    'Klassenarbeiten zurückgeben 2 Wochen nach {Deadline}'],
   createdAt:stamp,updatedAt:stamp
  };
  seed([exam]);
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  await user.click(screen.getByRole('button',{name:'Aufgabe erstellen'}));
  const useDialog=screen.getByRole('dialog',{name:'Vorlage ausfüllen'});
  await user.type(within(useDialog).getByLabelText('Klasse'),'7b');
  fireEvent.change(within(useDialog).getByLabelText('Ereignisdatum beim Verwenden der Vorlage'),{target:{value:'2026-11-27'}});
  await user.click(within(useDialog).getByRole('button',{name:'Weiter zum Aufgabeneditor'}));
  const editor=screen.getByRole('dialog',{name:'Aufgabe hinzufügen'});
  expect(within(editor).getByLabelText('Ereignisdatum')).toHaveValue('2026-11-27');
  expect(within(editor).getByLabelText('Deadline')).toHaveValue('');
  expect(within(editor).getByLabelText('Termin Unteraufgabe 1')).toHaveValue('2026-11-24');
  expect(within(editor).getByLabelText('Termin Unteraufgabe 2')).toHaveValue('2026-11-27');
  expect(within(editor).getByLabelText('Termin Unteraufgabe 3')).toHaveValue('2026-11-29');
  expect(within(editor).getByLabelText('Termin Unteraufgabe 4')).toHaveValue('2026-12-11');
  await user.click(within(editor).getByRole('button',{name:'Speichern'}));
  const task=stored().tasks[0];
  expect(task.eventDate).toBe('2026-11-27');
  expect(task.deadlineDate).toBeNull();
  expect(task.subtasks.map((step:{plannedDate:string})=>step.plannedDate))
   .toEqual(['2026-11-24','2026-11-27','2026-11-29','2026-12-11','2026-12-11','2026-12-11']);
  expect(stored().templates[0]).toEqual(exam);
 });

});
