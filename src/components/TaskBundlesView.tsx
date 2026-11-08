import {useState} from 'react';
import {CalendarDays,Check,ChevronDown,ChevronRight,Clock3,Flag,Layers3,AlertCircle} from 'lucide-react';
import {formatDate} from '../date';
import {isOpenTask} from '../deadlineRadar';
import {formatDuration} from '../weeklyPlanner';
import {taskBundles,type TaskBundle} from '../taskBundles';
import type {Project,Task} from '../types';

const statusText=(bundle:TaskBundle):string=>{
 switch(bundle.status){
  case 'overdue':return 'Offene überfällige Schritte';
  case 'today':return 'Heute anstehende Schritte';
  case 'upcoming':return 'Weitere Schritte geplant';
  case 'ready':return 'Alle Schritte erledigt';
  case 'finished':return 'Hauptaufgabe abgeschlossen';
  default:return 'Noch nicht alle Schritte geplant';
 }
};

export function TaskBundlesView({tasks,projects,today,onEdit,onToggleStep,onCompleteParent}:{
 tasks:Task[];projects:Project[];today:string;
 onEdit:(task:Task)=>void;onToggleStep:(taskId:string,stepId:string)=>void;
 onCompleteParent:(taskId:string)=>void;
}){
 const [showCompleted,setShowCompleted]=useState(false);
 const [collapsed,setCollapsed]=useState<Set<string>>(()=>new Set());
 const bundles=taskBundles(tasks,today,showCompleted);
 const ongoing=bundles.filter(bundle=>bundle.status!=='finished');
 const finished=bundles.filter(bundle=>bundle.status==='finished');
 const attention=ongoing.filter(bundle=>bundle.status==='overdue');
 const other=ongoing.filter(bundle=>bundle.status!=='overdue');
 const toggle=(id:string)=>setCollapsed(prev=>{
  const next=new Set(prev);if(next.has(id))next.delete(id);else next.add(id);return next;
 });
 const renderBundle=(bundle:TaskBundle)=>{
  const task=bundle.task;
  const project=projects.find(p=>p.id===task.projectId);
  const completedParent=!isOpenTask(task);
  const allDone=bundle.remaining===0;
  const expanded=!collapsed.has(task.id);
  const progress=Math.round(100*bundle.done/bundle.total);
  const estimates=(task.subtasks??[]).filter(step=>step.estimatedMinutes!=null);
  const knownMinutes=estimates.reduce((n,step)=>n+step.estimatedMinutes!,0);
  return <article className={'task-bundle '+(bundle.status==='overdue'?'bundle-overdue ':'')+(completedParent?'bundle-completed':'')}
   key={task.id} aria-label={`Aufgabenpaket ${task.title}`}>
   <header className="bundle-header">
    <div className="bundle-heading">
     <button type="button" className="bundle-toggle" aria-label={`Unteraufgaben von ${task.title} ${expanded?'einklappen':'ausklappen'}`}
      aria-expanded={expanded} aria-controls={`bundle-steps-${task.id}`} onClick={()=>toggle(task.id)}>
      {expanded?<ChevronDown size={17}/>:<ChevronRight size={17}/>}
     </button>
     <div className="bundle-title-area">
      <button type="button" className="bundle-title" onClick={()=>onEdit(task)}>{task.title}</button>
      <div className="bundle-meta">
       {project&&<span className="bundle-project"><i style={{background:project.color}} aria-hidden="true"/>{project.name}</span>}
       {task.eventDate&&<span><CalendarDays size={13} aria-hidden="true"/> Ereignis {formatDate(task.eventDate)}</span>}
       {task.deadlineDate&&<span className={bundle.parentDeadlineOverdue?'bundle-deadline-overdue':''}>
        <Flag size={13} aria-hidden="true"/> Deadline {formatDate(task.deadlineDate)}</span>}
       {estimates.length>0&&<span><Clock3 size={13} aria-hidden="true"/> {formatDuration(knownMinutes)} geschätzte Schritte</span>}
      </div>
     </div>
    </div>
    <div className="bundle-progress-display">
     <strong>{bundle.done}/{bundle.total}</strong><span>erledigt</span>
    </div>
   </header>
   <div className="bundle-meter" role="progressbar" aria-label={`Fortschritt von ${task.title}`}
    aria-valuemin={0} aria-valuemax={bundle.total} aria-valuenow={bundle.done}>
    <span style={{width:progress+'%'}}/>
   </div>
   <div className="bundle-status">
    {bundle.status==='overdue'?<><AlertCircle size={14} aria-hidden="true"/>{bundle.overdueSteps.length>0?
      `${bundle.overdueSteps.length} ${bundle.overdueSteps.length===1?'überfälliger Schritt':'überfällige Schritte'}`:
      'Hauptdeadline überschritten'}</>:
     <span>{statusText(bundle)}</span>}
    {bundle.nextDate&&<small>Nächster geplanter Schritt: {formatDate(bundle.nextDate)}</small>}
    {allDone&&!completedParent&&<button type="button" className="bundle-finish"
      onClick={()=>onCompleteParent(task.id)}><Check size={14} aria-hidden="true"/> Hauptaufgabe abschließen</button>}
   </div>
   {expanded&&<div className="bundle-steps" id={`bundle-steps-${task.id}`} aria-label={`Unteraufgaben von ${task.title}`}>
    {(task.subtasks??[]).map(step=>{
     const overdue=!step.completed&&!!step.plannedDate&&step.plannedDate<today;
     const dueToday=!step.completed&&step.plannedDate===today;
     return <div className={['bundle-step',step.completed?'done':'',overdue?'overdue':''].filter(Boolean).join(' ')} key={step.id}>
      <input type="checkbox" aria-label={`${step.title} erledigt (${task.title})`} checked={step.completed}
       disabled={completedParent} onChange={()=>onToggleStep(task.id,step.id)}/>
      <button type="button" className="bundle-step-title" onClick={()=>onEdit(task)}>{step.title}</button>
      <div className="bundle-step-meta">
       {step.plannedDate&&<span className={overdue?'bundle-step-late':''}>
        {step.completed?'Geplant ':overdue?'Geplant war ':dueToday?'Heute · ':'Geplant '}{formatDate(step.plannedDate)}</span>}
       {step.estimatedMinutes!=null&&<span>{step.estimatedMinutes} Min.</span>}
      </div>
     </div>;
    })}
   </div>}
  </article>;
 };
 return <div className="task-bundles-view">
  <header className="bundles-page-header">
   <div><h2>Deine Aufgabenpakete</h2>
    <p>Hier bleiben Hauptaufgaben wie Klassenarbeiten sichtbar – auch nach dem Ereignistag.
     Alle Unteraufgaben gehören weiterhin zur selben Aufgabe und behalten ihre Häkchen und Termine.</p></div>
   <label><input type="checkbox" checked={showCompleted} onChange={e=>setShowCompleted(e.target.checked)}/> Abgeschlossene anzeigen</label>
  </header>
  <div className="bundles-count">{ongoing.length} offene {ongoing.length===1?'Hauptaufgabe':'Hauptaufgaben'} mit Unteraufgaben</div>
  {ongoing.length===0&&<div className="empty"><div className="empty-check">✓</div>
   <h2>Keine offenen Aufgabenpakete</h2><p>Neue Hauptaufgaben mit Unteraufgaben erscheinen hier automatisch – ganz ohne Projektzuordnung.</p></div>}
  {attention.length>0&&<section className="bundle-group" aria-label="Aufgabenpakete mit Nachholbedarf">
   <h3>Mit Nachholbedarf <small>{attention.length}</small></h3>
   <p>Hier sind echte Deadlines oder einzelne geplante Schritte überschritten. Die gesamte Hauptaufgabe bleibt erhalten.</p>
   {attention.map(renderBundle)}
  </section>}
  {other.length>0&&<section className="bundle-group" aria-label="Laufende Aufgabenpakete">
   <h3>Weitere laufende Aufgabenpakete <small>{other.length}</small></h3>
   {other.map(renderBundle)}
  </section>}
  {showCompleted&&finished.length>0&&<section className="bundle-group" aria-label="Abgeschlossene Aufgabenpakete">
   <h3>Abgeschlossene Aufgabenpakete <small>{finished.length}</small></h3>
   {finished.map(renderBundle)}
  </section>}
 </div>;
}

