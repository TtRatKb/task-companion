import {useState} from 'react';
import {AlertTriangle,CalendarClock,ChevronLeft,ChevronRight,Clock3} from 'lucide-react';
import {addDays,formatDate,weekdayShort} from '../date';
import {deadlineWorkday} from '../relativePlanning';
import {formatDuration,mondayOf,unscheduledEntries,violatesDeadline,weekDays,type WeekEntry} from '../weeklyPlanner';
import type {Project,Task} from '../types';

export function WeekPlanner({
 tasks,projects,budgets,today,onMove,onBudgetChange,onEdit
}:{
 tasks:Task[];projects:Project[];budgets:(number|null)[];today:string;
 onMove:(taskId:string,subtaskId:string|undefined,date:string|null)=>void;
 onBudgetChange:(day:number,minutes:number|null)=>void;
 onEdit:(task:Task)=>void;
}){
 const [week,setWeek]=useState(()=>mondayOf(today));
 const days=weekDays(tasks,week,budgets);
 const unknown=days.reduce((n,d)=>n+d.unestimated,0);
 const minutes=days.reduce((n,d)=>n+d.knownMinutes,0);
 const overloaded=days.filter(d=>d.overBudget).length;
 const unplanned=unscheduledEntries(tasks);
 const dayEnd=addDays(week,6);
 const move=(item:WeekEntry,date:string|null)=>{
  if(violatesDeadline(item,date)&&!confirm('Dieser Arbeitstermin liegt nach dem letzten möglichen Fertigstellungstag. Trotzdem so einplanen?'))return;
  if(item.relative&&date!==item.date&&!confirm('Diese Unteraufgabe hat einen Abstand zur Hauptdeadline. Durch das Verschieben wird die automatische Verknüpfung für diesen Schritt gelöst. Fortfahren?'))return;
  onMove(item.taskId,item.subtaskId,date);
 };
 const budgetChange=(index:number,input:HTMLInputElement)=>{
  const raw=input.value.trim();
  if(!raw){if(budgets[index]!==null)onBudgetChange(index,null);return}
  const value=Number(raw);
  if(!Number.isInteger(value)||value<0||value>1440){
   input.value=String(budgets[index]??'');
   return;
  }
  if(value!==budgets[index])onBudgetChange(index,value);
 };
 const entryRow=(item:WeekEntry)=>(
  <div className="week-entry" key={item.key}>
   <div className="week-entry-text">
    <button className="week-entry-title" type="button" onClick={()=>{const task=tasks.find(t=>t.id===item.taskId);if(task)onEdit(task)}}>
     {item.title}
    </button>
    {item.parentTitle&&<small>{item.parentTitle}</small>}
    {item.projectId&&projects.some(p=>p.id===item.projectId)&&<small>{projects.find(p=>p.id===item.projectId)?.name}</small>}
    <span className="week-entry-meta">
     {item.estimatedMinutes!==null?<span><Clock3 aria-hidden="true" size={12}/>{formatDuration(item.estimatedMinutes)}</span>:<span className="week-unsized">Dauer offen</span>}
     {item.deadlineDate&&<span className={item.date>deadlineWorkday(item.deadlineDate)?'week-late-plan':''}>
       <CalendarClock aria-hidden="true" size={12}/> Benötigt {formatDate(item.deadlineDate)}
      </span>}
    </span>
   </div>
   <label className="week-move-label" title={item.relative?'Datum ändern (löst den Abstand zur Hauptdeadline)':'Arbeitstag verschieben'}>
    <span>Arbeitstag ändern</span>
    <input type="date" aria-label={`${item.title} Arbeitstag`} value={item.date}
      onChange={e=>move(item,e.target.value||null)}/>
   </label>
  </div>
 );
 return <section className="week-planner" aria-label="Wochenplanung">
  <div className="week-toolbar">
   <div>
    <h2>Deine Woche im Blick</h2>
    <p>Plane deine Arbeitszeit selbst. Aufgaben und Unteraufgaben werden nicht automatisch verschoben.</p>
   </div>
   <div className="week-nav">
    <button type="button" aria-label="Vorherige Woche" onClick={()=>setWeek(addDays(week,-7))}><ChevronLeft size={18}/></button>
    <button type="button" onClick={()=>setWeek(mondayOf(today))}>Diese Woche</button>
    <button type="button" aria-label="Nächste Woche" onClick={()=>setWeek(addDays(week,7))}><ChevronRight size={18}/></button>
   </div>
  </div>
  <div className="week-range" aria-live="polite">
   <strong>{formatDate(week)} – {formatDate(dayEnd)}</strong>
   <span>{formatDuration(minutes)} geschätzt
    {unknown>0?` · ${unknown} ${unknown===1?'Eintrag ohne Schätzung':'Einträge ohne Schätzung'}`:''}
    {overloaded>0?` · ${overloaded} ${overloaded===1?'Tag':'Tage'} über Budget`:''}
   </span>
  </div>
  <p className="week-budget-hint">
   <Clock3 size={15} aria-hidden="true"/>
   Trage pro Wochentag deine verfügbare Zeit in Minuten ein (optional). Ohne Budget wird keine Überlastung behauptet.
   Geschätzte Unteraufgaben zählen einzeln; eine zusätzliche Schätzung der Hauptaufgabe wird dann nicht noch einmal addiert.
  </p>
  <div className="week-grid">
   {days.map((day,index)=><section key={day.date} className={`week-day ${day.date===today?'is-today':''} ${day.overBudget?'over-capacity':''}`} aria-label={`Planung ${formatDate(day.date)}`}>
    <div className="week-day-top">
     <span className="week-day-title">{weekdayShort[(index+1)%7]} · {formatDate(day.date)}</span>
     {day.date===today&&<span className="week-today-chip">Heute</span>}
    </div>
    <div className="week-load">
     <strong>{formatDuration(day.knownMinutes)}</strong>
     <span>{day.budgetMinutes===null?'ohne Zeitbudget':`von ${formatDuration(day.budgetMinutes)}`}</span>
    </div>
    {day.budgetMinutes!==null&&
     <div className="week-budget-bar" aria-hidden="true">
      <span style={{width:`${day.budgetMinutes===0?(day.knownMinutes>0?100:0):Math.min(100,day.knownMinutes/day.budgetMinutes*100)}%`}}/>
     </div>}
    {day.overBudget&&<p className="week-overload"><AlertTriangle size={13} aria-hidden="true"/> Mindestens {formatDuration(day.knownMinutes-day.budgetMinutes!)} über Budget</p>}
    {day.unestimated>0&&<small className="week-unknown">{day.unestimated} {day.unestimated===1?'Eintrag':'Einträge'} ohne Zeitschätzung</small>}
    <label className="week-capacity">
     Tagesbudget (Min.)
     <input type="number" min="0" max="1440" step="15" placeholder="–" aria-label={`Zeitbudget ${weekdayShort[(index+1)%7]}`}
      key={`${index}-${day.budgetMinutes}`}
      defaultValue={day.budgetMinutes??''}
      onBlur={e=>budgetChange(index,e.currentTarget)}
      onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}}}/>
    </label>
    <div className="week-day-entries">
     {day.entries.length?day.entries.map(entryRow):<p className="week-day-empty">Noch nichts eingeplant</p>}
    </div>
   </section>)}
  </div>
  <section className="week-unscheduled">
   <div className="week-unscheduled-head">
    <h3>Ohne Arbeitstag <small>{unplanned.length}</small></h3>
    <p>Hier kannst du Aufgaben und einzelne Schritte direkt terminieren – ohne ihre Deadline zu ändern.</p>
   </div>
   {unplanned.length>0?<div className="week-unplanned-list">{unplanned.slice(0,16).map(entryRow)}</div>
    :<p className="week-day-empty">Alle offenen Aufgaben und Schritte haben bereits einen Arbeitstag.</p>}
   {unplanned.length>16&&<p className="week-unknown">16 von {unplanned.length} Einträgen angezeigt. Weitere Aufgaben lassen sich im Aufgabeneditor einplanen.</p>}
  </section>
 </section>;
}
