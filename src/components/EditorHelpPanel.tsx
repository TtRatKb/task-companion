import {BookOpen,CalendarClock,Keyboard,Lightbulb,MousePointerClick} from 'lucide-react';

export type HelpMode='template'|'task';

const templateSnippets=[
 {label:'{Fach}',value:'{Fach}',description:'Einmal eingeben, überall einsetzen'},
 {label:'{Klasse}',value:'{Klasse}',description:'Zum Beispiel 7b'},
 {label:'{Thema}',value:'{Thema}',description:'Zum Beispiel Bruchrechnung'},
 {label:'2 Wochen vorher',value:' – 2 Wochen vorher',description:'Fester Abstand zur Deadline'},
 {label:'14 Tage vorher',value:' – 14 Tage vorher',description:'Genauso möglich'},
 {label:'{Deadline} − 3 Tage',value:' – {Deadline} - 3 Tage',description:'Deadline ist ein Zeitanker'}
];
const taskSnippets=[
 {label:'2 Wochen vorher',value:' – 2 Wochen vorher',description:'Vom gewählten Deadline-Tag rückwärts'},
 {label:'14 Tage vorher',value:' – 14 Tage vorher',description:'Tage und Wochen sind möglich'},
 {label:'1 Monat vorher',value:' – 1 Monat vorher',description:'Kalendermonate, keine pauschalen 30 Tage'},
 {label:'{Deadline} − 3 Tage',value:' – {Deadline} - 3 Tage',description:'Drei Tage vor der Deadline'}
];

export function EditorHelpPanel({mode,onInsert}:{
 mode:HelpMode;onInsert?:(text:string)=>void
}){
 const snippets=mode==='template'?templateSnippets:taskSnippets;
 return <aside className="editor-help-panel" aria-label={mode==='template'?'Hilfe für Vorlagen':'Hilfe für Aufgaben'}>
  <div className="editor-help-heading"><BookOpen size={18} aria-hidden="true"/>
   <div><strong>Tipps & Shortcuts</strong><span>Direkt beim Arbeiten griffbereit</span></div>
  </div>
  {mode==='template'&&<section className="editor-help-section">
   <h3><Lightbulb size={15} aria-hidden="true"/> So funktionieren Vorlagen</h3>
   <p>Du erstellst eine <b>Hauptaufgabe</b> mit beliebig vielen Schritten. Die kleinen Häkchen sind nur eine Vorschau. Jede neue Aufgabe startet später mit leeren Häkchen.</p>
   <p>Mit <code>{'{Fach}'}</code> oder <code>{'{Klasse}'}</code> schreibst du variable Stellen. Beim Verwenden fragt dich Task Companion nur einmal danach und setzt die Antwort überall ein.</p>
  </section>}
  {mode==='task'&&<section className="editor-help-section">
   <h3><Lightbulb size={15} aria-hidden="true"/> Aufgaben bearbeiten</h3>
   <p>Deine Deadline ist der Tag, an dem alles schon fertig sein muss. Der letzte Arbeitstag liegt davor.</p>
   <p>Schreib relative Termine direkt hinter eine Unteraufgabe. Wenn du die Hauptdeadline festlegst, wird der passende Arbeitstag berechnet.</p>
  </section>}
  <section className="editor-help-section">
   <h3><Keyboard size={15} aria-hidden="true"/> Schritte sortieren & verschieben</h3>
   <p>Am geriffelten Griff ziehen oder die ↑↓-Buttons nutzen – auch ohne Maus.</p>
   {mode==='task'&&<p>Der Pfeil nach rechts bei einem Schritt speichert deine Änderungen und öffnet die Auswahl der Zielaufgabe. Relativ geplante Termine werden nicht heimlich neu berechnet.</p>}
   {mode==='template'&&<p>Das Umsortieren verändert nur die Reihenfolge der Vorlage; ihre Texte bleiben unverändert.</p>}
  </section>
  <section className="editor-help-section">
   <h3><MousePointerClick size={15} aria-hidden="true"/> Zum Einfügen anklicken</h3>
   <p className="editor-help-muted">Klicke zuerst in den Titel oder eine Unteraufgabe. Ein Tipp wird dort am Cursor eingefügt.</p>
   <div className="editor-snippets">
    {snippets.map(snippet=><button key={snippet.label} type="button"
     className="editor-snippet" aria-label={snippet.label} onMouseDown={e=>e.preventDefault()}
     onClick={()=>onInsert?.(snippet.value)} title={snippet.description}>
     <code>{snippet.label}</code><small>{snippet.description}</small>
    </button>)}
   </div>
  </section>
  <section className="editor-help-section">
   <h3><CalendarClock size={15} aria-hidden="true"/> Termine</h3>
   <p><code>2 Wochen vorher</code> = 14 Kalendertage vor der Hauptdeadline. Auch <code>3 Monate vorher</code> und <code>am Vortag</code> gehen.</p>
   <p>Es gibt keine automatische Verteilung auf gleichmäßige Abstände: Du bestimmst selbst, wann welcher Schritt ansteht.</p>
  </section>
  <section className="editor-help-section">
   <h3><Keyboard size={15} aria-hidden="true"/> Tastatur</h3>
   <dl className="editor-hotkeys">
    <div><dt><kbd>Enter</kbd></dt><dd>Neue Unteraufgabe unterhalb</dd></div>
    {mode==='template'&&<div><dt><kbd>Backspace</kbd></dt><dd>Leere Zeile entfernen</dd></div>}
    <div><dt><kbd>Strg/⌘</kbd> + <kbd>Enter</kbd></dt><dd>Speichern</dd></div>
    <div><dt><kbd>Esc</kbd></dt><dd>Editor schließen</dd></div>
   </dl>
  </section>
 </aside>;
}
