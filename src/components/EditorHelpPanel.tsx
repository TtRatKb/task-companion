import {BookOpen,CalendarClock,Keyboard,Lightbulb,MousePointerClick} from 'lucide-react';

export type HelpMode='template'|'task';

const templateSnippets=[
 {label:'{Fach}',value:'{Fach}',description:'Wird beim Benutzen einmal abgefragt'},
 {label:'{Klasse}',value:'{Klasse}',description:'Zum Beispiel 7b'},
 {label:'{Thema}',value:'{Thema}',description:'Zum Beispiel Bruchrechnung'},
 {label:'2 Wochen vorher',value:' – 2 Wochen vorher',description:'Schritt relativ zur Deadline planen'},
 {label:'14 Tage vorher',value:' – 14 Tage vorher',description:'Exakte Kalendertage'},
 {label:'{Deadline} − 3 Tage',value:' – {Deadline} - 3 Tage',description:'Zeitanker; kein Eingabefeld'},
 {label:'am Vortag',value:' – am Vortag',description:'Letzter Vorbereitungstag'}
];
const taskSnippets=[
 {label:'2 Wochen vorher',value:' – 2 Wochen vorher',description:'Vom gewählten Deadline-Tag rückwärts'},
 {label:'14 Tage vorher',value:' – 14 Tage vorher',description:'Tage und Wochen sind möglich'},
 {label:'1 Monat vorher',value:' – 1 Monat vorher',description:'Echte Kalendermonate'},
 {label:'{Deadline} − 3 Tage',value:' – {Deadline} - 3 Tage',description:'Drei Tage vor der Deadline'},
 {label:'am Vortag',value:' – am Vortag',description:'Letzter Vorbereitungstag'}
];

export function EditorHelpPanel({mode,onInsert}:{
 mode:HelpMode;onInsert?:(text:string)=>void
}){
 const snippets=mode==='template'?templateSnippets:taskSnippets;
 return <aside className="editor-help-panel" aria-label={mode==='template'?'Hilfe für Vorlagen':'Hilfe für Aufgaben'}>
  <div className="editor-help-heading"><BookOpen size={18} aria-hidden="true"/>
   <div><strong>{mode==='template'?'Vorlage gestalten':'Aufgabe planen'}</strong><span>Tipps & Shortcuts · im geöffneten Fenster</span></div>
  </div>
  {mode==='template'&&<section className="editor-help-section editor-help-walkthrough">
   <h3><Lightbulb size={15} aria-hidden="true"/> Beispiel: Klassenarbeit</h3>
   <p><b>1 · Hauptaufgabe:</b> <code>Klassenarbeit {'{Fach}'} {'{Klasse}'} vorbereiten</code></p>
   <p><b>2 · Unteraufgaben:</b> jeden Schritt als eigene Zeile mit rundem Häkchen anlegen, z. B. <code>Erwartungshorizont erstellen – 2 Wochen vorher</code>.</p>
   <p><b>3 · Vorlage verwenden:</b> Einmal Fach, Klasse und ggf. Thema eingeben. Danach die <b>Deadline der echten Aufgabe</b> eintragen – also den Klassenarbeitstag. Alle relativen Schritttermine werden daraus berechnet.</p>
   <p><b>Nur Klasse abfragen?</b> Dann verwende nur <code>{'{Klasse}'}</code> als Platzhalter. Fach und Thema können fest im Text stehen.</p>
   <p><b>Wichtig:</b> <code>{'{Deadline}'}</code> ist ein <b>Zeitanker</b>, keine zusätzliche Frage. Die Vorlage selbst hat bewusst noch keinen konkreten Termin.</p>
  </section>}
  {mode==='task'&&<section className="editor-help-section">
   <h3><Lightbulb size={15} aria-hidden="true"/> So ist die Aufgabe aufgebaut</h3>
   <p>Oben steht die Hauptaufgabe, darunter eigene abhakbare Unteraufgaben – jeweils mit unabhängigem Termin und optionaler Dauer.</p>
   <p><b>Geplant</b> = wann du daran arbeiten möchtest. <b>Deadline</b> = wann alles schon fertig sein muss; letzter Fertigstellungstag ist der Vortag.</p>
  </section>}
  <section className="editor-help-section">
   <h3><MousePointerClick size={15} aria-hidden="true"/> Beispiele zum Einfügen</h3>
   <p className="editor-help-muted">Klicke zuerst in das passende Titel- oder Unteraufgabenfeld und dann auf den Ausdruck. Zeitabstände gehören ans Ende einer <b>Unteraufgabe</b>.</p>
   <div className="editor-snippets">
    {snippets.map(snippet=><button key={snippet.label} type="button"
     className="editor-snippet" aria-label={snippet.label} onMouseDown={e=>e.preventDefault()}
     onClick={()=>onInsert?.(snippet.value)} title={snippet.description}>
     <code>{snippet.label}</code><small>{snippet.description}</small>
    </button>)}
   </div>
  </section>
  <section className="editor-help-section">
   <h3><CalendarClock size={15} aria-hidden="true"/> Termine & Intervalle</h3>
   <p><code>2 Wochen vorher</code> = 14 Kalendertage vor der Deadline. Auch <code>3 Monate vorher</code> und <code>am Vortag</code> funktionieren.</p>
   <p><b>Wiederholungen:</b> jeden Tag, Mo–Fr, am Wochenende, bestimmte Wochentage sowie alle 2 Tage, 3 Wochen oder jeden Monat am 15. In echten Aufgaben im Feld „Wiederholung“; in der Schnellerfassung direkt im Satz.</p>
   <p>Es erfolgt <b>keine</b> automatische Gleichverteilung der Schritte. Du bestimmst die Abstände.</p>
  </section>
  <section className="editor-help-section">
   <h3><Keyboard size={15} aria-hidden="true"/> Tastenkürzel</h3>
   <dl className="editor-hotkeys">
    <div><dt><kbd>Enter</kbd></dt><dd>Unteraufgabe darunter anlegen</dd></div>
    {mode==='template'&&<div><dt><kbd>Backspace</kbd></dt><dd>Leere Unteraufgabe entfernen</dd></div>}
    <div><dt><kbd>Strg/⌘</kbd> + <kbd>Enter</kbd></dt><dd>Speichern</dd></div>
    <div><dt><kbd>Esc</kbd></dt><dd>Editor schließen</dd></div>
    <div><dt><kbd>Q</kbd></dt><dd>Neue Aufgabe (außerhalb des Editors)</dd></div>
    <div><dt><kbd>#P1</kbd>–<kbd>#P4</kbd></dt><dd>Priorität in der <b>Schnellerfassung</b>, nicht im Vorlagentext</dd></div>
   </dl>
  </section>
  <section className="editor-help-section">
   <h3><Keyboard size={15} aria-hidden="true"/> Schritte organisieren</h3>
   <p>Mit Griff oder ↑↓ sortieren. Runde Häkchen in Vorlagen sind nur Vorschau; bei echten Aufgaben werden sie gespeichert.</p>
   {mode==='task'&&<p>Der Pfeil nach rechts bei einem Schritt verschiebt ihn nach dem Speichern in eine andere Hauptaufgabe. Relative Termine bleiben unter deiner Kontrolle.</p>}
  </section>
 </aside>;
}
