import { AlertTriangle, CalendarDays, Flag, RotateCw } from 'lucide-react';
import { formatDate, todayLocal } from '../date';
import { deadlineCountdown, deadlineState, planningAfterDeadline } from '../deadlineRadar';
import { recurrenceLabel } from '../recurrence';
import type { Project, Task } from '../types';

export function TaskList({
  tasks, projects, onComplete, onEdit, empty, today = todayLocal()
}: {
  tasks: Task[];
  projects: Project[];
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  empty: string;
  today?: string;
}) {
  if (!tasks.length) return <div className="empty">
    <div className="empty-check">✓</div>
    <h2>Alles klar</h2>
    <p>{empty}</p>
  </div>;

  return <div className="task-list">{tasks.map(task => {
    const project = projects.find(p => p.id === task.projectId);
    const deadlineClass = task.deadlineDate ? deadlineState(task.deadlineDate, today) : null;
    const planningConflict = planningAfterDeadline(task);
    return <article className="task-row" key={task.id}>
      <button className={'complete p' + task.priority}
        aria-label={`„${task.title}“ abschließen`}
        onClick={() => onComplete(task.id)} />
      <button className="task-content" onClick={() => onEdit(task)}>
        <strong>{task.title}</strong>
        {task.description && <span className="description">{task.description}</span>}
        <span className="meta">
          {task.scheduledDate && <span>
            <CalendarDays aria-hidden="true" />
            Geplant {formatDate(task.scheduledDate)}
          </span>}
          {task.deadlineDate && <span className={`deadline deadline-${deadlineClass}`}>
            <Flag aria-hidden="true" />
            {deadlineCountdown(task.deadlineDate, today)} · {formatDate(task.deadlineDate)}
          </span>}
          {task.recurrence && <span>
            <RotateCw aria-hidden="true" />{recurrenceLabel(task.recurrence)}
          </span>}
          {planningConflict && <span className="planning-warning">
            <AlertTriangle aria-hidden="true" /> Planung nach Deadline
          </span>}
          {project && <span className="project-dot" style={{ '--color': project.color } as React.CSSProperties}>
            {project.name}
          </span>}
        </span>
      </button>
    </article>;
  })}</div>;
}
