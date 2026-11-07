import {useMemo,useState} from 'react';
import {AlertTriangle,CalendarCheck2,CalendarClock,CalendarDays,ChevronLeft,ChevronRight,Clock3,Plus} from 'lucide-react';
import {formatDate,weekdayShort} from '../date';
import {deadlineWorkday} from '../relativePlanning';
import {
 budgetForDay,dayCalendarItems,monthCalendarItems,monthCalendarSummary,monthGridDates,
 monthShift,selectedDateAfterShift,type CalendarItem
} from '../monthCalendar';
import {formatDuration,violatesDeadline} from '../weeklyPlanner';
import type {Project,Task} from '../types';

const monthName=(month:string)=>new Intl.DateTimeFormat('de-DE',{
 month:'long',year:'numeric',timeZone:'Europe/Berlin'
}).format(new Date(month+'-01T12:00:00Z'));

export function MonthCalendar({
 tasks,projects,budgets,today,onEdit,onMove,onCreate,onOpenWeek
}:{
 tasks:Task[];projects:Project[];budgets:(number|null)[];today:string;
 onEdit:(task:Task)=>void;
 onMove:(taskId:string,subtaskId:string|undefined,date:string|null,expectedVersion:string)=>void;
 onCreate:(date:string)=>void;onOpenWeek:()=>void;
}){
 const [month,setMonth]=useState(today.slice(0,7));
 const [selected,setSelected]=useState(today);
 const dates=useMemo(()=>monthGridDates(month),[month]);
 const items=useMemo(()=>monthCalendarItems(tasks,month),[tasks,month]);
 const summary=useMemo(()=>monthCalendarSummary(items,month),[items,month]);
 const chosenItems=useMemo(()=>dayCalendarItems(items,selected),[items,selected]);
 const chosenWork=chosenItems.filter((x):x is Extract<CalendarItem,{kind:'work'}>=>x.kind==='work');
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
 const move=(item:Extract<CalendarItem,{kind:'work'}>,date:string|null)=>{
  if(item.entry.date===date)return;
  if(violatesDeadline(item.entry,date)&&
   !window.confirm('Dieser Arbeitstag liegt nach dem letzten möglichen Fertigstellungstag. Trotzdem so einplanen?'))return;
  if(item.entry.relative&&date!==item.entry.date&&
   !window.confirm('Diese Unteraufgabe ist relativ zur Deadline geplant. Beim Verschieben wird diese Verknüpfung gelöst. Fortfahren?'))return;
  onMove(item.taskId,item.entry.subtaskId,date,item.taskUpdatedAt);
 };
 const datesWithEntries=new Map<string,CalendarItem[]>();
 for(const item of items){
  const group=datesWithEntries.get(item.date)??[];
  group.push(item);datesWithEntries.set(item.date,group);
 }
 return <section className="month-calendar" aria-label="Monatskalender">
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
  <div className="month-legend" aria-label="Legende">
   <span><i className="legend-work"/> Arbeit eingeplant</span>
   <span><i className="legend-ready"/> Spätestens fertig</span>
   <span><i className="legend-required"/> Bereits benötigt</span>
  </div>
  <div className="month-weekdays" aria-hidden="true">
   {[1,2,3,4,5,6,0].map(i=><span key={i}>{weekdayShort[i]}</span>)}
  </div>
  <div className="month-grid" role="group" aria-label={`Kalender ${monthName(month)}`}>
   {dates.map(date=>{
    const daily=datesWithEntries.get(date)??[];
    const work=daily.filter(e=>e.kind==='work').length;
    const ready=daily.filter(e=>e.kind==='ready').length;
    const required=daily.filter(e=>e.kind==='required').length;
    const examples=daily.slice(0,2);
    return <button key={date} type="button"
     className={['month-day',date.slice(0,7)!==month?'outside':'',date===today?'current':'',date===selected?'selected':''].filter(Boolean).join(' ')}
     aria-label={`${formatDate(date)}: ${work} Arbeitsaufgaben, ${ready} bis dahin fertig, ${required} benötigt`}
     aria-pressed={date===selected} onClick={()=>changeDay(date)}>
     <span className="month-day-number">{Number(date.slice(-2))}{date===today&&<span className="month-today-dot" aria-label="Heute"/>}</span>
     <span className="month-day-preview">
      {examples.map(item=><span key={item.key} className={`month-entry-chip ${item.kind}`} title={
       item.kind==='work'?`Geplant: ${item.entry.title}`:
       item.kind==='ready'?`Spätestens fertig: ${item.title}`:`Bereits benötigt: ${item.title}`
      }>{item.kind==='work'?item.entry.title:item.kind==='ready'?'Fertig: '+item.title:'Benötigt: '+item.title}</span>)}
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
      {missing? ` + ${missing} ohne Schätzung`:''}
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
      <div className={`month-detail-symbol ${item.kind}`}>
       {item.kind==='work'?<Clock3 size={17} aria-hidden="true"/>:
        item.kind==='ready'?<CalendarCheck2 size={17} aria-hidden="true"/>:
        <CalendarClock size={17} aria-hidden="true"/>}
      </div>
      <div className="month-detail-body">
       <span className="month-detail-kind">{item.kind==='work'?'Eingeplanter Arbeitstag':
        item.kind==='ready'?'Spätestens an diesem Tag fertigstellen':'An diesem Tag bereits benötigt'}</span>
       <button type="button" className="month-detail-name"
        aria-label={`Aufgabe „${detailTitle}“ öffnen`} onClick={()=>open(item)}>{detailTitle}</button>
       {item.kind==='work'&&item.entry.parentTitle&&<span className="month-detail-parent">Unteraufgabe von {item.entry.parentTitle}</span>}
       {project&&<span className="month-detail-project"><i style={{background:project.color}} aria-hidden="true"/>{project.name}</span>}
       {item.kind==='work'&&<span className="month-detail-minutes">
        {item.entry.estimatedMinutes===null?'Dauer noch nicht geschätzt':formatDuration(item.entry.estimatedMinutes)}
        {item.entry.deadlineDate?` · ab ${formatDate(item.entry.deadlineDate)} benötigt`:''}
       </span>}
       {item.kind==='ready'&&<span className="month-detail-warning">
        Die Deadline ist {formatDate(item.deadlineDate)}. Ab diesem Tag muss alles bereit sein.</span>}
       {item.kind==='required'&&<span className="month-detail-warning">
        Letzter Fertigstellungstag: {formatDate(deadlineWorkday(item.deadlineDate))}.</span>}
      </div>
      {item.kind==='work'&&<label className="month-detail-date">
       <span>Arbeitstag ändern</span>
       <input type="date" aria-label={`${item.entry.title} Arbeitstag im Monatskalender`}
        value={item.entry.date} onChange={e=>move(item,e.target.value||null)}/>
       {isRelative&&<small>Ändern löst relativen Abstand</small>}
      </label>}
      {item.kind!=='work'&&<button type="button" className="month-edit-deadline"
       onClick={()=>open(item)}>Aufgabe öffnen</button>}
     </article>;
    })}
   </div>}
  </section>
  <p className="month-footnote"><CalendarDays size={15} aria-hidden="true"/>
   Ein Kalenderpunkt ist kein automatisch erzeugter Termin: Wiederholungen zeigen nur ihren nächsten geplanten Arbeitstag. Deadlines erscheinen sowohl am letzten Fertigstellungstag als auch am Tag, an dem alles benötigt wird. Du bestimmst deine Arbeitstage selbst.</p>
 </section>;
}
