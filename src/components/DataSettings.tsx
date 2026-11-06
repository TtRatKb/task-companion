import {useRef,useState} from 'react';import {Download,Upload,X} from 'lucide-react';import type {AppData} from '../types';
import {CloudSettings} from './CloudSettings';
import {ReminderSettings} from './ReminderSettings';
import type {ReminderSettings as ReminderPreferences} from '../reminders';
import {versionLabel} from '../version';
import type {CloudController,CloudStatus} from '../cloud/CloudController';
export function DataSettings({data,onImport,onClose,cloudController,cloudStatus,reminderSettings,onReminderChange}:{data:AppData;onImport:(file:File)=>Promise<void>;onClose:()=>void;cloudController:CloudController|null;cloudStatus:CloudStatus;reminderSettings:ReminderPreferences;onReminderChange:(changes:Partial<ReminderPreferences>)=>void}){
 const input=useRef<HTMLInputElement>(null);const [busy,setBusy]=useState(false);
 const download=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='task-companion-backup.json';a.click();URL.revokeObjectURL(a.href)};
 return <div className="modal-backdrop"><section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><header><h2 id="settings-title">Daten & Einstellungen</h2><button className="icon-button" onClick={onClose} aria-label="Schließen"><X/></button></header>
 <div className="notice"><strong>Deine Aufgaben bleiben lokal gesichert</strong><p>Cloud-Sync ist optional. Ohne Google-Verbindung werden deine Aufgaben weiterhin ausschließlich in diesem Browser gespeichert. Browser-Erinnerungen lassen sich unten aktivieren; echter Push bei geschlossener App ist noch nicht eingerichtet.</p></div>
 <h3>Sicherung</h3><p>Exportiere regelmäßig eine vollständige JSON-Sicherung.</p><div className="settings-actions"><button onClick={download}><Download/>JSON exportieren</button><button onClick={()=>input.current?.click()} disabled={busy}><Upload/>JSON importieren</button></div>
 <ReminderSettings preferences={reminderSettings} onChange={onReminderChange}/>
 <CloudSettings controller={cloudController} status={cloudStatus} localData={data}/>
 <p className="settings-build-info">Aktuell installiert: {versionLabel}</p>
 <input ref={input} hidden type="file" accept="application/json" onChange={async e=>{const f=e.target.files?.[0];if(f){setBusy(true);await onImport(f);setBusy(false);e.target.value=''}}}/><footer><span/><button className="primary" onClick={onClose}>Fertig</button></footer></section></div>
}
