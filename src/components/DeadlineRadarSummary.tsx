import { AlertTriangle, ArrowRight, CalendarClock } from 'lucide-react';
import type { DeadlineOverview } from '../deadlineRadar';

export function DeadlineRadarSummary({
  summary, onOpen, compact = false
}: {
  summary: DeadlineOverview;
  onOpen: () => void;
  compact?: boolean;
}) {
  const upcoming = summary.overdue + summary.today + summary.soon;

  return <section className="radar-summary" aria-label="Deadline-Überblick">
    <div className="radar-summary-heading">
      <span className="radar-summary-title"><CalendarClock aria-hidden="true" /> Deadline-Radar</span>
      {compact && <button className="radar-link" type="button" onClick={onOpen}>
        Alle Deadlines <ArrowRight aria-hidden="true" />
      </button>}
    </div>
    <div className="radar-stats">
      <div className={summary.overdue ? 'radar-stat critical' : 'radar-stat'}>
        <strong>{summary.overdue}</strong><span>Überfällig</span>
      </div>
      <div className={summary.today ? 'radar-stat today' : 'radar-stat'}>
        <strong>{summary.today}</strong><span>Heute fällig</span>
      </div>
      <div className="radar-stat"><strong>{summary.soon}</strong><span>Nächste 7 Tage</span></div>
    </div>
    {summary.planningConflicts > 0 &&
      <p className="radar-warning"><AlertTriangle size={16} aria-hidden="true" />
        Bei {summary.planningConflicts} {summary.planningConflicts === 1 ? 'Aufgabe liegt' : 'Aufgaben liegt'} die Planung nach der Deadline.
      </p>}
    {upcoming === 0 && <p className="radar-quiet">Keine überfälligen oder in den nächsten 7 Tagen fälligen Aufgaben. ✨</p>}
    {!compact && <p className="radar-explanation">
      Die Anzeige betrachtet echte Deadlines, unabhängig davon, für wann du die Bearbeitung geplant hast.
      Sie erinnert dich <strong>innerhalb der App</strong> – Push-Mitteilungen gibt es noch nicht.
    </p>}
  </section>;
}
