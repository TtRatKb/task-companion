import {CalendarClock,CalendarDays,ChevronLeft,Flag,Inbox,Menu,Plus,Settings} from 'lucide-react';import type {Project} from '../types';
export type View={kind:'inbox'|'today'|'upcoming'|'deadlines'|'project';id?:string};
export function Sidebar({open,view,projects,onView,onClose,onProject,onSettings}:{open:boolean;view:View;projects:Project[];onView:(v:View)=>void;onClose:()=>void;onProject:()=>void;onSettings:()=>void}){
 const item=(v:View,label:string,icon:React.ReactNode)=><button key={v.id??v.kind} className={view.kind===v.kind&&view.id===v.id?'active':''} onClick={()=>{onView(v);onClose()}}>{icon}<span>{label}</span></button>;
 return <><aside className={open?'open':''}><div className="brand"><span className="brand-mark">✓</span><b>Task Companion</b><button className="icon-button close-side" onClick={onClose} aria-label="Seitenleiste schließen"><ChevronLeft/></button></div>
 <nav aria-label="Hauptnavigation">{item({kind:'inbox'},'Eingang',<Inbox/>)}{item({kind:'today'},'Heute',<CalendarDays/>)}{item({kind:'upcoming'},'Anstehend',<CalendarClock/>)}{item({kind:'deadlines'},'Deadline-Radar',<Flag/>)}</nav>
 <div className="nav-heading"><span>Projekte</span><button className="icon-button" aria-label="Projekt erstellen" onClick={onProject}><Plus/></button></div>
 <nav>{projects.map(p=>item({kind:'project',id:p.id},p.name,<i className="color-dot" style={{background:p.color}}/>))}</nav>
 <button className="settings" onClick={onSettings}><Settings/>Daten & Einstellungen</button></aside>{open&&<button className="side-scrim" aria-label="Menü schließen" onClick={onClose}/>}</>
}
export function MenuButton({onClick}:{onClick:()=>void}){return <button className="icon-button menu-button" onClick={onClick} aria-label="Menü öffnen"><Menu/></button>}
