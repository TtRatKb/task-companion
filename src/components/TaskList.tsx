import { AlertTriangle, CalendarDays, Flag, RotateCw } from 'lucide-react';
import { checklistProgress } from '../checklists';
import { formatDate, todayLocal } from '../date';
import { deadlineCountdown, deadlineState, planningAfterDeadline } from '../deadlineRadar';
import { recurrenceLabel } from '../recurrence';
import type { Project, Task } from '../types';

export function TaskList({
  tasks, projects, onComplete, onEdit, onToggleSubtask, empty, today = todayLocal()
}: {
  tasks: Task[];
  projects: Project[];
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
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
    const checklist=checklistProgress(task);
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
            {deadlineCountdown(task.deadlineDate, today)} · benötigt {formatDate(task.deadlineDate)}
          </span>}
          {task.recurrence && <span>
            <RotateCw aria-hidden="true" />{recurrenceLabel(task.recurrence)}
          </span>}
          {planningConflict && <span className="planning-warning">
            <AlertTriangle aria-hidden="true" /> Planung nach Deadline
          </span>}
          {checklist.total>0&&<span className="subtask-progress-label">✓ {checklist.done}/{checklist.total} Schritte</span>}
          {project && <span className="project-dot" style={{ '--color': project.color } as React.CSSProperties}>
            {project.name}
          </span>}
        </span>
      </button>
      {checklist.total>0&&<div className="subtask-inline" aria-label={`Unteraufgaben für ${task.title}`}>
       <div className="subtask-meter" aria-hidden="true"><span style={{width:`${checklist.done/checklist.total*100}%`}}/></div>
       {(task.subtasks??[]).map(step=><label key={step.id} className={step.completed?'subtask-line done':'subtask-line'}>
        <input type="checkbox" checked={step.completed} disabled={!onToggleSubtask} onChange={()=>onToggleSubtask?.(task.id,step.id)}/>
        <span>{step.title}
         {step.plannedDate&&<small className={step.plannedDate<=today&&!step.completed?'subtask-date-due':'subtask-date-future'}>
          {step.plannedDate<today&&!step.completed?'Geplant war ':step.plannedDate===today&&!step.completed?'Heute geplant · ':'Geplant '}
          {formatDate(step.plannedDate)}
         </small>}
        </span>
       </label>)}
      </div>}
    </article>;
  })}</div>;
}
