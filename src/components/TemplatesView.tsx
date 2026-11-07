import {useState,type FormEvent} from 'react';
import {BookmarkPlus,Copy,Plus,Trash2,X} from 'lucide-react';
import type {TaskTemplate} from '../types';

export const STARTER_TEMPLATE:TaskTemplate={
 id:'starter-class-test',name:'Klassenarbeit vorbereiten',
 description:'Wiederkehrende Schritte – jederzeit anpassbar.',
 steps:['Aufgaben auswählen und zusammenstellen','Erwartungshorizont erstellen','Aufgaben und Punkteverteilung prüfen','Differenzierung und Hilfsmittel prüfen','Layout und Lösungen kontrollieren','Material drucken oder kopieren'],
 createdAt:'2026-11-07T00:00:00.000Z',updatedAt:'2026-11-07T00:00:00.000Z'
};

export function TemplatesView({templates,onUse,onSave,onDelete}:{
 templates:TaskTemplate[];
 onUse:(template:TaskTemplate)=>void;
 onSave:(draft:{id?:string;name:string;description:string;steps:string[]})=>void;
 onDelete:(id:string)=>void;
}){
 const [editing,setEditing]=useState<TaskTemplate|null>(null);
 const [newOpen,setNewOpen]=useState(false);
 const [name,setName]=useState(''),[description,setDescription]=useState(''),[steps,setSteps]=useState('');
 const edit=(template?:TaskTemplate)=>{
  setEditing(template??null);setName(template?.name??'');setDescription(template?.description??'');
  setSteps(template?.steps.join('\n')??'');setNewOpen(true);
 };
 const close=()=>{setNewOpen(false);setEditing(null)};
 const submit=(event:FormEvent)=>{
  event.preventDefault();if(!name.trim())return;
  onSave({id:editing?.id,name:name.trim(),description:description.trim(),steps:steps.split('\n').map(s=>s.trim()).filter(Boolean)});
  close();
 };
 return <div className="templates-view">
  <div className="templates-heading">
   <div><h2>Aufgabenvorlagen</h2><p>Einmal anlegen, beliebig oft nutzen. Jede neue Aufgabe erhält ihre eigene frische Checkliste.</p></div>
   <button className="primary" onClick={()=>edit()}><Plus size={17}/> Neue Vorlage</button>
  </div>
  <section className="template-grid" aria-label="Gespeicherte Vorlagen">
   {templates.map(template=><article className="template-card" key={template.id}>
    <h3>{template.name}</h3>{template.description&&<p>{template.description}</p>}
    <span className="template-count">{template.steps.length} Schritte</span>
    <ol>{template.steps.slice(0,4).map((step,i)=><li key={i}>{step}</li>)}</ol>
    {template.steps.length>4&&<small>+ {template.steps.length-4} weitere</small>}
    <div className="template-actions">
     <button className="primary" onClick={()=>onUse(template)}><Copy size={15}/> Aufgabe erstellen</button>
     <button className="ghost" onClick={()=>edit(template)}>Bearbeiten</button>
     <button className="icon-button" title="Vorlage löschen" aria-label={`Vorlage ${template.name} löschen`} onClick={()=>{if(confirm(`Vorlage „${template.name}“ löschen? Bereits erstellte Aufgaben bleiben erhalten.`))onDelete(template.id)}}><Trash2 size={16}/></button>
    </div>
   </article>)}
   {templates.length===0&&<p className="templates-empty">Noch keine eigenen Vorlagen. Du kannst direkt eine erstellen oder die Beispielvorlage unten übernehmen.</p>}
  </section>
  <section className="starter-template">
   <div><h3><BookmarkPlus size={17}/> Beispiel: Klassenarbeit vorbereiten</h3>
   <p>Eine unverbindliche Startvorlage für deinen Schulalltag. Passe die Schritte an deine Abläufe an.</p></div>
   <button className="ghost" onClick={()=>edit({...STARTER_TEMPLATE,id:'',name:STARTER_TEMPLATE.name})}>Beispiel anpassen & speichern</button>
  </section>
  {newOpen&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&close()}>
   <form className="modal template-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="template-edit-title" onSubmit={submit} onKeyDown={e=>e.key==='Escape'&&close()}>
    <header><h2 id="template-edit-title">{editing?.id?'Vorlage bearbeiten':'Neue Vorlage'}</h2><button type="button" className="icon-button" onClick={close} aria-label="Schließen"><X/></button></header>
    <label>Vorlagenname<input autoFocus required value={name} onChange={e=>setName(e.target.value)} placeholder="z. B. Klassenarbeit vorbereiten"/></label>
    <label>Beschreibung (optional)<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Wofür nutze ich diese Vorlage?"/></label>
    <label>Unteraufgaben – eine pro Zeile<textarea rows={9} value={steps} onChange={e=>setSteps(e.target.value)} placeholder={'Aufgaben zusammenstellen\nErwartungshorizont erstellen\nMaterial kopieren'}/></label>
    <p className="template-help">Hier werden keine Termine gespeichert. Beim Verwenden legst du Planung und Deadline für die konkrete Aufgabe selbst fest.</p>
    <footer><span/><div><button type="button" className="ghost" onClick={close}>Abbrechen</button><button className="primary">Vorlage speichern</button></div></footer>
   </form>
  </div>}
 </div>;
}
