import { useState } from 'react';
import { AlertTriangle, CalendarDays, ChevronDown, ChevronRight, Flag, RotateCw } from 'lucide-react';
import { formatDate, todayLocal } from '../date';
import { deadlineCountdown, deadlineState, planningAfterDeadline } from '../deadlineRadar';
import { recurrenceLabel } from '../recurrence';
import { checklistProgress } from '../templates';
import type { Project, Task } from '../types';

function TaskItem({
  task, project, onComplete, onEdit, onToggleSubtask, today
}: {
  task: Task;
  project?: Project;
  onComplete: (id:string) => void;
  onEdit: (task:Task) => void;
  onToggleSubtask: (taskId:string, subtaskId:string) => void;
  today: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const deadlineClass = task.deadlineDate ? deadlineState(task.deadlineDate, today) : null;
  const planningConflict = planningAfterDeadline(task);
  const progress = checklistProgress(task.subtasks);
  return <div className="task-entry">
    <article className="task-row">
      <button className={'complete p'+task.priority} aria-label={`„${task.title}“ abschließen`}
        onClick={() => onComplete(task.id)}/>
      <button className="task-content" onClick={() => onEdit(task)}>
        <strong>{task.title}</strong>
        {task.description && <span className="description">{task.description}</span>}
        <span className="meta">
          {task.scheduledDate && <span><CalendarDays aria-hidden="true" />Geplant {formatDate(task.scheduledDate)}</span>}
          {task.deadlineDate && <span className={`deadline deadline-${deadlineClass}`}>
            <Flag aria-hidden="true" />{deadlineCountdown(task.deadlineDate, today)} · {formatDate(task.deadlineDate)}
          </span>}
          {task.recurrence && <span><RotateCw aria-hidden="true"/>{recurrenceLabel(task.recurrence)}</span>}
          {planningConflict && <span className="planning-warning"><AlertTriangle aria-hidden="true"/> Planung nach Deadline</span>}
          {project && <span className="project-dot" style={{ '--color': project.color } as React.CSSProperties}>{project.name}</span>}
        </span>
      </button>
      {progress.total > 0 && <button className="subtask-expand" type="button"
        aria-label={`Unteraufgaben für „${task.title}“ ${expanded?'ausblenden':'anzeigen'}`}
        aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        <span>{progress.done}/{progress.total}</span>{expanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
      </button>}
    </article>
    {progress.total > 0 && <>
      <div className="subtask-progress" aria-label={`${progress.done} von ${progress.total} Unteraufgaben erledigt`}>
        <div style={{ width: progress.percentage + '%' }}/>
      </div>
      {expanded && <div className="subtask-list" aria-label={`Checkliste für ${task.title}`}>
        {task.subtasks.map(step => <label key={step.id} className={step.completedAt ? 'subtask-done' : ''}>
          <input type="checkbox" checked={step.completedAt !== null}
            onChange={() => onToggleSubtask(task.id,step.id)}/>
          <span>{step.title}</span>
        </label>)}
      </div>}
    </>}
  </div>;
}

export function TaskList({
  tasks, projects, onComplete, onEdit, onToggleSubtask, empty, today = todayLocal()
}: {
  tasks: Task[];
  projects: Project[];
  onComplete: (id:string) => void;
  onEdit: (task:Task) => void;
  onToggleSubtask?: (taskId:string, subtaskId:string) => void;
  empty:string;
  today?:string;
}) {
  if (!tasks.length) return <div className="empty"><div className="empty-check">✓</div>
    <h2>Alles klar</h2><p>{empty}</p></div>;
  return <div className="task-list">{tasks.map(task => <TaskItem key={task.id}
    task={task} project={projects.find(p=>p.id===task.projectId)}
    onComplete={onComplete} onEdit={onEdit}
    onToggleSubtask={onToggleSubtask ?? (() => undefined)} today={today}/>)}</div>;
}
