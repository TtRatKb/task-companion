import {describe,expect,it} from 'vitest';
import {
 dateBeforeDeadline,dateRelativeToAnchor,deadlineWorkday,offsetDescription,templateAnchorKind,
 parseAndResolveStep,parseRelativeStep,resolveRelativeSubtasks,templateStepFromSubtask
} from './relativePlanning';
import {taskFromTemplate,templateFromTask} from './checklists';
import {expandTaskTemplate,extractTemplatePlaceholders} from './templateVariables';
import type {Task,TaskTemplate} from './types';

describe('explizite rückwärts geplante Unteraufgaben',()=>{
 it.each([
  ['Aufgaben zusammenstellen – 2 Wochen vorher','Aufgaben zusammenstellen',2,'weeks'],
  ['ClassTime einrichten – {Deadline} - 3 Tage','ClassTime einrichten',3,'days'],
  ['Layout prüfen 14 Tage vorher','Layout prüfen',14,'days'],
  ['Erwartungshorizont zwei Wochen vorher','Erwartungshorizont',2,'weeks'],
  ['Druck aufbereiten – am Vortag','Druck aufbereiten',1,'days'],
  ['Material organisieren – 1 Monat vor {Deadline}','Material organisieren',1,'months'],
  ['Antrag stellen 3 Monate vorher','Antrag stellen',3,'months'],
  ['Kopieren – einen Tag vorher','Kopieren',1,'days']
 ])('versteht %s', (input,title,amount,unit)=>{
  expect(parseRelativeStep(input)).toEqual({title,offset:{amount,unit}});
 });
 it('berechnet Wochen und Tage genau vom eingetragenen Deadline-Tag, nicht vom Vorbereitungsziel',()=>{
  expect(dateBeforeDeadline('2026-11-27',{amount:2,unit:'weeks'})).toBe('2026-11-13');
  expect(dateBeforeDeadline('2026-11-27',{amount:14,unit:'days'})).toBe('2026-11-13');
  expect(dateBeforeDeadline('2026-11-10',{amount:1,unit:'days'})).toBe('2026-11-09');
  expect(deadlineWorkday('2026-11-10')).toBe('2026-11-09');
 });
 it('berücksichtigt unterschiedliche Monatslängen und Schaltjahre ohne 30-Tage-Annahme',()=>{
  expect(dateBeforeDeadline('2027-03-31',{amount:1,unit:'months'})).toBe('2027-02-28');
  expect(dateBeforeDeadline('2028-03-31',{amount:1,unit:'months'})).toBe('2028-02-29');
  expect(dateBeforeDeadline('2027-01-31',{amount:2,unit:'months'})).toBe('2026-11-30');
 });
 it('funktioniert auch über Jahres- und Sommerzeitwechsel hinweg',()=>{
  expect(dateBeforeDeadline('2027-01-05',{amount:2,unit:'weeks'})).toBe('2026-12-22');
  expect(dateBeforeDeadline('2026-03-30',{amount:3,unit:'days'})).toBe('2026-03-27');
 });
 it('verändert unerkannte Texte nicht und verteilt keine Aufgaben automatisch',()=>{
  expect(parseRelativeStep('Material in ClassTime importieren')).toEqual({title:'Material in ClassTime importieren',offset:null});
  expect(parseRelativeStep('Nicht automatisch am Freitag verteilen').offset).toBeNull();
  expect(parseRelativeStep('Notiz – 2000 Tage vorher').offset).toBeNull();
  expect(parseAndResolveStep('Layout prüfen', '2026-11-10')).toMatchObject({title:'Layout prüfen',plannedDate:null});
 });
 it('bewahrt die Termine bereits abgeschlossener Schritte und manuelle Einträge',()=>{
  const steps=[
   {id:'done',title:'Erledigt',completed:true,plannedDate:'2026-11-01',offset:{amount:7,unit:'days'} as const},
   {id:'open',title:'Offen',completed:false,plannedDate:'2026-11-02',offset:{amount:3,unit:'days'} as const},
   {id:'manual',title:'Von Hand',completed:false,plannedDate:'2026-11-06'}
  ];
  const result=resolveRelativeSubtasks(steps,'2026-11-20');
  expect(result.map(s=>s.plannedDate)).toEqual(['2026-11-01','2026-11-17','2026-11-06']);
  expect(steps[1].plannedDate).toBe('2026-11-02');
 });
 it('behält Zeitabstände in gespeicherten Vorlagen für die nächste Verwendung',()=>{
  const task:Task={
   id:'t1',title:'Arbeit vorbereiten',description:'',projectId:null,priority:2,
   scheduledDate:null,deadlineDate:'2026-11-27',recurrence:null,completedAt:null,createdAt:'x',updatedAt:'x',
   subtasks:[{id:'s1',title:'ClassTime einrichten',completed:true,plannedDate:'2026-11-24',offset:{amount:3,unit:'days'}}]
  };
  const template=templateFromTask(task);
  expect(template.steps[0]).toBe('ClassTime einrichten – {Deadline} - 3 Tage');
  expect(offsetDescription({amount:2,unit:'weeks'})).toBe('2 Wochen vor Deadline');
  const reused=taskFromTemplate(template,null);
  expect(reused.subtasks?.[0]).toMatchObject({title:'ClassTime einrichten',completed:false,offset:{amount:3,unit:'days'},plannedDate:null});
  expect(reused.id).not.toBe(task.id);
  expect(templateStepFromSubtask(reused.subtasks![0])).toBe(template.steps[0]);
 });
 it('behandelt {Deadline} als Zeitanker und fragt dafür keine Extra-Variable',()=>{
  const template:TaskTemplate={id:'a',name:'Klassenarbeit {Fach}',description:'',
   steps:['ClassTime – {Deadline} - 7 Tage','Aufgaben – 2 Wochen vorher'],
   createdAt:'x',updatedAt:'x'};
  expect(extractTemplatePlaceholders(template)).toEqual(['Fach']);
  expect(expandTaskTemplate(template,{Fach:'Mathematik'}).steps[0]).toBe('ClassTime – {Deadline} - 7 Tage');
  expect(taskFromTemplate(expandTaskTemplate(template,{Fach:'Mathematik'}),null).subtasks?.[0].offset)
   .toEqual({amount:7,unit:'days'});
 });
 it('lehnen ungültige Zeitangaben ab, bevor sie als Datum gespeichert werden',()=>{
  expect(()=>dateBeforeDeadline('2026-02-31',{amount:2,unit:'days'})).toThrow();
  expect(()=>dateBeforeDeadline('2026-11-10',{amount:0,unit:'weeks'})).toThrow();
 });
 it.each([
  ['Nachschreibtermin entscheiden am {Deadline}','Nachschreibtermin entscheiden',0,'on'],
  ['Über Nachschreibarbeit entscheiden 2 Tage danach','Über Nachschreibarbeit entscheiden',2,'after'],
  ['Klassenarbeiten bewerten bis 2 Wochen nach {Deadline}','Klassenarbeiten bewerten',2,'after'],
  ['Kompetenzraster ausdrucken bis 2 Wochen nach {Deadline}','Kompetenzraster ausdrucken',2,'after'],
  ['Klassenarbeiten zurückgeben 2 Wochen nach {Deadline}','Klassenarbeiten zurückgeben',2,'after'],
  ['Nachschreiben vereinbaren – {Deadline} + 5 Tage','Nachschreiben vereinbaren',5,'after'],
 ])('versteht einen Termin am oder nach dem Ereignisdatum: %s',(text,title,amount,direction)=>{
  const {title:cleaned,offset}=parseRelativeStep(text);
  expect(cleaned).toBe(title);
  expect(offset?.amount).toBe(amount);
  expect(offset?.direction).toBe(direction);
 });
 it('plant Vorbereitung, Termin und Nachbereitung aus einem Ereignisdatum ohne Deadline',()=>{
  const steps=[
   'Aufgaben drucken – 3 Tage vorher',
   'Klassenarbeit schreiben am {Deadline}',
   'Über Nachschreibarbeit entscheiden 2 Tage danach',
   'Korrektur abschließen bis 2 Wochen nach {Deadline}'
  ].map((text,i)=>({id:String(i),...parseAndResolveStep(text,'2026-11-27'),completed:false}));
  expect(steps.map(s=>s.title)).toEqual([
   'Aufgaben drucken','Klassenarbeit schreiben','Über Nachschreibarbeit entscheiden','Korrektur abschließen'
  ]);
  expect(steps.map(s=>s.plannedDate)).toEqual(['2026-11-24','2026-11-27','2026-11-29','2026-12-11']);
  expect(templateAnchorKind({steps:[
   'Aufgaben drucken – 3 Tage vorher','Korrektur abschließen bis 2 Wochen nach {Deadline}'
  ]})).toBe('event');
 });
 it('addiert Kalendermonate mit korrekt begrenztem Monatstag',()=>{
  expect(dateRelativeToAnchor('2027-01-31',{amount:1,unit:'months',direction:'after'})).toBe('2027-02-28');
  expect(dateRelativeToAnchor('2028-01-31',{amount:1,unit:'months',direction:'after'})).toBe('2028-02-29');
  expect(dateRelativeToAnchor('2026-11-27',{amount:0,unit:'days',direction:'on'})).toBe('2026-11-27');
  expect(()=>dateRelativeToAnchor('2026-11-27',{amount:0,unit:'days',direction:'after'})).toThrow();
 });
 it('schreibt Post-Ereignis-Abstände verlustfrei in wiederverwendbare Vorlagen',()=>{
  const step={id:'s1',title:'Korrektur',completed:false,offset:{amount:2,unit:'weeks',direction:'after'} as const};
  const raw=templateStepFromSubtask(step);
  expect(raw).toBe('Korrektur – {Deadline} + 2 Wochen');
  expect(parseRelativeStep(raw).offset).toEqual(step.offset);
 });

});
