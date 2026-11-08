import {useState,type FormEvent} from 'react';
import {BookmarkPlus,Copy,Plus,Trash2,X} from 'lucide-react';
import type {TaskTemplate} from '../types';
import {expandTaskTemplate,extractTemplatePlaceholders,fillTemplateText} from '../templateVariables';
import {TemplateEditor} from './TemplateEditor';

export const STARTER_TEMPLATE:TaskTemplate={
 id:'starter-class-test',name:'Klassenarbeit {Fach} {Klasse} vorbereiten',
 description:'Klassenarbeit zum Thema {Thema} – individuell anpassbar.',
 steps:['Aufgaben für {Thema} zusammenstellen – 2 Wochen vorher','Erwartungshorizont zu {Thema} erstellen – {Deadline} - 10 Tage','Aufgaben und Punkteverteilung prüfen – 1 Woche vorher','ClassTime-Aufgaben eintragen – 1 Woche vorher','ClassTime-Terminierung prüfen – 3 Tage vorher','Differenzierung und Layout kontrollieren – 2 Tage vorher','Material für {Klasse} drucken oder kopieren – am Vortag'],
 createdAt:'2026-11-07T00:00:00.000Z',updatedAt:'2026-11-07T00:00:00.000Z'
};

export function TemplatesView({templates,onUse,onSave,onDelete}:{
 templates:TaskTemplate[];
 onUse:(template:TaskTemplate,deadlineDate?:string|null)=>void;
 onSave:(draft:{id?:string;name:string;description:string;steps:string[]})=>void;
 onDelete:(id:string)=>void;
}){
 const [editing,setEditing]=useState<TaskTemplate|null>(null);
 const [newOpen,setNewOpen]=useState(false);
 const [instantiating,setInstantiating]=useState<TaskTemplate|null>(null);
 const [values,setValues]=useState<Record<string,string>>({});
 const [deadlineDate,setDeadlineDate]=useState('');
 const variables=instantiating?extractTemplatePlaceholders(instantiating):[];
 const missing=variables.filter(key=>!values[key]?.trim());
 const beginUse=(template:TaskTemplate)=>{
  if(!extractTemplatePlaceholders(template).length){onUse(template);return}
  setInstantiating(template);setValues({});setDeadlineDate('');
 };
 const cancelUse=()=>{setInstantiating(null);setValues({});setDeadlineDate('')};
 const confirmUse=(event:FormEvent)=>{
  event.preventDefault();
  if(!instantiating||missing.length)return;
  onUse(expandTaskTemplate(instantiating,values),deadlineDate||null);
  cancelUse();
 };
 const edit=(template?:TaskTemplate)=>{setEditing(template??null);setNewOpen(true)};
 const close=()=>{setNewOpen(false);setEditing(null)};
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
    <label className="template-use-deadline">Deadline / Tag, an dem die Aufgabe bereits fertig sein muss
     <input type="date" aria-label="Deadline beim Verwenden der Vorlage" value={deadlineDate} onChange={e=>setDeadlineDate(e.target.value)}/>
     <small>Zum Beispiel der Klassenarbeitstag. Alle Angaben wie „2 Wochen vorher“ werden daraus berechnet. Du kannst das Datum auch später im Aufgabeneditor setzen.</small>
    </label>
    <div className="template-live-preview" aria-live="polite">
     <span className="template-preview-label">Vorschau</span>
     <strong>{fillTemplateText(instantiating.name,values)}</strong>
     {instantiating.description&&<p>{fillTemplateText(instantiating.description,values)}</p>}
     {instantiating.steps.length>0&&<ol>{instantiating.steps.map((step,index)=><li key={index}>{fillTemplateText(step,values)}</li>)}</ol>}
    </div>
    <p className="template-help">Danach kannst du im Aufgabeneditor die berechneten Unteraufgabentermine prüfen, das Projekt auswählen und bei Bedarf die Deadline ändern. Diese Vorlage bleibt unverändert.</p>
    <footer><span/><div><button type="button" className="ghost" onClick={cancelUse}>Abbrechen</button><button className="primary" disabled={missing.length>0}>Weiter zum Aufgabeneditor</button></div></footer>
   </form>
  </div>}
  {newOpen&&<TemplateEditor template={editing??undefined} onSave={onSave} onClose={close}/>}
 </div>;
}
