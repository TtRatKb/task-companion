import {useEffect,useRef,useState,type FormEvent} from 'react';
import {X,Trash2} from 'lucide-react';
import {weekdayNames} from '../date';
import type {Priority,Project,Task,Weekday} from '../types';
type Draft=Omit<Task,'id'|'createdAt'|'updatedAt'|'completedAt'>;
const blank:Draft={title:'',description:'',projectId:null,priority:4,scheduledDate:null,deadlineDate:null,recurrence:null};
export function TaskEditor({task,projects,initialProject,onSave,onDelete,onClose}:{task?:Task;projects:Project[];initialProject?:string|null;onSave:(v:Draft)=>void;onDelete?:()=>void;onClose:()=>void}){
 const [v,setV]=useState<Draft>(task?{title:task.title,description:task.description,projectId:task.projectId,priority:task.priority,scheduledDate:task.scheduledDate,deadlineDate:task.deadlineDate,recurrence:task.recurrence}:{...blank,projectId:initialProject??null});
 const title=useRef<HTMLInputElement>(null); useEffect(()=>title.current?.focus(),[]);
 const submit=(e:FormEvent)=>{e.preventDefault();if(v.title.trim())onSave({...v,title:v.title.trim()})};
 return <div className="modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
  <form className="modal" role="dialog" aria-modal="true" aria-labelledby="editor-title" onSubmit={submit} onKeyDown={e=>e.key==='Escape'&&onClose()}>
   <header><h2 id="editor-title">{task?'Aufgabe bearbeiten':'Aufgabe hinzufügen'}</h2><button type="button" className="icon-button" aria-label="Schließen" onClick={onClose}><X/></button></header>
   <label>Titel<input ref={title} value={v.title} onChange={e=>setV({...v,title:e.target.value})} required placeholder="Was steht an?"/></label>
   <label>Beschreibung<textarea value={v.description} onChange={e=>setV({...v,description:e.target.value})} placeholder="Notizen (optional)"/></label>
   <div className="form-grid">
    <label>Projekt<select value={v.projectId??''} onChange={e=>setV({...v,projectId:e.target.value||null})}><option value="">Eingang</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label>Priorität<select value={v.priority} onChange={e=>setV({...v,priority:Number(e.target.value) as Priority})}>{[1,2,3,4].map(p=><option key={p} value={p}>P{p}</option>)}</select></label>
    <label>Geplant<input type="date" value={v.scheduledDate??''} onChange={e=>setV({...v,scheduledDate:e.target.value||null})}/></label>
    <label>Deadline<input type="date" value={v.deadlineDate??''} onChange={e=>setV({...v,deadlineDate:e.target.value||null})}/></label>
    <label>Wiederholung<select value={v.recurrence?.weekday??''} onChange={e=>setV({...v,recurrence:e.target.value===''?null:{kind:'weekly',weekday:Number(e.target.value) as Weekday}})}><option value="">Keine</option>{weekdayNames.map((n,i)=><option key={n} value={i}>Jede Woche am {n}</option>)}</select></label>
   </div>
   <footer>{task&&onDelete?<button type="button" className="danger ghost" onClick={onDelete}><Trash2/>Löschen</button>:<span/>}<div><button type="button" className="ghost" onClick={onClose}>Abbrechen</button><button className="primary">Speichern</button></div></footer>
  </form>
 </div>
}
