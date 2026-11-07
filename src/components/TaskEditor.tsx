import {useEffect,useRef,useState,type FormEvent} from 'react';
import {BookmarkPlus,Plus,Trash2,X} from 'lucide-react';
import {freshSubtask} from '../checklists';
import {weekdayNames} from '../date';
import {DAILY,WEEKEND,WORKDAYS,recurrence} from '../recurrence';
import type {Priority,Project,Task,Subtask,Weekday} from '../types';

type Draft=Omit<Task,'id'|'createdAt'|'updatedAt'|'completedAt'>;
const blank:Draft={title:'',description:'',projectId:null,priority:4,scheduledDate:null,deadlineDate:null,recurrence:null,subtasks:[]};

export function TaskEditor({task,initialDraft,projects,initialProject,onSave,onDelete,onClose,onSaveTemplate}:{
 task?:Task;initialDraft?:Draft;projects:Project[];initialProject?:string|null;
 onSave:(v:Draft)=>void;onDelete?:()=>void;onClose:()=>void;
 onSaveTemplate?:(draft:Draft)=>void
}){
 const [v,setV]=useState<Draft>(task?{title:task.title,description:task.description,projectId:task.projectId,priority:task.priority,scheduledDate:task.scheduledDate,deadlineDate:task.deadlineDate,recurrence:task.recurrence,subtasks:task.subtasks?.map(s=>({...s}))??[]}:initialDraft??{...blank,projectId:initialProject??null});
 const [newStep,setNewStep]=useState('');
 const title=useRef<HTMLInputElement>(null);useEffect(()=>title.current?.focus(),[]);
 const steps=v.subtasks??[];
 const addStep=()=>{if(!newStep.trim())return;setV(current=>({...current,subtasks:[...(current.subtasks??[]),freshSubtask(newStep)]}));setNewStep('')};
 const changeStep=(id:string,changes:Partial<Subtask>)=>setV(current=>({...current,subtasks:(current.subtasks??[]).map(s=>s.id===id?{...s,...changes}:s)}));
 const submit=(e:FormEvent)=>{e.preventDefault();if(!v.title.trim())return;const prepared={...v,title:v.title.trim(),subtasks:steps.filter(s=>s.title.trim()).map(s=>({...s,title:s.title.trim()}))};onSave(prepared)};
 const days=v.recurrence?.weekdays??[];
 const preset=days.join()===DAILY.join()?'daily':days.join()===WORKDAYS.join()?'workdays':days.join()===WEEKEND.join()?'weekend':days.length===1?'weekly':'custom';
 const setPreset=(value:string)=>{if(value==='')setV({...v,recurrence:null});else if(value==='daily')setV({...v,recurrence:recurrence(DAILY)});else if(value==='workdays')setV({...v,recurrence:recurrence(WORKDAYS)});else if(value==='weekend')setV({...v,recurrence:recurrence(WEEKEND)});else if(value==='weekly')setV({...v,recurrence:recurrence([v.recurrence?.weekdays[0]??1])});else setV({...v,recurrence:recurrence(v.recurrence?.weekdays.length?v.recurrence.weekdays:[1,3,5])})};
 return <div className="modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
  <form className="modal" role="dialog" aria-modal="true" aria-labelledby="editor-title" onSubmit={submit} onKeyDown={e=>e.key==='Escape'&&onClose()}>
   <header><h2 id="editor-title">{task?'Aufgabe bearbeiten':'Aufgabe hinzufügen'}</h2><button type="button" className="icon-button" aria-label="Schließen" onClick={onClose}><X/></button></header>
   <label>Titel<input ref={title} value={v.title} onChange={e=>setV({...v,title:e.target.value})} required placeholder="Was steht an?"/></label>
   <label>Beschreibung<textarea value={v.description} onChange={e=>setV({...v,description:e.target.value})} placeholder="Notizen (optional)"/></label>
   <fieldset className="subtask-editor">
    <legend>Unteraufgaben <small>{steps.filter(s=>s.completed).length}/{steps.length} erledigt</small></legend>
    {steps.map((step,index)=><div className="subtask-edit-row" key={step.id}>
     <input aria-label={`Unteraufgabe ${index+1} erledigt`} type="checkbox" checked={step.completed} onChange={e=>changeStep(step.id,{completed:e.target.checked})}/>
     <input aria-label={`Unteraufgabe ${index+1}`} value={step.title} onChange={e=>changeStep(step.id,{title:e.target.value})}/>
     <button type="button" className="icon-button" aria-label={`Unteraufgabe ${index+1} entfernen`} onClick={()=>setV(current=>({...current,subtasks:(current.subtasks??[]).filter(s=>s.id!==step.id)}))}><X/></button>
    </div>)}
    <div className="subtask-add-row"><input aria-label="Neue Unteraufgabe" value={newStep} onChange={e=>setNewStep(e.target.value)} placeholder="Weiteren Schritt eingeben" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addStep()}}}/><button type="button" className="ghost" onClick={addStep} disabled={!newStep.trim()}><Plus size={15}/> Hinzufügen</button></div>
    <p className="subtask-hint">Häkchen sind unabhängig von der Hauptaufgabe. Bei Wiederholungen werden sie nach dem Abschließen zurückgesetzt.</p>
   </fieldset>
   <div className="form-grid">
    <label>Projekt<select value={v.projectId??''} onChange={e=>setV({...v,projectId:e.target.value||null})}><option value="">Eingang</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label>Priorität<select value={v.priority} onChange={e=>setV({...v,priority:Number(e.target.value) as Priority})}>{[1,2,3,4].map(p=><option key={p} value={p}>P{p}</option>)}</select></label>
    <label>Geplant<input type="date" value={v.scheduledDate??''} onChange={e=>setV({...v,scheduledDate:e.target.value||null})}/></label>
    <label>Deadline<input type="date" value={v.deadlineDate??''} onChange={e=>setV({...v,deadlineDate:e.target.value||null})}/><small>Bleibt bei Wiederholungen unverändert.</small></label>
    <label>Wiederholung<select value={v.recurrence?preset:''} onChange={e=>setPreset(e.target.value)}><option value="">Keine</option><option value="daily">Jeden Tag</option><option value="workdays">Jeden Wochentag (Mo–Fr)</option><option value="weekend">Jedes Wochenende</option><option value="weekly">Jede Woche an einem Tag</option><option value="custom">Benutzerdefinierte Tage</option></select></label>
   </div>
   {v.recurrence&&(preset==='weekly'||preset==='custom')&&<fieldset className="weekday-picker"><legend>{preset==='weekly'?'Wochentag':'Wochentage'}</legend>{weekdayNames.map((name,index)=><label key={name}><input type={preset==='weekly'?'radio':'checkbox'} name="weekday" checked={days.includes(index as Weekday)} onChange={()=>setV({...v,recurrence:recurrence(preset==='weekly'?[index]:days.includes(index as Weekday)?days.filter(d=>d!==index):[...days,index])})}/>{name.slice(0,2)}</label>)}</fieldset>}
   <footer className="editor-footer">
    <div className="editor-secondary-actions">{task&&onDelete?<button type="button" className="danger ghost" onClick={onDelete}><Trash2/>Löschen</button>:null}
    {onSaveTemplate&&<button type="button" className="ghost" disabled={!v.title.trim()} onClick={()=>onSaveTemplate({...v,subtasks:steps.filter(s=>s.title.trim())})}><BookmarkPlus size={16}/> Als Vorlage speichern</button>}</div>
    <div><button type="button" className="ghost" onClick={onClose}>Abbrechen</button><button className="primary">Speichern</button></div>
   </footer>
  </form>
 </div>
}