export function TaskBundlesPreview({tasks,today,onOpen,onAll}:{
 tasks:Task[];today:string;onOpen:(task:Task)=>void;onAll:()=>void;
}){
 const bundles=taskBundles(tasks,today).slice(0,3);
 if(!bundles.length)return null;
 const count=taskBundles(tasks,today).length;
 return <section className="bundles-today-preview" aria-label="Laufende Aufgabenpakete">
  <div className="bundles-preview-heading">
   <div><h2><Layers3 size={17} aria-hidden="true"/> Laufende Aufgabenpakete</h2>
    <p>Der gesamte Vorgang bleibt sichtbar, nicht nur die für heute geplanten Schritte.</p></div>
   <button type="button" onClick={onAll}>Alle {count} ansehen</button>
  </div>
  <div className="bundles-preview-list">
   {bundles.map(bundle=><button key={bundle.task.id} type="button" onClick={()=>onOpen(bundle.task)}
    className="bundles-preview-row" aria-label={`Hauptaufgabe ${bundle.task.title} öffnen`}>
    <span className="bundles-preview-title">{bundle.task.title}</span>
    <span className="bundles-preview-progress">{bundle.done}/{bundle.total} erledigt</span>
    <span className="bundles-preview-track"><i style={{width:Math.round(bundle.done*100/bundle.total)+'%'}}/></span>
    {bundle.overdueSteps.length>0&&<small>{bundle.overdueSteps.length} ${bundle.overdueSteps.length===1?'Schritt':'Schritte'} überfällig</small>}
    {bundle.parentDeadlineOverdue&&bundle.overdueSteps.length===0&&<small>Deadline überschritten</small>}
   </button>)}
  </div>
 </section>;
}
