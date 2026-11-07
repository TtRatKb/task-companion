import {useMemo,useRef,useState,type DragEvent} from 'react';
import {AlertTriangle,CalendarCheck2,CalendarClock,CalendarDays,Check,CheckCircle2,ChevronDown,ChevronLeft,ChevronRight,ChevronUp,Clock3,GripVertical,ListTodo,Plus,X} from 'lucide-react';
import {formatDate,weekdayShort} from '../date';
import {deadlineWorkday} from '../relativePlanning';
import {
 budgetForDay,dayCalendarItems,monthCalendarItems,monthCalendarSummary,monthGridDates,
 monthShift,selectedDateAfterShift,type CalendarItem
} from '../monthCalendar';
import {formatDuration,violatesDeadline} from '../weeklyPlanner';
import {calendarBacklog,type CalendarPlanStatus,type PlanningEntry} from '../calendarPlanning';
import type {CalendarExecutionStatus,CalendarExecutionMode} from '../calendarExecution';
import type {Project,Task} from '../types';

const monthName=(month:string)=>new Intl.DateTimeFormat('de-DE',{
 month:'long',year:'numeric',timeZone:'Europe/Berlin'
}).format(new Date(month+'-01T12:00:00Z'));

export function MonthCalendar({
 tasks,projects,budgets,today,onEdit,onSchedule,onExecute,onCreate,onOpenWeek
}:{
 tasks:Task[];projects:Project[];budgets:(number|null)[];today:string;
 onEdit:(task:Task)=>void;
 onSchedule:(key:string,expectedVersion:string,date:string|null)=>CalendarPlanStatus;
 onExecute:(taskId:string,stepId:string|undefined,expectedVersion:string,mode:CalendarExecutionMode)=>CalendarExecutionStatus;
 onCreate:(date:string)=>void;onOpenWeek:()=>void;
}){
 const [month,setMonth]=useState(today.slice(0,7));
 const [selected,setSelected]=useState(today);
 const [projectFilter,setProjectFilter]=useState('all');
 const [showCompleted,setShowCompleted]=useState(false);
 const [executionError,setExecutionError]=useState('');
 const visibleTasks=useMemo(()=>projectFilter==='all'?tasks:
  tasks.filter(task=>projectFilter==='inbox'?task.projectId===null:task.projectId===projectFilter),
  [tasks,projectFilter]);
 const [choosing,setChoosing]=useState<PlanningEntry|null>(null);
 const [dragging,setDragging]=useState<PlanningEntry|null>(null);
 const [hoverDate,setHoverDate]=useState('');
 const [planningError,setPlanningError]=useState('');
 const [backlogOpen,setBacklogOpen]=useState(true);
 const [showAllBacklog,setShowAllBacklog]=useState(false);
 const dragRef=useRef<PlanningEntry|null>(null);
 const backlog=useMemo(()=>calendarBacklog(visibleTasks),[visibleTasks]);
 const shownBacklog=backlog.slice(0,showAllBacklog?30:5);
 const dates=useMemo(()=>monthGridDates(month),[month]);
 const items=useMemo(()=>monthCalendarItems(visibleTasks,month,showCompleted),[visibleTasks,month,showCompleted]);
 const summary=useMemo(()=>monthCalendarSummary(items,month),[items,month]);
 const chosenItems=useMemo(()=>dayCalendarItems(items,selected),[items,selected]);
 const chosenWork=chosenItems.filter((x):x is Extract<CalendarItem,{kind:'work'}>=>x.kind==='work');
 const chosenCompleted=chosenItems.filter(item=>item.kind==='done').length;
 const estimated=chosenWork.reduce((n,x)=>n+(x.entry.estimatedMinutes??0),0);
 const missing=chosenWork.filter(x=>x.entry.estimatedMinutes===null).length;
 const budget=budgetForDay(selected,budgets);
 const overBudget=budget!==null&&estimated>budget;
 const setMonthAndDay=(nextMonth:string)=>{
  setSelected(day=>selectedDateAfterShift(day,nextMonth));
  setMonth(nextMonth);
 };
 const open=(item:CalendarItem)=>{
  const task=tasks.find(t=>t.id===item.taskId);
  if(task)onEdit(task);
 };
 const changeDay=(date:string)=>{
  setSelected(date);
  if(date.slice(0,7)!==month)setMonth(date.slice(0,7));
 };
 const clearPlanning=()=>{setChoosing(null);setDragging(null);dragRef.current=null;setHoverDate('')};
 const execute=(item:CalendarItem,mode:CalendarExecutionMode)=>{
  if(item.kind!=='work'&&item.kind!=='done')return;
  if(item.kind==='done'&&!item.subtaskId)return;
  const task=tasks.find(t=>t.id===item.taskId);
  if(!task)return;
  if(mode==='complete'&&!('subtaskId' in item&&item.subtaskId)&&task.recurrence&&
   (task.deadlineDate||task.subtasks?.some(s=>!!s.plannedDate))&&
   !window.confirm('Bei dieser wiederkehrenden Aufgabe werden die Häkchen nach Abschluss zurückgesetzt und der nächste Hauptarbeitstag eingetragen. Die Deadline und einzelne Unteraufgabentermine bleiben unverändert. Trotzdem abschließen?'))return;
  const stepId=item.kind==='work'?item.entry.subtaskId:item.subtaskId;
  const status=onExecute(item.taskId,stepId,item.taskUpdatedAt,mode);
  if(status==='changed'){setExecutionError('');return}
  setExecutionError(status==='conflict'?
   'Die Aufgabe wurde inzwischen verändert. Bitte den aktualisierten Eintrag erneut auswählen.':
   status==='blocked'?'Diese wiederkehrende Aufgabe kann erst ab ihrem geplanten Arbeitstag abgeschlossen werden.':
   'Dieser Schritt kann nicht mehr so geändert werden. Bitte die aktuelle Aufgabe prüfen.');
 };
 const chooseWork=(work:PlanningEntry)=>{clearPlanning();setChoosing(work);setPlanningError('')};
 const plan=(work:PlanningEntry,date:string|null)=>{
  if((work.entry.date||null)===date){clearPlanning();setPlanningError('');return}
  if(violatesDeadline(work.entry,date)&&
   !window.confirm('Dieser Arbeitstag liegt nach dem letzten möglichen Fertigstellungstag. Trotzdem so einplanen?'))return;
  if(work.entry.relative&&
   !window.confirm('Diese Unteraufgabe ist relativ zur Deadline geplant. Durch das Verschieben wird ihre automatische Verknüpfung gelöst. Fortfahren?'))return;
  const status=onSchedule(work.entry.key,work.version,date);
  if(status==='moved'||status==='unchanged'){
   clearPlanning();setPlanningError('');
   if(date){setSelected(date);if(date.slice(0,7)!==month)setMonth(date.slice(0,7))}
  }else setPlanningError(status==='conflict'
   ?'Die Aufgabe wurde inzwischen geändert. Bitte die aktuelle Planung prüfen und erneut auswählen.'
   :'Der Schritt ist nicht mehr verfügbar. Bitte die aktuelle Aufgabenliste prüfen.');
 };
 const dragStart=(event:DragEvent<HTMLElement>,work:PlanningEntry)=>{
  dragRef.current=work;
  setDragging(work);setChoosing(null);setPlanningError('');
  event.dataTransfer.effectAllowed='move';
  event.dataTransfer.setData('text/plain','task-companion:'+work.entry.key);
 };
 const dragEnd=()=>{dragRef.current=null;setDragging(null);setHoverDate('')};
 const dropOnDay=(event:DragEvent<HTMLElement>,date:string)=>{
  const source=dragRef.current;
  if(!source)return;
  event.preventDefault();event.stopPropagation();
  dragEnd();
  plan(source,date);
 };
 const dayClick=(date:string)=>{
  if(choosing){plan(choosing,date);return}
  changeDay(date);
 };
 const datesWithEntries=new Map<string,CalendarItem[]>();
 for(const item of items){
  const group=datesWithEntries.get(item.date)??[];
  group.push(item);datesWithEntries.set(item.date,group);
 }
 return <section className="month-calendar" aria-label="Monatskalender"
  onKeyDown={event=>{if(event.key==='Escape'&&choosing){event.preventDefault();clearPlanning();setPlanningError('')}}}>
  <header className="month-toolbar">
   <div>
    <h2>Dein Monat im Überblick</h2>
    <p>Arbeitstage, Checklisten-Schritte und Deadlines – klar voneinander getrennt.</p>
   </div>
   <div className="month-navigation">
    <button type="button" aria-label="Vorheriger Monat" onClick={()=>setMonthAndDay(monthShift(month,-1))}><ChevronLeft size={18}/></button>
    <button type="button" onClick={()=>{setMonth(today.slice(0,7));setSelected(today)}}>Dieser Monat</button>
    <button type="button" aria-label="Nächster Monat" onClick={()=>setMonthAndDay(monthShift(month,1))}><ChevronRight size={18}/></button>
   </div>
  </header>
  <div className="month-summary">
   <div><h3 aria-live="polite">{monthName(month)}</h3>
    <p>{summary.workCount} {summary.workCount===1?'Arbeitsschritt':'Arbeitsschritte'} · {summary.readyCount} {summary.readyCount===1?'Fertigstellungstermin':'Fertigstellungstermine'}</p>
   </div>
   <div className="month-summary-right">
    <strong>{formatDuration(summary.knownMinutes)} geplant</strong>
    {summary.unestimated>0&&<small>+ {summary.unestimated} ohne Zeitschätzung</small>}
   </div>
  </div>
  <div className="month-display-options" role="group" aria-label="Kalenderansicht filtern">
   <label>Projekt
    <select aria-label="Kalender nach Projekt filtern" value={projectFilter}
     onChange={event=>{setProjectFilter(event.target.value);clearPlanning();setPlanningError('');setExecutionError('')}}>
     <option value="all">Alle Projekte</option>
     <option value="inbox">Ohne Projekt (Eingang)</option>
     {projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
   </label>
   <label className="month-done-filter">
    <input type="checkbox" checked={showCompleted} onChange={event=>setShowCompleted(event.target.checked)}/>
    Erledigte anzeigen
   </label>
   {projectFilter!=='all'&&<button type="button" className="month-reset-project"
    onClick={()=>{setProjectFilter('all');clearPlanning()}}>Alle Projekte zeigen</button>}
  </div>
  <div className="month-legend" aria-label="Legende">
   <span><i className="legend-work"/> Arbeit eingeplant</span>
   <span><i className="legend-ready"/> Spätestens fertig</span>
   <span><i className="legend-required"/> Bereits benötigt</span>
   {showCompleted&&<span><i className="legend-done"/> Erledigt</span>}
  </div>
  <section className="month-backlog" aria-label="Aufgaben ohne Arbeitstag">
   <header className="month-backlog-heading">
    <button type="button" className="month-backlog-toggle" aria-expanded={backlogOpen}
     onClick={()=>setBacklogOpen(open=>!open)}>
     <ListTodo size={17} aria-hidden="true"/>
     <strong>Ohne Arbeitstag <small>{backlog.length}</small></strong>
     {backlogOpen?<ChevronUp size={16} aria-hidden="true"/>:<ChevronDown size={16} aria-hidden="true"/>}
    </button>
    <p>Schritt am Griff auf einen Tag ziehen oder „Tag wählen“ klicken.</p>
   </header>
   {backlogOpen&&(backlog.length===0?
    <p className="month-backlog-empty">Alles hat bereits einen Arbeitstag – nice! ✨</p>:
    <>
     <div className="month-backlog-list">
      {shownBacklog.map(work=><div className="month-backlog-row" key={work.entry.key}>
       <button type="button" className="month-drag-handle" draggable
        aria-label={`„${work.entry.title}“ auf einen Kalendertag ziehen`}
        title="Auf einen Kalendertag ziehen" onDragStart={event=>dragStart(event,work)} onDragEnd={dragEnd}>
        <GripVertical size={16}/>
       </button>
       <div className="month-backlog-info">
        <button type="button" onClick={()=>{
         const parent=tasks.find(t=>t.id===work.entry.taskId);if(parent)onEdit(parent);
        }} aria-label={`„${work.entry.title}“ bearbeiten`}>{work.entry.title}</button>
        <small>{work.entry.parentTitle&&`Aus: ${work.entry.parentTitle} · `}
         {work.entry.estimatedMinutes!==null?formatDuration(work.entry.estimatedMinutes):'ohne Zeitangabe'}
         {work.entry.deadlineDate&&` · benötigt ${formatDate(work.entry.deadlineDate)}`}</small>
       </div>
       <button type="button" className="month-pick-date"
        aria-label={`„${work.entry.title}“ Termin wählen`}
        onClick={()=>chooseWork(work)}>Tag wählen</button>
      </div>)}
     </div>
     {backlog.length>5&&!showAllBacklog&&<button className="month-more-backlog" type="button"
      onClick={()=>setShowAllBacklog(true)}>Weitere Aufgaben anzeigen ({backlog.length-5})</button>}
     {showAllBacklog&&backlog.length>30&&<p className="month-backlog-limit">
      30 von {backlog.length} angezeigt. Weitere Aufgaben kannst du über die Wochenplanung einplanen.</p>}
    </>)}
  </section>
  {(choosing||dragging)&&<div className="month-planning-prompt" role="status">
   <strong>{dragging?'Auf einen Kalendertag ziehen':'Jetzt Kalendertag auswählen'}:</strong>
   <span>{(choosing??dragging)?.entry.title}</span>
   <button type="button" onClick={()=>{clearPlanning();setPlanningError('')}}
    aria-label="Planungsauswahl abbrechen"><X size={15}/> Abbrechen</button>
  </div>}
  {executionError&&<p className="month-planning-error" role="alert">{executionError}
   <button type="button" onClick={()=>setExecutionError('')}>Schließen</button></p>}
  {planningError&&<p className="month-planning-error" role="alert">{planningError}
   <button type="button" onClick={()=>setPlanningError('')}>Schließen</button></p>}
  <div className="month-weekdays" aria-hidden="true">
   {[1,2,3,4,5,6,0].map(i=><span key={i}>{weekdayShort[i]}</span>)}
  </div>
  <div className="month-grid" role="group" aria-label={`Kalender ${monthName(month)}`}>
   {dates.map(date=>{
    const daily=datesWithEntries.get(date)??[];
    const work=daily.filter(e=>e.kind==='work').length;
    const ready=daily.filter(e=>e.kind==='ready').length;
    const required=daily.filter(e=>e.kind==='required').length;
    const done=daily.filter(e=>e.kind==='done').length;
    const examples=daily.slice(0,2);
    return <button key={date} type="button"
     className={['month-day',date.slice(0,7)!==month?'outside':'',date===today?'current':'',date===selected?'selected':'',
      choosing||dragging?'plan-target':'',hoverDate===date?'plan-hover':''].filter(Boolean).join(' ')}
     aria-label={`${formatDate(date)}: ${work} Arbeitsaufgaben, ${ready} bis dahin fertig, ${required} benötigt${showCompleted?`, ${done} erledigt`:''}`}
     aria-pressed={date===selected} onClick={()=>dayClick(date)}
     onDragOver={event=>{if(dragRef.current){event.preventDefault();event.dataTransfer.dropEffect='move';setHoverDate(date)}}}
     onDragLeave={()=>setHoverDate(current=>current===date?'':current)}
     onDrop={event=>dropOnDay(event,date)}> 
     <span className="month-day-number">{Number(date.slice(-2))}{date===today&&<span className="month-today-dot" aria-label="Heute"/>}</span>
     <span className="month-day-preview">
      {examples.map(item=><span key={item.key} className={`month-entry-chip ${item.kind}`}
       draggable={item.kind==='work'}
       onDragStart={event=>item.kind==='work'&&dragStart(event,{entry:item.entry,version:item.taskUpdatedAt})}
       onDragEnd={dragEnd} title={
       item.kind==='work'?`Geplant: ${item.entry.title}`:
       item.kind==='ready'?`Spätestens fertig: ${item.title}`:item.kind==='required'?`Bereits benötigt: ${item.title}`:`Erledigt: ${item.title}`
      }>{item.kind==='work'?item.entry.title:item.kind==='ready'?'Fertig: '+item.title:item.kind==='required'?'Benötigt: '+item.title:'✓ '+item.title}</span>)}
      {daily.length>2&&<span className="month-day-extra">+{daily.length-2} weitere</span>}
      {daily.length===0&&<span className="month-day-quiet">—</span>}
     </span>
    </button>;
   })}
  </div>
  <section className="month-selected-day" aria-label={`Tagesdetails ${formatDate(selected)}`}>
   <div className="month-selected-heading">
    <div><h3>{formatDate(selected)} {selected===today&&<small>Heute</small>}</h3>
     <p>{chosenWork.length} geplante {chosenWork.length===1?'Arbeit':'Arbeiten'} · {formatDuration(estimated)}
      {missing? ` + ${missing} ohne Schätzung`:''}{showCompleted&&chosenCompleted?` · ${chosenCompleted} erledigt`:''}
      {budget!==null?` von ${formatDuration(budget)} Tagesbudget`:''}
     </p>
    </div>
    <button type="button" className="primary" onClick={()=>onCreate(selected)}>
     <Plus size={15}/> Aufgabe für diesen Tag
    </button>
   </div>
   {overBudget&&<p className="month-budget-warning"><AlertTriangle size={14} aria-hidden="true"/>
    Mindestens {formatDuration(estimated-budget!)} über deinem Wochenplanungs-Budget. Nicht geschätzte Schritte kommen gegebenenfalls hinzu.</p>}
   {chosenItems.length===0?<div className="month-selected-empty">
    Für diesen Tag ist noch keine Arbeit oder Deadline eingetragen.
    <button type="button" onClick={onOpenWeek}>Ungeplante Aufgaben in der Wochenplanung ansehen</button>
   </div>:<div className="month-day-detail-rows">
    {chosenItems.map(item=>{
     const project=projects.find(p=>p.id===(item.kind==='work'?item.entry.projectId:item.projectId));
     const detailTitle=item.kind==='work'?item.entry.title:item.title;
     const isRelative=item.kind==='work'&&item.entry.relative;
     return <article className={`month-detail-row ${item.kind}`} key={item.key}>
      {item.kind==='work'&&<button type="button" className="month-complete-toggle"
       title="Schritt erledigen" aria-label={`„${item.entry.title}“ im Kalender erledigen`}
       onClick={()=>execute(item,'complete')}/>}
      {item.kind==='done'&&item.subtaskId&&<button type="button" className="month-complete-toggle completed"
       title="Unteraufgabe wieder öffnen"
       aria-label={`„${item.title}“ im Kalender wieder öffnen`}
       onClick={()=>execute(item,'reopen')}><Check size={13} aria-hidden="true"/></button>}
      <div className={`month-detail-symbol ${item.kind}`}>
       {item.kind==='work'?<Clock3 size={17} aria-hidden="true"/>:
        item.kind==='ready'?<CalendarCheck2 size={17} aria-hidden="true"/>:
        item.kind==='done'?<CheckCircle2 size={17} aria-hidden="true"/>:
        <CalendarClock size={17} aria-hidden="true"/>}
      </div>
      <div className="month-detail-body">
       <span className="month-detail-kind">{item.kind==='work'?'Eingeplanter Arbeitstag':
        item.kind==='ready'?'Spätestens an diesem Tag fertigstellen':item.kind==='done'?'Erledigt':'An diesem Tag bereits benötigt'}</span>
       <button type="button" className="month-detail-name"
        aria-label={`Aufgabe „${detailTitle}“ öffnen`} onClick={()=>open(item)}>{detailTitle}</button>
       {item.kind==='work'&&item.entry.parentTitle&&<span className="month-detail-parent">Unteraufgabe von {item.entry.parentTitle}</span>}
       {item.kind==='done'&&item.parentTitle&&<span className="month-detail-parent">Unteraufgabe von {item.parentTitle}</span>}
       {project&&<span className="month-detail-project"><i style={{background:project.color}} aria-hidden="true"/>{project.name}</span>}
       {item.kind==='work'&&<span className="month-detail-minutes">
        {item.entry.estimatedMinutes===null?'Dauer noch nicht geschätzt':formatDuration(item.entry.estimatedMinutes)}
        {item.entry.deadlineDate?` · ab ${formatDate(item.entry.deadlineDate)} benötigt`:''}
       </span>}
       {item.kind==='ready'&&<span className="month-detail-warning">
        Die Deadline ist {formatDate(item.deadlineDate)}. Ab diesem Tag muss alles bereit sein.</span>}
       {item.kind==='done'&&!item.subtaskId&&<span className="month-detail-minutes">Abgeschlossene Hauptaufgabe (am Abschlusstag angezeigt).</span>}
       {item.kind==='required'&&<span className="month-detail-warning">
        Letzter Fertigstellungstag: {formatDate(deadlineWorkday(item.deadlineDate))}.</span>}
      </div>
      {item.kind==='work'&&<div className="month-detail-grab">
       <button type="button" draggable className="month-drag-handle"
        aria-label={`„${item.entry.title}“ auf einen Kalendertag ziehen`}
        title="Am Griff auf einen anderen Kalendertag ziehen"
        onDragStart={event=>dragStart(event,{entry:item.entry,version:item.taskUpdatedAt})}
        onDragEnd={dragEnd}><GripVertical size={16}/></button>
       <button type="button" onClick={()=>chooseWork({entry:item.entry,version:item.taskUpdatedAt})}
        className="month-pick-date" aria-label={`„${item.entry.title}“ durch Klicken auf einen Kalendertag verschieben`}>
        Tag wählen
       </button>
      </div>}
      {item.kind==='work'&&<label className="month-detail-date">
       <span>Arbeitstag ändern</span>
       <input type="date" aria-label={`${item.entry.title} Arbeitstag im Monatskalender`}
        value={item.entry.date} onChange={e=>plan({entry:item.entry,version:item.taskUpdatedAt},e.target.value||null)}/>
       {isRelative&&<small>Ändern löst relativen Abstand</small>}
      </label>}
      {item.kind!=='work'&&<button type="button" className="month-edit-deadline"
       onClick={()=>open(item)}>Aufgabe öffnen</button>}
     </article>;
    })}
   </div>}
  </section>
  <p className="month-footnote"><CalendarDays size={15} aria-hidden="true"/>
   Ein Kalenderpunkt ist kein automatisch erzeugter Termin: Wiederholungen zeigen nur ihren nächsten geplanten Arbeitstag. Erledigte Einträge werden optional angezeigt; abgeschlossene wiederkehrende Durchläufe gehören nicht zur Kalenderhistorie. Deadlines erscheinen sowohl am letzten Fertigstellungstag als auch am Tag, an dem alles benötigt wird. Du bestimmst deine Arbeitstage selbst.</p>
 </section>;
}
