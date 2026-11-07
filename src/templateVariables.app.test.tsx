import {beforeEach,describe,expect,it} from 'vitest';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {emptyData,type TaskTemplate} from './types';
import {STORAGE_KEY} from './repository';
import {STARTER_TEMPLATE} from './components/TemplatesView';

const template:TaskTemplate={
 id:'tpl-placeholders',name:'Klassenarbeit {Fach} {Klasse} vorbereiten',
 description:'Thema {Thema}',steps:['Aufgaben zu {Thema} sammeln','Erwartungshorizont für {Klasse} erstellen','Drucken'],
 createdAt:'2026-11-07T09:00:00Z',updatedAt:'2026-11-07T09:00:00Z'
};

describe('Vorlagen-Platzhalter im Alltag',()=>{
 beforeEach(()=>{localStorage.clear();location.hash=''});
 const open = async ()=>{
  const user=userEvent.setup();
  render(<App/>);
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  await waitFor(()=>expect(screen.getByText(template.name)).toBeInTheDocument());
  return user;
 };
 it('füllt Fach, Klasse und Thema einmal aus und überträgt sie in Titel, Beschreibung und Unteraufgaben',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),templates:[template]}));
  const user=await open();
  await user.click(screen.getByRole('button',{name:'Aufgabe erstellen'}));
  const dialog=screen.getByRole('dialog',{name:'Vorlage ausfüllen'});
  expect(within(dialog).getByRole('button',{name:'Weiter zum Aufgabeneditor'})).toBeDisabled();
  await user.type(within(dialog).getByRole('textbox',{name:'Fach'}),'Mathematik');
  await user.type(within(dialog).getByRole('textbox',{name:'Klasse'}),'7b');
  await user.type(within(dialog).getByRole('textbox',{name:'Thema'}),'Bruchrechnung');
  expect(within(dialog).getByText('Klassenarbeit Mathematik 7b vorbereiten')).toBeInTheDocument();
  expect(within(dialog).getByText('Aufgaben zu Bruchrechnung sammeln')).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button',{name:'Weiter zum Aufgabeneditor'}));
  const editor=screen.getByRole('dialog',{name:'Aufgabe hinzufügen'});
  expect(within(editor).getByLabelText('Titel')).toHaveValue('Klassenarbeit Mathematik 7b vorbereiten');
  expect(within(editor).getByLabelText('Beschreibung')).toHaveValue('Thema Bruchrechnung');
  expect(within(editor).getByLabelText('Unteraufgabe 1')).toHaveValue('Aufgaben zu Bruchrechnung sammeln');
  expect(within(editor).getByLabelText('Unteraufgabe 2')).toHaveValue('Erwartungshorizont für 7b erstellen');
  fireEvent.change(within(editor).getByLabelText('Deadline'),{target:{value:'2026-12-02'}});
  await user.click(within(editor).getByRole('button',{name:'Speichern'}));
  await waitFor(()=>expect(screen.getByText('Klassenarbeit Mathematik 7b vorbereiten')).toBeInTheDocument());
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(saved.tasks[0]).toMatchObject({
   title:'Klassenarbeit Mathematik 7b vorbereiten',description:'Thema Bruchrechnung',
   deadlineDate:'2026-12-02',subtasks:[{title:'Aufgaben zu Bruchrechnung sammeln',completed:false},{title:'Erwartungshorizont für 7b erstellen',completed:false},{title:'Drucken',completed:false}]
  });
  expect(saved.templates[0]).toEqual(template);
 });
 it('bricht ohne Aufgabe ab und behält gespeicherte Vorlage',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),templates:[template]}));
  const user=await open();
  await user.click(screen.getByRole('button',{name:'Aufgabe erstellen'}));
  await user.type(within(screen.getByRole('dialog')).getByRole('textbox',{name:'Fach'}),'Religion');
  await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Abbrechen'}));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(saved.tasks).toEqual([]);
  expect(saved.templates[0]).toEqual(template);
 });
 it('wiederholte Verwendung erzeugt unabhängige Checklisten mit neuem Titel',async()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),templates:[template]}));
  const user=await open();
  const create=async(fach:string,klasse:string,thema:string)=>{
   await user.click(screen.getByRole('button',{name:'Aufgabe erstellen'}));
   const modal=screen.getByRole('dialog');
   await user.type(within(modal).getByRole('textbox',{name:'Fach'}),fach);
   await user.type(within(modal).getByRole('textbox',{name:'Klasse'}),klasse);
   await user.type(within(modal).getByRole('textbox',{name:'Thema'}),thema);
   await user.click(within(modal).getByRole('button',{name:'Weiter zum Aufgabeneditor'}));
   await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Speichern'}));
  };
  await create('Mathe','7b','Brüche');
  await user.click(screen.getByRole('checkbox',{name:'Aufgaben zu Brüche sammeln'}));
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  await create('Religion','8a','Islam');
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(saved.tasks.map((t:{title:string})=>t.title)).toEqual(['Klassenarbeit Mathe 7b vorbereiten','Klassenarbeit Religion 8a vorbereiten']);
  expect(saved.tasks[0].subtasks[0].completed).toBe(true);
  expect(saved.tasks[1].subtasks[0].completed).toBe(false);
  expect(saved.tasks[0].subtasks[0].id).not.toBe(saved.tasks[1].subtasks[0].id);
 });
 it('behält den alten schnellen Weg für Vorlagen ohne Platzhalter bei',async()=>{
  const plain={...template,id:'plain',name:'Korrektur vorbereiten',description:'',steps:['Material bereitstellen']};
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...emptyData(),templates:[plain]}));
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:'Vorlagen'}));
  await user.click(screen.getByRole('button',{name:'Aufgabe erstellen'}));
  expect(screen.getByRole('dialog',{name:'Aufgabe hinzufügen'})).toBeInTheDocument();
  expect(screen.queryByRole('dialog',{name:'Vorlage ausfüllen'})).not.toBeInTheDocument();
 });
 it('liefert eine unverbindliche Schulvorlage mit drei erkennbaren Feldern',()=>{
  expect(STARTER_TEMPLATE.name).toContain('{Fach}');
  expect(STARTER_TEMPLATE.name).toContain('{Klasse}');
  expect(STARTER_TEMPLATE.description).toContain('{Thema}');
 });
});
