import {useEffect,useRef,useState,type FormEvent,type KeyboardEvent} from 'react';
import {ArrowRight,CalendarDays,CheckCircle2,CornerDownRight,Flag,FolderOpen,Keyboard,SkipForward,X} from 'lucide-react';
import {addDays,formatDate,todayLocal} from '../date';
import type {InboxTriagePatch,InboxTriageResult} from '../inboxTriage';
import type {Priority,Project,Task} from '../types';

function TriageStep({
 task,projects,today,onSave,onSkip,onClose,position,total
}:{
 task:Task;projects:Project[];today:string;
 onSave:(taskId:string,expectedUpdatedAt:string,patch:InboxTriagePatch)=>InboxTriageResult['status'];
 onSkip:()=>void;onClose:()=>void;position:number;total:number
}){
 const [draft,setDraft]=useState<InboxTriagePatch>({
  projectId:task.projectId,priority:task.priority,
  scheduledDate:task.scheduledDate,deadlineDate:task.deadlineDate
 });
 const [error,setError]=useState('');
 const focusRef=useRef<HTMLFormElement>(null);
 const projectRef=useRef<HTMLSelectElement>(null);
 const scheduleRef=useRef<HTMLInputElement>(null);
 const deadlineRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{focusRef.current?.focus()},[]);
 const submit=(event:FormEvent)=>{
  event.preventDefault();
  const result=onSave(task.id,task.updatedAt,draft);
  if(result==='conflict')setError('Diese Aufgabe wurde inzwischen auf einem anderen Gerät oder in einem anderen Fenster geändert. Schließe den Modus und prüfe die aktuelle Version, bevor du sie bearbeitest.');
  else if(result==='missing')setError('Diese Aufgabe ist inzwischen abgeschlossen oder nicht mehr verfügbar. Du kannst sie überspringen.');
  else if(result==='invalid')setError('Prüfe bitte das Projekt und die eingetragenen Daten.');
 };
 const keydown=(event:KeyboardEvent<HTMLFormElement>)=>{
  if(event.key==='Escape'){event.preventDefault();onClose();return}
  // Never steal typing, native date pickers, select menus or text composition.
  if(event.ctrlKey||event.altKey||event.metaKey||event.isComposing)return;
  const target=event.target as HTMLElement;
  if(target.closest('input,select,textarea,[contenteditable="true"]'))return;
  if(['1','2','3','4'].includes(event.key)){
   event.preventDefault();setDraft(v=>({...v,priority:Number(event.key) as Priority}));return;
  }
  switch(event.key.toLowerCase()){
   case 'h':event.preventDefault();setDraft(v=>({...v,scheduledDate:today}));break;
   case 'm':event.preventDefault();setDraft(v=>({...v,scheduledDate:addDays(today,1)}));break;
   case 'w':event.preventDefault();setDraft(v=>({...v,scheduledDate:addDays(today,7)}));break;
   case '0':event.preventDefault();setDraft(v=>({...v,scheduledDate:null}));break;
   case 'p':event.preventDefault();projectRef.current?.focus();break;
   case 'd':event.preventDefault();scheduleRef.current?.focus();break;
   case 'l':event.preventDefault();deadlineRef.current?.focus();break;
   case 's':event.preventDefault();onSkip();break;
   // Enter submits natively via the form. Do not override button semantics.
  }
 };
 const hasChanged=task.projectId!==draft.projectId||task.priority!==draft.priority||
  task.scheduledDate!==draft.scheduledDate||task.deadlineDate!==draft.deadlineDate;
 return <form key={task.id} className="inbox-triage-step" role="dialog" aria-modal="true"
  aria-labelledby="triage-title" ref={focusRef} tabIndex={-1} onSubmit={submit} onKeyDown={keydown}>
  <header className="triage-header">
   <div>
    <span className="triage-eyebrow">Eingang aufräumen · {position} von {total}</span>
    <h2 id="triage-title">{task.title}</h2>
   </div>
   <button type="button" className="icon-button" aria-label="Inbox-Turbo schließen" onClick={onClose}><X size={19}/></button>
  </header>
  <div className="triage-progress" role="progressbar" aria-valuenow={position-1} aria-valuemin={0}
   aria-valuemax={total} aria-label="Fortschritt im Durchlauf">
   <span style={{width:`${(position-1)/total*100}%`}}/>
  </div>
  {task.description&&<p className="triage-description">{task.description}</p>}
  {(task.subtasks?.length??0)>0&&
   <p className="triage-context">{task.subtasks?.length} Unteraufgaben vorhanden – sie bleiben beim Einsortieren unverändert.</p>}
  <div className="triage-fields">
   <label><span><FolderOpen aria-hidden="true" size={16}/> Projekt <kbd>P</kbd></span>
    <select aria-label="Projekt wählen" ref={projectRef} value={draft.projectId??''}
     onChange={e=>setDraft(v=>({...v,projectId:e.target.value||null}))}>
     <option value="">Eingang behalten</option>
     {projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
   </label>
   <fieldset className="triage-priorities">
    <legend>Priorität <small>Taste 1–4</small></legend>
    <div className="triage-priority-row">
     {([1,2,3,4] as Priority[]).map(priority=><button key={priority} type="button"
      aria-label={`Priorität P${priority}`} aria-pressed={draft.priority===priority}
      className={draft.priority===priority?`triage-priority p${priority} selected`:`triage-priority p${priority}`}
      onClick={()=>setDraft(v=>({...v,priority}))}>P{priority}</button>)}
    </div>
   </fieldset>
   <label><span><CalendarDays aria-hidden="true" size={16}/> Arbeitstag <kbd>D</kbd></span>
    <input ref={scheduleRef} type="date" aria-label="Arbeitstag wählen" value={draft.scheduledDate??''}
     onChange={e=>setDraft(v=>({...v,scheduledDate:e.target.value||null}))}/>
   </label>
   <label><span><Flag aria-hidden="true" size={16}/> Deadline <kbd>L</kbd></span>
    <input ref={deadlineRef} type="date" aria-label="Deadline wählen" value={draft.deadlineDate??''}
     onChange={e=>setDraft(v=>({...v,deadlineDate:e.target.value||null}))}/>
    <small>Am Deadline-Tag muss alles bereits fertig sein.</small>
   </label>
  </div>
  <div className="triage-shortcuts">
   <span>Arbeitstag mit einem Klick:</span>
   <div>
    <button type="button" className="ghost" onClick={()=>setDraft(v=>({...v,scheduledDate:today}))}>Heute <kbd>H</kbd></button>
    <button type="button" className="ghost" onClick={()=>setDraft(v=>({...v,scheduledDate:addDays(today,1)}))}>Morgen <kbd>M</kbd></button>
    <button type="button" className="ghost" onClick={()=>setDraft(v=>({...v,scheduledDate:addDays(today,7)}))}>In 7 Tagen <kbd>W</kbd></button>
    <button type="button" className="ghost" onClick={()=>setDraft(v=>({...v,scheduledDate:null}))}>Ohne Datum <kbd>0</kbd></button>
   </div>
  </div>
  {draft.scheduledDate&&<p className="triage-preview"><CalendarDays size={15}/> Geplant: {formatDate(draft.scheduledDate)}
   {draft.deadlineDate&&draft.scheduledDate>=draft.deadlineDate&&
    <strong className="triage-warning"> Achtung: Arbeitstag nicht vor der Deadline!</strong>}
  </p>}
  {error&&<div className="triage-error" role="alert">{error}</div>}
  <footer className="triage-footer">
   <button type="button" className="ghost" onClick={onSkip}><SkipForward size={16}/> Überspringen <kbd>S</kbd></button>
   <div>
    <button type="button" className="ghost" onClick={onClose}>Schließen <kbd>Esc</kbd></button>
    <button type="submit" className="primary">
     {hasChanged?'Speichern & nächste':'Weiter ohne Änderung'} <CornerDownRight size={16}/>
    </button>
   </div>
  </footer>
  <p className="triage-footnote">
   <Keyboard size={14} aria-hidden="true"/> Die Tastenkürzel funktionieren, solange kein Eingabefeld aktiv ist.
   <strong> Alles bleibt gespeichert</strong>, auch wenn du den Durchlauf später abbrichst.
   Ohne Projektzuordnung bleibt eine Aufgabe im Eingang, erscheint aber in diesem Durchlauf nur einmal.
  </p>
 </form>;
}

