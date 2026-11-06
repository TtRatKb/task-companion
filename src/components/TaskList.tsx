import {CalendarDays,Flag,RotateCw} from 'lucide-react';import {formatDate} from '../date';import {recurrenceLabel} from '../recurrence';import type {Project,Task} from '../types';
export function TaskList({tasks,projects,onComplete,onEdit,empty}:{tasks:Task[];projects:Project[];onComplete:(id:string)=>void;onEdit:(t:Task)=>void;empty:string}){
 if(!tasks.length)return <div className="empty"><div className="empty-check">✓</div><h2>Alles klar</h2><p>{empty}</p></div>;
 return <div className="task-list">{tasks.map(t=>{const project=projects.find(p=>p.id===t.projectId);return <article className="task-row" key={t.id}>
  <button className={'complete p'+t.priority} aria-label={'„'+t.title+'“ abschließen'} onClick={()=>onComplete(t.id)}/>
  <button className="task-content" onClick={()=>onEdit(t)}><strong>{t.title}</strong>{t.description&&<span className="description">{t.description}</span>}<span className="meta">
   {t.scheduledDate&&<span><CalendarDays/>Geplant {formatDate(t.scheduledDate)}</span>}
   {t.deadlineDate&&<span className="deadline"><Flag/>Deadline {formatDate(t.deadlineDate)}</span>}
   {t.recurrence&&<span><RotateCw/>{recurrenceLabel(t.recurrence)}</span>}
   {project&&<span className="project-dot" style={{'--color':project.color} as React.CSSProperties}>{project.name}</span>}
  </span></button>
 </article>})}</div>
}
