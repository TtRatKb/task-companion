import {useRef,useState,type FormEvent,type KeyboardEvent} from 'react';
import {Check,Plus,Trash2,X} from 'lucide-react';
import type {TaskTemplate} from '../types';
import {parseRelativeStep,offsetDescription,templateAnchorKind} from '../relativePlanning';
import {EditorHelpPanel} from './EditorHelpPanel';
import {StepOrderControls} from './StepOrderControls';
import {reorderById,stepUpDown} from '../subtaskOrganization';

type StepRow={id:string;text:string;checked:boolean};
type FocusTarget={field:'name'|'description'|'step';id?:string};
const freshRow=(text=''):StepRow=>({id:crypto.randomUUID(),text,checked:false});

export function TemplateEditor({template,onSave,onClose}:{
 template?:TaskTemplate;
 onSave:(draft:{id?:string;name:string;description:string;steps:string[];anchorKind?:'event'|'deadline'})=>void;
 onClose:()=>void;
}){
 const [name,setName]=useState(template?.name??'');
 const [description,setDescription]=useState(template?.description??'');
 const [anchorKind,setAnchorKind]=useState<'event'|'deadline'>(template?templateAnchorKind(template):'deadline');
 const [rows,setRows]=useState<StepRow[]>(()=>template?.steps.length
  ?template.steps.map(freshRow):[freshRow()]);
 const [previewChecked,setPreviewChecked]=useState(false);
 const [error,setError]=useState('');
 const [dirty,setDirty]=useState(false);
 const titleRef=useRef<HTMLInputElement>(null);
 const rowRefs=useRef<Record<string,HTMLInputElement|null>>({});
 const dragging=useRef<string|null>(null);
 const active=useRef<FocusTarget>({field:'name'});
 const activeElement=useRef<HTMLInputElement|HTMLTextAreaElement|null>(null);
 const nameInput=(el:HTMLInputElement|null)=>{titleRef.current=el};
 const focusRow=(id:string)=>window.setTimeout(()=>rowRefs.current[id]?.focus(),0);
 const updateRow=(id:string,text:string)=>{
  setRows(old=>old.map(row=>row.id===id?{...row,text}:row));
  if(['after','on'].includes(parseRelativeStep(text).offset?.direction??''))setAnchorKind('event');
  setDirty(true);
 };
 const createAfter=(id?:string,text='')=>{
  const next=freshRow(text);
  setRows(old=>{
   const index=id?old.findIndex(row=>row.id===id):-1;
   if(index<0)return [...old,next];
   return [...old.slice(0,index+1),next,...old.slice(index+1)];
  });
  setDirty(true);
  focusRow(next.id);
 };
 const moveRow=(id:string,direction:-1|1)=>{setRows(old=>stepUpDown(old,id,direction));setDirty(true)};
 const dropRow=(targetId:string)=>{
  const movingId=dragging.current;
  dragging.current=null;
  if(!movingId||movingId===targetId)return;
  setRows(old=>reorderById(old,movingId,targetId));
  setDirty(true);
 };
 const removeRow=(id:string)=>{
  const index=rows.findIndex(row=>row.id===id);
  const sibling=rows[index-1]?.id??rows[index+1]?.id;
  setRows(old=>old.length===1?[freshRow()]:old.filter(row=>row.id!==id));
  setDirty(true);
  if(sibling)focusRow(sibling);
 };
 const keyRow=(e:KeyboardEvent<HTMLInputElement>,row:StepRow)=>{
  if(e.key==='Enter'&&!e.shiftKey&&!e.ctrlKey&&!e.metaKey){
   e.preventDefault();
   const cursor=e.currentTarget.selectionStart??row.text.length;
   const left=row.text.slice(0,cursor),right=row.text.slice(cursor);
   updateRow(row.id,left);
   createAfter(row.id,right);
  }else if(e.key==='Backspace'&&row.text===''&&rows.length>1){
   e.preventDefault();removeRow(row.id);
  }
 };
 const insertSnippet=(snippet:string)=>{
  // Relative date snippets are always subtask instructions, never part of a template title.
  if(snippet.startsWith(' – ') && active.current.field!=='step'){
   const row=rows.find(item=>item.text.trim())??rows[0];
   if(row){active.current={field:'step',id:row.id};activeElement.current=rowRefs.current[row.id]??null}
  }
  const target=active.current;
  const element=activeElement.current;
  let value=target.field==='name'?name:target.field==='description'?description:
   rows.find(row=>row.id===target.id)?.text;
  if(value===undefined){const last=rows.at(-1);if(!last)return;active.current={field:'step',id:last.id};value=last.text}
  const start=element&&document.contains(element)?element.selectionStart??value.length:value.length;
  const end=element&&document.contains(element)?element.selectionEnd??start:start;
  const next=value.slice(0,start)+snippet+value.slice(end);
  const chosen=active.current;
  if(chosen.field==='name')setName(next);
  else if(chosen.field==='description')setDescription(next);
  else if(chosen.id)updateRow(chosen.id,next);
  setDirty(true);
  window.setTimeout(()=>{
   const input=chosen.field==='name'?titleRef.current:
    chosen.field==='description'?document.querySelector<HTMLTextAreaElement>('#template-description'):
    chosen.id?rowRefs.current[chosen.id]:null;
   input?.focus();
   input?.setSelectionRange(start+snippet.length,start+snippet.length);
  },0);
 };
 const submit=(event:FormEvent)=>{
  event.preventDefault();
  if(!name.trim()){setError('Bitte gib der Vorlage einen Namen.');titleRef.current?.focus();return}
  const steps=rows.map(row=>row.text.trim()).filter(Boolean);
  try{onSave({id:template?.id||undefined,name:name.trim(),description:description.trim(),steps,anchorKind});onClose()}
  catch(e){setError(e instanceof Error?e.message:'Vorlage konnte nicht gespeichert werden.')}
 };
 const cancel=()=>{
  if(dirty && !window.confirm('Vorlage ohne Speichern schließen? Deine Änderungen gehen verloren.'))return;
  onClose();
 };
 const keydown=(event:KeyboardEvent<HTMLFormElement>)=>{
  if(event.key==='Escape'){event.preventDefault();cancel();return}
  if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){
   event.preventDefault();event.currentTarget.requestSubmit();
  }
 };
 const total=rows.filter(row=>row.text.trim()).length;
 return <div className="modal-backdrop editor-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&cancel()}>
  <form className="modal template-visual-editor" role="dialog" aria-modal="true"
   aria-labelledby="visual-template-title" onSubmit={submit} onKeyDown={keydown}>
   <div className="editor-two-column">
    <div className="visual-template-main">
     <header className="template-editor-heading">
      <div><span className="template-editor-eyebrow">AUFGABENVORLAGE</span>
       <h2 id="visual-template-title">{template?.id?'Vorlage bearbeiten':'Neue Vorlage erstellen'}</h2>
      </div>
      <button type="button" className="icon-button" aria-label="Schließen" onClick={cancel}><X/></button>
     </header>
     <div className="template-main-task editor-template-parent">
      <div className="template-main-row">
       <button className={previewChecked?'template-preview-toggle checked':'template-preview-toggle'}
        type="button" aria-label="Hauptaufgabe als Vorschau abhaken"
        aria-pressed={previewChecked} title="Vorschau-Häkchen; wird nicht gespeichert"
        onClick={()=>setPreviewChecked(old=>!old)}>{previewChecked&&<Check size={15}/>}</button>
       <label className="template-title-field">
        <span>Hauptaufgabe</span>
        <input ref={nameInput} autoFocus required aria-label="Vorlagenname"
         className={previewChecked?'is-preview-done':''}
         value={name} onFocus={e=>{active.current={field:'name'};activeElement.current=e.currentTarget}}
         onChange={e=>{setName(e.target.value);setDirty(true)}}
         placeholder="z. B. Klassenarbeit {Fach} {Klasse} vorbereiten"/>
       </label>
      </div>
      <label className="template-desc-field">Beschreibung (optional)
       <textarea id="template-description" aria-label="Beschreibung (optional)"
        value={description} rows={2} onChange={e=>{setDescription(e.target.value);setDirty(true)}}
        onFocus={e=>{active.current={field:'description'};activeElement.current=e.currentTarget}}
        placeholder="Wofür brauchst du diese Aufgabe?"/>
      </label>
      <label className="template-anchor-kind">Wofür steht das Bezugsdatum?
       <select aria-label="Art des Bezugsdatums" value={anchorKind} onChange={e=>{setAnchorKind(e.target.value as 'event'|'deadline');setDirty(true)}}>
        <option value="deadline">Abgabe-Deadline · alles vorher erledigt</option>
        <option value="event">Ereignisdatum · Schritte davor, am Tag und danach</option>
       </select>
       <small>Klassenarbeiten sind Ereignisse: Drucken davor, Korrigieren und Rückgabe danach. Die Uhrzeit oder das Datum wählst du erst bei Verwendung.</small>
      </label>
     </div>
     <div className="template-step-heading">
      <h3>Unteraufgaben <small>{total} Schritte</small></h3>
      <span>Per Griff ziehen oder mit ↑ ↓ sortieren</span>
     </div>
     <div className="template-visual-steps" aria-label="Unteraufgaben der Vorlage">
      {rows.map((row,index)=>{
       const parsed=parseRelativeStep(row.text);
       return <div className="template-visual-row editor-task-like-step" key={row.id}
         onDragOver={e=>{if(dragging.current){e.preventDefault();e.dataTransfer.dropEffect='move'}}}
         onDrop={e=>{e.preventDefault();dropRow(row.id)}}>
        <StepOrderControls index={index} total={rows.length}
         onUp={()=>moveRow(row.id,-1)} onDown={()=>moveRow(row.id,1)}
         onDragStart={e=>{dragging.current=row.id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',row.id)}}
         onDragEnd={()=>{dragging.current=null}}/>
        <button type="button" className={row.checked?'template-preview-toggle checked':'template-preview-toggle'}
         aria-label={`Unteraufgabe ${index+1} als Vorschau abhaken`}
         aria-pressed={row.checked} title="Vorschau-Häkchen; wird nicht gespeichert"
         onClick={()=>setRows(old=>old.map(item=>item.id===row.id?{...item,checked:!item.checked}:item))}>
         {row.checked&&<Check size={14}/>}
        </button>
        <div className="template-visual-field">
         <input ref={el=>{rowRefs.current[row.id]=el}}
          aria-label={`Unteraufgabe ${index+1}`} className={row.checked?'is-preview-done':''}
          value={row.text} onChange={e=>updateRow(row.id,e.target.value)}
          onFocus={e=>{active.current={field:'step',id:row.id};activeElement.current=e.currentTarget}}
          onKeyDown={e=>keyRow(e,row)}
          placeholder={index===0?'Ersten Schritt eingeben …':'Weiteren Schritt eingeben …'}/>
         {parsed.offset&&parsed.title&&<div className="template-step-explanation">
          <span>Zeitpunkt:</span> {offsetDescription(parsed.offset,anchorKind==='event'?'Ereignisdatum':'Deadline')}
         </div>}
        </div>
        <button type="button" className="icon-button template-remove-row"
         aria-label={`Unteraufgabe ${index+1} entfernen`} title="Unteraufgabe entfernen"
         onClick={()=>removeRow(row.id)}><Trash2 size={15}/></button>
       </div>
      })}
      <button type="button" className="template-add-step" onClick={()=>createAfter()}>
       <Plus size={16}/> Unteraufgabe hinzufügen <kbd>Enter</kbd>
      </button>
     </div>
     <p className="template-preview-notice">Du bearbeitest hier eine Hauptaufgabe mit eigenen Unteraufgaben – wie in deiner Aufgabenliste. Häkchen dienen nur zur Vorschau; jede Verwendung startet mit offenen Schritten. Den konkreten Klassenarbeitstermin (Ereignisdatum) gibst du erst beim Erstellen der echten Aufgabe an. Danach können die Vorbereitung und die Nachbereitung relativ geplant werden.</p>
     {error&&<p className="template-save-error" role="alert">{error}</p>}
     <footer className="template-visual-actions">
      <button type="button" className="ghost" onClick={cancel}>Abbrechen</button>
      <button type="submit" className="primary">Vorlage speichern <kbd>⌘/Strg + Enter</kbd></button>
     </footer>
    </div>
    <EditorHelpPanel mode="template" onInsert={insertSnippet}/>
   </div>
  </form>
 </div>;
}
