import {describe,expect,it} from 'vitest';
import {expandTaskTemplate,extractTemplatePlaceholders,fillTemplateText} from './templateVariables';
import {taskFromTemplate} from './checklists';
import type {TaskTemplate} from './types';

const template:TaskTemplate={
 id:'tpl-1',name:'Klassenarbeit {Fach} {Klasse} vorbereiten',
 description:'Thema {Thema}, Fach {Fach}',
 steps:['Aufgaben für {Thema} erstellen','Material für {Klasse} vorbereiten','{Thema} kontrollieren'],
 createdAt:'2026-11-07T08:00:00Z',updatedAt:'2026-11-07T08:00:00Z'
};

describe('Wiederverwendbare Vorlagen-Platzhalter',()=>{
 it('findet Platzhalter in Titel, Beschreibung und Schritten, ohne Wiederholungen',()=>{
  expect(extractTemplatePlaceholders(template)).toEqual(['Fach','Klasse','Thema']);
 });
 it('füllt alle Felder und lässt die gespeicherte Vorlage unverändert',()=>{
  const values={Fach:'Mathematik',Klasse:'7b',Thema:'Bruchrechnung'};
  const expanded=expandTaskTemplate(template,values);
  expect(expanded).toMatchObject({
   name:'Klassenarbeit Mathematik 7b vorbereiten',
   description:'Thema Bruchrechnung, Fach Mathematik',
   steps:['Aufgaben für Bruchrechnung erstellen','Material für 7b vorbereiten','Bruchrechnung kontrollieren']
  });
  expect(template.name).toBe('Klassenarbeit {Fach} {Klasse} vorbereiten');
  expect(template.steps[0]).toContain('{Thema}');
  const first=taskFromTemplate(expanded,null);
  const second=taskFromTemplate(expanded,null);
  expect(first.id).not.toBe(second.id);
  expect(first.subtasks?.[0].id).not.toBe(second.subtasks?.[0].id);
  expect(first.deadlineDate).toBeNull();
 });
 it('braucht alle Angaben, auch wenn der Platzhalter nur in einem Schritt steht',()=>{
  expect(()=>expandTaskTemplate(template,{Fach:'Mathe',Klasse:'7b',Thema:'  '})).toThrow('Thema');
  expect(()=>expandTaskTemplate(template,{})).toThrow('Fach');
 });
 it('akzeptiert eigene Platzhalter, Umlaute und Zahlen im Namen',()=>{
  const custom={...template,name:'Planung {Schuljahr_2} für {Lerngröße}',description:'',steps:[]};
  expect(extractTemplatePlaceholders(custom)).toEqual(['Schuljahr_2','Lerngröße']);
  expect(fillTemplateText(custom.name,{Schuljahr_2:'2026/27',Lerngröße:'28'})).toBe('Planung 2026/27 für 28');
 });
 it('ersetzt den Wert wörtlich, ohne JavaScript-, HTML- oder Platzhalter-Nachauswertung',()=>{
  expect(fillTemplateText('Test {Fach} {Klasse}',{Fach:'$& {Klasse} <Mathe>',Klasse:'8a'}))
   .toBe('Test $& {Klasse} <Mathe> 8a');
 });
 it('ignoriert gewöhnliche Klammern, unvollständige und zu lange Platzhalter',()=>{
  const custom={...template,name:'Notiz {unfertig / {}} und {0Fach}',description:'',steps:['{ein unglaublich extrem extrem langer Platzhaltername jenseits limit}']};
  expect(extractTemplatePlaceholders(custom)).toEqual([]);
  expect(fillTemplateText('A {Fach}, B {Fach}',{Fach:' Mathe '})).toBe('A Mathe, B Mathe');
 });
 it('ändert für Vorlagen ohne Variablen überhaupt nichts',()=>{
  const plain={...template,name:'Klassenarbeit vorbereiten',description:'Standard',steps:['Aufgaben auswählen']};
  expect(extractTemplatePlaceholders(plain)).toEqual([]);
  expect(expandTaskTemplate(plain,{})).toEqual(plain);
 });
});