export function InboxProcessor({
 ids,tasks,projects,today=todayLocal(),onSave,onClose
}:{
 ids:string[];tasks:Task[];projects:Project[];today?:string;
 onSave:(taskId:string,expectedUpdatedAt:string,patch:InboxTriagePatch)=>InboxTriageResult['status'];
 onClose:()=>void;
}){
 const [index,setIndex]=useState(0);
 const [processed,setProcessed]=useState(0);
 const [skipped,setSkipped]=useState(0);
 const next=()=>setIndex(i=>i+1);
 const current=tasks.find(t=>t.id===ids[index]);
 const isFinished=index>=ids.length;
 return <div className="modal-backdrop triage-backdrop" role="presentation"
  onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
  {isFinished?
   <section className="modal triage-finished" role="dialog" aria-modal="true" aria-labelledby="triage-finished-title">
    <CheckCircle2 className="triage-complete-icon" size={36} aria-hidden="true"/>
    <h2 id="triage-finished-title">Durchlauf abgeschlossen!</h2>
    <p>Du hast alle {ids.length} Aufgaben dieses Durchlaufs angesehen.</p>
    <div className="triage-summary">
     <span><strong>{processed}</strong> gespeichert oder bestätigt</span>
     <span><strong>{skipped}</strong> übersprungen</span>
    </div>
    <p className="triage-footnote">Übersprungene Aufgaben bleiben im Eingang. Auch Aufgaben ohne Projekt sind dort weiterhin erreichbar.</p>
    <button className="primary" autoFocus type="button" onClick={onClose}>Zurück zum Eingang <ArrowRight size={16}/></button>
   </section>
   :current?<TriageStep key={ids[index]} task={current} projects={projects} today={today}
     position={index+1} total={ids.length} onClose={onClose}
     onSkip={()=>{setSkipped(x=>x+1);next()}}
     onSave={(taskId,expectedUpdatedAt,patch)=>{
      const result=onSave(taskId,expectedUpdatedAt,patch);
      if(result==='saved'){setProcessed(x=>x+1);next()}
      return result;
     }}/>:
    <section className="modal triage-finished" role="dialog" aria-modal="true" aria-labelledby="triage-missing-title">
     <h2 id="triage-missing-title">Diese Aufgabe ist inzwischen nicht mehr verfügbar.</h2>
     <p>Vielleicht wurde sie auf einem anderen Gerät bereits abgeschlossen oder gelöscht.</p>
     <button autoFocus type="button" className="primary" onClick={()=>{setSkipped(x=>x+1);next()}}>
      Zur nächsten Aufgabe <ArrowRight size={16}/>
     </button>
     <button type="button" className="ghost" onClick={onClose}>Schließen</button>
    </section>}
 </div>;
}
