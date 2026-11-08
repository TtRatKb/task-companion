import {useEffect,useRef,useState,type FormEvent} from 'react';
import {BookmarkPlus,MoveRight,Plus,Trash2,X} from 'lucide-react';
import {StepOrderControls} from './StepOrderControls';
import {reorderById,stepUpDown} from '../subtaskOrganization';
import {EditorHelpPanel} from './EditorHelpPanel';
import {freshSubtask} from '../checklists';
import {deadlineWorkday,dateBeforeDeadline,offsetDescription,parseRelativeStep,resolveRelativeSubtasks} from '../relativePlanning';
import {formatDate,todayLocal} from '../date';
import {weekdayNames} from '../date';
import {DAILY,WEEKEND,WORKDAYS,recurrence,intervalRecurrence,nextOccurrence,recurrenceLabel} from '../recurrence';
import type {Priority,Project,Task,Subtask,Weekday} from '../types';

type Draft=Omit<Task,'id'|'createdAt'|'updatedAt'|'completedAt'>;
const blank:Draft={title:'',description:'',projectId:null,priority:4,scheduledDate:null,deadlineDate:null,recurrence:null,subtasks:[]};

export function TaskEditor({task,initialDraft,projects,initialProject,onSave,onDelete,onClose,onSaveTemplate,onSaveAndMoveStep}:{
 task?:Task;initialDraft?:Draft;projects:Project[];initialProject?:string|null;
 onSave:(v:Draft)=>void;onDelete?:()=>void;onClose:()=>void;
 onSaveTemplate?:(draft:Draft)=>void;
 onSaveAndMoveStep?:(draft:Draft,stepId:string)=>void;
}){
 const [v,setV]=useState<Draft>(task?{title:task.title,description:task.description,projectId:task.projectId,priority:task.priority,scheduledDate:task.scheduledDate,deadlineDate:task.deadlineDate,recurrence:task.recurrence,estimatedMinutes:task.estimatedMinutes??null,subtasks:task.subtasks?.map(s=>({...s}))??[]}:initialDraft??{...blank,projectId:initialProject??null});
 const [newStep,setNewStep]=useState('');
 const [deadlineChange,setDeadlineChange]=useState<'pending'|'adjust'|'keep'|null>(null);
 const title=useRef<HTMLInputElement>(null);useEffect(()=>title.current?.focus(),[]);
 const newStepRef=useRef<HTMLInputElement>(null);
 const stepRefs=useRef<Record<string,HTMLInputElement|null>>({});
 const dragging=useRef<string|null>(null);
 const activeStep=useRef<string|null>(null);
 const insertSnippet=(snippet:string)=>{
  const id=activeStep.current;
  const input=id?stepRefs.current[id]:newStepRef.current;
  const value=id?(v.subtasks??[]).find(s=>s.id===id)?.title??'':newStep;
  const start=input?.selectionStart??value.length;
  const end=input?.selectionEnd??start;
  const text=value.slice(0,start)+snippet+value.slice(end);
  if(id)changeStep(id,{title:text});
  else setNewStep(text);
  window.setTimeout(()=>{
   const next=id?stepRefs.current[id]:newStepRef.current;
   next?.focus();next?.setSelectionRange(start+snippet.length,start+snippet.length);
  },0);
 };
 const addAfter=(id:string)=>{
  const step=freshSubtask('');
  setV(current=>{
   const items=current.subtasks??[];
   const index=items.findIndex(item=>item.id===id);
   return {...current,subtasks:index<0?[...items,step]:[
    ...items.slice(0,index+1),step,...items.slice(index+1)
   ]};
  });
  window.setTimeout(()=>stepRefs.current[step.id]?.focus(),0);
 };
 const moveRow=(id:string,direction:-1|1)=>setV(current=>({...current,subtasks:stepUpDown(current.subtasks??[],id,direction)}));
 const dropRow=(targetId:string)=>{
  const movingId=dragging.current;dragging.current=null;
  if(movingId&&movingId!==targetId)
   setV(current=>({...current,subtasks:reorderById(current.subtasks??[],movingId,targetId)}));
 };
 const steps=v.subtasks??[];
 const addStep=()=>{if(!newStep.trim())return;setV(current=>({...current,subtasks:[...(current.subtasks??[]),...resolveRelativeSubtasks([freshSubtask(newStep)],current.deadlineDate)]}));setNewStep('')};
 const changeStep=(id:string,changes:Partial<Subtask>)=>setV(current=>({...current,subtasks:(current.subtasks??[]).map(s=>s.id===id?{...s,...changes}:s)}));
 const processStepText=(step:Subtask):Subtask=>{
  const parsed=parseRelativeStep(step.title);
  if(!parsed.offset)return {...step,title:step.title.trim()};
  return {...step,title:parsed.title,offset:parsed.offset,
   plannedDate:v.deadlineDate?dateBeforeDeadline(v.deadlineDate,parsed.offset):null};
 };
 const preparedDraft=():Draft|null=>{
  if(!v.title.trim()||deadlineChange==='pending')return null;
  return {...v,title:v.title.trim(),subtasks:steps.filter(s=>s.title.trim()).map(processStepText)};
 };
 const submit=(e:FormEvent)=>{
  e.preventDefault();
  const prepared=preparedDraft();
  if(prepared)onSave(prepared);
 };
 const startTransfer=(stepId:string)=>{
  const prepared=preparedDraft();
  if(!prepared||!prepared.subtasks?.some(s=>s.id===stepId)||!onSaveAndMoveStep)return;
  onSaveAndMoveStep(prepared,stepId);
 };
 const changeDeadline=(nextDeadline:string|null)=>{
  const needsDecision=!!task?.deadlineDate && task.deadlineDate!==nextDeadline &&
   (v.subtasks??[]).some(s=>!!s.offset);
  setDeadlineChange(needsDecision?'pending':null);
  setV(current=>({...current,deadlineDate:nextDeadline,
   subtasks:needsDecision?(current.subtasks??[]):resolveRelativeSubtasks(current.subtasks??[],nextDeadline)}));
 };
 const confirmReplan=()=>{
  setV(current=>({...current,subtasks:resolveRelativeSubtasks(current.subtasks??[],current.deadlineDate)}));
  setDeadlineChange('adjust');
 };
 const reviewOffsets=steps.filter(s=>s.offset && s.plannedDate!==null &&
  s.plannedDate!==(v.deadlineDate?dateBeforeDeadline(v.deadlineDate,s.offset):null));
 const days=v.recurrence?.kind==='weekdays'?v.recurrence.weekdays:[];
 const interval=v.recurrence?.kind==='interval'?v.recurrence:null;
 const preset=interval?'interval-'+interval.unit:!v.recurrence?'':days.join()===DAILY.join()?'daily':days.join()===WORKDAYS.join()?'workdays':days.join()===WEEKEND.join()?'weekend':days.length===1?'weekly':'custom';
 const setPreset=(value:string)=>{
  if(value===''){setV({...v,recurrence:null});return;}
  if(value.startsWith('interval-')){
   const unit=value.slice('interval-'.length) as 'days'|'weeks'|'months';
   const start=v.scheduledDate??todayLocal();
   const every=interval?.unit===unit?interval.every:unit==='months'?1:2;
   setV({...v,scheduledDate:start,recurrence:intervalRecurrence(every,unit,start)});
   return;
  }
  if(value==='daily')setV({...v,recurrence:recurrence(DAILY)});
  else if(value==='workdays')setV({...v,recurrence:recurrence(WORKDAYS)});
  else if(value==='weekend')setV({...v,recurrence:recurrence(WEEKEND)});
  else if(value==='weekly')setV({...v,recurrence:recurrence([days[0]??1])});
  else setV({...v,recurrence:recurrence(days.length?days:[1,3,5])});
 };
 return <div className="modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
  <form className="modal task-editor-workspace" role="dialog" aria-modal="true" aria-labelledby="editor-title" onSubmit={submit}
  onKeyDown={e=>{
   if(e.key==='Escape'){e.preventDefault();onClose()}
   else if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();e.currentTarget.requestSubmit()}
  }}>
   <div className="editor-two-column"><div className="editor-primary">
   <header><h2 id="editor-title">{task?'Aufgabe bearbeiten':'Aufgabe hinzufügen'}</h2><button type="button" className="icon-button" aria-label="Schließen" onClick={onClose}><X/></button></header>
   <div className="editor-task-like-parent">
    <span className="editor-task-decorative-check" aria-hidden="true"/>
    <div className="editor-task-like-body">
     <label className="editor-parent-title">Hauptaufgabe<input ref={title} aria-label="Titel" value={v.title} onChange={e=>setV({...v,title:e.target.value})} required placeholder="Was steht an?"/></label>
     <label className="editor-parent-description">Beschreibung<textarea value={v.description} onChange={e=>setV({...v,description:e.target.value})} placeholder="Notizen (optional)"/></label>
    </div>
   </div>
   <fieldset className="subtask-editor task-list-like-subtasks">
    <legend>Unteraufgaben <small>{steps.filter(s=>s.completed).length}/{steps.length} erledigt · Per Griff ziehen oder Pfeile nutzen</small></legend>
    {steps.map((step,index)=><div className="subtask-edit-row" key={step.id}
     onDragOver={e=>{if(dragging.current){e.preventDefault();e.dataTransfer.dropEffect='move'}}}
     onDrop={e=>{e.preventDefault();dropRow(step.id)}}>
     <StepOrderControls index={index} total={steps.length}
      onUp={()=>moveRow(step.id,-1)} onDown={()=>moveRow(step.id,1)}
      onDragStart={e=>{dragging.current=step.id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',step.id)}}
      onDragEnd={()=>{dragging.current=null}}/>
     <input className="editor-subtask-checkbox" aria-label={`Unteraufgabe ${index+1} erledigt`} type="checkbox" checked={step.completed} onChange={e=>changeStep(step.id,{completed:e.target.checked})}/>
     <div className="subtask-edit-main">
      <input ref={el=>{stepRefs.current[step.id]=el}} aria-label={`Unteraufgabe ${index+1}`} value={step.title}
       onChange={e=>changeStep(step.id,{title:e.target.value})}
       onFocus={()=>{activeStep.current=step.id}}
       onKeyDown={e=>{if(e.key==='Enter'&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();addAfter(step.id)}}}
       onBlur={()=>{const parsed=parseRelativeStep(step.title);if(parsed.offset)changeStep(step.id,{title:parsed.title,offset:parsed.offset,plannedDate:v.deadlineDate?dateBeforeDeadline(v.deadlineDate,parsed.offset):null})}}/>
      <div className="subtask-schedule-row">
       {step.offset&&<span className="subtask-offset"><span>{offsetDescription(step.offset)}</span>
        <button type="button" aria-label={`Zeitabstand von Unteraufgabe ${index+1} entfernen`}
         onClick={()=>changeStep(step.id,{offset:undefined})}>×</button>
       </span>}
       <label>
        <span>{step.offset?'Geplant':'Termin'}</span>
        <input aria-label={`Termin Unteraufgabe ${index+1}`} type="date"
         value={step.plannedDate??''}
         onChange={e=>changeStep(step.id,{plannedDate:e.target.value||null,offset:undefined})}/>
       </label>
       <label className="subtask-estimate-label">Dauer (Min.)
        <input type="number" min="0" max="1440" step="5" aria-label={`Dauer Unteraufgabe ${index+1} in Minuten`}
         value={step.estimatedMinutes??''}
         onChange={e=>changeStep(step.id,{estimatedMinutes:e.target.value===''?null:Math.max(0,Math.min(1440,Math.round(Number(e.target.value))))})}
         placeholder="–"/>
       </label>
       {step.plannedDate && step.plannedDate<todayLocal()&&!step.completed&&
        <span className="subtask-date-past">Termin vorbei</span>}
      </div>
     </div>
     {task&&onSaveAndMoveStep&&step.title.trim()&&<button type="button"
      className="icon-button subtask-transfer-editor"
      aria-label={`Unteraufgabe ${index+1} speichern und in andere Aufgabe verschieben`}
      title="Änderungen speichern und Schritt in eine andere Aufgabe verschieben"
      onClick={()=>startTransfer(step.id)}><MoveRight size={17}/></button>}
     <button type="button" className="icon-button" aria-label={`Unteraufgabe ${index+1} entfernen`} onClick={()=>setV(current=>({...current,subtasks:(current.subtasks??[]).filter(s=>s.id!==step.id)}))}><X/></button>
    </div>)}
    <div className="subtask-add-row"><span className="editor-task-decorative-check" aria-hidden="true"/><input ref={newStepRef} aria-label="Neue Unteraufgabe" value={newStep}
     onFocus={()=>{activeStep.current=null}} onChange={e=>setNewStep(e.target.value)} placeholder="Weiteren Schritt eingeben" onKeyDown={e=>{if(e.key==='Enter'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();addStep()}}}/><button type="button" className="ghost" onClick={addStep} disabled={!newStep.trim()}><Plus size={15}/> Hinzufügen</button></div>
    <p className="subtask-hint">Jeder Schritt ist eine eigene abhakbare Aufgabe. <b>Enter</b> fügt den nächsten Schritt hinzu. Schreib einen Abstand einfach ans Ende: „Aufgaben zusammenstellen – 2 Wochen vorher“, „ClassTime einrichten – {<code>{'{Deadline}'}</code>} - 3 Tage“ oder „14 Tage vorher“. Termine werden von der Hauptdeadline zurückgerechnet, nie gleichmäßig verteilt. Du kannst Termine jederzeit manuell ändern; das löst dann die automatische Verknüpfung.</p>
   </fieldset>
   <div className="form-grid">
    <label>Projekt<select value={v.projectId??''} onChange={e=>setV({...v,projectId:e.target.value||null})}><option value="">Eingang</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label>Priorität<select value={v.priority} onChange={e=>setV({...v,priority:Number(e.target.value) as Priority})}>{[1,2,3,4].map(p=><option key={p} value={p}>P{p}</option>)}</select></label>
    <label>Geschätzte Dauer (Minuten)
     <input type="number" min="0" max="1440" step="5" aria-label="Dauer Aufgabe in Minuten"
      placeholder="Noch nicht geschätzt" value={v.estimatedMinutes??''}
      onChange={e=>setV({...v,estimatedMinutes:e.target.value===''?null:Math.max(0,Math.min(1440,Math.round(Number(e.target.value))))})}/>
     <small>Bei zeitlich geschätzten Unteraufgaben zählen deren Zeiten separat. Diese Dauer wird dann nicht zusätzlich gezählt.</small>
    </label>
    <label>Geplant<input type="date" aria-label="Geplant" value={v.scheduledDate??''}
      onChange={e=>{
       const date=e.target.value||null;
       if(interval&&!date)return;
       setV({...v,scheduledDate:date,
        recurrence:interval&&date?intervalRecurrence(interval.every,interval.unit,date):v.recurrence});
      }}/>
      {interval&&<small>Startdatum des Rhythmus: Wenn du es änderst, beginnt das Intervall ab diesem Tag neu.</small>}
    </label>
    <label>Deadline · ab diesem Tag benötigt<input type="date" value={v.deadlineDate??''}
     aria-label="Deadline" onChange={e=>changeDeadline(e.target.value||null)}/>
     <small>{v.deadlineDate?`Spätestens am ${formatDate(deadlineWorkday(v.deadlineDate))} fertigstellen – am ${formatDate(v.deadlineDate)} muss alles bereit sein.`:'Am angegebenen Tag muss alles bereits fertig sein (spätestens am Vortag).'}</small>
     <small>Bei Wiederholungen bleibt die Deadline unverändert.</small>
    </label>
    <label>Wiederholung<select aria-label="Wiederholung" value={preset} onChange={e=>setPreset(e.target.value)}>
     <option value="">Keine</option>
     <option value="daily">Jeden Tag</option>
     <option value="workdays">Jeden Wochentag (Mo–Fr)</option>
     <option value="weekend">Jedes Wochenende</option>
     <option value="weekly">Jede Woche an einem Tag</option>
     <option value="custom">Benutzerdefinierte Tage</option>
     <option value="interval-days">Alle N Tage</option>
     <option value="interval-weeks">Alle N Wochen</option>
     <option value="interval-months">Alle N Monate (auch monatlich)</option>
    </select></label>
   </div>
   {interval&&<div className="interval-recurrence">
     <label>Abstand
      <input type="number" min="1" max="999" step="1" aria-label="Wiederholungsabstand"
       value={interval.every}
       onChange={e=>{
        const every=Math.max(1,Math.min(999,Math.trunc(Number(e.target.value)||1)));
        setV({...v,recurrence:intervalRecurrence(every,interval.unit,interval.anchorDate)});
       }}/>
     </label>
     <div className="interval-preview" role="status">
      <strong>{recurrenceLabel(interval)}</strong>
      <span>Aktuell geplant: {v.scheduledDate?formatDate(v.scheduledDate):formatDate(interval.anchorDate)}</span>
      <span>Danach: {formatDate(nextOccurrence(v.scheduledDate??interval.anchorDate,interval))}
       {' · '} {formatDate(nextOccurrence(nextOccurrence(v.scheduledDate??interval.anchorDate,interval),interval))}</span>
      <small>Der Rhythmus bleibt am Startdatum ausgerichtet. Verpasste Termine werden übersprungen; bei Monatsenden wird der Tag passend angepasst.</small>
     </div>
    </div>}
   {v.recurrence&&!interval&&<p className="recurrence-preview">Nächster Termin nach dieser Ausführung: {formatDate(nextOccurrence(v.scheduledDate??todayLocal(),v.recurrence))}</p>}
   {v.recurrence&&(!!v.deadlineDate||steps.some(s=>!!s.plannedDate))&&
    <p className="recurrence-static-note">
     <strong>Achtung bei der Wiederholung:</strong> Die Hauptaufgabe erhält nach dem Abhaken einen neuen Arbeitstag und die Häkchen der Unteraufgaben werden zurückgesetzt. Eine einmal eingetragene Deadline und eigene Termine der Unteraufgaben bleiben aber unverändert – bitte bei Bedarf selbst neu planen.
    </p>}

   {v.recurrence&&(preset==='weekly'||preset==='custom')&&<fieldset className="weekday-picker"><legend>{preset==='weekly'?'Wochentag':'Wochentage'}</legend>{weekdayNames.map((name,index)=><label key={name}><input type={preset==='weekly'?'radio':'checkbox'} name="weekday" checked={days.includes(index as Weekday)} onChange={()=>setV({...v,recurrence:recurrence(preset==='weekly'?[index]:days.includes(index as Weekday)?days.filter(d=>d!==index):[...days,index])})}/>{name.slice(0,2)}</label>)}</fieldset>}
   {deadlineChange==='pending'&&<div className="replan-review" role="status">
    <strong>Deadline geändert: Unteraufgaben neu planen?</strong>
    <p>{reviewOffsets.length} relative Termine könnten sich ändern. Bereits abgehakte Schritte und manuell terminierte Unteraufgaben bleiben unverändert.</p>
    <ul>{reviewOffsets.slice(0,4).map(step=><li key={step.id}>{step.title}: {step.plannedDate?formatDate(step.plannedDate):'–'} → {v.deadlineDate&&step.offset?formatDate(dateBeforeDeadline(v.deadlineDate,step.offset)):'ohne Termin'}</li>)}</ul>
    <div className="settings-actions">
     <button type="button" className="primary" onClick={confirmReplan}>Neue Termine übernehmen</button>
     <button type="button" className="ghost" onClick={()=>setDeadlineChange('keep')}>Bisherige Termine behalten</button>
    </div>
   </div>}
   <footer className="editor-footer">
    <div className="editor-secondary-actions">{task&&onDelete?<button type="button" className="danger ghost" onClick={onDelete}><Trash2/>Löschen</button>:null}
    {onSaveTemplate&&<button type="button" className="ghost" disabled={!v.title.trim()} onClick={()=>onSaveTemplate({...v,subtasks:steps.filter(s=>s.title.trim())})}><BookmarkPlus size={16}/> Als Vorlage speichern</button>}</div>
    <div><button type="button" className="ghost" onClick={onClose}>Abbrechen</button><button className="primary" disabled={deadlineChange==='pending'}>Speichern</button></div>
   </footer>
   </div><EditorHelpPanel mode="task" onInsert={insertSnippet}/></div>
  </form>
 </div>
}
