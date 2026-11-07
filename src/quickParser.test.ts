import { describe, expect, it } from 'vitest';
import { parseQuickTask } from './quickParser';

const ref = '2026-11-06';

describe('deutsche Schnellerfassung', () => {
  it('trennt Planung, Deadline und Priorität', () => {
    expect(parseQuickTask('Elternbrief schreiben am Dienstag bis Donnerstag #P2', ref))
      .toMatchObject({ title: 'Elternbrief schreiben', scheduledDate: '2026-11-10', deadlineDate: '2026-11-12', priority: 2 });
  });

  it.each([1, 2, 3, 4])('erkennt #P%s direkt beim Tippen und entfernt das Kürzel aus dem Titel', (priority) => {
    const input = `Aufgabe #P${priority}`;
    expect(parseQuickTask(input, ref)).toMatchObject({ title: 'Aufgabe', priority });
  });

  it('erkennt Prioritätskürzel unabhängig von der Großschreibung', () => {
    expect(parseQuickTask('Unterricht vorbereiten #p1', ref))
      .toMatchObject({ title: 'Unterricht vorbereiten', priority: 1 });
  });

  it('erkennt Priorität auch vor Satzzeichen', () => {
    expect(parseQuickTask('WebUntis #P3, eintragen', ref).priority).toBe(3);
  });

  it('erkennt Schultag ohne Ferienversprechen', () => {
    expect(parseQuickTask('WebUntis eintragen jeden Schultag #p2', ref))
      .toMatchObject({ title: 'WebUntis eintragen', scheduledDate: '2026-11-06', priority: 2, recurrence: { kind: 'weekdays', weekdays: [1, 2, 3, 4, 5] } });
  });

  it('erkennt mehrere Wochentage', () => {
    expect(parseQuickTask('Korrektur jeden Dienstag und Freitag', ref).recurrence).toEqual({kind:'weekdays',weekdays:[2,5]});
  });

  it('erkennt Intervalle in Tagen, Wochen und Monaten auch mit Zahlwörtern',()=>{
    expect(parseQuickTask('Kontrolle alle 3 Tage #P2',ref)).toMatchObject({
      title:'Kontrolle',priority:2,scheduledDate:ref,
      recurrence:{kind:'interval',every:3,unit:'days',anchorDate:ref}
    });
    expect(parseQuickTask('Klassenbuch alle zwei Wochen',ref)).toMatchObject({
      title:'Klassenbuch',scheduledDate:ref,
      recurrence:{kind:'interval',every:2,unit:'weeks',anchorDate:ref}
    });
    expect(parseQuickTask('Abrechnung alle 2 Monate',ref)).toMatchObject({
      title:'Abrechnung',recurrence:{kind:'interval',every:2,unit:'months',anchorDate:ref}
    });
  });
  it('verankert einen Wiederholungsabstand am ausdrücklich gewählten Startdatum',()=>{
    expect(parseQuickTask('Teammeeting alle 2 Wochen am Dienstag',ref)).toMatchObject({
      title:'Teammeeting',scheduledDate:'2026-11-10',
      recurrence:{kind:'interval',every:2,unit:'weeks',anchorDate:'2026-11-10'}
    });
    expect(parseQuickTask('Kontrolle alle 4 Tage am 16.11.',ref)).toMatchObject({
      title:'Kontrolle',scheduledDate:'2026-11-16',
      recurrence:{kind:'interval',every:4,unit:'days',anchorDate:'2026-11-16'}
    });
  });
  it('erkennt jeden Monat am 15. sowie Monatssprünge am 31.',()=>{
    expect(parseQuickTask('Bericht jeden Monat am 15.',ref)).toMatchObject({
      title:'Bericht',scheduledDate:'2026-11-15',
      recurrence:{kind:'interval',every:1,unit:'months',anchorDate:'2026-11-15'}
    });
    expect(parseQuickTask('Bericht monatlich am 31.',ref)).toMatchObject({
      title:'Bericht',scheduledDate:'2026-11-30',
      recurrence:{kind:'interval',every:1,unit:'months',anchorDate:'2026-10-31'}
    });
    expect(parseQuickTask('Bericht monatlich am 15.','2026-11-20').scheduledDate).toBe('2026-12-15');
  });
  it('bewahrt ungültige und unbekannte Angaben', () => {
    expect(parseQuickTask('Bericht am 31.02. bis irgendwann Projekt Pinguin', ref))
      .toMatchObject({ title: 'Bericht am 31.02. bis irgendwann Projekt Pinguin', scheduledDate: null, deadlineDate: null });
  });

  it('verwendet bei Datum ohne Jahr das nächste gültige Vorkommen', () => {
    expect(parseQuickTask('Steuer am 05.11.', ref).scheduledDate).toBe('2027-11-05');
  });
});
