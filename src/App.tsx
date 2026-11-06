import {useEffect,useMemo,useRef,useState} from 'react';import {Plus} from 'lucide-react';
import {addDays,formatDate,todayLocal} from './date';import {allDeadlineGroups,deadlineOverview,todayRadarGroups} from './deadlineRadar';import {completeTask,id,undoCompletion} from './domain';import {LocalTaskRepository} from './repository';import {emptyData,type AppData,type Project,type Task} from './types';
import {DataSettings} from './components/DataSettings';import {MenuButton,Sidebar,type View} from './components/Sidebar';import {TaskEditor} from './components/TaskEditor';import {TaskList} from './components/TaskList';
import {QuickCapture,type TaskDraft} from './components/QuickCapture';
import {CloudController,type CloudStatus} from './cloud/CloudController';
import {DeadlineRadarSummary} from './components/DeadlineRadarSummary';
import {useDeadlineNotifications} from './useDeadlineNotifications';
type TaskGroup={key:string;title:string|null;description?:string;tasks:Task[]};
const repo=new LocalTaskRepository();const route=():View=>{const p=location.hash.slice(1).split('/');return p[0]==='today'?{kind:'today'}:p[0]==='upcoming'?{kind:'upcoming'}:p[0]==='deadlines'?{kind:'deadlines'}:p[0]==='project'?{kind:'project',id:p[1]}:{kind:'inbox'}};
export default function App(){
 const cloudRef=useRef<CloudController|null>(null);
 const [today,setToday]=useState(()=>todayLocal());
 const localDataRef=useRef<AppData>(emptyData());
 const [cloudStatus,setCloudStatus]=useState<CloudStatus>({phase:'checking'});
 const [data,setData]=useState<AppData>(emptyData),[error,setError]=useState(''),[view,setView]=useState<View>(route),[side,setSide]=useState(false),[editor,setEditor]=useState<Task|undefined>(),[editorDraft,setEditorDraft]=useState<TaskDraft|undefined>(),[quick,setQuick]=useState(false),[captureVersion,setCaptureVersion]=useState(0),[settings,setSettings]=useState(false),[undo,setUndo]=useState<string|null>(null);
 const {reminderSettings,updateReminderSettings}=useDeadlineNotifications(data.tasks);
 useEffect(()=>{
   let loaded:AppData;
   try {
     loaded=repo.load();
     localDataRef.current=loaded;
     setData(loaded);
   } catch(e) {
     setError((e as Error).message);
     setCloudStatus({phase:'error',message:'Lokale Daten konnten nicht sicher gelesen werden. Die Cloud wird deshalb nicht aktiviert.'});
     return;
   }
   const controller=new CloudController(
     ()=>localDataRef.current,
     next=>{repo.save(next);localDataRef.current=next;setData(next)},
     setCloudStatus
   );
   cloudRef.current=controller;
   void controller.start();
   return ()=>{controller.dispose();if(cloudRef.current===controller)cloudRef.current=null};
 },[]);
 useEffect(()=>{
   const updateDay=()=>setToday(todayLocal());
   window.addEventListener('focus',updateDay);
   document.addEventListener('visibilitychange',updateDay);
   const interval=window.setInterval(updateDay,60_000);
   return()=>{window.clearInterval(interval);window.removeEventListener('focus',updateDay);document.removeEventListener('visibilitychange',updateDay)};
 },[]);
 useEffect(()=>{const f=()=>setView(route());addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);
 useEffect(()=>{const f=(e:KeyboardEvent)=>{if(e.key.toLowerCase()==='q'&&!['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName)){e.preventDefault();setQuick(true)}};addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[]);
 const commit=(next:AppData)=>{repo.save(next);localDataRef.current=next;setData(next);cloudRef.current?.notifyLocalChange()};const navigate=(v:View)=>{location.hash=v.kind==='project'?'project/'+v.id:v.kind};
 const active=data.tasks.filter(t=>!t.completedAt||t.recurrence!==null);
 const groups=useMemo<TaskGroup[]>(()=>{
   if(view.kind==='inbox')return [{key:'inbox',title:null,tasks:active.filter(t=>t.projectId===null)}];
   if(view.kind==='project')return [{key:'project',title:null,tasks:active.filter(t=>t.projectId===view.id)}];
   if(view.kind==='today')return todayRadarGroups(data.tasks,today);
   if(view.kind==='deadlines')return allDeadlineGroups(data.tasks,today);
   return Array.from({length:7},(_,i)=>{
     const d=addDays(today,i);
     return {key:d,title:i===0?'Heute · '+formatDate(d):formatDate(d),tasks:active.filter(t=>t.scheduledDate===d)};
   });
 },[data,view,today]);
 const overview=useMemo(()=>deadlineOverview(data.tasks,today),[data,today]);
 const groupedRadar=view.kind==='today'||view.kind==='deadlines';
 const visibleGroups=groupedRadar?groups.filter(group=>group.tasks.length):groups;
 const title=view.kind==='inbox'?'Eingang':view.kind==='today'?'Heute':view.kind==='upcoming'?'Anstehend':view.kind==='deadlines'?'Deadline-Radar':data.projects.find(p=>p.id===view.id)?.name??'Projekt';
 const finish=(taskId:string)=>{const next=completeTask(data,taskId);if(next===data)return;commit(next);setUndo(next.completionEvents.at(-1)!.id)};
 const saveDraft=(draft:TaskDraft,editing?:Task)=>{const now=new Date().toISOString();const next=editing?{...data,tasks:data.tasks.map(t=>t.id===editing.id?{...t,...draft,updatedAt:now}:t)}:{...data,tasks:[...data.tasks,{...draft,id:id(),completedAt:null,createdAt:now,updatedAt:now}]};commit(next)};
 const saveQuick=(draft:TaskDraft)=>{saveDraft(draft);setCaptureVersion(version=>version+1)};
 const saveEditor=(draft:TaskDraft)=>{saveDraft(draft,editor);setEditor(undefined);setEditorDraft(undefined);if(editorDraft)setCaptureVersion(version=>version+1)};
 const createProject=()=>{const name=prompt('Name des neuen Projekts');if(!name?.trim())return;const p:Project={id:id(),name:name.trim(),color:['#5b8def','#8b6fc0','#3d9970','#d9853b'][data.projects.length%4],createdAt:new Date().toISOString()};commit({...data,projects:[...data.projects,p]});navigate({kind:'project',id:p.id})};
 const projectActions=()=>{if(view.kind!=='project')return;const project=data.projects.find(p=>p.id===view.id);if(!project)return;const name=prompt('Projekt umbenennen (leer lassen zum Löschen):',project.name);if(name===null)return;if(name.trim())commit({...data,projects:data.projects.map(p=>p.id===project.id?{...p,name:name.trim()}:p)});else if(confirm('Projekt löschen? Alle enthaltenen Aufgaben werden sicher in den Eingang verschoben.')){commit({...data,projects:data.projects.filter(p=>p.id!==project.id),tasks:data.tasks.map(t=>t.projectId===project.id?{...t,projectId:null,updatedAt:new Date().toISOString()}:t)});navigate({kind:'inbox'})}};
 return <div className="app"><Sidebar open={side} view={view} projects={data.projects} onView={navigate} onClose={()=>setSide(false)} onProject={createProject} onSettings={()=>setSettings(true)}/>
 <main><header className="topbar"><MenuButton onClick={()=>setSide(true)}/><h1>{title}</h1>{view.kind==='project'&&<button className="text-button" onClick={projectActions}>Projekt bearbeiten</button>}<button className="add-top" onClick={()=>setQuick(true)}><Plus/>Aufgabe</button></header>
 {error&&<div className="error" role="alert">{error} <button onClick={()=>setSettings(true)}>Sicherung importieren</button></div>}
 <div className="content">
 {(view.kind==='today'||view.kind==='deadlines')&&
  <DeadlineRadarSummary summary={overview} compact={view.kind==='today'} onOpen={()=>navigate({kind:'deadlines'})}/>}
 {groupedRadar&&visibleGroups.length===0&&
  <div className="empty radar-all-clear"><div className="empty-check">✓</div><h2>Alles im Blick</h2><p>{view.kind==='today'?'Heute ist nichts dringend oder eingeplant.':'Aktuell sind keine offenen Aufgaben mit Deadline erfasst.'}</p></div>}
 {visibleGroups.map(group=><section className={`task-section ${groupedRadar?'radar-section':''}`} key={group.key}>
  {group.title&&<h2>{group.title}<small>{group.tasks.length}</small></h2>}
  {group.description&&<p className="radar-group-description">{group.description}</p>}
  <TaskList tasks={group.tasks} today={today} projects={data.projects} onComplete={finish} onEdit={setEditor} empty="Hier ist gerade nichts geplant."/>
 </section>)}
 {quick?<QuickCapture key={captureVersion} projectId={view.kind==='project'?view.id??null:null} onSave={saveQuick} onCancel={()=>setQuick(false)} onMore={draft=>setEditorDraft(draft)}/>:<button className="add-row" onClick={()=>setQuick(true)}><Plus/>Aufgabe hinzufügen <kbd>Q</kbd></button>}</div></main>
 {(editor||editorDraft)&&<TaskEditor task={editor} initialDraft={editorDraft} projects={data.projects} initialProject={view.kind==='project'?view.id:null} onClose={()=>{setEditor(undefined);setEditorDraft(undefined)}} onSave={saveEditor} onDelete={editor?()=>{if(confirm('Aufgabe wirklich löschen?')){commit({...data,tasks:data.tasks.filter(t=>t.id!==editor.id)});setEditor(undefined)}}:undefined}/>}
 {settings&&<DataSettings data={data} cloudController={cloudRef.current} cloudStatus={cloudStatus} reminderSettings={reminderSettings} onReminderChange={updateReminderSettings} onClose={()=>setSettings(false)} onImport={async file=>{try{const next=repo.parseImport(await file.text());if(confirm('Die aktuellen lokalen Daten vollständig durch diese Sicherung ersetzen?'))commit(next)}catch(e){alert((e as Error).message)}}}/>}
 {undo&&<div className="snackbar">Aufgabe abgeschlossen. <button onClick={()=>{commit(undoCompletion(data,undo));setUndo(null)}}>Rückgängig</button><button aria-label="Meldung schließen" onClick={()=>setUndo(null)}>×</button></div>}
 </div>
}
