import {useState,type FormEvent} from 'react';
import {ArrowRightLeft,X} from 'lucide-react';
import {formatDate} from '../date';
import {deadlineWorkday,dateBeforeDeadline,offsetDescription} from '../relativePlanning';
import type {TransferDateChoice,TransferResult} from '../subtaskOrganization';
import type {Task} from '../types';

export function MoveSubtaskDialog({
 source,stepId,tasks,onTransfer,onClose
}:{
 source:Task;stepId:string;tasks:Task[];
 onTransfer:(toTaskId:string,choice:TransferDateChoice,expectedFrom:string,expectedTo:string)=>TransferResult['status'];
 onClose:()=>void;
}){
 const step=source.subtasks?.find(s=>s.id===stepId);
 const destinations=tasks.filter(t=>t.id!==source.id&&(!t.completedAt||t.recurrence!==null));
 const [targetId,setTargetId]=useState('');
 const [choice,setChoice]=useState<TransferDateChoice>('keep');
 const [error,setError]=useState('');
 const target=destinations.find(t=>t.id===targetId);
 // Keep versions as of dialog opening, not as of the eventual Save click.
 const [sourceVersion]=useState(source.updatedAt);
 const [targetVersions]=useState(()=>Object.fromEntries(destinations.map(t=>[t.id,t.updatedAt])));
 const canRebase=!!step?.offset&&!!target?.deadlineDate;
 const effective=choice==='rebase'&&canRebase?'rebase':'keep';
 const previewDate=effective==='rebase'&&step?.offset&&target?.deadlineDate
  ?dateBeforeDeadline(target.deadlineDate,step.offset):step?.plannedDate??null;
 const pastLastDay=!!target?.deadlineDate&&!!previewDate&&previewDate>deadlineWorkday(target.deadlineDate);
 const submit=(e:FormEvent)=>{
  e.preventDefault();
  if(!target||!step)return;
  if(pastLastDay&&!window.confirm('Der beibehaltene Arbeitstag liegt nach dem letzten möglichen Fertigstellungstag der Zielaufgabe. Trotzdem verschieben?'))return;
  const status=onTransfer(target.id,effective,sourceVersion,targetVersions[target.id]);
  if(status==='moved'){onClose();return}
  setError(status==='conflict'
   ?'Eine der beiden Aufgaben wurde zwischenzeitlich geändert. Bitte schließen und die aktuelle Liste prüfen.'
   :status==='missing'?'Eine der Aufgaben ist nicht mehr verfügbar.':
    'Verschieben ist mit diesen Angaben nicht möglich.');
 };
 return <div className="modal-backdrop move-step-backdrop" role="presentation"
  onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
  <form className="modal move-subtask-dialog" role="dialog" aria-modal="true"
   aria-labelledby="move-step-title" onSubmit={submit} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();onClose()}}}>
   <header>
    <div><h2 id="move-step-title">Unteraufgabe verschieben</h2>
     <p>Aus „{source.title}“</p>
    </div>
    <button type="button" className="icon-button" aria-label="Verschieben schließen" onClick={onClose}><X/></button>
   </header>
   <p className="move-step-name"><ArrowRightLeft size={18} aria-hidden="true"/>{step?.title??'Schritt nicht mehr verfügbar'}</p>
   <label>Zielaufgabe
    <select autoFocus required aria-label="Zielaufgabe" value={targetId}
     onChange={e=>{setTargetId(e.target.value);setChoice('keep');setError('')}}>
     <option value="">Aufgabe auswählen …</option>
     {destinations.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
    </select>
   </label>
   {destinations.length===0&&<p className="move-step-help">Lege zuerst eine zweite offene Aufgabe an, in die der Schritt verschoben werden kann.</p>}
   {step?.offset&&target&&<fieldset className="move-step-date-choice">
    <legend>Was soll mit dem Termin passieren?</legend>
    <label><input type="radio" name="move-choice" value="keep" checked={effective==='keep'}
     onChange={()=>setChoice('keep')}/>
     <span><b>Arbeitstag beibehalten</b>
      <small>{step.plannedDate?formatDate(step.plannedDate):'Ohne Arbeitstag'} · relative Verknüpfung lösen</small>
     </span>
    </label>
    <label className={!canRebase?'move-step-disabled':''}>
     <input type="radio" name="move-choice" value="rebase" disabled={!canRebase}
      checked={effective==='rebase'} onChange={()=>setChoice('rebase')}/>
     <span><b>Relativen Abstand übernehmen</b>
      <small>{canRebase&&step.offset&&target.deadlineDate
       ?`${offsetDescription(step.offset)} → ${formatDate(dateBeforeDeadline(target.deadlineDate,step.offset))}`
       :'Nur möglich, wenn die Zielaufgabe eine Deadline hat'}</small>
     </span>
    </label>
   </fieldset>}
   {target&&<p className="move-step-preview" aria-live="polite">
    <strong>Vorschau:</strong> {step?.title} → {target.title}
    <span>Arbeitstag: {previewDate?formatDate(previewDate):'nicht geplant'}.
     {step?.offset&&effective==='keep'?' Der relative Abstand wird entfernt.':''}</span>
    {pastLastDay&&<span className="move-step-warning">Achtung: Der Arbeitstag liegt nach dem letzten Fertigstellungstag dieser Aufgabe.</span>}
   </p>}
   <p className="move-step-help">Der Schritt behält sein Häkchen, seine Zeitschätzung und seine ID. Andere Aufgaben bleiben unberührt. Bei einem relativen Termin entscheidest du ausdrücklich über die Neuberechnung.</p>
   {error&&<p className="move-step-error" role="alert">{error}</p>}
   <footer><button type="button" className="ghost" onClick={onClose}>Abbrechen</button>
    <button type="submit" className="primary" disabled={!target||!step}>Unteraufgabe verschieben</button>
   </footer>
  </form>
 </div>;
}
