import {useEffect,useMemo,useState,type RefObject} from 'react';
import {BookOpen,CalendarDays,CheckCircle2,ClipboardList,Flag,Search,X} from 'lucide-react';
import {formatDate} from '../date';
import {isOpenTask} from '../deadlineRadar';
import {searchAll,DEFAULT_SEARCH_FILTERS,type SearchFilters} from '../globalSearch';
import type {AppData,Priority,Task,TaskTemplate} from '../types';

const PAGE_SIZE=30;
export function SearchView({
 data,onOpenTask,onOpenTemplate,inputRef
}:{
 data:AppData;onOpenTask:(task:Task)=>void;onOpenTemplate:(template:TaskTemplate)=>void;
 inputRef:RefObject<HTMLInputElement|null>;
}){
 const [filters,setFilters]=useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);
 const [limit,setLimit]=useState(PAGE_SIZE);
 const hits=useMemo(()=>searchAll(data,filters),[data,filters]);
 const shown=hits.slice(0,limit);
 const change=<K extends keyof SearchFilters>(key:K,value:SearchFilters[K])=>{
  setFilters(previous=>({...previous,[key]:value}));setLimit(PAGE_SIZE);
 };
 useEffect(()=>{inputRef.current?.focus()},[inputRef]);
 return <section className="global-search" aria-label="Globale Suche">
  <div className="search-intro">
   <h2>Alles wiederfinden</h2>
   <p>Suche auch innerhalb von Unteraufgaben und Vorlagen. Deine Aufgaben werden dabei nicht verändert.</p>
  </div>
  <div className="search-bar">
   <Search aria-hidden="true" size={20}/>
   <input ref={inputRef} type="search" value={filters.query} aria-label="Aufgaben und Vorlagen suchen"
    placeholder="z. B. ClassTime, Erwartungshorizont, Mathe 7b …"
    onChange={event=>change('query',event.target.value)}
    onKeyDown={e=>{if(e.key==='Escape'&&filters.query){e.preventDefault();e.stopPropagation();change('query','')}}}/>
   {filters.query&&<button type="button" className="search-clear" aria-label="Suchtext löschen"
    onClick={()=>{change('query','');inputRef.current?.focus()}}><X size={16}/></button>}
   <kbd>/</kbd>
  </div>
  <div className="search-filters" aria-label="Suchfilter">
   <label>Anzeige
    <select aria-label="Erledigungsstatus filtern" value={filters.status}
     onChange={e=>change('status',e.target.value as SearchFilters['status'])}>
     <option value="open">Offen</option><option value="done">Erledigt</option><option value="all">Alle</option>
    </select>
   </label>
   <label>Typ
    <select aria-label="Ergebnistyp filtern" value={filters.kind}
     onChange={e=>change('kind',e.target.value as SearchFilters['kind'])}>
     <option value="all">Aufgaben & Vorlagen</option><option value="tasks">Nur Aufgaben</option><option value="templates">Nur Vorlagen</option>
    </select>
   </label>
   <label>Projekt
    <select aria-label="Projekt filtern" value={filters.project}
     onChange={e=>change('project',e.target.value)}>
     <option value="all">Alle Projekte</option>
     <option value="inbox">Ohne Projekt (Eingang)</option>
     {data.projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
   </label>
   <label>Priorität
    <select aria-label="Priorität filtern" value={filters.priority}
     onChange={e=>change('priority',e.target.value==='all'?'all':Number(e.target.value) as Priority)}>
     <option value="all">Alle Prioritäten</option>
     {[1,2,3,4].map(value=><option key={value} value={value}>P{value}</option>)}
    </select>
   </label>
  </div>
  <div className="search-summary">
   <span role="status">{hits.length} {hits.length===1?'Treffer':'Treffer'}
    {hits.length>limit?` · ${limit} angezeigt`:''}</span>
   {(filters.query||filters.project!=='all'||filters.status!=='open'||filters.priority!=='all'||filters.kind!=='all')
    &&<button type="button" className="search-reset" onClick={()=>{setFilters(DEFAULT_SEARCH_FILTERS);setLimit(PAGE_SIZE);inputRef.current?.focus()}}>
      Alle Filter zurücksetzen
     </button>}
  </div>
  {hits.length===0?<div className="search-empty">
   <Search size={24} aria-hidden="true"/>
   <strong>Keine passenden Einträge</strong>
   <p>Versuch einen kürzeren Suchbegriff oder setze die Filter zurück. Auch erledigte Aufgaben kannst du über „Anzeige“ finden.</p>
  </div>:
   <div className="search-results" aria-label="Suchergebnisse">
    {shown.map(hit=>{
     if(hit.kind==='template'){
      return <article className="search-result" key={'template:'+hit.id}>
       <div className="search-result-symbol template"><BookOpen size={19} aria-hidden="true"/></div>
       <div className="search-result-body">
        <span className="search-result-kind">Vorlage</span>
        <button type="button" className="search-result-title"
         aria-label={`Vorlage „${hit.template.name}“ bearbeiten`}
         onClick={()=>onOpenTemplate(hit.template)}>{hit.template.name}</button>
        {hit.template.description&&<p>{hit.template.description}</p>}
        {hit.matchedSteps.length>0&&<div className="search-matched-steps">
         <span>Passende Schritte:</span>{hit.matchedSteps.map((text,i)=><small key={i}>{text}</small>)}
        </div>}
        {hit.matchedSteps.length===0&&<span className="search-result-meta">{hit.template.steps.length} Unteraufgaben</span>}
       </div>
      </article>;
     }
     const task=hit.task,open=isOpenTask(task);
     const project=data.projects.find(p=>p.id===task.projectId);
     return <article className="search-result" key={'task:'+hit.id}>
      <div className={open?'search-result-symbol task':'search-result-symbol done'}>
       {open?<ClipboardList size={19} aria-hidden="true"/>:<CheckCircle2 size={19} aria-hidden="true"/>}
      </div>
      <div className="search-result-body">
       <span className="search-result-kind">{open?'Offene Aufgabe':'Erledigte Aufgabe'} · P{task.priority}{project?` · ${project.name}`:' · Eingang'}</span>
       <button type="button" className="search-result-title"
        aria-label={`Aufgabe „${task.title}“ bearbeiten`}
        onClick={()=>onOpenTask(task)}>{task.title}</button>
       {task.description&&<p>{task.description}</p>}
       <div className="search-result-meta">
        {task.scheduledDate&&<span><CalendarDays size={13} aria-hidden="true"/> Geplant {formatDate(task.scheduledDate)}</span>}
        {task.deadlineDate&&<span><Flag size={13} aria-hidden="true"/> Benötigt {formatDate(task.deadlineDate)}</span>}
        {(task.subtasks?.length??0)>0&&<span>{task.subtasks?.filter(s=>s.completed).length}/{task.subtasks?.length} Schritte erledigt</span>}
       </div>
       {hit.matchedSteps.length>0&&<div className="search-matched-steps">
        <span>Passende Unteraufgaben:</span>
        {hit.matchedSteps.map((text,i)=><small key={i}>{text}</small>)}
       </div>}
      </div>
     </article>;
    })}
    {hits.length>limit&&<button type="button" className="search-load-more"
     onClick={()=>setLimit(value=>value+PAGE_SIZE)}>Weitere Ergebnisse anzeigen ({hits.length-limit})</button>}
   </div>}
  <p className="search-help">Tipp: <kbd>/</kbd> oder <kbd>Strg/⌘ + K</kbd> öffnet die Suche von überall aus – außer während ein Dialog geöffnet ist.</p>
 </section>;
}
