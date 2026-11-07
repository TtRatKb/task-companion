import {useEffect,useMemo,useRef,useState} from 'react';import {Plus,Inbox as InboxIcon} from 'lucide-react';
import {addDays,formatDate,todayLocal} from './date';import {allDeadlineGroups,deadlineOverview,todayRadarGroups} from './deadlineRadar';import {completeTask,id,undoCompletion} from './domain';import {LocalTaskRepository} from './repository';import {emptyData,type AppData,type Project,type Task} from './types';
import {DataSettings} from './components/DataSettings';import {MenuButton,Sidebar,type View} from './components/Sidebar';import {TaskEditor} from './components/TaskEditor';import {TaskList} from './components/TaskList';
import {QuickCapture,type TaskDraft} from './components/QuickCapture';
import {CloudController,type CloudStatus} from './cloud/CloudController';
import {DeadlineRadarSummary} from './components/DeadlineRadarSummary';
import {useDeadlineNotifications} from './useDeadlineNotifications';
import {makeTemplate,taskFromTemplate,templateFromTask,toggleSubtask} from './checklists';
import {TemplatesView} from './components/TemplatesView';
import {WeekPlanner} from './components/WeekPlanner';
import {AppShortcutRail} from './components/AppShortcutRail';
import {MoveSubtaskDialog} from './components/MoveSubtaskDialog';
import {transferSubtask,undoSubtaskTransfer,type TransferDateChoice,type TransferReceipt} from './subtaskOrganization';
import {FocusedSteps} from './components/FocusedSteps';
import {focusedSteps,stepsDueNow,parentGroupsWithoutStepOnlyDuplicates} from './focusedSteps';
import {moveWorkItem} from './weeklyPlanner';
import {InboxProcessor} from './components/InboxProcessor';
import {applyInboxTriage,inboxQueue,type InboxTriagePatch} from './inboxTriage';
import type {TaskTemplate} from './types';
type TaskGroup={key:string;title:string|null;description?:string;tasks:Task[]};
const repo=new LocalTaskRepository();const route=():View=>{const p=location.hash.slice(1).split('/');return p[0]==='today'?{kind:'today'}:p[0]==='upcoming'?{kind:'upcoming'}:p[0]==='week'?{kind:'week'}:p[0]==='deadlines'?{kind:'deadlines'}:p[0]==='templates'?{kind:'templates'}:p[0]==='project'?{kind:'project',id:p[1]}:{kind:'inbox'}};
export default function App(){
 const cloudRef=useRef<CloudController|null>(null);
 const [today,setToday]=useState(()=>todayLocal());
 const localDataRef=useRef<AppData>(emptyData());
 const [cloudStatus,setCloudStatus]=useState<CloudStatus>({phase:'checking'});
 const [data,setData]=useState<AppData>(emptyData),[error,setError]=useState(''),[view,setView]=useState<View>(route),[side,setSide]=useState(false),[editor,setEditor]=useState<Task|undefined>(),[editorDraft,setEditorDraft]=useState<TaskDraft|undefined>(),[quick,setQuick]=useState(false),[captureVersion,setCaptureVersion]=useState(0),[settings,setSettings]=useState(false),[undo,setUndo]=useState<string|null>(null),[notice,setNotice]=useState(''),[inboxRun,setInboxRun]=useState<string[]|null>(null),[stepUndo,setStepUndo]=useState<{taskId:string;stepId:string;version:string;title:string}|null>(null),
 [moveRequest,setMoveRequest]=useState<{taskId:string;stepId:string}|null>(null),
 [moveUndo,setMoveUndo]=useState<{receipt:TransferReceipt;title:string}|null>(null);
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
 useEffect(()=>{const f=(e:KeyboardEvent)=>{if(e.key.toLowerCase()==='q'&&!(e.target as HTMLElement).closest('[role="dialog"]')&&!['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName)){e.preventDefault();setQuick(true)}};addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[]);
 const commit=(next:AppData)=>{repo.save(next);localDataRef.current=next;setData(next);cloudRef.current?.notifyLocalChange()};const navigate=(v:View)=>{location.hash=v.kind==='project'?'project/'+v.id:v.kind};
 const active=data.tasks.filter(t=>!t.completedAt||t.recurrence!==null);
 const groups=useMemo<TaskGroup[]>(()=>{
   if(view.kind==='inbox')return [{key:'inbox',title:null,tasks:active.filter(t=>t.projectId===null)}];
   if(view.kind==='project')return [{key:'project',title:null,tasks:active.filter(t=>t.projectId===view.id)}];
   if(view.kind==='today')return parentGroupsWithoutStepOnlyDuplicates(todayRadarGroups(data.tasks,today),today);
   if(view.kind==='deadlines')return allDeadlineGroups(data.tasks,today);
   if(view.kind==='week')return [];
   return Array.from({length:7},(_,i)=>{
     const d=addDays(today,i);
     return {key:d,title:i===0?'Heute · '+formatDate(d):formatDate(d),tasks:active.filter(t=>t.scheduledDate===d)};
   });
 },[data,view,today]);
 const overview=useMemo(()=>deadlineOverview(data.tasks,today),[data,today]);
 const focusedToday=useMemo(()=>stepsDueNow(data.tasks,today),[data.tasks,today]);
 const groupedRadar=view.kind==='today'||view.kind==='deadlines';
 const visibleGroups=groupedRadar?groups.filter(group=>group.tasks.length):groups;
 const title=view.kind==='inbox'?'Eingang':view.kind==='today'?'Heute':view.kind==='upcoming'?'Anstehend':view.kind==='week'?'Wochenplanung':view.kind==='deadlines'?'Deadline-Radar':view.kind==='templates'?'Vorlagen':data.projects.find(p=>p.id===view.id)?.name??'Projekt';
 const finish=(taskId:string)=>{const next=completeTask(data,taskId);if(next===data)return;commit(next);setStepUndo(null);setUndo(next.completionEvents.at(-1)!.id)};
 const saveDraft=(draft:TaskDraft,editing?:Task)=>{const now=new Date().toISOString();const next=editing?{...data,tasks:data.tasks.map(t=>t.id===editing.id?{...t,...draft,updatedAt:now}:t)}:{...data,tasks:[...data.tasks,{...draft,id:id(),completedAt:null,createdAt:now,updatedAt:now}]};commit(next)};
 const saveQuick=(draft:TaskDraft)=>{saveDraft(draft);setCaptureVersion(version=>version+1)};
 const toggleChecklistStep=(taskId:string,stepId:string)=>{
  const task=localDataRef.current.tasks.find(t=>t.id===taskId);
  const step=task?.subtasks?.find(s=>s.id===stepId);
  const next=toggleSubtask(localDataRef.current,taskId,stepId);
  if(next===localDataRef.current)return;
  commit(next);
  if(step&&!step.completed){
   const changed=next.tasks.find(t=>t.id===taskId)!;
   setStepUndo({taskId,stepId,version:changed.updatedAt,title:step.title});
  }else setStepUndo(null);
 };
 const undoStep=()=>{
  if(!stepUndo)return;
  const latest=localDataRef.current.tasks.find(t=>t.id===stepUndo.taskId);
  if(latest?.updatedAt===stepUndo.version &&
     latest.subtasks?.some(s=>s.id===stepUndo.stepId&&s.completed)){
   const next=toggleSubtask(localDataRef.current,stepUndo.taskId,stepUndo.stepId);
   if(next!==localDataRef.current)commit(next);
  }else setNotice('Der Schritt wurde inzwischen verändert. Es wurde nichts überschrieben.');
  setStepUndo(null);
 };
 const saveInboxTriage=(taskId:string,expectedUpdatedAt:string,patch:InboxTriagePatch)=>{
  const result=applyInboxTriage(localDataRef.current,taskId,expectedUpdatedAt,patch);
  if(result.status==='saved'&&result.data!==localDataRef.current)commit(result.data);
  return result.status;
 };
 const movePlannedWork=(taskId:string,stepId:string|undefined,date:string|null)=>{
  const next=moveWorkItem(data,taskId,stepId,date);
  if(next!==data)commit(next);
 };
 const updateWorkBudget=(weekdayIndex:number,minutes:number|null)=>{
  const budgets=[...data.weeklyBudgetMinutes];
  budgets[weekdayIndex]=minutes;
  commit({...data,weeklyBudgetMinutes:budgets});
 };
 const saveTaskTemplate=(draft:TaskDraft)=>{
  const prepared=templateFromTask({...draft,id:'preview',createdAt:'',updatedAt:'',completedAt:null});
  commit({...data,templates:[...data.templates,prepared]});
  setNotice('Vorlage gespeichert. Du findest sie unter „Vorlagen“.');
 };
 const useTemplate=(template:TaskTemplate)=>{
  const draft=taskFromTemplate(template,null);
  setEditor(undefined);
  setEditorDraft({title:draft.title,description:draft.description,projectId:draft.projectId,priority:draft.priority,scheduledDate:draft.scheduledDate,deadlineDate:draft.deadlineDate,recurrence:draft.recurrence,subtasks:draft.subtasks});
  navigate({kind:'inbox'});
 };
 const saveTemplateDefinition=(draft:{id?:string;name:string;description:string;steps:string[]})=>{
  const now=new Date().toISOString();
  const templates=draft.id&&data.templates.some(t=>t.id===draft.id)?
   data.templates.map(t=>t.id===draft.id?{...t,name:draft.name,description:draft.description,steps:draft.steps,updatedAt:now}:t):
   [...data.templates,makeTemplate(draft.name,draft.description,draft.steps)];
  commit({...data,templates});
  setNotice('Vorlage gespeichert.');
 };
 const deleteTemplate=(templateId:string)=>{
  commit({...data,templates:data.templates.filter(t=>t.id!==templateId)});
  setNotice('Vorlage gelöscht. Bestehende Aufgaben bleiben unverändert.');
 };
 const saveEditor=(draft:TaskDraft)=>{saveDraft(draft,editor);setEditor(undefined);setEditorDraft(undefined);if(editorDraft)setCaptureVersion(version=>version+1)};
 const saveAndMoveStep=(draft:TaskDraft,stepId:string)=>{
  if(!editor||!draft.subtasks?.some(step=>step.id===stepId))return;
  const latest=localDataRef.current;
  const source=latest.tasks.find(task=>task.id===editor.id);
  if(!source||source.updatedAt!==editor.updatedAt){
   alert('Diese Aufgabe wurde inzwischen verändert. Bitte Editor schließen und aktuelle Fassung erneut öffnen.');return;
  }
  const updatedAt=new Date().toISOString();
  commit({...latest,tasks:latest.tasks.map(task=>task.id===source.id?{...task,...draft,updatedAt}:task)});
  setEditor(undefined);setEditorDraft(undefined);
  setMoveRequest({taskId:source.id,stepId});
 };
 const requestMove=(taskId:string,stepId:string)=>{setMoveRequest({taskId,stepId});setMoveUndo(null)};
 const confirmMove=(targetId:string,choice:TransferDateChoice,sourceVersion:string,targetVersion:string)=>{
  if(!moveRequest)return 'missing' as const;
  const latest=localDataRef.current;
  const source=latest.tasks.find(task=>task.id===moveRequest.taskId);
  const step=source?.subtasks?.find(s=>s.id===moveRequest.stepId);
  const result=transferSubtask(latest,moveRequest.taskId,moveRequest.stepId,targetId,choice,sourceVersion,targetVersion);
  if(result.status==='moved'&&result.receipt){
   commit(result.data);
   setMoveUndo({receipt:result.receipt,title:step?.title??'Unteraufgabe'});
   setStepUndo(null);
  }
  return result.status;
 };
 const undoMove=()=>{
  if(!moveUndo)return;
  const result=undoSubtaskTransfer(localDataRef.current,moveUndo.receipt);
  if(result.status==='moved')commit(result.data);
  else setNotice('Die Aufgaben haben sich seit der Verschiebung geändert. Rückgängig würde neuere Änderungen überschreiben.');
  setMoveUndo(null);
 };
 const createProject=()=>{const name=prompt('Name des neuen Projekts');if(!name?.trim())return;const p:Project={id:id(),name:name.trim(),color:['#5b8def','#8b6fc0','#3d9970','#d9853b'][data.projects.length%4],createdAt:new Date().toISOString()};commit({...data,projects:[...data.projects,p]});navigate({kind:'project',id:p.id})};
 const projectActions=()=>{if(view.kind!=='project')return;const project=data.projects.find(p=>p.id===view.id);if(!project)return;const name=prompt('Projekt umbenennen (leer lassen zum Löschen):',project.name);if(name===null)return;if(name.trim())commit({...data,projects:data.projects.map(p=>p.id===project.id?{...p,name:name.trim()}:p)});else if(confirm('Projekt löschen? Alle enthaltenen Aufgaben werden sicher in den Eingang verschoben.')){commit({...data,projects:data.projects.filter(p=>p.id!==project.id),tasks:data.tasks.map(t=>t.projectId===project.id?{...t,projectId:null,updatedAt:new Date().toISOString()}:t)});navigate({kind:'inbox'})}};
 return <div className="app"><Sidebar open={side} view={view} projects={data.projects} onView={navigate} onClose={()=>setSide(false)} onProject={createProject} onSettings={()=>setSettings(true)}/>
 <main><header className="topbar"><MenuButton onClick={()=>setSide(true)}/><h1>{title}</h1>{view.kind==='project'&&<button className="text-button" onClick={projectActions}>Projekt bearbeiten</button>}<button className="add-top" onClick={()=>setQuick(true)}><Plus/>Aufgabe</button></header>
 {error&&<div className="error" role="alert">{error} <button onClick={()=>setSettings(true)}>Sicherung importieren</button></div>}
 <div className="main-content-shell"><div className="content">
 {view.kind==='inbox'&&<section className="inbox-startbar" aria-label="Eingang effizient bearbeiten">
  <div><strong>Eingang sortieren</strong>
   <p>{inboxQueue(data.tasks).length===0?'Alles durchgesehen – aktuell keine offenen Eingangsaufgaben.':'Ordne offene Aufgaben nacheinander ein – per Tastatur oder mit wenigen Klicks.'}</p>
  </div>
  <button type="button" className="primary" disabled={inboxQueue(data.tasks).length===0}
   onClick={()=>setInboxRun(inboxQueue(data.tasks))}><InboxIcon size={17}/> Eingang aufräumen <span className="inbox-count">{inboxQueue(data.tasks).length}</span></button>
 </section>}
 {view.kind==='week'&&<WeekPlanner tasks={data.tasks} projects={data.projects}
  budgets={data.weeklyBudgetMinutes} today={today} onMove={movePlannedWork}
  onBudgetChange={updateWorkBudget} onEdit={setEditor}/>}
 {view.kind==='templates'&&<TemplatesView templates={data.templates} onUse={useTemplate} onSave={saveTemplateDefinition} onDelete={deleteTemplate}/>}
 {(view.kind==='today'||view.kind==='deadlines')&&
  <DeadlineRadarSummary summary={overview} compact={view.kind==='today'} onOpen={()=>navigate({kind:'deadlines'})}/>}
 {groupedRadar&&visibleGroups.length===0&&(view.kind!=='today'||(focusedToday.today.length===0&&focusedToday.overdue.length===0))&&
  <div className="empty radar-all-clear"><div className="empty-check">✓</div><h2>Alles im Blick</h2><p>{view.kind==='today'?'Heute ist nichts dringend oder eingeplant.':'Aktuell sind keine offenen Aufgaben mit Deadline erfasst.'}</p></div>}
 {view.kind==='today'&&<div className="today-focus">
  <FocusedSteps title="Überfällige Arbeitsschritte" description="Diese Schritte waren bereits eingeplant und sind noch offen."
   entries={focusedToday.overdue} projects={data.projects} onComplete={toggleChecklistStep} onMove={requestMove}
   onEdit={taskId=>{const task=data.tasks.find(t=>t.id===taskId);if(task)setEditor(task)}} today={today}/>
  <FocusedSteps title="Heute anstehende Unteraufgaben" description="Konkrete Schritte aus deinen größeren Aufgaben – direkt abhaken, ohne die Hauptaufgabe abzuschließen."
   entries={focusedToday.today} projects={data.projects} onComplete={toggleChecklistStep} onMove={requestMove}
   onEdit={taskId=>{const task=data.tasks.find(t=>t.id===taskId);if(task)setEditor(task)}} today={today}/>
 </div>}
 {view.kind!=='templates'&&view.kind!=='week'&&visibleGroups.filter(group=>view.kind!=='upcoming'||group.tasks.length>0||focusedSteps(data.tasks,group.key).length>0).map(group=><section className={`task-section ${groupedRadar?'radar-section':''}`} key={group.key}>
  {group.title&&<h2>{group.title}<small>{group.tasks.length}</small></h2>}
  {group.description&&<p className="radar-group-description">{group.description}</p>}
  {group.tasks.length>0&&<TaskList tasks={group.tasks} today={today} projects={data.projects}
   onComplete={finish} onEdit={setEditor} onToggleSubtask={toggleChecklistStep} onMoveSubtask={requestMove}
   showSubtasks={view.kind!=='today'&&view.kind!=='upcoming'} empty="Hier ist gerade nichts geplant."/>}
  {view.kind==='upcoming'&&<FocusedSteps
   title="Unteraufgaben für diesen Tag"
   entries={focusedSteps(data.tasks,group.key)}
   projects={data.projects} today={today} onComplete={toggleChecklistStep}
   onEdit={taskId=>{const task=data.tasks.find(t=>t.id===taskId);if(task)setEditor(task)}} onMove={requestMove}/> }
 </section>)}
 {view.kind!=='templates'&&(quick?<QuickCapture key={captureVersion} projectId={view.kind==='project'?view.id??null:null} onSave={saveQuick} onCancel={()=>setQuick(false)} onMore={draft=>setEditorDraft(draft)}/>:<button className="add-row" onClick={()=>setQuick(true)}><Plus/>Aufgabe hinzufügen <kbd>Q</kbd></button>)}</div><AppShortcutRail view={view}/></div></main>
 {(editor||editorDraft)&&<TaskEditor task={editor} initialDraft={editorDraft} projects={data.projects} initialProject={view.kind==='project'?view.id:null} onClose={()=>{setEditor(undefined);setEditorDraft(undefined)}} onSave={saveEditor} onSaveAndMoveStep={editor?saveAndMoveStep:undefined} onSaveTemplate={saveTaskTemplate} onDelete={editor?()=>{if(confirm('Aufgabe wirklich löschen?')){commit({...data,tasks:data.tasks.filter(t=>t.id!==editor.id)});setEditor(undefined)}}:undefined}/>}
 {moveRequest&&data.tasks.some(task=>task.id===moveRequest.taskId)&&
  <MoveSubtaskDialog key={moveRequest.taskId+':'+moveRequest.stepId}
   source={data.tasks.find(task=>task.id===moveRequest.taskId)!}
   stepId={moveRequest.stepId} tasks={data.tasks}
   onTransfer={confirmMove} onClose={()=>setMoveRequest(null)}/>}
 {moveUndo&&<div className="snackbar move-undo">„{moveUndo.title}“ verschoben.
  <button type="button" onClick={undoMove}>Rückgängig</button>
  <button type="button" aria-label="Verschiebungshinweis schließen" onClick={()=>setMoveUndo(null)}>×</button>
 </div>}
 {settings&&<DataSettings data={data} cloudController={cloudRef.current} cloudStatus={cloudStatus} reminderSettings={reminderSettings} onReminderChange={updateReminderSettings} onClose={()=>setSettings(false)} onImport={async file=>{try{const next=repo.parseImport(await file.text());if(confirm('Die aktuellen lokalen Daten vollständig durch diese Sicherung ersetzen?'))commit(next)}catch(e){alert((e as Error).message)}}}/>}
 {notice&&<div className="app-notice" role="status">{notice}<button aria-label="Hinweis schließen" onClick={()=>setNotice('')}>×</button></div>}
 {inboxRun&&<InboxProcessor ids={inboxRun} tasks={data.tasks} projects={data.projects} today={today}
  onSave={saveInboxTriage} onClose={()=>setInboxRun(null)}/>}
 {stepUndo&&<div className="snackbar step-undo">„{stepUndo.title}“ erledigt.
  <button type="button" onClick={undoStep}>Rückgängig</button>
  <button type="button" aria-label="Schrittmeldung schließen" onClick={()=>setStepUndo(null)}>×</button>
 </div>}
 {undo&&<div className="snackbar">Aufgabe abgeschlossen. <button onClick={()=>{commit(undoCompletion(data,undo));setUndo(null)}}>Rückgängig</button><button aria-label="Meldung schließen" onClick={()=>setUndo(null)}>×</button></div>}
 </div>
}
