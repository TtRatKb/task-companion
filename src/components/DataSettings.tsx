import {useRef,useState} from 'react';import {Download,Upload,X} from 'lucide-react';import type {AppData} from '../types';
export function DataSettings({data,onImport,onClose}:{data:AppData;onImport:(file:File)=>Promise<void>;onClose:()=>void}){
 const input=useRef<HTMLInputElement>(null);const [busy,setBusy]=useState(false);
 const download=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='task-companion-backup.json';a.click();URL.revokeObjectURL(a.href)};
 return <div className="modal-backdrop"><section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><header><h2 id="settings-title">Daten & Einstellungen</h2><button className="icon-button" onClick={onClose} aria-label="Schließen"><X/></button></header>
 <div className="notice"><strong>Nur auf diesem Gerät</strong><p>v0.1 speichert lokal in diesem Browser. Es gibt noch keine Synchronisation zwischen Geräten und keine zuverlässigen Erinnerungen.</p></div>
 <h3>Sicherung</h3><p>Exportiere regelmäßig eine vollständige JSON-Sicherung.</p><div className="settings-actions"><button onClick={download}><Download/>JSON exportieren</button><button onClick={()=>input.current?.click()} disabled={busy}><Upload/>JSON importieren</button></div>
 <input ref={input} hidden type="file" accept="application/json" onChange={async e=>{const f=e.target.files?.[0];if(f){setBusy(true);await onImport(f);setBusy(false);e.target.value=''}}}/><footer><span/><button className="primary" onClick={onClose}>Fertig</button></footer></section></div>
}
