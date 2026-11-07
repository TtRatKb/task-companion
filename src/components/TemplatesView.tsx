import {useState,type FormEvent} from 'react';
import {BookmarkPlus,Copy,Plus,Trash2,X} from 'lucide-react';
import type {TaskTemplate} from '../types';
import {expandTaskTemplate,extractTemplatePlaceholders,fillTemplateText} from '../templateVariables';

export const STARTER_TEMPLATE:TaskTemplate={
 id:'starter-class-test',name:'Klassenarbeit {Fach} {Klasse} vorbereiten',
 description:'Klassenarbeit zum Thema {Thema} – individuell anpassbar.',
 steps:['Aufgaben für {Thema} zusammenstellen – 2 Wochen vorher','Erwartungshorizont zu {Thema} erstellen – {Deadline} - 10 Tage','Aufgaben und Punkteverteilung prüfen – 1 Woche vorher','ClassTime-Aufgaben eintragen – 1 Woche vorher','ClassTime-Terminierung prüfen – 3 Tage vorher','Differenzierung und Layout kontrollieren – 2 Tage vorher','Material für {Klasse} drucken oder kopieren – am Vortag'],
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
 const [instantiating,setInstantiating]=useState<TaskTemplate|null>(null);
 const [values,setValues]=useState<Record<string,string>>({});
 const variables=instantiating?extractTemplatePlaceholders(instantiating):[];
 const missing=variables.filter(key=>!values[key]?.trim());
 const beginUse=(template:TaskTemplate)=>{
  if(!extractTemplatePlaceholders(template).length){onUse(template);return}
  setInstantiating(template);setValues({});
 };
 const cancelUse=()=>{setInstantiating(null);setValues({})};
 const confirmUse=(event:FormEvent)=>{
  event.preventDefault();
  if(!instantiating||missing.length)return;
  onUse(expandTaskTemplate(instantiating,values));
  cancelUse();
 };
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
    <span className="template-count">{template.steps.length} Schritte{extractTemplatePlaceholders(template).length>0?` · ${extractTemplatePlaceholders(template).length} Platzhalter`:null}</span>
    <ol>{template.steps.slice(0,4).map((step,i)=><li key={i}>{step}</li>)}</ol>
    {template.steps.length>4&&<small>+ {template.steps.length-4} weitere</small>}
    <div className="template-actions">
     <button className="primary" onClick={()=>beginUse(template)}><Copy size={15}/> Aufgabe erstellen</button>
     <button className="ghost" onClick={()=>edit(template)}>Bearbeiten</button>
     <button className="icon-button" title="Vorlage löschen" aria-label={`Vorlage ${template.name} löschen`} onClick={()=>{if(confirm(`Vorlage „${template.name}“ löschen? Bereits erstellte Aufgaben bleiben erhalten.`))onDelete(template.id)}}><Trash2 size={16}/></button>
    </div>
   </article>)}
   {templates.length===0&&<p className="templates-empty">Noch keine eigenen Vorlagen. Du kannst direkt eine erstellen oder die Beispielvorlage unten übernehmen.</p>}
  </section>
  <section className="starter-template">
   <div><h3><BookmarkPlus size={17}/> Beispiel: Klassenarbeit vorbereiten</h3>
   <p>Mit {`{Fach}`}, {`{Klasse}`} und {`{Thema}`} – eine Vorlage für viele Klassenarbeiten. Passe die Schritte an deinen Ablauf an.</p></div>
   <button className="ghost" onClick={()=>edit({...STARTER_TEMPLATE,id:'',name:STARTER_TEMPLATE.name})}>Beispiel anpassen & speichern</button>
  </section>
  {instantiating&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&cancelUse()}>
   <form className="modal template-use-dialog" role="dialog" aria-modal="true" aria-labelledby="template-use-title" onSubmit={confirmUse} onKeyDown={e=>e.key==='Escape'&&cancelUse()}>
    <header><h2 id="template-use-title">Vorlage ausfüllen</h2><button type="button" className="icon-button" onClick={cancelUse} aria-label="Schließen"><X/></button></header>
    <p className="template-use-intro">Trage die Angaben einmal ein. Sie werden im Aufgabentitel, in der Beschreibung und in allen passenden Unteraufgaben eingesetzt.</p>
    <div className="template-variable-fields">
     {variables.map((key,index)=><label key={key}>{key}
      <input autoFocus={index===0} required aria-label={key} value={values[key]??''} onChange={e=>setValues(old=>({...old,[key]:e.target.value}))} placeholder={key==='Fach'?'z. B. Mathematik':key==='Klasse'?'z. B. 7b':key==='Thema'?'z. B. Bruchrechnung':key}/>
     </label>)}
    </div>
    <div className="template-live-preview" aria-live="polite">
     <span className="template-preview-label">Vorschau</span>
     <strong>{fillTemplateText(instantiating.name,values)}</strong>
     {instantiating.description&&<p>{fillTemplateText(instantiating.description,values)}</p>}
     {instantiating.steps.length>0&&<ol>{instantiating.steps.map((step,index)=><li key={index}>{fillTemplateText(step,values)}</li>)}</ol>}
    </div>
    <p className="template-help">Danach kannst du im Aufgabeneditor die Deadline, das Projekt und weitere Details festlegen. Diese Vorlage bleibt unverändert.</p>
    <footer><span/><div><button type="button" className="ghost" onClick={cancelUse}>Abbrechen</button><button className="primary" disabled={missing.length>0}>Weiter zum Aufgabeneditor</button></div></footer>
   </form>
  </div>}
  {newOpen&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&close()}>
   <form className="modal template-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="template-edit-title" onSubmit={submit} onKeyDown={e=>e.key==='Escape'&&close()}>
    <header><h2 id="template-edit-title">{editing?.id?'Vorlage bearbeiten':'Neue Vorlage'}</h2><button type="button" className="icon-button" onClick={close} aria-label="Schließen"><X/></button></header>
    <label>Vorlagenname<input autoFocus required value={name} onChange={e=>setName(e.target.value)} placeholder="z. B. Klassenarbeit vorbereiten"/></label>
    <label>Beschreibung (optional)<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Wofür nutze ich diese Vorlage?"/></label>
    <label>Unteraufgaben – eine pro Zeile<textarea rows={9} value={steps} onChange={e=>setSteps(e.target.value)} placeholder={'Aufgaben zusammenstellen\nErwartungshorizont erstellen\nMaterial kopieren'}/></label>
    <p className="template-help">Tipp: Mit {<code>{'{Fach}'}</code>}, {<code>{'{Klasse}'}</code>} oder {<code>{'{Thema}'}</code>} definierst du persönliche Platzhalter. Relative Unteraufgaben-Termine schreibst du einfach hinter den Schritt, z. B. „2 Wochen vorher“, „14 Tage vorher“ oder {<code>{'{Deadline} - 3 Tage'}</code>}. Die Hauptdeadline legst du bei jeder neuen Aufgabe fest; sie bedeutet, dass alles an diesem Tag bereits fertig sein muss.</p>
    <footer><span/><div><button type="button" className="ghost" onClick={close}>Abbrechen</button><button className="primary">Vorlage speichern</button></div></footer>
   </form>
  </div>}
 </div>;
}
