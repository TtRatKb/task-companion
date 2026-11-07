import {CalendarDays,Clock3,Flag,Layers3} from 'lucide-react';
import {formatDate} from '../date';
import {formatDuration} from '../weeklyPlanner';
import {deadlineWorkday} from '../relativePlanning';
import type {FocusedStep} from '../focusedSteps';
import type {Project} from '../types';

export function FocusedSteps({
 entries,title,description,projects,onComplete,onEdit,today
}:{
 entries:FocusedStep[];title:string;description?:string;projects:Project[];
 onComplete:(taskId:string,stepId:string)=>void;
 onEdit:(taskId:string)=>void;today:string;
}){
 if(entries.length===0)return null;
 return <section className="focused-steps" aria-label={title}>
  <div className="focused-steps-head">
   <h2>{title} <small>{entries.length}</small></h2>
   {description&&<p>{description}</p>}
  </div>
  <div className="focused-step-list">
   {entries.map(item=>{
    const project=projects.find(p=>p.id===item.projectId);
    const missed=item.plannedDate<today;
    const lastDay=item.deadlineDate?deadlineWorkday(item.deadlineDate):null;
    return <article className={missed?'focused-step-row missed':'focused-step-row'} key={item.taskId+':'+item.stepId}>
     <button className={'complete p'+item.priority}
      aria-label={`„${item.title}“ erledigen (aus „${item.taskTitle}“)`}
      title="Schritt abhaken"
      onClick={()=>onComplete(item.taskId,item.stepId)}/>
     <div className="focused-step-body">
      <strong>{item.title}</strong>
      <div className="focused-step-parent">
       <Layers3 size={13} aria-hidden="true"/>
       <button type="button" onClick={()=>onEdit(item.taskId)}
        aria-label={`Hauptaufgabe „${item.taskTitle}“ öffnen`}>{item.taskTitle}</button>
       <span>· {item.completedCount}/{item.totalCount} Schritte erledigt</span>
      </div>
      <div className="focused-step-meta">
       {missed&&<span className="focused-step-overdue"><CalendarDays size={12} aria-hidden="true"/> Geplant war {formatDate(item.plannedDate)}</span>}
       {!missed&&<span><CalendarDays size={12} aria-hidden="true"/> Heute geplant</span>}
       {item.estimatedMinutes!==null&&<span><Clock3 size={12} aria-hidden="true"/>{formatDuration(item.estimatedMinutes)}</span>}
       {item.deadlineDate&&<span className={lastDay&&lastDay<today?'focused-step-overdue':''}>
        <Flag size={12} aria-hidden="true"/> Benötigt {formatDate(item.deadlineDate)}
       </span>}
       {project&&<span className="focused-step-project"><i style={{background:project.color}} aria-hidden="true"/>{project.name}</span>}
      </div>
     </div>
    </article>;
   })}
  </div>
 </section>;
}
