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
    expect(parseQuickTask('Korrektur jeden Dienstag und Freitag', ref).recurrence?.weekdays).toEqual([2, 5]);
  });

  it('bewahrt ungültige und unbekannte Angaben', () => {
    expect(parseQuickTask('Bericht am 31.02. bis irgendwann Projekt Pinguin', ref))
      .toMatchObject({ title: 'Bericht am 31.02. bis irgendwann Projekt Pinguin', scheduledDate: null, deadlineDate: null });
  });

  it('verwendet bei Datum ohne Jahr das nächste gültige Vorkommen', () => {
    expect(parseQuickTask('Steuer am 05.11.', ref).scheduledDate).toBe('2027-11-05');
  });
});
